"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants";

const initial: AuthState = {};
const KEY = "pds_recordar_email";

export function LoginForm({ redirect = "" }: { redirect?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);

  // Prefill del email guardado (solo en el navegador).
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (saved) {
      queueMicrotask(() => {
        setEmail(saved);
        setRemember(true);
      });
    }
  }, []);

  // Guardar / borrar el email según el checkbox.
  useEffect(() => {
    if (remember && email) localStorage.setItem(KEY, email);
    else if (!remember) localStorage.removeItem(KEY);
  }, [remember, email]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">
        {APP_NAME}
      </Link>
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="mt-1 text-sm text-muted">
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
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          required
          className="input"
        />

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4"
          />
          Recordar mi email
        </label>

        {state.error ? (
          <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
