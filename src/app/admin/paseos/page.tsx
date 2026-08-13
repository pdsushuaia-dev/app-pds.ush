import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { WalkStatus } from "@/lib/types/database";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

interface WalkRow {
  id: string;
  status: WalkStatus;
  started_at: string | null;
  distance_m: number | null;
  walker_id: string | null;
  dogs: { name: string } | null;
}

export default async function AdminPaseos() {
  const supabase = await createClient();

  // La RLS walks_admin permite al admin ver todos los paseos.
  const { data } = await supabase
    .from("walks")
    .select("id, status, started_at, distance_m, walker_id, dogs(name)")
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(50);
  const walks = (data ?? []) as unknown as WalkRow[];

  const walkerIds = Array.from(
    new Set(walks.map((w) => w.walker_id).filter(Boolean))
  ) as string[];
  const { data: profs } = walkerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", walkerIds)
    : { data: [] };
  const walkerName = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ])
  );

  const enCurso = walks.filter((w) => w.status === "in_progress");
  const terminados = walks.filter((w) => w.status === "done");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Paseos</h1>
        <p className="text-sm text-muted">
          Seguí los recorridos en vivo y revisá los paseos terminados.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">
          En curso{" "}
          <span className="text-sm font-normal text-muted">
            ({enCurso.length})
          </span>
        </h2>
        {enCurso.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            No hay paseos en curso ahora.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {enCurso.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/admin/paseos/${w.id}`}
                  className="flex items-center gap-3 rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 transition-colors hover:bg-brand/15"
                >
                  <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-brand" />
                  <span className="font-medium">{w.dogs?.name ?? "Perro"}</span>
                  <span className="text-sm text-muted">
                    {w.walker_id ? walkerName.get(w.walker_id) ?? "Paseador" : "—"}
                  </span>
                  <span className="ml-auto text-sm font-medium text-brand">
                    Ver recorrido →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          Últimos paseos{" "}
          <span className="text-sm font-normal text-muted">
            ({terminados.length})
          </span>
        </h2>
        {terminados.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            Todavía no hay paseos terminados.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {terminados.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/admin/paseos/${w.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-brand/50"
                >
                  <span className="font-medium">{w.dogs?.name ?? "Perro"}</span>
                  <span className="text-muted">
                    {w.walker_id ? walkerName.get(w.walker_id) ?? "Paseador" : "—"}
                  </span>
                  {w.started_at ? (
                    <span className="text-muted">
                      {dateFmt.format(new Date(w.started_at))}
                    </span>
                  ) : null}
                  {w.distance_m != null ? (
                    <span className="ml-auto tabular-nums">
                      {(w.distance_m / 1000).toFixed(1)} km
                    </span>
                  ) : (
                    <span className="ml-auto text-brand">Ver →</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
