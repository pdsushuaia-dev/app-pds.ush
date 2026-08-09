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
        timeSlot: rule?.timeSlot ?? "morning",
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
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{dogName}</span>
        <span className="text-xs text-neutral-500">
          {planName}
          {daysPerWeek != null ? (
            <>
              {" · "}
              <b
                className={
                  incompleto
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }
              >
                {count} de {daysPerWeek} días
              </b>
            </>
          ) : null}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
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
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label} ({String(s.hour).padStart(2, "0")}:00)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-neutral-400">sin paseo</span>
              )}
            </div>
          );
        })}
      </div>

      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-green-600 dark:text-green-400">
          Agenda guardada — generamos tus próximos turnos ✓
        </p>
      ) : null}

      <button
        type="submit"
        disabled={incompleto || pending}
        className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Guardando…" : "Guardar agenda"}
      </button>
    </form>
  );
}
