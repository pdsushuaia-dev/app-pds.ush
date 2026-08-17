"use client";

import { useActionState } from "react";
import {
  addAvailability,
  type AvailabilityState,
} from "@/lib/actions/availability";
import { WEEKDAYS } from "@/lib/constants";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const initial: AvailabilityState = {};

export function AvailabilityForm() {
  const [state, action, pending] = useActionState(addAvailability, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Día</span>
          <select name="weekday" required defaultValue="1" className="input">
            {ORDER.map((wd) => (
              <option key={wd} value={wd}>
                {WEEKDAYS[wd]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Desde</span>
          <input
            name="start_time"
            type="time"
            required
            defaultValue="09:00"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Hasta</span>
          <input
            name="end_time"
            type="time"
            required
            defaultValue="13:00"
            className="input"
          />
        </label>
      </div>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-brand">{state.message}</p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary px-5 py-2.5 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Agregar horario"}
        </button>
      </div>
    </form>
  );
}
