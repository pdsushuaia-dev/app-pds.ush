// =====================================================================
// PDS.ushuaia · Agrega un PASEO EN VIVO (con recorrido realista) a una cuenta
// =====================================================================
// Crea (o actualiza) un paseo EN CURSO para el perro de la cuenta EMAIL,
// con un recorrido que SIGUE LAS CALLES del centro de Ushuaia: tramos rectos,
// giros en esquina y un circuito que vuelve cerca del inicio. Base de DEV.
//
//   node scripts/seed-walk.mjs
//
// Idempotente: si ya hay un paseo en curso para ese perro, lo REFRESCA
// (nuevo recorrido + tiempo realista). Al terminar imprime el link al mapa.
// =====================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Cuenta (cliente) a la que se le agrega el paseo:
const EMAIL = "juanpcolinagonzalez@gmail.com";
const DURATION_MIN = 30; // hace cuánto arrancó el paseo (tiempo en vivo)

// ---------- env ----------
try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("✗ No pude leer .env.local. Corré el script desde la raíz del proyecto.");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email ?? "").toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

// ---------- Recorrido realista siguiendo la cuadrícula de Ushuaia ----------
// La grilla del centro está rotada respecto al norte: las calles corren
// paralelas/perpendiculares a la costa. Definimos dos vectores de "cuadra"
// (~120 m) alineados a esa grilla y trazamos el paseo por esquinas.
function buildRoute() {
  const baseLat = -54.8098;
  const baseLng = -68.3115;
  const u = { lat: -0.0004556, lng: 0.0016966 }; // paralelo a la costa (ESE)
  const v = { lat: 0.0009770, lng: 0.0007911 }; // perpendicular (NNE)

  // Esquinas del circuito, en cuadras [a lo largo de u, a lo largo de v].
  // Sale por una calle, gira, sube, vuelve por una paralela y cierra.
  const corners = [
    [0, 0], [3, 0], [3, 1.2], [1, 1.2], [1, 2.2],
    [-0.8, 2.2], [-0.8, 0.4], [0, 0.4], [0, 0],
  ];
  const toLL = ([a, b]) => ({
    lat: baseLat + a * u.lat + b * v.lat,
    lng: baseLng + a * u.lng + b * v.lng,
  });
  const jitter = () => (Math.random() - 0.5) * 0.00008; // ~5 m de ruido GPS

  const out = [];
  for (let s = 0; s < corners.length - 1; s++) {
    const [fa, fb] = corners[s];
    const [ta, tb] = corners[s + 1];
    const blocks = Math.hypot(ta - fa, tb - fb);
    const steps = Math.max(2, Math.round(blocks / 0.28)); // ~1 punto cada 34 m
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const p = toLL([fa + (ta - fa) * t, fb + (tb - fb) * t]);
      out.push({ lat: p.lat + jitter(), lng: p.lng + jitter() });
    }
  }
  out.push(toLL(corners[corners.length - 1])); // punto exacto de cierre
  return out;
}

console.log(`\n🐾 Paseo en vivo (recorrido realista) para ${EMAIL}\n`);

const client = await findUserByEmail(EMAIL);
if (!client) {
  console.error(`✗ No encontré la cuenta ${EMAIL}. Revisá que esté registrada.`);
  process.exit(1);
}

// 1) Perro del cliente (o crear uno)
const { data: dogs } = await db
  .from("dogs")
  .select("id, name")
  .eq("owner_id", client.id)
  .order("created_at", { ascending: true })
  .limit(1);
let dog = dogs?.[0];
if (!dog) {
  const { data, error } = await db
    .from("dogs")
    .insert({
      owner_id: client.id,
      name: "Toby",
      breed: "Border Collie",
      pickup_address: "Gobernador Paz 550, Ushuaia",
      notes: "Enérgico, le encanta correr.",
    })
    .select("id, name")
    .single();
  if (error) throw error;
  dog = data;
  console.log(`  ✓ perro creado: ${dog.name}`);
} else {
  console.log(`  • perro: ${dog.name}`);
}

// 2) Paseador (cualquiera; si no hay, crear el de demo)
const { data: walkers } = await db
  .from("profiles")
  .select("id")
  .eq("role", "walker")
  .limit(1);
let walkerId = walkers?.[0]?.id ?? null;
if (!walkerId) {
  const { data: created, error } = await db.auth.admin.createUser({
    email: "paseador.demo@pdsushuaia.com",
    password: "PdsDemo2026!",
    email_confirm: true,
    user_metadata: { full_name: "Bruno Giménez" },
  });
  if (error) throw error;
  walkerId = created.user.id;
  await db
    .from("profiles")
    .update({ role: "walker", full_name: "Bruno Giménez", city: "ushuaia" })
    .eq("id", walkerId);
  console.log("  ✓ paseador de demo creado (Bruno)");
} else {
  console.log("  • paseador asignado");
}

// 3) Paseo en curso: refrescar si existe, si no crear
const startedAt = new Date(Date.now() - DURATION_MIN * 60 * 1000).toISOString();
const { data: openWalks } = await db
  .from("walks")
  .select("id")
  .eq("dog_id", dog.id)
  .eq("status", "in_progress")
  .limit(1);
let walkId = openWalks?.[0]?.id;

if (walkId) {
  await db.from("walks").update({ started_at: startedAt, status: "in_progress" }).eq("id", walkId);
  await db.from("walk_positions").delete().eq("walk_id", walkId); // regenerar recorrido
  console.log("  • refresco el paseo en curso existente");
} else {
  const { data: walk, error } = await db
    .from("walks")
    .insert({ walker_id: walkerId, dog_id: dog.id, started_at: startedAt, status: "in_progress" })
    .select("id")
    .single();
  if (error) throw error;
  walkId = walk.id;
  console.log("  ✓ paseo EN CURSO creado");
}

// 4) Recorrido realista + timestamps repartidos en la duración
const route = buildRoute();
const startMs = new Date(startedAt).getTime();
const totalMs = DURATION_MIN * 60 * 1000;
const positions = route.map((p, i) => ({
  walk_id: walkId,
  lat: p.lat,
  lng: p.lng,
  recorded_at: new Date(startMs + Math.round((i / (route.length - 1)) * totalMs)).toISOString(),
}));
const { error: pErr } = await db.from("walk_positions").insert(positions);
if (pErr) throw pErr;
console.log(`  ✓ recorrido de ${positions.length} puntos por las calles (~1,4 km, giros y circuito)`);

console.log("\n─────────────────────────────────────");
console.log(`✓ Listo. Entrá como ${EMAIL} y abrí:`);
console.log(`   ${APP_URL}/cliente/paseo/${walkId}`);
console.log("   (o desde Turnos → “ver en vivo”)");
console.log("─────────────────────────────────────\n");
