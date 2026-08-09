"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { slotLabel } from "@/lib/turnos";

export interface AssignState {
  ok?: boolean;
  error?: string;
}

const pushDateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * Asigna (o desasigna con walkerId=null) un paseador a un turno.
 * Solo admin. Respeta la regla unique(walker_id, scheduled_at): 1 perro por
 * turno por paseador.
 */
export async function assignWalker(
  appointmentId: string,
  walkerId: string | null
): Promise<AssignState> {
  if (!appointmentId) return { error: "Falta el turno." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  // Validar admin en el server (además de la RLS).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((me as { role: string } | null)?.role !== "admin") {
    return { error: "Solo el administrador puede asignar paseadores." };
  }

  // Si se asigna alguien, verificar que sea un paseador.
  if (walkerId) {
    const { data: w } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", walkerId)
      .maybeSingle();
    if ((w as { role: string } | null)?.role !== "walker") {
      return { error: "El usuario elegido no es un paseador." };
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({ walker_id: walkerId })
    .eq("id", appointmentId);

  if (error) {
    // 23505 = unique_violation → el paseador ya tiene un turno a esa hora.
    if (error.code === "23505") {
      return { error: "Ese paseador ya tiene un turno a esa hora." };
    }
    return { error: error.message };
  }

  // Push al paseador recién asignado (un fallo no rompe la asignación).
  if (walkerId) {
    const { data: apptRaw } = await supabase
      .from("appointments")
      .select("scheduled_at, time_slot, dogs(name)")
      .eq("id", appointmentId)
      .maybeSingle();
    const appt = apptRaw as {
      scheduled_at: string;
      time_slot: "morning" | "midday" | "afternoon" | null;
      dogs: { name: string } | null;
    } | null;
    if (appt) {
      const fecha = pushDateFmt.format(new Date(appt.scheduled_at));
      const perro = appt.dogs?.name ?? "Un perro";
      await sendPushToUser(walkerId, {
        title: "Nuevo paseo asignado",
        body: `${perro} · ${fecha} ${slotLabel(appt.time_slot)}`,
        url: "/paseador",
      });
    }
  }

  revalidatePath("/admin/turnos");
  return { ok: true };
}

/**
 * Wrapper para useActionState. walkerId vacío = desasignar.
 */
export async function assignWalkerAction(
  _prev: AssignState,
  formData: FormData
): Promise<AssignState> {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const raw = String(formData.get("walkerId") ?? "");
  return assignWalker(appointmentId, raw === "" ? null : raw);
}
