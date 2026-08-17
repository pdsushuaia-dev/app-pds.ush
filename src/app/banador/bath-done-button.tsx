"use client";

import { useTransition } from "react";
import { markBathDone } from "@/lib/actions/baths";

export function BathDoneButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        start(() => {
          void markBathDone(id);
        })
      }
      disabled={pending}
      className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
    >
      {pending ? "…" : "Marcar hecho"}
    </button>
  );
}
