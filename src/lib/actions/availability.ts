"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityState = { error?: string; message?: string };

/**
 * Agrega un rango horario a la disponibilidad del paseador logueado.
 */
export async function addAvailability(
  _prev: AvailabilityState,
  formData: FormData
): Promise<AvailabilityState> {
  const weekday = Number(formData.get("weekday"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Elegí un día." };
  }
  if (!start || !end) return { error: "Poné hora de inicio y de fin." };
  if (end <= start) {
    return { error: "La hora de fin tiene que ser posterior a la de inicio." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  const { error } = await supabase.from("walker_availability").insert({
    walker_id: user.id,
    weekday,
    start_time: start,
    end_time: end,
  });
  if (error) return { error: "No se pudo guardar el horario. Probá de nuevo." };

  revalidatePath("/paseador/horarios");
  return { message: "Horario agregado." };
}

/**
 * Quita un rango horario. La RLS limita el borrado al dueño (o admin).
 */
export async function removeAvailability(
  id: string
): Promise<AvailabilityState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("walker_availability")
    .delete()
    .eq("id", id);
  if (error) return { error: "No se pudo borrar. Probá de nuevo." };

  revalidatePath("/paseador/horarios");
  return {};
}
