import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mpConfigured,
  getPreapproval,
  getAuthorizedPayment,
} from "@/lib/mercadopago";

export const runtime = "nodejs";

/**
 * Webhook de MercadoPago (débito automático / suscripciones).
 *
 * MP notifica dos tipos relevantes:
 *  - `subscription_preapproval`        → cambió el estado de la suscripción.
 *  - `subscription_authorized_payment` → se cobró (o rechazó) una cuota.
 *
 * Consultamos el detalle con el access token y actualizamos `subscriptions`
 * y `payments`. Siempre respondemos 200 para que MP no reintente en loop.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    topic?: string;
    id?: string;
    data?: { id?: string };
  } | null;
  const url = new URL(request.url);

  const type =
    body?.type ??
    body?.topic ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    "";
  const id =
    body?.data?.id ??
    body?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    "";

  if (!mpConfigured() || !type || !id) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  try {
    if (type.includes("preapproval")) {
      const pre = await getPreapproval(String(id));
      const subId = pre.external_reference;
      if (subId) {
        const subStatus =
          pre.status === "authorized"
            ? "active"
            : pre.status === "cancelled"
              ? "canceled"
              : pre.status === "paused"
                ? "paused"
                : undefined;
        await admin
          .from("subscriptions")
          .update({
            mp_preapproval_id: pre.id,
            mp_status: pre.status,
            ...(subStatus ? { status: subStatus } : {}),
          })
          .eq("id", subId);
      }
    } else if (type.includes("authorized_payment")) {
      const ap = await getAuthorizedPayment(String(id));
      if (ap.preapproval_id) {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("id")
          .eq("mp_preapproval_id", ap.preapproval_id)
          .maybeSingle();
        const subId = (sub as { id: string } | null)?.id;
        if (subId) {
          const paid =
            ap.status === "processed" || ap.payment?.status === "approved";
          const period = (ap.date_created ?? new Date().toISOString()).slice(
            0,
            7
          ); // YYYY-MM
          await admin.from("payments").upsert(
            {
              subscription_id: subId,
              amount: ap.transaction_amount ?? null,
              status: paid ? "paid" : "overdue",
              method: "mercadopago",
              mp_payment_id: String(ap.payment?.id ?? ap.id),
              period,
              paid_at: paid ? new Date().toISOString() : null,
            },
            { onConflict: "subscription_id,period" }
          );
          await admin
            .from("subscriptions")
            .update({ status: paid ? "active" : "overdue" })
            .eq("id", subId);
        }
      }
    }
  } catch (e) {
    console.error("[mercadopago webhook]", e);
    // Igual respondemos 200: MP reintenta con backoff y no queremos loops.
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "mercadopago webhook ok" });
}
