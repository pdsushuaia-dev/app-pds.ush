"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r: BookState = await bookWalk(dogId, date, slot, walkerId);
            if (r.error) {
              setError(r.error);
            } else {
              // Lo llevamos a Turnos, donde ve el pedido "esperando confirmación".
              router.push("/cliente/turnos");
            }
          });
        }}
        className="btn-primary px-4 py-1.5 text-sm"
      >
        {pending ? "Enviando…" : "Pedir"}
      </button>
      {error ? (
        <span className="max-w-48 text-right text-xs text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
