"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffState = { error?: string; message?: string };

/**
 * Activa o desvincula a un usuario (cliente / paseador / bañador). Un usuario
 * inactivo no puede entrar a la app. Solo admin; usa service-role porque la
 * 0007 bloquea el update de columnas de profiles para 'authenticated'.
 */
export async function setUserActive(
  userId: string,
  active: boolean
): Promise<StaffState> {
  if (!(await isAdmin())) return { error: "No autorizado." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ active })
    .eq("id", userId);
  if (error) return { error: "No se pudo actualizar. Probá de nuevo." };

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/paseadores");
  return {};
}
