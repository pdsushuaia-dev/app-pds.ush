"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewState {
  ok?: boolean;
  error?: string;
}

/**
 * Crea una reseña de un paseo finalizado.
 * dog_id / walker_id / client_id se DERIVAN en el server a partir del walk;
 * nunca se confía en el cliente.
 */
export async function createReview(
  walkId: string,
  rating: number,
  comment: string | null
): Promise<ReviewState> {
  if (!walkId) return { error: "Falta el paseo." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Elegí un puntaje de 1 a 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  // Walk (RLS ya limita al dueño; validamos estado y pertenencia igual).
  const { data: walkRaw } = await supabase
    .from("walks")
    .select("id, dog_id, walker_id, status")
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as {
    id: string;
    dog_id: string;
    walker_id: string | null;
    status: string;
  } | null;
  if (!walk) return { error: "Paseo no encontrado." };
  if (walk.status !== "done") {
    return { error: "Solo podés reseñar un paseo finalizado." };
  }

  // El perro tiene que ser del usuario logueado.
  const { data: dogRaw } = await supabase
    .from("dogs")
    .select("owner_id")
    .eq("id", walk.dog_id)
    .maybeSingle();
  const dog = dogRaw as { owner_id: string } | null;
  if (!dog || dog.owner_id !== user.id) {
    return { error: "Este paseo no es de tu perro." };
  }

  // Una reseña por walk.
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("walk_id", walkId)
    .maybeSingle();
  if (existing) return { error: "Ya dejaste una reseña para este paseo." };

  const { error } = await supabase.from("reviews").insert({
    walk_id: walkId,
    dog_id: walk.dog_id,
    client_id: user.id,
    walker_id: walk.walker_id,
    rating,
    comment: comment?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya dejaste una reseña para este paseo." };
    }
    return { error: error.message };
  }

  revalidatePath(`/cliente/paseo/${walkId}`);
  return { ok: true };
}

/**
 * Wrapper para useActionState.
 */
export async function createReviewAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const walkId = String(formData.get("walkId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "");
  return createReview(walkId, rating, comment);
}
