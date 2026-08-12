// =====================================================================
// PDS.ushuaia · Agrega un PASEO EN VIVO (con recorrido) a una cuenta
// =====================================================================
// Para ver cómo se ve el mapa: crea un paseo EN CURSO con su recorrido
// para el perro de la cuenta EMAIL de abajo. Base de DESARROLLO.
//
//   node scripts/seed-walk.mjs
//
// Idempotente: si ya hay un paseo en curso para ese perro, reusa ese.
// Al terminar imprime el link directo al mapa.
// =====================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Cuenta (cliente) a la que se le agrega el paseo:
const EMAIL = "juanpcolinagonzalez@gmail.com";

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

console.log(`\n🐾 Agregando paseo en vivo a ${EMAIL}\n`);

const client = await findUserByEmail(EMAIL);
if (!client) {
  console.error(`✗ No encontré la cuenta ${EMAIL}. Revisá que esté registrada e intentá de nuevo.`);
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

// 3) ¿Ya hay un paseo en curso para este perro?
const { data: openWalks } = await db
  .from("walks")
  .select("id")
  .eq("dog_id", dog.id)
  .eq("status", "in_progress")
  .limit(1);
let walkId = openWalks?.[0]?.id;

if (!walkId) {
  const startedAt = new Date(Date.now() - 18 * 60 * 1000).toISOString(); // arrancó hace 18 min
  const { data: walk, error } = await db
    .from("walks")
    .insert({
      walker_id: walkerId,
      dog_id: dog.id,
      started_at: startedAt,
      distance_m: 1520,
      duration_s: 1080,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (error) throw error;
  walkId = walk.id;

  // Recorrido alrededor del centro de Ushuaia
  const baseLat = -54.8085;
  const baseLng = -68.312;
  const startMs = new Date(startedAt).getTime();
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    pts.push({
      walk_id: walkId,
      lat: baseLat + t * 0.006 + Math.sin(i * 0.6) * 0.0008,
      lng: baseLng + t * 0.009 + Math.cos(i * 0.5) * 0.0009,
      recorded_at: new Date(startMs + i * 45000).toISOString(),
    });
  }
  const { error: pErr } = await db.from("walk_positions").insert(pts);
  if (pErr) throw pErr;
  console.log(`  ✓ paseo EN CURSO con ${pts.length} puntos de recorrido`);
} else {
  console.log("  • ya había un paseo en curso → lo reuso");
}

console.log("\n─────────────────────────────────────");
console.log(`✓ Listo. Entrá como ${EMAIL} y abrí:`);
console.log(`   ${APP_URL}/cliente/paseo/${walkId}`);
console.log("   (o desde Turnos → “ver en vivo”)");
console.log("─────────────────────────────────────\n");
