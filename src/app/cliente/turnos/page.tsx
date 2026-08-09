import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, ScheduleRule, TimeSlot } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";
import { ScheduleEditor } from "./schedule-editor";

// Formatos de fecha/hora en horario de Ushuaia.
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  hour: "2-digit",
  minute: "2-digit",
});

interface SubRow {
  id: string;
  dog_id: string;
  dogs: { name: string } | null;
  plans: { name: string; days_per_week: number | null } | null;
}
type ApptRow = Appointment & { dogs: { name: string } | null };

export default async function TurnosPage() {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();

  const [subsRes, rulesRes, apptsRes, liveRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, dog_id, dogs(name), plans(name, days_per_week)")
      .eq("status", "active"),
    // RLS limita las reglas a las de los perros del dueño.
    supabase.from("schedule_rules").select("*"),
    supabase
      .from("appointments")
      .select("*, dogs(name)")
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true }),
    // Paseo en curso (RLS lo limita a los perros del dueño).
    supabase
      .from("walks")
      .select("id, dogs(name)")
      .eq("status", "in_progress"),
  ]);

  const subs = (subsRes.data ?? []) as unknown as SubRow[];
  const rules = (rulesRes.data ?? []) as ScheduleRule[];
  const appts = (apptsRes.data ?? []) as unknown as ApptRow[];
  const liveWalks = (liveRes.data ?? []) as unknown as {
    id: string;
    dogs: { name: string } | null;
  }[];

  // Reglas por suscripción.
  const rulesBySub = new Map<string, { weekday: number; timeSlot: TimeSlot }[]>();
  for (const r of rules) {
    if (r.time_slot == null) continue;
    const list = rulesBySub.get(r.subscription_id) ?? [];
    list.push({ weekday: r.weekday, timeSlot: r.time_slot });
    rulesBySub.set(r.subscription_id, list);
  }

  // Próximos turnos agrupados por fecha.
  const groups: { key: string; label: string; items: ApptRow[] }[] = [];
  for (const a of appts) {
    const d = new Date(a.scheduled_at);
    const label = dateFmt.format(d);
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { key: label, label, items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Agenda de turnos</h1>
        <p className="text-sm text-neutral-500">
          Elegí los días y la franja de cada perro. Generamos tus turnos de las
          próximas 4 semanas; el paseador se asigna después.
        </p>
      </div>

      {/* Paseo en curso */}
      {liveWalks.map((w) => (
        <Link
          key={w.id}
          href={`/cliente/paseo/${w.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm dark:border-green-800 dark:bg-green-950"
        >
          <span className="font-medium text-green-800 dark:text-green-200">
            🟢 {w.dogs?.name ?? "Tu perro"} está de paseo ahora
          </span>
          <span className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white">
            Ver en vivo
          </span>
        </Link>
      ))}

      {/* Mi agenda semanal */}
      <section>
        <h2 className="text-lg font-semibold">Mi agenda semanal</h2>
        {subs.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            No tenés suscripciones activas. Elegí un plan en{" "}
            <Link href="/cliente/planes" className="underline">
              Planes
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {subs.map((s) => (
              <ScheduleEditor
                key={s.id}
                subscriptionId={s.id}
                dogName={s.dogs?.name ?? "Perro"}
                planName={s.plans?.name ?? "Plan"}
                daysPerWeek={s.plans?.days_per_week ?? null}
                initialRules={rulesBySub.get(s.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Próximos turnos */}
      <section>
        <h2 className="text-lg font-semibold">Próximos turnos</h2>
        {groups.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            Todavía no hay turnos generados. Guardá tu agenda semanal para
            crearlos.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {groups.map((g) => (
              <div key={g.key}>
                <h3 className="text-sm font-medium capitalize text-neutral-600 dark:text-neutral-400">
                  {g.label}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {g.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                    >
                      <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                      <span className="text-neutral-500">
                        {slotLabel(a.time_slot)} · {timeFmt.format(new Date(a.scheduled_at))}
                      </span>
                      {a.walker_id == null ? (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Paseador: a asignar
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
