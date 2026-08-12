import { createClient } from "@/lib/supabase/server";
import type { BathAppointment } from "@/lib/types/database";
import { icons } from "@/components/icons";
import { BathForm } from "./bath-form";
import { CancelBathButton } from "./cancel-bath-button";

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

export default async function BanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [dogsRes, bathsRes] = await Promise.all([
    supabase
      .from("dogs")
      .select("id, name")
      .eq("owner_id", user?.id ?? "")
      .order("created_at", { ascending: true }),
    supabase
      .from("bath_appointments")
      .select("*, dogs(name)")
      .order("scheduled_at", { ascending: true }),
  ]);

  const dogs = (dogsRes.data ?? []) as { id: string; name: string }[];
  const baths = (bathsRes.data ?? []) as unknown as BathRow[];

  const now = new Date().getTime();
  const upcoming = baths.filter((b) => new Date(b.scheduled_at).getTime() >= now);
  const past = baths
    .filter((b) => new Date(b.scheduled_at).getTime() < now)
    .reverse();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Baños</h1>
        <p className="mt-1 text-sm text-muted">
          Agendá el baño de tu perro y lo coordinamos con vos.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Agendar un baño</h2>
        <div className="mt-4">
          <BathForm dogs={dogs} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Próximos baños</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no tenés baños agendados.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Droplet className="h-4 w-4 text-brand" />
                  {b.dogs?.name ?? "Perro"}
                </span>
                <span className="capitalize text-muted">
                  {fmt.format(new Date(b.scheduled_at))}
                </span>
                <span className="ml-auto">
                  <CancelBathButton id={b.id} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Baños anteriores</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((b) => (
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
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
