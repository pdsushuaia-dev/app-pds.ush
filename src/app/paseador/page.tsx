import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";
import { EnableNotifications } from "@/components/EnableNotifications";
import { StartWalkButton } from "./start-walk-button";
import { RequestActions } from "./request-actions";

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
  dogs: { name: string; photo_url: string | null } | null;
}

export default async function PaseadorHome() {
  const supabase = await createClient();

  // Desde el inicio de hoy (para no perder turnos de hoy que ya pasaron de hora).
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const fromISO = from.toISOString();

  const [requestsRes, apptsRes, walksRes, doneRes] = await Promise.all([
    // Solicitudes pendientes que le mandaron al paseador (modelo marketplace).
    supabase
      .from("appointments")
      .select("id, dog_id, scheduled_at, time_slot, dogs(name, photo_url)")
      .eq("status", "requested")
      .gte("scheduled_at", fromISO)
      .order("scheduled_at", { ascending: true }),
    // RLS appts_walker_select limita a los turnos asignados al paseador.
    supabase
      .from("appointments")
      .select("id, dog_id, scheduled_at, time_slot, dogs(name, photo_url)")
      .eq("status", "scheduled")
      .gte("scheduled_at", fromISO)
      .order("scheduled_at", { ascending: true }),
    // Paseos en curso (para "Continuar").
    supabase
      .from("walks")
      .select("id, appointment_id")
      .eq("status", "in_progress"),
    // Paseos finalizados hoy (para subir/ver fotos después).
    supabase
      .from("walks")
      .select("id, started_at, dogs(name)")
      .eq("status", "done")
      .gte("started_at", fromISO)
      .order("started_at", { ascending: false }),
  ]);

  const requests = (requestsRes.data ?? []) as unknown as ApptRow[];
  const appts = (apptsRes.data ?? []) as unknown as ApptRow[];
  const walks = (walksRes.data ?? []) as { id: string; appointment_id: string | null }[];
  const doneWalks = (doneRes.data ?? []) as unknown as {
    id: string;
    started_at: string | null;
    dogs: { name: string } | null;
  }[];

  const walkByAppt = new Map<string, string>();
  for (const w of walks) {
    if (w.appointment_id) walkByAppt.set(w.appointment_id, w.id);
  }

  // Agrupar por fecha.
  const groups: { label: string; items: ApptRow[] }[] = [];
  for (const a of appts) {
    const label = dateFmt.format(new Date(a.scheduled_at));
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi agenda</h1>
        <p className="text-sm text-muted">
          Tus paseos asignados. Iniciá el paseo cuando retires al perro.
        </p>
      </div>

      <EnableNotifications />

      {/* Solicitudes pendientes (marketplace) */}
      {requests.length > 0 ? (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <h2 className="text-lg font-semibold">
            Solicitudes{" "}
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-sm text-amber-400">
              {requests.length}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Un cliente te pidió estos paseos. Aceptá o rechazá.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {requests.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                <span className="text-muted">
                  {dateFmt.format(new Date(a.scheduled_at))} ·{" "}
                  {slotLabel(a.time_slot)} ·{" "}
                  {timeFmt.format(new Date(a.scheduled_at))}
                </span>
                <span className="ml-auto">
                  <RequestActions id={a.id} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No tenés turnos asignados por ahora.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.label}>
              <h2 className="text-sm font-medium capitalize text-muted">
                {g.label}
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {g.items.map((a) => {
                  const walkId = walkByAppt.get(a.id);
                  return (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                      <span className="text-muted">
                        {slotLabel(a.time_slot)} ·{" "}
                        {timeFmt.format(new Date(a.scheduled_at))}
                      </span>
                      <div className="ml-auto">
                        {walkId ? (
                          <Link
                            href={`/paseador/paseo/${walkId}`}
                            className="btn-primary"
                          >
                            Continuar paseo
                          </Link>
                        ) : (
                          <StartWalkButton appointmentId={a.id} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {doneWalks.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium text-muted">
            Finalizados hoy
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {doneWalks.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{w.dogs?.name ?? "Perro"}</span>
                {w.started_at ? (
                  <span className="text-muted">
                    {timeFmt.format(new Date(w.started_at))}
                  </span>
                ) : null}
                <Link
                  href={`/paseador/paseo/${w.id}`}
                  className="btn-secondary ml-auto px-3 py-1.5"
                >
                  Fotos
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
