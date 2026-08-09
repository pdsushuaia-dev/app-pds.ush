"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateInviteState {
  ok?: boolean;
  code?: string;
  error?: string;
}

export interface RedeemState {
  ok?: boolean;
  error?: string;
}

// Alfabeto sin 0/O/1/I para dictar fácil por teléfono/WhatsApp.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function genCode(len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/**
 * Genera un código de invitación de paseador (solo admin).
 */
export async function createInvite(): Promise<CreateInviteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((me as { role: string } | null)?.role !== "admin") {
    return { error: "Solo el administrador puede generar códigos." };
  }

  // Reintenta ante una colisión (muy improbable) del unique(code).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { error } = await supabase
      .from("walker_invites")
      .insert({ code, created_by: user.id });
    if (!error) {
      revalidatePath("/admin/paseadores");
      return { ok: true, code };
    }
    if (error.code !== "23505") return { error: error.message };
  }
  return { error: "No se pudo generar un código único. Reintentá." };
}

/**
 * Redime un código de invitación → convierte al usuario en paseador.
 * Usa el RPC SECURITY DEFINER (la 0007 quitó el permiso de tocar role
 * directamente, así que un update a profiles.role fallaría).
 */
export async function redeemInviteAction(
  _prev: RedeemState,
  formData: FormData
): Promise<RedeemState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Ingresá el código." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Iniciá sesión para activar tu cuenta." };

  const { error } = await supabase.rpc("redeem_walker_invite", {
    invite_code: code,
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("invál") || m.includes("inval") || m.includes("utilizado")) {
      return { error: "Código inválido o ya utilizado." };
    }
    return { error: error.message };
  }

  revalidatePath("/paseador");
  redirect("/paseador");
}
