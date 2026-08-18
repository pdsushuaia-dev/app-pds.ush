"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SLOTS, type TimeSlot } from "@/lib/turnos";

export type CancelState = { error?: string };

export type RescheduleState = { error?: string };

const VALID_SLOTS: TimeSlot[] = SLOTS.map((s) => s.key);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Cancela un turno del cliente (lo marca como 'canceled', no lo borra).
 * Valida que el turno sea de un perro del usuario y usa service-role para
 * poder cancelar incluso turnos ya asignados a un paseador.
 */
export async function cancelAppointment(id: string): Promise<CancelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, dogs(owner_id)")
    .eq("id", id)
    .maybeSingle();
  const a = appt as unknown as {
    id: string;
    dogs: { owner_id: string } | null;
  } | null;
  if (!a || a.dogs?.owner_id !== user.id) {
    return { error: "No encontramos ese turno." };
  }

  const { error } = await createAdminClient()
    .from("appointments")
    .update({ status: "canceled" })
    .eq("id", id);
  if (error) return { error: "No se pudo cancelar. Probá de nuevo." };

  revalidatePath("/cliente/turnos");
  return {};
}

/**
 * Reprograma un turno puntual a otra fecha y/o franja horaria, sin tocar la
 * agenda semanal del resto de la semana. Al moverlo, el turno vuelve a quedar
 * "a asignar" (walker_id null) para que el admin reasigne según disponibilidad.
 *
 * Valida dueño en el server y usa service-role para poder mover turnos ya
 * asignados. `dateStr` viene como "YYYY-MM-DD" (hora de Ushuaia).
 */
export async function rescheduleAppointment(
  id: string,
  dateStr: string,
  slot: TimeSlot
): Promise<RescheduleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  // --- Validaciones de entrada ---
  if (!DATE_RE.test(dateStr)) return { error: "Fecha inválida." };
  if (!VALID_SLOTS.includes(slot)) return { error: "Franja horaria inválida." };

  // Turno + dueño (RLS limita a los perros del usuario, pero validamos igual).
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, dog_id, status, dogs(owner_id)")
    .eq("id", id)
    .maybeSingle();
  const a = appt as unknown as {
    id: string;
    dog_id: string;
    status: string;
    dogs: { owner_id: string } | null;
  } | null;
  if (!a || a.dogs?.owner_id !== user.id) {
    return { error: "No encontramos ese turno." };
  }
  if (a.status !== "scheduled") {
    return { error: "Este turno ya no se puede reprogramar." };
  }

  // Nueva fecha/hora con offset fijo de Argentina (-03:00).
  const hour = SLOTS.find((s) => s.key === slot)?.hour ?? 9;
  const HH = String(hour).padStart(2, "0");
  const newScheduledAt = `${dateStr}T${HH}:00:00-03:00`;

  if (new Date(newScheduledAt).getTime() <= Date.now()) {
    return { error: "Elegí un día y una hora que todavía no hayan pasado." };
  }

  const { error } = await createAdminClient()
    .from("appointments")
    .update({
      scheduled_at: newScheduledAt,
      time_slot: slot,
      walker_id: null, // vuelve a "a asignar"
    })
    .eq("id", id);

  if (error) {
    // 23505 = ya hay un turno de ese perro a esa misma fecha/hora.
    if (error.code === "23505") {
      return { error: "Ya tenés un turno a esa hora. Elegí otra." };
    }
    return { error: "No se pudo reprogramar. Probá de nuevo." };
  }

  revalidatePath("/cliente/turnos");
  return {};
}
