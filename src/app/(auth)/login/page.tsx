import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">
        {APP_NAME}
      </Link>
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Accedé con tu email y contraseña.
      </p>

      {/* TODO(Semana 1): formulario real con Supabase Auth (Server Action) */}
      <form className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          disabled
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          disabled
        />
        <button
          type="button"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          disabled
        >
          Ingresar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
