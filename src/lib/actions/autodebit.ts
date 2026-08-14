"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mpConfigured,
  createPreapproval,
  cancelPreapproval,
} from "@/lib/mercadopago";

export type AutoDebitState = {
  error?: string;
  initPoint?: string;
  message?: string;
};

/**
 * Inicia el débito automático de una suscripción: crea la preapproval en MP
 * y devuelve el init_point para que el cliente autorice su tarjeta.
 */
export async function startAutoDebit(
  subscriptionId: string
): Promise<AutoDebitState> {
  if (!mpConfigured()) {
    return { error: "El pago automático todavía no está habilitado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  const { data } = await supabase
    .from("subscriptions")
    .select("id, custom_price, plan_id, dogs(name, owner_id)")
    .eq("id", subscriptionId)
    .maybeSingle();
  const s = data as unknown as {
    id: string;
    custom_price: number | null;
    plan_id: string | null;
    dogs: { name: string; owner_id: string } | null;
  } | null;
  if (!s || s.dogs?.owner_id !== user.id) {
    return { error: "No encontramos esa suscripción." };
  }

  let amount = s.custom_price;
  if (amount == null && s.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("price")
      .eq("id", s.plan_id)
      .maybeSingle();
    amount = (plan as { price: number | null } | null)?.price ?? null;
  }
  if (amount == null || amount <= 0) {
    return {
      error: "Tu plan todavía no tiene un precio definido. Coordinalo con el club.",
    };
  }

  try {
    const pre = await createPreapproval({
      reason: `PDS.ushuaia — Paseos de ${s.dogs?.name ?? "tu perro"}`,
      externalReference: s.id,
      payerEmail: user.email ?? "",
      amount,
    });

    await createAdminClient()
      .from("subscriptions")
      .update({ mp_preapproval_id: pre.id, mp_status: pre.status ?? "pending" })
      .eq("id", s.id);

    revalidatePath("/cliente/pagos");
    if (!pre.init_point) {
      return { error: "No se pudo iniciar el pago. Probá de nuevo." };
    }
    return { initPoint: pre.init_point };
  } catch (e) {
    console.error("[autodebit] start", e);
    return { error: "No se pudo iniciar el débito automático. Probá de nuevo." };
  }
}

/**
 * Cancela el débito automático de una suscripción.
 */
export async function cancelAutoDebit(
  subscriptionId: string
): Promise<AutoDebitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  const { data } = await supabase
    .from("subscriptions")
    .select("id, mp_preapproval_id, dogs(owner_id)")
    .eq("id", subscriptionId)
    .maybeSingle();
  const s = data as unknown as {
    id: string;
    mp_preapproval_id: string | null;
    dogs: { owner_id: string } | null;
  } | null;
  if (!s || s.dogs?.owner_id !== user.id) {
    return { error: "No encontramos esa suscripción." };
  }
  if (!s.mp_preapproval_id) {
    return { error: "No hay débito automático activo." };
  }

  try {
    if (mpConfigured()) await cancelPreapproval(s.mp_preapproval_id);
    await createAdminClient()
      .from("subscriptions")
      .update({ mp_status: "cancelled" })
      .eq("id", s.id);
    revalidatePath("/cliente/pagos");
    return { message: "Débito automático cancelado." };
  } catch (e) {
    console.error("[autodebit] cancel", e);
    return { error: "No se pudo cancelar. Probá de nuevo." };
  }
}
