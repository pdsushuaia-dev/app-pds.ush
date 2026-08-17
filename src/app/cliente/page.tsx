import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { EnableNotifications } from "@/components/EnableNotifications";
import { SessionBanners, type ClientBanner } from "./session-banners";
import { icons, type IconName } from "@/components/icons";
import { CLUB_WHATSAPP } from "@/lib/constants";
import type { Appointment } from "@/lib/types/database";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  hour: "2-digit",
  minute: "2-digit",
});

type ApptRow = Appointment & { dogs: { name: string } | null };

const onboarding: {
  n: number;
  icon: IconName;
  title: string;
  desc: string;
  href: string;
}[] = [
  { n: 1, icon: "paw", title: "Cargá la ficha de tu perro", desc: "Nombre, raza, foto y dirección.", href: "/cliente/perros" },
  { n: 2, icon: "tag", title: "Elegí un plan", desc: "Los paseos por semana que quieras.", href: "/cliente/planes" },
  { n: 3, icon: "calendar", title: "Agendá los turnos", desc: "Elegí días y horario.", href: "/cliente/turnos" },
];

function Tile({
  href,
  label,
  hint,
  icon,
  external,
}: {
  href: string;
  label: string;
  hint: string;
  icon: IconName;
  external?: boolean;
}) {
  const Icon = icons[icon];
  const cls =
    "flex min-h-[116px] flex-col justify-center gap-2.5 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand/50 active:scale-[.98]";
  const inner = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
        <Icon className="h-7 w-7 text-white" />
      </span>
      <span className="text-base font-semibold leading-tight">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export default async function ClienteHome() {
  const supabase = await createClient();
  const profile = await getProfile();
  const nowISO = new Date().toISOString();

  const [bannersRes, liveRes, apptsRes, dogsRes] = await Promise.all([
    supabase.from("banners").select("id, title, body"),
    supabase.from("walks").select("id, dogs(name)").eq("status", "in_progress"),
    supabase
      .from("appointments")
      .select("*, dogs(name)")
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true })
      .limit(1),
    supabase
      .from("dogs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profile?.id ?? ""),
  ]);

  const banners = (bannersRes.data ?? []) as ClientBanner[];
  const liveWalks = (liveRes.data ?? []) as unknown as {
    id: string;
    dogs: { name: string } | null;
  }[];
  const nextAppt = ((apptsRes.data ?? []) as unknown as ApptRow[])[0] ?? null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const isNew = (dogsRes.count ?? 0) === 0;
  const Pin = icons.pin;

  const turnosHint = nextAppt
    ? `Próximo: ${dateFmt.format(new Date(nextAppt.scheduled_at))} ${timeFmt.format(new Date(nextAppt.scheduled_at))}`
    : "Agendar paseos";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Bienvenida */}
      <header className="overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface to-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
          Paseadores del Sur Club
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {isNew ? "¡Bienvenido" : "Hola"}
          {firstName ? `, ${firstName}` : ""}
          {isNew ? "!" : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isNew
            ? "En 3 pasos dejás todo listo para el primer paseo."
            : "El cuidado de tu perro, en un solo lugar."}
        </p>
      </header>

      <SessionBanners banners={banners} />

      {/* Paseo en vivo */}
      {liveWalks.map((w) => (
        <Link
          key={w.id}
          href={`/cliente/paseo/${w.id}`}
          className="flex items-center gap-3 rounded-2xl bg-brand px-5 py-4 text-[#06210f] transition-colors hover:bg-brand-hover active:scale-[.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#06210f]/10">
            <Pin className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold">
              {w.dogs?.name ?? "Tu perro"} está de paseo
            </span>
            <span className="block text-sm text-[#0a3d1e]">
              Tocá para ver el mapa en vivo
            </span>
          </span>
          <span className="text-2xl leading-none">›</span>
        </Link>
      ))}

      {/* Primeros pasos (cliente nuevo) */}
      {isNew ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Primeros pasos</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {onboarding.map((step) => {
              const Icon = icons[step.icon];
              return (
                <li key={step.n}>
                  <Link
                    href={step.href}
                    className="flex items-center gap-4 rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-brand/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">
                        {step.n}. {step.title}
                      </span>
                      <span className="block text-sm text-muted">{step.desc}</span>
                    </span>
                    <span className="text-brand">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {/* Botones grandes */}
      <div className="grid grid-cols-2 gap-3">
        <Tile href="/cliente/perros" label="Mis perros" hint="Fichas y fotos" icon="paw" />
        <Tile href="/cliente/turnos" label="Turnos" hint={turnosHint} icon="calendar" />
        <Tile href="/cliente/planes" label="Planes" hint="Elegir plan" icon="tag" />
        <Tile href="/cliente/banos" label="Baños" hint="Agendar baño" icon="droplet" />
        <Tile href="/cliente/historial" label="Historial" hint="Paseos pasados" icon="route" />
        <Tile
          href={`https://wa.me/${CLUB_WHATSAPP}`}
          label="Ayuda"
          hint="Hablar con el club"
          icon="chat"
          external
        />
      </div>

      <EnableNotifications />
    </div>
  );
}
