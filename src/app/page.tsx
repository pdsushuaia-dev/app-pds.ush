import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="mt-3 text-neutral-500">
          Gestión de paseos de perros · Ushuaia y Río Grande
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Ingresar
        </Link>
        <Link
          href="/registro"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Registrarme
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-neutral-400">
        <Link href="/cliente" className="hover:underline">Panel Cliente</Link>
        <Link href="/paseador" className="hover:underline">Panel Paseador</Link>
        <Link href="/admin" className="hover:underline">Panel Admin</Link>
      </div>
    </main>
  );
}
