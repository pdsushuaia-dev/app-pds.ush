/**
 * Helpers puros para la agenda de turnos (sin "use server").
 *
 * Zona horaria de Argentina: offset fijo -03:00 (sin horario de verano).
 * `scheduled_at` se construye siempre con ese offset explícito.
 */

export type TimeSlot = "morning" | "midday" | "afternoon";

export const SLOTS: { key: TimeSlot; label: string; hour: number }[] = [
  { key: "morning", label: "Mañana", hour: 9 },
  { key: "midday", label: "Mediodía", hour: 13 },
  { key: "afternoon", label: "Tarde", hour: 17 },
];

/** Días de la semana con lunes primero (para la UI). value sigue 0=domingo..6=sábado. */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function slotLabel(key: TimeSlot | null | undefined): string {
  return SLOTS.find((s) => s.key === key)?.label ?? "—";
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((w) => w.value === value)?.label ?? "—";
}

/**
 * Próximas `count` fechas futuras (desde mañana) cuyo getDay() === weekday.
 */
export function nextOccurrences(weekday: number, count = 4): Date[] {
  const result: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // arranca mañana
  while (result.length < count) {
    if (d.getDay() === weekday) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

/**
 * ISO de `scheduled_at` con offset -03:00 y la hora de la franja.
 * Ej: "2026-08-11T09:00:00-03:00".
 */
export function scheduledAtISO(date: Date, slot: TimeSlot): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hour = SLOTS.find((s) => s.key === slot)?.hour ?? 9;
  const HH = String(hour).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${HH}:00:00-03:00`;
}
