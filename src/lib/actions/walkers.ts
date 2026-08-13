"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateWalkerState = { error?: string; message?: string };

/**
 * Alta de paseador por el admin: crea la cuenta (email + contraseña) y la deja
 * con role='walker' al instante. Usa el cliente service-role porque la 0007
 * bloquea el cambio de rol para 'authenticated'. Valida is_admin en el server.
 */
export async function createWalker(
  _prev: CreateWalkerState,
  formData: FormData
): Promise<CreateWalkerState> {
  if (!(await isAdmin())) {
    return { error: "Solo el administrador puede crear paseadores." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!fullName) return { error: "Poné el nombre del paseador." };
  if (!email || !email.includes("@")) return { error: "Email inválido." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (city !== "ushuaia" && city !== "rio_grande")
    return { error: "Elegí la ciudad." };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error || !data?.user) {
    const m = (error?.message ?? "").toLowerCase();
    if (m.includes("already") || m.includes("registered") || m.includes("exist")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return {
      error: "No se pudo crear el paseador. Revisá el email y probá de nuevo.",
    };
  }

  const { error: pErr } = await admin
    .from("profiles")
    .update({ role: "walker", full_name: fullName, phone: phone || null, city })
    .eq("id", data.user.id);
  if (pErr) {
    return {
      error:
        "La cuenta se creó pero no se pudo asignar el rol de paseador. Reintentá.",
    };
  }

  revalidatePath("/admin/paseadores");
  return { message: `✓ ${fullName} ya puede entrar con su email y contraseña.` };
}
