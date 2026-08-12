import { cache } from "react";
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
 * Memoizado por request con `cache()` de React: aunque lo llamen el layout, la
 * page y isAdmin, la sesión + el perfil se resuelven UNA sola vez por request.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
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
});

/**
 * True si el usuario autenticado es admin. Para validar permisos en Server
 * Actions y Server Components (además de la RLS).
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
