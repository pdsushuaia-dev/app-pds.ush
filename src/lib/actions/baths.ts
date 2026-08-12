"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BathState = { error?: string; message?: string };

/**
 * Agenda un turno de baño para un perro del cliente.
 * La RLS (owns_dog) garantiza que el perro sea del usuario; validamos igual
 * en el server. La fecha del <input type="datetime-local"> se interpreta en
 * hora de Argentina (-03:00), igual que el resto de la app.
 */
export async function scheduleBath(
  _prev: BathState,
  formData: FormData
): Promise<BathState> {
  const dogId = String(formData.get("dog_id") ?? "");
  const scheduledAt = String(formData.get("scheduled_at") ?? "");

  if (!dogId) return { error: "Elegí un perro." };
  if (!scheduledAt) return { error: "Elegí fecha y hora." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  // Solo se pueden agendar baños para los propios perros.
  const { data: dog } = await supabase
    .from("dogs")
    .select("id")
    .eq("id", dogId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!dog) return { error: "Ese perro no está en tu lista." };

  const when = new Date(`${scheduledAt}:00-03:00`);
  if (Number.isNaN(when.getTime())) return { error: "Fecha inválida." };

  const { error } = await supabase.from("bath_appointments").insert({
    dog_id: dogId,
    scheduled_at: when.toISOString(),
  });
  if (error) return { error: "No pudimos agendar el baño. Probá de nuevo." };

  revalidatePath("/cliente/banos");
  return { message: "¡Baño agendado!" };
}

export async function cancelBath(id: string): Promise<BathState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bath_appointments")
    .delete()
    .eq("id", id);
  if (error) return { error: "No pudimos cancelar el baño. Probá de nuevo." };

  revalidatePath("/cliente/banos");
  return {};
}
