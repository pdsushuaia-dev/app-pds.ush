"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/lib/actions/auth";
import { APP_NAME, CITIES } from "@/lib/constants";

const initial: AuthState = {};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">
        {APP_NAME}
      </Link>
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-muted">
        Registrate como cliente para agendar los paseos de tu perro.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input
          name="full_name"
          placeholder="Nombre completo"
          autoComplete="name"
          required
          className="input"
        />
        <input
          name="phone"
          placeholder="Teléfono"
          autoComplete="tel"
          className="input"
        />
        <select
          name="city"
          defaultValue=""
          required
          className="input"
        >
          <option value="" disabled>
            Elegí tu ciudad
          </option>
          {CITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          className="input"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          autoComplete="new-password"
          required
          className="input"
        />

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-md bg-brand/10 px-3 py-2 text-sm text-brand">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="underline">
          Ingresá
        </Link>
      </p>
    </main>
  );
}
