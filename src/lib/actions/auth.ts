"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth";
import type { Role } from "@/lib/types/database";

export interface AuthState {
  error?: string;
  message?: string;
}

const SAFE_REDIRECT = /^\/(cliente|paseador|admin)(\/|$)/;

/**
 * Iniciar sesión con email + contraseña.
 * Al éxito redirige al panel del rol (o al `redirect` si es seguro).
 */
export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const wanted = String(formData.get("redirect") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traducirError(error.message) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dest = "/";
  if (SAFE_REDIRECT.test(wanted)) {
    dest = wanted;
  } else if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    dest = roleHome((profile as { role: Role } | null)?.role);
  }

  redirect(dest);
}

/**
 * Registro de un nuevo cliente. El trigger de la DB crea el `profile`
 * con rol 'client' por defecto.
 */
export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!full_name || !email || !password) {
    return { error: "Completá nombre, email y contraseña." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone } },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  // Si la confirmación de email está desactivada, ya hay sesión → al panel.
  if (data.session) {
    redirect("/cliente");
  }

  // Si requiere confirmación por email:
  return {
    message:
      "Cuenta creada. Revisá tu email para confirmar la cuenta y después iniciá sesión.",
  };
}

/**
 * Cerrar sesión.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Tenés que confirmar tu email antes de ingresar.";
  if (m.includes("user already registered")) return "Ese email ya está registrado.";
  return msg;
}
