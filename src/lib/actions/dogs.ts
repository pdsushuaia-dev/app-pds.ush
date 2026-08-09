"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DogFormState {
  ok?: boolean;
  error?: string;
}

const BUCKET = "dog-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sube (si vino) la foto a Storage bajo la carpeta del usuario y devuelve
 * su URL pública. Si no hay foto, devuelve `fallback` (para editar sin
 * cambiar la imagen).
 */
async function uploadPhotoIfAny(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  photo: File | null,
  fallback: string | null
): Promise<{ url: string | null; error?: string }> {
  if (!photo || photo.size === 0) return { url: fallback };

  if (!photo.type.startsWith("image/")) {
    return { url: fallback, error: "El archivo debe ser una imagen." };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { url: fallback, error: "La imagen no puede superar los 5 MB." };
  }

  const ext = (photo.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${userId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, photo, { contentType: photo.type, upsert: false });

  if (error) {
    return { url: fallback, error: `No se pudo subir la foto: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Deriva el path dentro del bucket a partir de una URL pública. */
function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

function fieldsFrom(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const pickup_address =
    String(formData.get("pickup_address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const photo = formData.get("photo");
  return {
    name,
    breed,
    pickup_address,
    notes,
    photo: photo instanceof File ? photo : null,
  };
}

/** Alta de un perro del cliente logueado. */
export async function createDog(
  _prev: DogFormState,
  formData: FormData
): Promise<DogFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const f = fieldsFrom(formData);
  if (!f.name) return { error: "El nombre es obligatorio." };

  const { url, error: upErr } = await uploadPhotoIfAny(
    supabase,
    user.id,
    f.photo,
    null
  );
  if (upErr) return { error: upErr };

  const { error } = await supabase.from("dogs").insert({
    owner_id: user.id, // seteado en el server, no se confía en el form
    name: f.name,
    breed: f.breed,
    pickup_address: f.pickup_address,
    notes: f.notes,
    photo_url: url,
  });

  if (error) return { error: error.message };

  revalidatePath("/cliente/perros");
  return { ok: true };
}

/** Edición de un perro (solo el dueño, garantizado por RLS). */
export async function updateDog(
  _prev: DogFormState,
  formData: FormData
): Promise<DogFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador del perro." };

  const f = fieldsFrom(formData);
  if (!f.name) return { error: "El nombre es obligatorio." };

  // Foto actual (para no perderla si no se sube una nueva).
  const { data: current } = await supabase
    .from("dogs")
    .select("photo_url")
    .eq("id", id)
    .single();

  const { url, error: upErr } = await uploadPhotoIfAny(
    supabase,
    user.id,
    f.photo,
    (current as { photo_url: string | null } | null)?.photo_url ?? null
  );
  if (upErr) return { error: upErr };

  const { error } = await supabase
    .from("dogs")
    .update({
      name: f.name,
      breed: f.breed,
      pickup_address: f.pickup_address,
      notes: f.notes,
      photo_url: url,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/cliente/perros");
  return { ok: true };
}

/** Borra un perro y, best-effort, su foto en Storage. */
export async function deleteDog(id: string): Promise<DogFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { data: current } = await supabase
    .from("dogs")
    .select("photo_url")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("dogs")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  // Limpieza de la foto (no crítica).
  const path = storagePathFromPublicUrl(
    (current as { photo_url: string | null } | null)?.photo_url ?? null
  );
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  revalidatePath("/cliente/perros");
  return { ok: true };
}
