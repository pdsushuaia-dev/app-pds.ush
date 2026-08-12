import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { icons } from "@/components/icons";

const features = [
  {
    icon: "pin" as const,
    title: "Seguimiento en vivo",
    desc: "Mirá a tu perro en el mapa, en tiempo real.",
  },
  {
    icon: "camera" as const,
    title: "Fotos y videos",
    desc: "Recibí el registro de cada paseo.",
  },
  {
    icon: "calendar" as const,
    title: "Agenda flexible",
    desc: "Elegí tus días y horarios fijos.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="PDS"
          className="size-24 rounded-3xl object-cover shadow-lg shadow-black/40 ring-1 ring-border"
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {APP_NAME}
          </h1>
          <p className="mt-3 text-lg text-muted">Paseadores del Sur Club</p>
          <p className="mt-1 text-sm text-muted">
            Más que paseos, una rutina de bienestar para tu perro. Ushuaia y Río
            Grande.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/registro" className="btn-primary px-6 py-2.5">
          Crear cuenta
        </Link>
        <Link href="/login" className="btn-secondary px-6 py-2.5">
          Ingresar
        </Link>
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-3">
        {features.map((f) => {
          const Icon = icons[f.icon];
          return (
            <div
              key={f.title}
              className="card flex flex-col items-center gap-2 p-5 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-xs text-muted">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs uppercase tracking-widest text-muted">
        Aventura · Conexión · Libertad
      </p>
    </main>
  );
}
