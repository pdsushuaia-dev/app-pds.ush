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
      className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-60 dark:hover:bg-neutral-900"
    >
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
