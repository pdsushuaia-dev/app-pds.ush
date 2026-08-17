"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  nextOccurrences,
  scheduledAtISO,
  SLOTS,
  type TimeSlot,
} from "@/lib/turnos";

export interface ScheduleState {
  ok?: boolean;
  error?: string;
}

export interface ScheduleEntry {
  weekday: number;
  timeSlot: TimeSlot;
}

const VALID_SLOTS: TimeSlot[] = SLOTS.map((s) => s.key);

/**
 * Guarda la agenda semanal de una suscripción (perro) y regenera sus turnos
 * de las próximas 4 semanas, SIN paseador (walker_id null).
 *
 * Seguridad: el dueño se valida en el server (además de la RLS). Nunca se
 * setea walker_id; el dog_id se deriva de la suscripción validada.
 */
export async function saveSchedule(
  subscriptionId: string,
  entries: ScheduleEntry[]
): Promise<ScheduleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  if (!subscriptionId) return { error: "Falta la suscripción." };

  // Suscripción + plan (RLS ya limita al dueño).
  const { data: subRaw } = await supabase
    .from("subscriptions")
    .select("id, dog_id, plans(days_per_week)")
    .eq("id", subscriptionId)
    .maybeSingle();

  const sub = subRaw as {
    id: string;
    dog_id: string;
    plans: { days_per_week: number | null } | null;
  } | null;

  if (!sub) return { error: "Suscripción no encontrada o no te pertenece." };
  const daysPerWeek = sub.plans?.days_per_week ?? null;

  // --- Validaciones ---
  if (!Array.isArray(entries) || entries.length === 0) {
    return { error: "Elegí al menos un día." };
  }
  const weekdays = entries.map((e) => e.weekday);
  if (weekdays.some((w) => !Number.isInteger(w) || w < 0 || w > 6)) {
    return { error: "Hay un día inválido." };
  }
  if (new Set(weekdays).size !== weekdays.length) {
    return { error: "No repitas el mismo día." };
  }
  if (entries.some((e) => !VALID_SLOTS.includes(e.timeSlot))) {
    return { error: "Hay una franja horaria inválida." };
  }
  if (daysPerWeek != null && entries.length !== daysPerWeek) {
    return {
      error: `Tu plan es de ${daysPerWeek} días por semana y elegiste ${entries.length}.`,
    };
  }

  // --- Reemplazar reglas ---
  const { error: delRulesErr } = await supabase
    .from("schedule_rules")
    .delete()
    .eq("subscription_id", subscriptionId);
  if (delRulesErr) return { error: delRulesErr.message };

  const ruleRows = entries.map((e) => ({
    subscription_id: subscriptionId,
    weekday: e.weekday,
    time_slot: e.timeSlot,
  }));
  const { error: insRulesErr } = await supabase
    .from("schedule_rules")
    .insert(ruleRows);
  if (insRulesErr) return { error: insRulesErr.message };

  // --- Regenerar turnos futuros sin asignar ---
  const nowISO = new Date().toISOString();
  const { error: delApptErr } = await supabase
    .from("appointments")
    .delete()
    .eq("dog_id", sub.dog_id)
    .is("walker_id", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", nowISO);
  if (delApptErr) return { error: delApptErr.message };

  const apptRows: {
    dog_id: string;
    scheduled_at: string;
    time_slot: TimeSlot;
    status: "scheduled";
  }[] = [];
  for (const e of entries) {
    for (const date of nextOccurrences(e.weekday, 4)) {
      apptRows.push({
        dog_id: sub.dog_id,
        scheduled_at: scheduledAtISO(date, e.timeSlot),
        time_slot: e.timeSlot,
        status: "scheduled",
      });
    }
  }

  if (apptRows.length > 0) {
    const { error: upErr } = await supabase
      .from("appointments")
      .upsert(apptRows, {
        onConflict: "dog_id,scheduled_at",
        ignoreDuplicates: true,
      });
    if (upErr) return { error: upErr.message };
  }

  revalidatePath("/cliente/turnos");
  return { ok: true };
}

/**
 * Wrapper para useActionState: lee subscriptionId y entries (JSON) del form.
 */
export async function saveScheduleAction(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  let entries: ScheduleEntry[];
  try {
    const parsed = JSON.parse(String(formData.get("entries") ?? "[]"));
    if (!Array.isArray(parsed)) return { error: "Datos inválidos." };
    entries = parsed as ScheduleEntry[];
  } catch {
    return { error: "Datos inválidos." };
  }

  return saveSchedule(subscriptionId, entries);
}
