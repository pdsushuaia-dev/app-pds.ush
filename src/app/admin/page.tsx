import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";
import { icons, type IconName } from "@/components/icons";

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
  icon,
  accent,
  hint,
  href,
}: {
  label: string;
  value: number;
  icon: IconName;
  accent?: boolean;
  hint?: string;
  href?: string;
}) {
  const Icon = icons[icon];
  const isAlert = accent && value > 0;
  const base = `block rounded-xl border p-4 ${
    isAlert ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-surface"
  }`;
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isAlert
              ? "bg-amber-500/15 text-amber-400"
              : "bg-surface-2 text-muted"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} group transition hover:border-brand/60 hover:bg-surface-2`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
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
        <p className="text-sm text-muted">Resumen de la operación.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Paseos de hoy"
          value={paseosHoy.count ?? 0}
          icon="route"
          href="/admin/turnos"
        />
        <StatCard
          label="Turnos agendados"
          value={agTotal.count ?? 0}
          icon="calendar"
          hint={`${agCon.count ?? 0} asignados`}
          href="/admin/turnos"
        />
        <StatCard
          label="Sin asignar"
          value={agSin.count ?? 0}
          icon="bell"
          accent
          hint="requieren paseador"
          href="/admin/turnos"
        />
        <StatCard
          label="Paseadores"
          value={walkersCount.count ?? 0}
          icon="users"
          href="/admin/paseadores"
        />
        <StatCard
          label="Clientes"
          value={clientsCount.count ?? 0}
          icon="user"
          href="/admin/clientes"
        />
        <StatCard
          label="Perros"
          value={dogsCount.count ?? 0}
          icon="paw"
          href="/admin/clientes"
        />
      </div>

      {/* Próximos turnos de hoy */}
      <section>
        <h2 className="text-lg font-semibold">Próximos turnos de hoy</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            No quedan turnos para hoy.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                <span className="text-muted">
                  {timeFmt.format(new Date(a.scheduled_at))} ·{" "}
                  {slotLabel(a.time_slot)}
                </span>
                {a.walker_id ? (
                  <span className="ml-auto text-xs text-muted">
                    {walkerName.get(a.walker_id) ?? "Paseador"}
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
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
