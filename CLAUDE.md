# PDS.ushuaia — Contexto del proyecto

Plataforma web de gestión de **paseos de perros** para Ushuaia y Río Grande.
Cliente: Agustín Hernández (PDS.ushuaia). Fase 1 = MVP en ~4 semanas.

## Roles
- **client** (dueño del perro): ficha del perro, plan, agenda de turnos, mapa en vivo, reseña privada, pago por link.
- **walker** (paseador): alta por código de invitación, agenda, iniciar/terminar paseo, emitir GPS.
- **admin** (Agustín): dashboard, gestión de paseadores/planes/clientes, reseñas (solo él), banners.

## Stack
- **Next.js 16 (App Router) + TypeScript** · `src/` · import alias `@/*`.
- **Tailwind v4**. (shadcn/ui opcional más adelante.)
- **Supabase**: Postgres + Auth + Realtime + Storage. Cliente vía `@supabase/ssr`.
- **Leaflet + OpenStreetMap** para mapas (gratis, sin Google Maps).
- **MercadoPago** (Checkout Pro / link) para membresías.
- **Deploy**: Vercel (front) + Supabase (backend).
- PWA: manifest + service worker manual (NO `next-pwa`, incompatible con Next 16).

## Estructura
```
src/
  app/
    page.tsx                landing
    (auth)/login, /registro
    cliente/                panel client  (layout + perros/turnos/pagos)
    paseador/               panel walker  (agenda + paseo/[walkId])
    admin/                  panel admin   (dashboard + paseadores/planes/clientes/resenas/banners)
    api/mercadopago/webhook route handler del webhook
  components/               RoleNav, Placeholder, map/LiveMap
  lib/
    supabase/               client.ts (browser), server.ts (RSC/actions), middleware.ts
    types/database.ts       tipos DB (escritos a mano; regenerar con supabase gen types)
    geo/haversine.ts        distancia del recorrido
    constants.ts            ciudades, weekdays, intervalo GPS
  middleware.ts             refresca sesión + protege rutas por prefijo/rol
supabase/
  migrations/0001_init.sql  esquema + RLS
  seed.sql                  catálogo de planes
```

**Decisión de ruteo:** se usan segmentos reales `/cliente` `/paseador` `/admin`
(no route groups) para que cada rol tenga su namespace y el middleware proteja por prefijo.

## Reglas de negocio clave
- **1 perro por turno por paseador** → `unique (walker_id, scheduled_at)` en `appointments`.
- Turnos recurrentes: `schedule_rules` (weekday + hora) se materializan en `appointments`.
- Reseñas **privadas**: RLS deja `SELECT` solo al admin.
- GPS en vivo: paseador emite `watchPosition` + Wake Lock → Supabase Realtime broadcast por `walk_id`; se persisten muestras en `walk_positions`. Al cerrar: distancia (Haversine) + duración → `walks`.
- **Limitación honesta (en contrato):** en PWA el GPS se corta con pantalla apagada. Regla "app abierta durante el paseo".

## Convenciones
- Definir **schema primero** (migración), después la UI.
- Una feature por vez; correr `npm run lint` y typecheck antes de commitear.
- RLS activa en todas las tablas; nada de service_role en el cliente.
- Idioma de UI: español.

## Estado actual
Semana 1 en curso: estructura + esqueleto listos. Páginas de rol son placeholders.
Falta conectar Supabase real (env), Auth funcional, y luego features por cronograma.

## Setup
```bash
cp .env.local.example .env.local   # completar con datos de Supabase
npm run dev
```
