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
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();
    const p = profile as { role: Role; active: boolean } | null;
    // Cuenta desvinculada: no puede entrar.
    if (p && p.active === false) {
      await supabase.auth.signOut();
      return { error: "Tu cuenta fue desvinculada. Contactá al club." };
    }
    dest = SAFE_REDIRECT.test(wanted) ? wanted : roleHome(p?.role);
  } else if (SAFE_REDIRECT.test(wanted)) {
    dest = wanted;
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
  const cityRaw = String(formData.get("city") ?? "").trim();
  const city =
    cityRaw === "ushuaia" || cityRaw === "rio_grande" ? cityRaw : null;

  if (!full_name || !email || !password) {
    return { error: "Completá nombre, email y contraseña." };
  }
  if (!city) {
    return { error: "Elegí tu ciudad." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, city } },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  // Si la confirmación de email está desactivada, ya hay sesión → al panel.
  if (data.session) {
    // El trigger handle_new_user setea city desde el metadata (migración 0014);
    // por las dudas (o si aún no se corrió), lo aseguramos acá (0007 permite al
    // usuario setear su propia city).
    if (data.user) {
      await supabase.from("profiles").update({ city }).eq("id", data.user.id);
    }
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
