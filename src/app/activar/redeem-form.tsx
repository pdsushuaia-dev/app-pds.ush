"use client";

import { useActionState } from "react";
import { redeemInviteAction, type RedeemState } from "@/lib/actions/invites";

const initial: RedeemState = {};

export function RedeemForm() {
  const [state, formAction, pending] = useActionState(redeemInviteAction, initial);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input
        name="code"
        placeholder="Código (ej. K7M2P9QX)"
        autoComplete="off"
        autoCapitalize="characters"
        required
        className="input text-center font-mono text-lg tracking-widest uppercase"
      />

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Activando…" : "Activar mi cuenta de paseador"}
      </button>
    </form>
  );
}
