"use client";

import { useTransition } from "react";
import { removeAvailability } from "@/lib/actions/availability";

export function RemoveAvailabilityButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        start(() => {
          void removeAvailability(id);
        })
      }
      disabled={pending}
      aria-label="Quitar horario"
      className="leading-none text-brand/70 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      ✕
    </button>
  );
}
