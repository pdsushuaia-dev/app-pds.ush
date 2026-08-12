import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { EnableNotifications } from "@/components/EnableNotifications";
import { SessionBanners, type ClientBanner } from "./session-banners";
import { icons } from "@/components/icons";
import type { Appointment } from "@/lib/types/database";

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

const accesos = [
  { href: "/cliente/perros", label: "Mis perros", icon: "paw" as const },
  { href: "/cliente/planes", label: "Planes", icon: "tag" as const },
  { href: "/cliente/historial", label: "Historial", icon: "route" as const },
];

export default async function ClienteHome() {
  const supabase = await createClient();
  const profile = await getProfile();
  const nowISO = new Date().toISOString();

  const [bannersRes, liveRes, apptsRes] = await Promise.all([
    supabase.from("banners").select("id, title, body"),
    supabase.from("walks").select("id, dogs(name)").eq("status", "in_progress"),
    supabase
      .from("appointments")
      .select("*, dogs(name)")
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true })
      .limit(4),
  ]);

  const banners = (bannersRes.data ?? []) as ClientBanner[];
  const liveWalks = (liveRes.data ?? []) as unknown as {
    id: string;
    dogs: { name: string } | null;
  }[];
  const appts = (apptsRes.data ?? []) as unknown as ApptRow[];

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Hola{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Todo sobre los paseos de tu perro, en un solo lugar.
        </p>
      </header>

      <SessionBanners banners={banners} />

      {/* Paseo en vivo de hoy */}
      {liveWalks.map((w) => (
        <Link
          key={w.id}
          href={`/cliente/paseo/${w.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-brand/50 bg-brand/10 px-5 py-4 transition-colors hover:bg-brand/15"
        >
          <span className="flex items-center gap-2 font-medium text-brand">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
            {w.dogs?.name ?? "Tu perro"} está de paseo ahora
          </span>
          <span className="btn-primary">Ver en vivo</span>
        </Link>
      ))}

      {/* Próximos turnos */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximos turnos</h2>
          <Link
            href="/cliente/turnos"
            className="text-sm text-brand hover:underline"
          >
            Ver agenda
          </Link>
        </div>
        {appts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Todavía no tenés turnos agendados. Elegí un plan y armá tu agenda en{" "}
            <Link href="/cliente/planes" className="text-brand hover:underline">
              Planes
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {appts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{a.dogs?.name ?? "Perro"}</span>
                <span className="capitalize text-muted">
                  {dateFmt.format(new Date(a.scheduled_at))} ·{" "}
                  {timeFmt.format(new Date(a.scheduled_at))}
                </span>
                {a.walker_id == null ? (
                  <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                    A asignar paseador
                  </span>
                ) : (
                  <span className="ml-auto badge-brand">Paseador asignado</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {accesos.map((c) => {
          const Icon = icons[c.icon];
          return (
            <Link
              key={c.href}
              href={c.href}
              className="card flex flex-col items-center gap-2 p-4 text-center text-sm transition-colors hover:border-brand/50"
            >
              <Icon className="h-6 w-6 text-brand" />
              {c.label}
            </Link>
          );
        })}
      </div>

      <EnableNotifications />
    </div>
  );
}
