import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/constants";
import type { WalkerAvailability } from "@/lib/types/database";
import { AvailabilityForm } from "./availability-form";
import { RemoveAvailabilityButton } from "./remove-button";

// Orden de lunes a domingo (los weekday guardan 0=domingo).
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const hhmm = (t: string) => t.slice(0, 5);

export default async function HorariosPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const { data } = await supabase
    .from("walker_availability")
    .select("*")
    .eq("walker_id", profile?.id ?? "")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });
  const rows = (data ?? []) as WalkerAvailability[];

  const byDay = new Map<number, WalkerAvailability[]>();
  for (const r of rows) {
    const arr = byDay.get(r.weekday) ?? [];
    arr.push(r);
    byDay.set(r.weekday, arr);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mis horarios</h1>
        <p className="mt-1 text-sm text-muted">
          Cargá los días y las horas en las que trabajás. Cada turno dura 2 h
          (1:30 de paseo + 30 min de traslado e hidratación). Los clientes solo
          van a poder pedirte paseos dentro de tus horarios.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Agregar horario</h2>
        <div className="mt-4">
          <AvailabilityForm />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {ORDER.map((wd) => {
          const list = byDay.get(wd) ?? [];
          return (
            <div
              key={wd}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-medium">{WEEKDAYS[wd]}</p>
              {list.length === 0 ? (
                <p className="mt-1 text-sm text-muted">Sin horario · día libre</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {list.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-sm text-brand"
                    >
                      {hhmm(r.start_time)}–{hhmm(r.end_time)}
                      <RemoveAvailabilityButton id={r.id} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
