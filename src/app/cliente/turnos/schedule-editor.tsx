"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  saveScheduleAction,
  type ScheduleState,
} from "@/lib/actions/schedule";
import { SLOTS, WEEKDAYS, type TimeSlot } from "@/lib/turnos";

const initial: ScheduleState = {};

interface InitialRule {
  weekday: number;
  timeSlot: TimeSlot;
}

type DayState = Record<number, { selected: boolean; timeSlot: TimeSlot }>;

export function ScheduleEditor({
  subscriptionId,
  dogName,
  planName,
  daysPerWeek,
  initialRules,
}: {
  subscriptionId: string;
  dogName: string;
  planName: string;
  daysPerWeek: number | null;
  initialRules: InitialRule[];
}) {
  const [days, setDays] = useState<DayState>(() => {
    const s: DayState = {};
    for (const wd of WEEKDAYS) {
      const rule = initialRules.find((r) => r.weekday === wd.value);
      s[wd.value] = {
        selected: Boolean(rule),
        timeSlot: rule?.timeSlot ?? "09",
      };
    }
    return s;
  });

  const [bulkSlot, setBulkSlot] = useState<TimeSlot>("13");

  const [state, formAction, pending] = useActionState(
    saveScheduleAction,
    initial
  );

  const entries = useMemo(
    () =>
      WEEKDAYS.filter((wd) => days[wd.value].selected).map((wd) => ({
        weekday: wd.value,
        timeSlot: days[wd.value].timeSlot,
      })),
    [days]
  );

  const count = entries.length;
  const incompleto = daysPerWeek != null && count !== daysPerWeek;

  function toggle(weekday: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], selected: !prev[weekday].selected },
    }));
  }

  function setSlot(weekday: number, timeSlot: TimeSlot) {
    setDays((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], timeSlot },
    }));
  }

  /** Marca esos días con la franja `bulkSlot` y deselecciona el resto. */
  function applyToDays(weekdays: number[]) {
    setDays((prev) => {
      const next: DayState = { ...prev };
      for (const wd of WEEKDAYS) {
        const on = weekdays.includes(wd.value);
        next[wd.value] = {
          selected: on,
          timeSlot: on ? bulkSlot : prev[wd.value].timeSlot,
        };
      }
      return next;
    });
  }

  function clearAll() {
    setDays((prev) => {
      const next: DayState = { ...prev };
      for (const wd of WEEKDAYS) {
        next[wd.value] = { ...prev[wd.value], selected: false };
      }
      return next;
    });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{dogName}</span>
        <span className="text-xs text-muted">
          {planName}
          {daysPerWeek != null ? (
            <>
              {" · "}
              <b
                className={
                  incompleto
                    ? "text-red-600 dark:text-red-400"
                    : "text-brand"
                }
              >
                {count} de {daysPerWeek} días
              </b>
            </>
          ) : null}
        </span>
      </div>

      {/* Atajo: mismo horario todos los días (para agenda fija) */}
      <div className="rounded-lg bg-surface-2 p-3">
        <p className="text-sm font-medium">¿Mismo horario todos los días?</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={bulkSlot}
            onChange={(e) => setBulkSlot(e.target.value as TimeSlot)}
            className="input"
            aria-label="Franja para todos los días"
          >
            {SLOTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => applyToDays([1, 2, 3, 4, 5])}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Lunes a viernes
          </button>
          <button
            type="button"
            onClick={() => applyToDays([1, 2, 3, 4, 5, 6, 0])}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Todos los días
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            Limpiar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Aplica esa hora a todos los días de una vez. Después podés ajustar día
          por día abajo si algún día va a otra hora.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {WEEKDAYS.map((wd) => {
          const st = days[wd.value];
          return (
            <div key={wd.value} className="flex items-center gap-3 py-2">
              <label className="flex min-w-28 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={st.selected}
                  onChange={() => toggle(wd.value)}
                  className="size-4"
                />
                {wd.label}
              </label>

              {st.selected ? (
                <select
                  value={st.timeSlot}
                  onChange={(e) => setSlot(wd.value, e.target.value as TimeSlot)}
                  className="input"
                >
                  {SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-muted">sin paseo</span>
              )}
            </div>
          );
        })}
      </div>

      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-brand">
          Agenda guardada — generamos tus próximos turnos ✓
        </p>
      ) : null}

      <button
        type="submit"
        disabled={incompleto || pending}
        className="self-start btn-primary"
      >
        {pending ? "Guardando…" : "Guardar agenda"}
      </button>
    </form>
  );
}
