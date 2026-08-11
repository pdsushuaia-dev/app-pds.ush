"use client";

import { useTransition } from "react";
import { signOutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-60"
    >
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
