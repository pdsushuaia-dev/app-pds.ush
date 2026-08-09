"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface StartWalkState {
  ok?: boolean;
  walkId?: string;
  error?: string;
}

export interface EndWalkState {
  ok?: boolean;
  error?: string;
}

/**
 * Inicia (o continúa) el paseo de un turno asignado al paseador logueado.
 * Devuelve el walkId para redirigir a la pantalla de paseo en curso.
 */
export async function startWalk(appointmentId: string): Promise<StartWalkState> {
  if (!appointmentId) return { error: "Falta el turno." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  // Validar rol paseador.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((me as { role: string } | null)?.role !== "walker") {
    return { error: "Solo un paseador puede iniciar un paseo." };
  }

  // El turno tiene que estar asignado a este paseador.
  const { data: apptRaw } = await supabase
    .from("appointments")
    .select("id, dog_id, walker_id")
    .eq("id", appointmentId)
    .maybeSingle();
  const appt = apptRaw as {
    id: string;
    dog_id: string;
    walker_id: string | null;
  } | null;
  if (!appt) return { error: "Turno no encontrado." };
  if (appt.walker_id !== user.id) {
    return { error: "Ese turno no está asignado a vos." };
  }

  // ¿Ya hay un paseo en curso para este turno? No dupliques.
  const { data: existing } = await supabase
    .from("walks")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, walkId: (existing as { id: string }).id };
  }

  const { data: inserted, error } = await supabase
    .from("walks")
    .insert({
      appointment_id: appointmentId,
      walker_id: user.id,
      dog_id: appt.dog_id,
      started_at: new Date().toISOString(),
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/paseador");
  return { ok: true, walkId: (inserted as { id: string }).id };
}

/**
 * Cierra el paseo con distancia (m) y duración (s).
 */
export async function endWalk(
  walkId: string,
  distanceM: number,
  durationS: number
): Promise<EndWalkState> {
  if (!walkId) return { error: "Falta el paseo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { data: walkRaw } = await supabase
    .from("walks")
    .select("id, walker_id")
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as { id: string; walker_id: string } | null;
  if (!walk) return { error: "Paseo no encontrado." };
  if (walk.walker_id !== user.id) return { error: "Ese paseo no es tuyo." };

  const { error } = await supabase
    .from("walks")
    .update({
      ended_at: new Date().toISOString(),
      distance_m: Math.max(0, Math.round(distanceM)),
      duration_s: Math.max(0, Math.round(durationS)),
      status: "done",
    })
    .eq("id", walkId);

  if (error) return { error: error.message };

  revalidatePath("/paseador");
  return { ok: true };
}
