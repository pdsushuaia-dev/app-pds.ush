# PDS.ushuaia — Contexto del proyecto

Plataforma web de gestión de **paseos de perros** para Ushuaia y Río Grande.
Cliente: Agustín Hernández (PDS.ushuaia · "Paseadores del Sur Club"). Proveedor: Juan Pablo Colina.

## Roles
- **client** (dueño del perro): ficha del perro, elige plan, agenda de turnos, ve el mapa en vivo del paseo, deja reseña privada, ve banners, paga por link.
- **walker** (paseador): alta por **código de invitación**, ve su agenda, inicia/termina el paseo y emite GPS.
- **admin** (Agustín): dashboard con métricas, asigna paseadores a turnos, genera códigos de invitación, gestiona planes/clientes, ve reseñas (solo él), publica banners.

## Stack
- **Next.js 16.3 (App Router) + TypeScript** · `src/` · import alias `@/*`. React 19.
- **Tailwind v4**.
- **Supabase**: Postgres + Auth + Realtime + Storage. Cliente vía `@supabase/ssr`.
- **Leaflet + OpenStreetMap** para mapas (gratis, sin API key).
- **MercadoPago** (Checkout Pro / link) para membresías — *pendiente (Fase 4 · Pieza 5)*.
- **Web Push** (`web-push` + VAPID) + PWA instalable (manifest + `public/sw.js` manual; NO `next-pwa`).
- **Deploy**: Vercel (front) + Supabase (backend) — *pendiente (Fase 5)*.

## Estructura de rutas
```
src/app/
  page.tsx                     landing
  (auth)/login, /registro      auth (Server Actions)
  activar/                     canje de código de paseador (raíz, fuera del middleware por rol)
  cliente/                     panel client
    page.tsx                   home (banners vigentes + activar notificaciones)
    perros/                    CRUD ficha del perro (foto → Storage)
    planes/                    elegir/cambiar plan (suscripción por perro)
    turnos/                    agenda self-service + próximos turnos + "ver en vivo"
    paseo/[walkId]/            mapa EN VIVO (Realtime) + reseña si finalizó
    pagos/                     placeholder (Pieza 5)
  paseador/                    panel walker
    page.tsx                   agenda (iniciar/continuar paseo) + activar notificaciones
    paseo/[walkId]/            paseo en curso: captura GPS + métricas + mapa
  admin/                       panel admin
    page.tsx                   dashboard con métricas reales
    turnos/                    asignar/reasignar paseador a turnos
    paseadores/                generar códigos + lista de paseadores
    planes, clientes/          placeholders
    resenas/                   listado + filtro + promedio por paseador
    banners/                   CRUD de banners
  api/cron/send-reminders/     POST (nodejs) recordatorios push (Bearer CRON_SECRET)
  api/mercadopago/webhook/     stub (Pieza 5)
  manifest.ts                  PWA manifest
src/components/                RoleNav, Placeholder, PushRegistrar, EnableNotifications, map/LiveMap(+inner)
src/lib/
  supabase/                    client.ts (browser), server.ts (RSC/actions), middleware.ts, admin.ts (service-role, server-only)
  actions/                     auth, dogs, subscriptions, schedule, assignments, walks, reviews, invites, push, banners
  auth.ts                      getProfile, roleHome
  turnos.ts                    SLOTS, WEEKDAYS, nextOccurrences, scheduledAtISO
  geo/haversine.ts             haversineMeters, pathDistanceMeters, LatLng
  push.ts                      sendPushToUser (web-push, service-role)
  format.ts                    formatARS
  types/database.ts            tipos DB escritos a mano (ver gotcha abajo)
src/proxy.ts                   middleware (Next 16 renombró middleware→proxy): refresca sesión + protege /cliente,/paseador,/admin por rol
supabase/migrations/           0001..0010 (ver abajo)
```

**Ruteo:** segmentos reales `/cliente` `/paseador` `/admin` (no route groups) → cada rol con su namespace; el `proxy.ts` protege por prefijo/rol. `/activar` va en la raíz a propósito (un `client` tiene que poder canjear el código sin que el middleware lo redirija).

