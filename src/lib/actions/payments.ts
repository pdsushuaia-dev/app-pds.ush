"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export interface PaymentState {
  ok?: boolean;
  error?: string;
}

const VALID = ["paid", "pending", "overdue"] as const;
export type PayStatus = (typeof VALID)[number];

/**
 * Marca el estado del pago de una suscripción para un período ('YYYY-MM').
 * Upsert por (subscription_id, period). Solo admin (RLS payments_admin +
 * validación en el server). Sin MercadoPago: method='manual'.
 */
export async function setPaymentStatus(
  subscriptionId: string,
  period: string,
  status: PayStatus,
  amount: number | null
): Promise<PaymentState> {
  if (!subscriptionId || !period) return { error: "Datos incompletos." };
  if (!VALID.includes(status)) return { error: "Estado inválido." };
  if (!(await isAdmin())) {
    return { error: "Solo el administrador puede registrar pagos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").upsert(
    {
      subscription_id: subscriptionId,
      period,
      status,
      amount,
      method: "manual",
      paid_at: status === "paid" ? new Date().toISOString() : null,
    },
    { onConflict: "subscription_id,period" }
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  return { ok: true };
}
