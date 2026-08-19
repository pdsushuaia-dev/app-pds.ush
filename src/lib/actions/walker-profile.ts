"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface WalkerProfileState {
  ok?: boolean;
  error?: string;
}

const BUCKET = "walker-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sube la foto del paseador logueado a Storage (carpeta {uid}/) y guarda su
 * URL pública en profiles.photo_url. El candado de rol (0007) fue ampliado en
 * la migración 0022 para permitir que el usuario edite su propia photo_url.
 */
export async function updateWalkerPhoto(
  _prev: WalkerProfileState,
  formData: FormData
): Promise<WalkerProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Elegí una foto." };
  }
  if (!photo.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { error: "La imagen no puede superar los 5 MB." };
  }

  const ext = (photo.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, photo, { contentType: photo.type, upsert: false });
  if (upErr) {
    return { error: `No se pudo subir la foto: ${upErr.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ photo_url: data.publicUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/paseador/perfil");
  revalidatePath("/paseador");
  return { ok: true };
}
