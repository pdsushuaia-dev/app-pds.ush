"use client";

import { useState, useTransition } from "react";
import { rescheduleAppointment } from "@/lib/actions/appointments";
import { SLOTS, type TimeSlot } from "@/lib/turnos";

export function RescheduleAppointmentButton({
  id,
  currentDate,
  currentSlot,
}: {
  id: string;
  currentDate: string; // "YYYY-MM-DD" (hora de Ushuaia)
  currentSlot: TimeSlot;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [slot, setSlot] = useState<TimeSlot>(currentSlot);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Mínimo = hoy (Ushuaia). Lazy para no violar la regla de purity.
  const [today] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Ushuaia",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setErr(null);
          setDate(currentDate);
          setSlot(currentSlot);
          setOpen(true);
        }}
        className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface-2"
      >
        Reprogramar
      </button>
    );
  }

  return (
    <span className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="input py-1 text-xs"
          aria-label="Nueva fecha"
        />
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as TimeSlot)}
          className="input py-1 text-xs"
          aria-label="Nueva franja"
        >
          {SLOTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await rescheduleAppointment(id, date, slot);
              if (r.error) setErr(r.error);
              else setOpen(false);
            });
          }}
          className="btn-primary px-3 py-1 text-xs"
        >
          {pending ? "Guardando…" : "Guardar cambio"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            setOpen(false);
          }}
          className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      {err ? <span className="text-xs text-red-400">{err}</span> : null}
    </span>
  );
}
