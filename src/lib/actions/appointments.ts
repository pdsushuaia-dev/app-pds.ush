"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CancelState = { error?: string };

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
