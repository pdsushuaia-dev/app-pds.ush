import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SLOTS, slotLabel, type TimeSlot } from "@/lib/turnos";
import { RequestWalkButton } from "./request-walk-button";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Ushuaia",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const prettyDate = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface Walker {
  id: string;
  full_name: string | null;
  photo_url: string | null;
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string; date?: string; slot?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: dogsData } = await supabase
    .from("dogs")
    .select("id, name")
    .order("name", { ascending: true });
  const dogs = (dogsData ?? []) as { id: string; name: string }[];

  const today = isoDateFmt.format(new Date());
  const dogId =
    typeof sp.dog === "string" && dogs.some((d) => d.id === sp.dog)
      ? sp.dog
      : dogs[0]?.id ?? "";
  const date = typeof sp.date === "string" && DATE_RE.test(sp.date) ? sp.date : "";
  const slot =
    typeof sp.slot === "string" && SLOTS.some((s) => s.key === sp.slot)
      ? (sp.slot as TimeSlot)
      : "";

  let walkers: Walker[] | null = null;
  if (dogId && date && slot) {
    const [y, mo, d] = date.split("-").map(Number);
    const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    const startH = SLOTS.find((s) => s.key === slot)?.hour ?? 9;
    const HH = String(startH).padStart(2, "0");
    const { data } = await supabase.rpc("available_walkers", {
      p_scheduled_at: `${date}T${HH}:00:00-03:00`,
      p_weekday: weekday,
      p_slot_start: `${HH}:00:00`,
      p_slot_end: `${String(startH + 2).padStart(2, "0")}:00:00`,
    });
    walkers = (data ?? []) as Walker[];
  }

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Reservar un paseo</h1>
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          Primero cargá la ficha de tu perro en{" "}
          <Link href="/cliente/perros" className="underline">
            Mi perro
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reservar un paseo</h1>
        <p className="text-sm text-muted">
          Elegí el día y la hora, mirá los paseadores libres y pedile a uno. Te
          confirma él mismo.
        </p>
      </div>

      {/* Selección de perro, día y franja */}
      <form
        method="get"
        className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4 sm:items-end"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Perro</span>
          <select name="dog" defaultValue={dogId} className="input">
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Día</span>
          <input
            type="date"
            name="date"
            defaultValue={date}
            min={today}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Franja</span>
          <select name="slot" defaultValue={slot} className="input">
            <option value="">Elegí…</option>
            {SLOTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Buscar paseadores
        </button>
      </form>

      {/* Resultados */}
      {walkers === null ? (
        <p className="text-sm text-muted">
          Elegí día y franja para ver los paseadores disponibles.
        </p>
      ) : walkers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          No hay paseadores libres el{" "}
          <b className="capitalize">{prettyDate.format(new Date(`${date}T12:00:00-03:00`))}</b>{" "}
          en la franja {slotLabel(slot as TimeSlot)}. Probá otro día u horario.
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Paseadores libres · {slotLabel(slot as TimeSlot)}
          </h2>
          <ul className="flex flex-col gap-2">
            {walkers.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.photo_url ?? "/dog-placeholder.svg"}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
                <span className="font-medium">
                  {w.full_name ?? "Paseador"}
                </span>
                <span className="ml-auto">
                  <RequestWalkButton
                    dogId={dogId}
                    date={date}
                    slot={slot as TimeSlot}
                    walkerId={w.id}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
