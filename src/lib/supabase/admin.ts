import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Cliente de Supabase con service_role. SOLO servidor.
 * Bypassa RLS: usalo únicamente en código de backend confiable
 * (envío de push, webhooks, cron), nunca expuesto al navegador.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
