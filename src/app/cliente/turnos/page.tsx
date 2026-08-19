import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/types/database";
import { slotLabel } from "@/lib/turnos";
import { CancelAppointmentButton } from "./cancel-appointment-button";

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

type ApptRow = Appointment & { dogs: { name: string } | null };
interface Walker {
  id: string;
  full_name: string | null;
  photo_url: string | null;
}

export default async function TurnosPage() {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();

  const [apptsRes, liveRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, dogs(name)")
      .in("status", ["requested", "scheduled", "rejected"])
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true }),
    supabase.from("walks").select("id, dogs(name)").eq("status", "in_progress"),
  ]);

  const appts = (apptsRes.data ?? []) as unknown as ApptRow[];
  const liveWalks = (liveRes.data ?? []) as unknown as {
    id: string;
    dogs: { name: string } | null;
  }[];

  // Info pública (foto + nombre) de los paseadores involucrados.
  const walkerIds = [
    ...new Set(appts.map((a) => a.walker_id).filter((x): x is string => !!x)),
  ];
  const walkerMap = new Map<string, Walker>();
  if (walkerIds.length > 0) {
    const { data: wData } = await supabase
      .from("public_walkers")
      .select("id, full_name, photo_url")
      .in("id", walkerIds);
    for (const w of (wData ?? []) as Walker[]) walkerMap.set(w.id, w);
  }

  // Agrupar por fecha.
  const groups: { key: string; label: string; items: ApptRow[] }[] = [];
  for (const a of appts) {
    const label = dateFmt.format(new Date(a.scheduled_at));
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { key: label, label, items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mis turnos</h1>
          <p className="text-sm text-muted">
            Pedís un paseo y el paseador lo confirma. Acá ves el estado de cada
            uno.
          </p>
        </div>
        <Link href="/cliente/reservar" className="btn-primary">
          + Reservar un paseo
        </Link>
      </div>

      {/* Paseo en curso */}
      {liveWalks.map((w) => (
        <Link
          key={w.id}
          href={`/cliente/paseo/${w.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm"
        >
          <span className="font-medium text-brand">
            🟢 {w.dogs?.name ?? "Tu perro"} está de paseo ahora
          </span>
          <span className="btn-primary">Ver en vivo</span>
        </Link>
      ))}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">
            Todavía no tenés turnos. Reservá tu primer paseo y elegí quién lo
            lleva.
          </p>
          <Link
            href="/cliente/reservar"
            className="btn-primary mt-4 inline-block"
          >
            Reservar un paseo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-sm font-medium capitalize text-muted">
                {g.label}
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {g.items.map((a) => {
                  const w = a.walker_id ? walkerMap.get(a.walker_id) : null;
                  return (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      {w ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.photo_url ?? "/dog-placeholder.svg"}
                          alt=""
                          className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : null}
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {a.dogs?.name ?? "Perro"}
                          {w?.full_name ? (
                            <span className="font-normal text-muted">
                              {" "}
                              · con {w.full_name}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted">
                          {slotLabel(a.time_slot)} ·{" "}
                          {timeFmt.format(new Date(a.scheduled_at))}
                        </span>
                      </div>

                      <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
                        <StatusBadge status={a.status} />
                        {a.status === "rejected" ? (
                          <Link
                            href="/cliente/reservar"
                            className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
                          >
                            Pedir a otro
                          </Link>
                        ) : (
                          <CancelAppointmentButton id={a.id} />
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  if (status === "scheduled") {
    return <span className="badge-brand">Confirmado</span>;
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
        Rechazado
      </span>
    );
  }
  // requested
  return (
    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
      Esperando confirmación
    </span>
  );
}
