"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export interface PriceState {
  ok?: boolean;
  error?: string;
}

/**
 * Setea (o limpia con null) el precio personalizado de una suscripción.
 * Solo admin: se valida en el server y además el RPC SECURITY DEFINER
 * `admin_set_subscription_price` re-chequea is_admin() en la DB.
 */
export async function setCustomPrice(
  subscriptionId: string,
  price: number | null
): Promise<PriceState> {
  if (!subscriptionId) return { error: "Falta la suscripción." };
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    return { error: "Precio inválido." };
  }
  if (!(await isAdmin())) {
    return { error: "Solo el administrador puede editar el precio." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_subscription_price", {
    p_subscription_id: subscriptionId,
    p_price: price,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  return { ok: true };
}

/**
 * Wrapper para useActionState. price vacío = usar precio del plan (null).
 */
export async function setCustomPriceAction(
  _prev: PriceState,
  formData: FormData
): Promise<PriceState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const raw = String(formData.get("price") ?? "").trim();
  const price = raw === "" ? null : Math.round(Number(raw));
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    return { error: "Ingresá un número válido (o dejalo vacío para usar el plan)." };
  }
  return setCustomPrice(subscriptionId, price);
}
