"use client";

import { useState, useTransition } from "react";
import { cancelAppointment } from "@/lib/actions/appointments";

export function CancelAppointmentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => {
          if (!confirm("¿Cancelar este turno?")) return;
          setErr(null);
          start(async () => {
            const r = await cancelAppointment(id);
            if (r.error) setErr(r.error);
          });
        }}
        disabled={pending}
        className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar turno"}
      </button>
      {err ? <span className="text-xs text-red-400">{err}</span> : null}
    </span>
  );
}