## Migraciones (todas aplicadas en la base)
- **0001** esquema base + RLS + trigger `handle_new_user` + helpers `is_admin()`/`user_role()`.
- **0002** planes flexibles (`plans.days_per_week`/`price` NULL-ables → "Aventura Pro").
- **0003** Storage `dog-photos` (bucket público, escritura del dueño por carpeta `{uid}/`).
- **0004** turnos por franja (`schedule_rules.time_slot`, `appointments.time_slot`, unique `(dog_id,scheduled_at)`, policies owner insert/delete).
- **0005** fix recursión RLS `dogs↔appointments` con funciones SECURITY DEFINER `owns_dog()`/`walker_has_dog()`.
- **0006** Realtime para `walk_positions` y `walks` (publicación `supabase_realtime`).
- **0007** candado de rol: `revoke update` en `profiles` + grant solo `(full_name,phone,city)`; RPC `redeem_walker_invite(code)` (única vía a `role='walker'`).
- **0008** `push_subscriptions` (RLS por usuario) + `appointments.reminded_at`.
- **0009** `reviews` (dropea la placeholder de 0001 y recrea: `walk_id` unique, RLS autor+admin, paseador NO).
- **0010** `banners` (RLS: vigentes para authenticated o todo si admin; escritura solo admin).

## Reglas de negocio clave
- **1 perro por turno por paseador** → `unique (walker_id, scheduled_at)` en `appointments` (error 23505 = "ya tiene un turno a esa hora").
- Turnos: el cliente elige días + franja por suscripción → se materializan **4 semanas** de `appointments` con `walker_id null`; el admin asigna el paseador.
- Franjas → hora AR (offset fijo **-03:00**, sin DST): morning=09, midday=13, afternoon=17.
- GPS en vivo: paseador emite `watchPosition` (throttle ≥5s o >10m, ignora accuracy >50m) → inserta `walk_positions` **desde el browser** (RLS lo permite) → cliente se suscribe por **Supabase Realtime** (`postgres_changes`, filtra por RLS). Cierre: distancia (Haversine) + duración → `walks`.
- Reseñas **privadas**: solo autor + admin (paseador no). Una por walk.
- Fechas siempre en `America/Argentina/Ushuaia` para lo visible; `scheduled_at` se construye con `-03:00`.

## Gotchas / decisiones (importante para no repetir errores)
- **Tipos DB como `type`, NO `interface`**: una `interface` no satisface `Record<string,unknown>` y hace que el cliente Supabase tipado degrade a `never`. Todos los tipos de fila en `types/database.ts` son `type` con `Relationships: []`.
- `current_role` es **palabra reservada** de Postgres → el helper se llama `user_role()`.
- Middleware raíz es **`src/proxy.ts`** (Next 16 deprecó `middleware.ts`).
- **Leaflet + SSR**: `LiveMap` usa `next/dynamic` con `ssr:false` sobre `live-map-inner.tsx`; pasar `{lat,lng}` (no `[lat,lng]`, que TS infiere `number[]`).
- **service-role** solo en `lib/supabase/admin.ts` (con `import "server-only"`), usado por push/cron/webhooks. Nunca en el cliente.
- Reglas eslint nuevas de React: `set-state-in-effect` (diferir con `queueMicrotask`) y `purity` (`Date.now()` solo en initializer lazy de `useState`).
- FKs de `reviews` apuntan a `auth.users` (no `profiles`) → los nombres se resuelven con query aparte, no con embed.
- **Al correr checks, frená el `npm run dev`**: el dev server escribe `.next/dev/types` y compite con `tsc` (da un error espurio en `routes.d.ts`).

## Convenciones de trabajo
- Definir **schema primero** (migración) y después la UI. Las migraciones las corre el cliente (Cowork) en el SQL Editor; Claude Code solo escribe el archivo.
- Una feature por vez; correr **typecheck + lint + build** antes de commitear. Commits chicos.
- RLS activa en todas las tablas; validar rol/pertenencia **también en el server** (no confiar en el form). IDs sensibles (owner_id, dog_id, walker_id) se derivan en el server.
- UI en español.

## Estado actual
Fases 1–4 (excepto Pieza 5) **completas**: auth por rol, ficha del perro, planes, agenda de turnos, asignación de paseador, panel paseador + GPS, mapa en vivo del cliente, alta de paseadores por código, PWA + push (con recordatorios por cron), dashboard admin, reseñas, banners.
**Pendiente**: Fase 4 · **Pieza 5 = Pagos MercadoPago** (bloqueado por Access Token de Agustín) → luego **Fase 5 = deploy** (Vercel + dominio + env prod + carga de datos reales: 31 clientes / 7 paseadores).

## Env vars (`.env.local`, NO se commitea)
Supabase (URL, anon, service_role), Web Push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`), `CRON_SECRET`, `REMINDER_LEAD_MINUTES`, `NEXT_PUBLIC_APP_URL`, MercadoPago (`MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`) — pendiente.

## Setup
```bash
cp .env.local.example .env.local   # completar
npm run dev                         # http://localhost:3000
# antes de commitear:
npx tsc --noEmit && npm run lint && npm run build
```
