"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BannerState {
  ok?: boolean;
  error?: string;
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function assertAdmin(
  supabase: SupabaseServer
): Promise<{ userId: string | null; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, error: "Sesión expirada." };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((me as { role: string } | null)?.role !== "admin") {
    return { userId: null, error: "Solo el administrador puede gestionar banners." };
  }
  return { userId: user.id };
}

/** "YYYY-MM-DDTHH:MM" (datetime-local, hora AR) → timestamptz con -03:00. */
function toTs(local: string): string | null {
  const v = local.trim();
  if (!v) return null;
  return `${v}:00-03:00`;
}

function revalidate() {
  revalidatePath("/admin/banners");
  revalidatePath("/cliente");
}

export async function createBannerAction(
  _prev: BannerState,
  formData: FormData
): Promise<BannerState> {
  const supabase = await createClient();
  const { userId, error } = await assertAdmin(supabase);
  if (!userId) return { error };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };

  const { error: insErr } = await supabase.from("banners").insert({
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    active: formData.get("active") != null,
    starts_at: toTs(String(formData.get("starts_at") ?? "")),
    ends_at: toTs(String(formData.get("ends_at") ?? "")),
    created_by: userId,
  });
  if (insErr) return { error: insErr.message };

  revalidate();
  return { ok: true };
}

export async function updateBannerAction(
  _prev: BannerState,
  formData: FormData
): Promise<BannerState> {
  const supabase = await createClient();
  const { userId, error } = await assertAdmin(supabase);
  if (!userId) return { error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el banner." };
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };

  const { error: updErr } = await supabase
    .from("banners")
    .update({
      title,
      body: String(formData.get("body") ?? "").trim() || null,
      active: formData.get("active") != null,
      starts_at: toTs(String(formData.get("starts_at") ?? "")),
      ends_at: toTs(String(formData.get("ends_at") ?? "")),
    })
    .eq("id", id);
  if (updErr) return { error: updErr.message };

  revalidate();
  return { ok: true };
}

export async function setBannerActive(
  id: string,
  active: boolean
): Promise<BannerState> {
  const supabase = await createClient();
  const { userId, error } = await assertAdmin(supabase);
  if (!userId) return { error };

  const { error: updErr } = await supabase
    .from("banners")
    .update({ active })
    .eq("id", id);
  if (updErr) return { error: updErr.message };

  revalidate();
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<BannerState> {
  const supabase = await createClient();
  const { userId, error } = await assertAdmin(supabase);
  if (!userId) return { error };

  const { error: delErr } = await supabase.from("banners").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  revalidate();
  return { ok: true };
}
