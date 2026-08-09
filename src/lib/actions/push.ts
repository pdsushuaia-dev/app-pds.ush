"use server";

import { createClient } from "@/lib/supabase/server";

export interface PushActionState {
  ok?: boolean;
  error?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}

/**
 * Guarda (upsert por endpoint) la suscripción push del usuario logueado.
 */
export async function savePushSubscription(
  sub: PushSubscriptionInput
): Promise<PushActionState> {
  if (!sub?.endpoint || !sub?.p256dh || !sub?.auth) {
    return { error: "Suscripción inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Borra la suscripción del usuario (al desactivar notificaciones).
 */
export async function deletePushSubscription(
  endpoint: string
): Promise<PushActionState> {
  if (!endpoint) return { error: "Falta el endpoint." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) return { error: error.message };
  return { ok: true };
}
