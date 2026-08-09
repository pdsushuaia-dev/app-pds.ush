"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants";

const initial: AuthState = {};

export function LoginForm({ redirect = "" }: { redirect?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">
        {APP_NAME}
      </Link>
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Accedé con tu email y contraseña.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="redirect" value={redirect} />
        <input
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Ingresando…" : "Ingresar"}
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
