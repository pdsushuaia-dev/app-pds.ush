"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SubscribeState {
  ok?: boolean;
  error?: string;
}

/**
 * Suscribe (o cambia el plan de) un perro del cliente logueado.
 * La suscripción es POR PERRO: si ya tiene una activa, actualiza su plan;
 * si no, crea una nueva con status 'active'.
 *
 * El dueño se valida SIEMPRE en el server con auth.uid() (además de la RLS).
 */
export async function subscribeDog(
  dogId: string,
  planId: string
): Promise<SubscribeState> {
  if (!dogId || !planId) return { error: "Elegí un perro y un plan." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  // Verificar que el perro pertenezca al usuario (la RLS lo fuerza; validamos igual).
  const { data: dog } = await supabase
    .from("dogs")
    .select("id")
    .eq("id", dogId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!dog) return { error: "Perro no encontrado o no te pertenece." };

  // ¿Ya tiene una suscripción activa?
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("dog_id", dogId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan_id: planId })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    // start_date usa el default de la DB (current_date).
    const { error } = await supabase.from("subscriptions").insert({
      dog_id: dogId,
      plan_id: planId,
      status: "active",
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/cliente/planes");
  return { ok: true };
}

/**
 * Wrapper para usar con useActionState desde un <form>.
 * Extrae dogId y planId del FormData y delega en subscribeDog.
 */
export async function subscribeDogAction(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const dogId = String(formData.get("dogId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  return subscribeDog(dogId, planId);
}
