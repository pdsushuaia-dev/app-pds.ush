import { createClient } from "@/lib/supabase/server";
import type { BathAppointment } from "@/lib/types/database";
import { icons } from "@/components/icons";
import { BathDoneButton } from "./bath-done-button";

const fmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type BathRow = BathAppointment & { dogs: { name: string } | null };
const Droplet = icons.droplet;

export default async function BanadorHome() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bath_appointments")
    .select("*, dogs(name)")
    .neq("status", "canceled")
    .order("scheduled_at", { ascending: true });
  const baths = (data ?? []) as unknown as BathRow[];

  const pend = baths.filter((b) => b.status !== "done");
  const done = baths.filter((b) => b.status === "done");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mis baños</h1>
        <p className="mt-1 text-sm text-muted">
          Turnos de baño que agendaron los clientes. Marcalos como hechos cuando
          los termines.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Pendientes</h2>
        {pend.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            No hay baños pendientes.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {pend.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Droplet className="h-4 w-4 text-brand" />
                  {b.dogs?.name ?? "Perro"}
                </span>
                <span className="capitalize text-muted">
                  {fmt.format(new Date(b.scheduled_at))}
                </span>
                {b.notes ? (
                  <span className="w-full text-xs text-muted">“{b.notes}”</span>
                ) : null}
                <span className="ml-auto">
                  <BathDoneButton id={b.id} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Hechos</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {done.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2.5 text-sm text-muted"
              >
                <span className="flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  {b.dogs?.name ?? "Perro"}
                </span>
                <span className="capitalize">
                  {fmt.format(new Date(b.scheduled_at))}
                </span>
                <span className="ml-auto badge-brand">Hecho</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
