import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";

const dateTimeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface HistoryRow {
  walk_id: string;
  dog_name: string;
  walker_name: string | null;
  ended_at: string | null;
  started_at: string | null;
  distance_m: number | null;
  duration_s: number | null;
  media_count: number;
}

export default async function HistorialPage() {
  const supabase = await createClient();

  // Función SECURITY DEFINER scopeada a auth.uid() (solo los paseos del cliente).
  const { data } = await supabase.rpc("client_walk_history", { p_limit: 50 });
  const walks = (data ?? []) as HistoryRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Historial de paseos</h1>
        <p className="text-sm text-muted">Tus paseos finalizados, del más reciente.</p>
      </div>

      {walks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no hay paseos finalizados. Cuando tu perro complete un paseo, va
          a aparecer acá con el recorrido, las fotos y el resumen.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {walks.map((w) => {
            const when = w.ended_at ?? w.started_at;
            const km = ((w.distance_m ?? 0) / 1000).toFixed(1);
            return (
              <li key={w.walk_id}>
                <Link
                  href={`/cliente/paseo/${w.walk_id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-surface-2"
                >
                  <span className="font-medium">{w.dog_name}</span>
                  {when ? (
                    <span className="text-muted">
                      {dateTimeFmt.format(new Date(when))}
                    </span>
                  ) : null}
                  <span className="text-muted">
                    {w.walker_name ?? "Paseador"}
                  </span>
                  <span className="ml-auto flex items-center gap-2 text-muted">
                    <span className="tabular-nums">{km} km</span>
                    <span className="tabular-nums">
                      {formatDuration(w.duration_s)}
                    </span>
                    {w.media_count > 0 ? (
                      <span className="badge-brand">📷 {w.media_count}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
