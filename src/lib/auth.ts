import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types/database";

/**
 * Devuelve la ruta home del panel según el rol.
 */
export function roleHome(role: Role | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "walker":
      return "/paseador";
    case "client":
      return "/cliente";
    default:
      return "/";
  }
}

/**
 * Perfil del usuario autenticado (o null si no hay sesión).
 * Para usar en Server Components / layouts.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}
