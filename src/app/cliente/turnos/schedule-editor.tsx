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
