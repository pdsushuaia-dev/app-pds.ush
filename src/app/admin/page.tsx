import { createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";

const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  hour: "2-digit",
  minute: "2-digit",
});
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Ushuaia",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface UpcomingRow {
  id: string;
  scheduled_at: string;
  time_slot: TimeSlot | null;
  walker_id: string | null;
  dogs: { name: string } | null;
}

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent && value > 0
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}

export default async function AdminHome() {
  const supabase = await createClient();

  const now = new Date();
  const nowISO = now.toISOString();
  // Cortes de "hoy" en horario de Argentina (offset fijo -03:00).
  const ymd = ymdFmt.format(now); // YYYY-MM-DD
  const startTodayISO = `${ymd}T00:00:00-03:00`;
  const startTomorrowISO = new Date(
    new Date(startTodayISO).getTime() + 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    paseosHoy,
    agTotal,
    agSin,
    agCon,
    walkersCount,
    clientsCount,
    dogsCount,
    upcomingRes,
    walkersRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", startTodayISO)
      .lt("scheduled_at", startTomorrowISO),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", nowISO),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", nowISO)
      .is("walker_id", null),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", nowISO)
      .not("walker_id", "is", null),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "walker"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),
    supabase.from("dogs").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id, scheduled_at, time_slot, walker_id, dogs(name)")
      .eq("status", "scheduled")
      .gte("scheduled_at", nowISO)
      .lt("scheduled_at", startTomorrowISO)
      .order("scheduled_at", { ascending: true })
      .limit(12),
    supabase.from("profiles").select("id, full_name").eq("role", "walker"),
  ]);

  const upcoming = (upcomingRes.data ?? []) as unknown as UpcomingRow[];
  const walkers = (walkersRes.data ?? []) as {
    id: string;
    full_name: string | null;
  }[];
  const walkerName = new Map(walkers.map((w) => [w.id, w.full_name]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500">Resumen de la operación.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Paseos de hoy" value={paseosHoy.count ?? 0} />
        <StatCard
          label="Turnos agendados"
          value={agTotal.count ?? 0}
          hint={`${agCon.count ?? 0} asignados`}
        />
        <StatCard
          label="Sin asignar"
          value={agSin.count ?? 0}
          accent
          hint="requieren paseador"
        />
        <StatCard label="Paseadores" value={walkersCount.count ?? 0} />
        <StatCard label="Clientes" value={clientsCount.count ?? 0} />
        <StatCard label="Perros" value={dogsCount.count ?? 0} />
      </div>

      {/* Próximos turnos de hoy */}
      <section>
        <h2 className="text-lg font-semibold">Próximos turnos de hoy</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            No quedan turnos para hoy.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                <span className="text-neutral-500">
                  {timeFmt.format(new Date(a.scheduled_at))} ·{" "}
                  {slotLabel(a.time_slot)}
                </span>
                {a.walker_id ? (
                  <span className="ml-auto text-xs text-neutral-500">
                    {walkerName.get(a.walker_id) ?? "Paseador"}
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Sin asignar
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
