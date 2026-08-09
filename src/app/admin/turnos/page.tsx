import { createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";
import { AssignRow, type WalkerOption } from "./assign-row";

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

interface ApptRow {
  id: string;
  dog_id: string;
  scheduled_at: string;
  time_slot: TimeSlot | null;
  walker_id: string | null;
  dogs: { name: string } | null;
}

function groupByDate(items: ApptRow[]) {
  const groups: { label: string; items: ApptRow[] }[] = [];
  for (const a of items) {
    const label = dateFmt.format(new Date(a.scheduled_at));
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }
  return groups;
}

export default async function AdminTurnosPage() {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();

  const [unassignedRes, assignedRes, walkersRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, dog_id, scheduled_at, time_slot, walker_id, dogs(name)")
      .is("walker_id", null)
      .eq("status", "scheduled")
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, dog_id, scheduled_at, time_slot, walker_id, dogs(name)")
      .not("walker_id", "is", null)
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "walker")
      .order("full_name", { ascending: true }),
  ]);

  const unassigned = (unassignedRes.data ?? []) as unknown as ApptRow[];
  const assigned = (assignedRes.data ?? []) as unknown as ApptRow[];
  const walkers = (walkersRes.data ?? []) as WalkerOption[];

  const walkerName = new Map(walkers.map((w) => [w.id, w.full_name]));
  const unassignedGroups = groupByDate(unassigned);
  const assignedGroups = groupByDate(assigned);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Turnos</h1>
        <p className="text-sm text-neutral-500">
          Asigná un paseador a cada turno. Un paseador no puede tener dos perros
          en el mismo horario.
        </p>
      </div>

      {walkers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Todavía no hay paseadores cargados. Creá paseadores para poder asignar
          turnos.
        </p>
      ) : null}

      {/* Turnos a asignar */}
      <section>
        <h2 className="text-lg font-semibold">
          Turnos a asignar{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({unassigned.length})
          </span>
        </h2>
        {unassignedGroups.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            No hay turnos para asignar. 🎉
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {unassignedGroups.map((g) => (
              <div key={g.label}>
                <h3 className="text-sm font-medium capitalize text-neutral-600 dark:text-neutral-400">
                  {g.label}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {g.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                    >
                      <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                      <span className="text-neutral-500">
                        {slotLabel(a.time_slot)} ·{" "}
                        {timeFmt.format(new Date(a.scheduled_at))}
                      </span>
                      <div className="ml-auto">
                        <AssignRow appointmentId={a.id} walkers={walkers} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Turnos asignados */}
      <section>
        <h2 className="text-lg font-semibold">
          Turnos asignados{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({assigned.length})
          </span>
        </h2>
        {assignedGroups.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            Todavía no asignaste ningún turno.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {assignedGroups.map((g) => (
              <div key={g.label}>
                <h3 className="text-sm font-medium capitalize text-neutral-600 dark:text-neutral-400">
                  {g.label}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {g.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                    >
                      <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                      <span className="text-neutral-500">
                        {slotLabel(a.time_slot)} ·{" "}
                        {timeFmt.format(new Date(a.scheduled_at))}
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
                        {a.walker_id ? walkerName.get(a.walker_id) ?? "Paseador" : "—"}
                      </span>
                      <div className="ml-auto">
                        <AssignRow
                          appointmentId={a.id}
                          walkers={walkers}
                          currentWalkerId={a.walker_id}
                        />
                      </div>
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
