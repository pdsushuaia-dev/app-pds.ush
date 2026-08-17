// =====================================================================
// PDS.ushuaia · Seed de datos de DEMO (base de DESARROLLO)
// =====================================================================
// Crea 2 cuentas de prueba (1 cliente + 1 paseador) y las llena de datos:
// perro, plan con precio negociado, turnos (algunos sin asignar), un paseo
// TERMINADO con su recorrido en el mapa, y una reseña de 5 estrellas.
//
// Cómo correrlo — desde la raíz del proyecto:
//     node scripts/seed-demo.mjs
//
// Lee las credenciales de Supabase de .env.local (NEXT_PUBLIC_SUPABASE_URL
// y SUPABASE_SERVICE_ROLE_KEY). Es IDEMPOTENTE: si ya existen las cuentas o
// el perro de demo, no duplica nada. No borra datos.
// =====================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------- 1) Cargar .env.local ----------
try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const k = m[1];
    const v = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch {
  console.error("✗ No pude leer .env.local. Corré el script desde la raíz del proyecto.");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Datos de demo ----------
const PASS = "PdsDemo2026!";
const CLIENT = { email: "cliente.demo@pdsushuaia.com", full_name: "Camila Fernández", phone: "2901556677", city: "ushuaia" };
const WALKER = { email: "paseador.demo@pdsushuaia.com", full_name: "Bruno Giménez", phone: "2901443322", city: "ushuaia" };

// ---------- Helpers ----------
async function getOrCreateUser(info, role) {
  let user = null;
  for (let page = 1; page <= 20 && !user; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    user = data.users.find((u) => (u.email ?? "").toLowerCase() === info.email.toLowerCase()) ?? null;
    if (data.users.length < 200) break;
  }
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: info.email,
      password: PASS,
      email_confirm: true,
      user_metadata: { full_name: info.full_name, phone: info.phone },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  ✓ cuenta creada: ${info.email}`);
  } else {
    console.log(`  • cuenta ya existía: ${info.email}`);
  }
  // Asegurar rol + datos del perfil (service_role bypassa el candado de rol).
  const { error: pErr } = await db
    .from("profiles")
    .update({ role, full_name: info.full_name, phone: info.phone, city: info.city })
    .eq("id", user.id);
  if (pErr) throw pErr;
  return user;
}

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const atAR = (dateStr, hhmm) => new Date(`${dateStr}T${hhmm}:00-03:00`).toISOString();

// ---------- Main ----------
console.log("\n🌱 Seed de demo · PDS.ushuaia\n");

console.log("1) Cuentas");
const client = await getOrCreateUser(CLIENT, "client");
const walker = await getOrCreateUser(WALKER, "walker");

// Idempotencia: si ya está el perro de demo, no reinsertamos datos.
const { data: existingDogs } = await db
  .from("dogs")
  .select("id")
  .eq("owner_id", client.id)
  .eq("name", "Rocco");
if (existingDogs && existingDogs.length) {
  console.log("\n✓ El perro de demo ya existe → no duplico datos.");
  printCreds();
  process.exit(0);
}

console.log("\n2) Perro");
const { data: dog, error: dogErr } = await db
  .from("dogs")
  .insert({
    owner_id: client.id,
    name: "Rocco",
    breed: "Golden Retriever",
    pickup_address: "Av. San Martín 1234, Ushuaia",
    notes: "Sociable. La correa está en el perchero de la entrada.",
  })
  .select("id")
  .single();
if (dogErr) throw dogErr;
console.log("  ✓ Rocco (Golden Retriever)");

console.log("\n3) Plan + suscripción");
const { data: plans } = await db
  .from("plans")
  .select("id, name, days_per_week")
  .eq("active", true)
  .order("days_per_week", { ascending: true });
const plan = plans?.find((p) => p.days_per_week === 4) ?? plans?.[0] ?? null;
const { error: subErr } = await db.from("subscriptions").insert({
  dog_id: dog.id,
  plan_id: plan?.id ?? null,
  status: "active",
  custom_price: 42000,
});
if (subErr) throw subErr;
console.log(`  ✓ ${plan?.name ?? "sin plan"} · precio negociado $42.000`);

console.log("\n4) Turnos");
const today = new Date();
const todayStr = ymd(today);

const { data: apptToday, error: aErr } = await db
  .from("appointments")
  .insert({
    dog_id: dog.id,
    walker_id: walker.id,
    scheduled_at: atAR(todayStr, "09:00"),
    time_slot: "09",
    status: "done",
  })
  .select("id")
  .single();
if (aErr) throw aErr;

const futureDates = [];
const cur = new Date(today);
while (futureDates.length < 6) {
  cur.setDate(cur.getDate() + 1);
  const wd = cur.getDay();
  if (wd === 0 || wd === 6) continue; // saltar sáb/dom
  futureDates.push(ymd(new Date(cur)));
}
const futureRows = futureDates.map((ds, i) => ({
  dog_id: dog.id,
  walker_id: i === 2 ? null : walker.id, // uno SIN asignar (para el panel admin)
  scheduled_at: atAR(ds, "09:00"),
  time_slot: "09",
  status: "scheduled",
}));
const { error: fErr } = await db.from("appointments").insert(futureRows);
if (fErr) throw fErr;
console.log(`  ✓ 1 turno de hoy (hecho) + ${futureRows.length} próximos (1 sin asignar)`);

console.log("\n5) Paseo terminado + recorrido");
const startedAt = atAR(todayStr, "09:05");
const endedAt = atAR(todayStr, "09:47");
const { data: walk, error: wErr } = await db
  .from("walks")
  .insert({
    appointment_id: apptToday.id,
    walker_id: walker.id,
    dog_id: dog.id,
    started_at: startedAt,
    ended_at: endedAt,
    distance_m: 2640,
    duration_s: 2520,
    status: "done",
  })
  .select("id")
  .single();
if (wErr) throw wErr;

const baseLat = -54.8072;
const baseLng = -68.3068;
const startMs = new Date(startedAt).getTime();
const positions = [];
for (let i = 0; i < 18; i++) {
  const t = i / 17;
  positions.push({
    walk_id: walk.id,
    lat: baseLat + t * 0.0045 + Math.sin(i * 0.9) * 0.0006,
    lng: baseLng + t * 0.0075 + Math.cos(i * 0.7) * 0.0006,
    recorded_at: new Date(startMs + i * 140000).toISOString(),
  });
}
const { error: posErr } = await db.from("walk_positions").insert(positions);
if (posErr) throw posErr;
console.log(`  ✓ paseo de 2,6 km · ${positions.length} puntos de GPS`);

console.log("\n6) Reseña");
const { error: rErr } = await db.from("reviews").insert({
  walk_id: walk.id,
  dog_id: dog.id,
  client_id: client.id,
  walker_id: walker.id,
  rating: 5,
  comment: "Excelente paseo, Rocco volvió feliz y cansado. Bruno muy atento, mandó fotos. ¡Gracias!",
});
if (rErr) throw rErr;
console.log("  ✓ 5★");

printCreds();

function printCreds() {
  console.log("\n─────────────────────────────────────");
  console.log("✓ Listo. Cuentas de demo:");
  console.log(`  Cliente:   ${CLIENT.email}   /  ${PASS}`);
  console.log(`  Paseador:  ${WALKER.email}  /  ${PASS}`);
  console.log("  Admin:     usá tu cuenta de siempre");
  console.log("─────────────────────────────────────\n");
}
