"use client";

import { useTransition } from "react";
import { cancelBath } from "@/lib/actions/baths";

export function CancelBathButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Cancelar este baño?")) return;
        startTransition(async () => {
          await cancelBath(id);
        });
      }}
      className="rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-950 disabled:opacity-60"
    >
      Cancelar
    </button>
  );
}
