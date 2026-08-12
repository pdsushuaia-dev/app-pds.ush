import { createClient } from "@/lib/supabase/server";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface ReviewRow {
  id: string;
  dog_id: string;
  walker_id: string | null;
  client_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  dogs: { name: string } | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} de 5`}>
      {"★".repeat(rating)}
      <span className="text-muted/40">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

export default async function AdminResenas({
  searchParams,
}: {
  searchParams: Promise<{ walker?: string }>;
}) {
  const sp = await searchParams;
  const walkerFilter = sp.walker ?? "";
  const supabase = await createClient();

  const [reviewsRes, walkersRes] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, dog_id, walker_id, client_id, rating, comment, created_at, dogs(name)"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "walker")
      .order("full_name", { ascending: true }),
  ]);

  const reviews = (reviewsRes.data ?? []) as unknown as ReviewRow[];
  const walkers = (walkersRes.data ?? []) as {
    id: string;
    full_name: string | null;
  }[];

  // Nombres de paseador y cliente (FKs apuntan a auth.users, no a profiles,
  // así que resolvemos con una consulta aparte).
  const ids = Array.from(
    new Set(
      reviews.flatMap((r) => [r.walker_id, r.client_id].filter(Boolean))
    )
  ) as string[];
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const nameById = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ])
  );

  // Promedio por paseador.
  const agg = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    if (!r.walker_id) continue;
    const e = agg.get(r.walker_id) ?? { sum: 0, count: 0 };
    e.sum += r.rating;
    e.count += 1;
    agg.set(r.walker_id, e);
  }

  const shown = walkerFilter
    ? reviews.filter((r) => r.walker_id === walkerFilter)
    : reviews;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Reseñas</h1>
        <p className="text-sm text-muted">
          Reseñas privadas de los clientes (control de calidad interno).
        </p>
      </div>

      {/* Promedio por paseador */}
      <section>
        <h2 className="text-lg font-semibold">Promedio por paseador</h2>
        {walkers.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No hay paseadores.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {walkers.map((w) => {
              const e = agg.get(w.id);
              const avg = e ? e.sum / e.count : null;
              return (
                <div
                  key={w.id}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="font-medium">{w.full_name ?? "(sin nombre)"}</p>
                  {avg != null ? (
                    <p className="mt-1 text-sm">
                      <span className="text-xl font-bold tabular-nums">
                        {avg.toFixed(1)}
                      </span>{" "}
                      <span className="text-muted">
                        · {e!.count} reseña{e!.count > 1 ? "s" : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">Sin reseñas</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Listado con filtro */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Todas las reseñas{" "}
            <span className="text-sm font-normal text-muted">
              ({shown.length})
            </span>
          </h2>
          <form method="get" className="flex items-center gap-2">
            <select
              name="walker"
              defaultValue={walkerFilter}
              className="input"
            >
              <option value="">Todos los paseadores</option>
              {walkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name ?? "(sin nombre)"}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1 text-sm"
            >
              Filtrar
            </button>
          </form>
        </div>

        {shown.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            No hay reseñas{walkerFilter ? " para este paseador" : ""}.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {shown.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={r.rating} />
                  <span className="font-medium">{r.dogs?.name ?? "Perro"}</span>
                  <span className="text-muted">
                    Paseador: {r.walker_id ? nameById.get(r.walker_id) ?? "—" : "—"}
                  </span>
                  <span className="text-muted">
                    Cliente: {nameById.get(r.client_id) ?? "—"}
                  </span>
                  <span className="ml-auto text-xs text-muted">
                    {dateFmt.format(new Date(r.created_at))}
                  </span>
                </div>
                {r.comment ? (
                  <p className="mt-1 text-muted">
                    “{r.comment}”
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
