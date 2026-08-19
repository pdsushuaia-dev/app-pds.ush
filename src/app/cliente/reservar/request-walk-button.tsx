"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { bookWalk, type BookState } from "@/lib/actions/booking";
import type { TimeSlot } from "@/lib/turnos";

export function RequestWalkButton({
  dogId,
  date,
  slot,
  walkerId,
}: {
  dogId: string;
  date: string;
  slot: TimeSlot;
  walkerId: string;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<BookState>({});

  if (state.ok) {
    return (
      <span className="text-sm font-medium text-brand">
        ¡Solicitud enviada! Seguila en{" "}
        <Link href="/cliente/turnos" className="underline">
          Turnos
        </Link>
        .
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await bookWalk(dogId, date, slot, walkerId);
            setState(r);
          })
        }
        className="btn-primary px-4 py-1.5 text-sm"
      >
        {pending ? "Enviando…" : "Pedir"}
      </button>
      {state.error ? (
        <span className="max-w-48 text-right text-xs text-red-400">
          {state.error}
        </span>
      ) : null}
    </div>
  );
}
