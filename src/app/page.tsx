import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="size-20 rounded-2xl object-cover shadow-lg"
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-fg">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-muted">
            Paseadores del Sur Club · Ushuaia y Río Grande
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/login" className="btn-primary px-6 py-2.5">
          Ingresar
        </Link>
        <Link href="/registro" className="btn-secondary px-6 py-2.5">
          Registrarme
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-muted">
        <Link href="/cliente" className="hover:text-brand">
          Panel Cliente
        </Link>
        <Link href="/paseador" className="hover:text-brand">
          Panel Paseador
        </Link>
        <Link href="/admin" className="hover:text-brand">
          Panel Admin
        </Link>
      </div>
    </main>
  );
}
