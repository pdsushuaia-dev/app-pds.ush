"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export interface PlanState {
  ok?: boolean;
  error?: string;
}

function parseDays(raw: string): { value: number | null; error?: string } {
  const v = raw.trim();
  if (v === "") return { value: null };
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 2 || n > 6) {
    return {
      value: null,
      error: "Los días deben ser entre 2 y 6 (o vacío para plan personalizado).",
    };
  }
  return { value: n };
}

function parsePrice(raw: string): { value: number | null; error?: string } {
  const v = raw.trim();
  if (v === "") return { value: null };
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) return { value: null, error: "Precio inválido." };
  return { value: n };
}

function mapErr(error: { code?: string; message: string }): string {
  if (error.code === "23505")
    return "Ya existe un plan con esa cantidad de días por semana.";
  if (error.code === "23503")
    return "No se puede borrar: hay suscripciones con este plan. Desactivalo en su lugar.";
  return error.message;
}

function revalidate() {
  revalidatePath("/admin/planes");
  revalidatePath("/cliente/planes");
}

export async function createPlanAction(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  if (!(await isAdmin())) return { error: "Solo el administrador puede gestionar planes." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };
  const d = parseDays(String(formData.get("days_per_week") ?? ""));
  if (d.error) return { error: d.error };
  const p = parsePrice(String(formData.get("price") ?? ""));
  if (p.error) return { error: p.error };

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({
    name,
    days_per_week: d.value,
    price: p.value,
    active: formData.get("active") != null,
  });
  if (error) return { error: mapErr(error) };

  revalidate();
  return { ok: true };
}

export async function updatePlanAction(
  _prev: PlanState,
  formData: FormData
): Promise<PlanState> {
  if (!(await isAdmin())) return { error: "Solo el administrador puede gestionar planes." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el plan." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };
  const d = parseDays(String(formData.get("days_per_week") ?? ""));
  if (d.error) return { error: d.error };
  const p = parsePrice(String(formData.get("price") ?? ""));
  if (p.error) return { error: p.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({
      name,
      days_per_week: d.value,
      price: p.value,
      active: formData.get("active") != null,
    })
    .eq("id", id);
  if (error) return { error: mapErr(error) };

  revalidate();
  return { ok: true };
}

export async function setPlanActive(
  id: string,
  active: boolean
): Promise<PlanState> {
  if (!(await isAdmin())) return { error: "Solo el administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ active }).eq("id", id);
  if (error) return { error: mapErr(error) };
  revalidate();
  return { ok: true };
}

export async function deletePlan(id: string): Promise<PlanState> {
  if (!(await isAdmin())) return { error: "Solo el administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { error: mapErr(error) };
  revalidate();
  return { ok: true };
}
