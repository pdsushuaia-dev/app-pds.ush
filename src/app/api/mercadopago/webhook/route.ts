import { NextResponse, type NextRequest } from "next/server";

/**
 * Webhook de MercadoPago (Semana 3).
 *
 * MercadoPago notifica aquí los cambios de estado de un pago. El flujo será:
 *  1. Validar la notificación (topic/type + id).
 *  2. Consultar el pago en la API de MercadoPago con el access token.
 *  3. Actualizar la fila en `payments` (status: paid/overdue) y la subscripción.
 *
 * Por ahora solo responde 200 para que MercadoPago no reintente.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  // TODO(Semana 3): procesar el pago y actualizar la DB.
  console.log("[mercadopago webhook] recibido:", body);
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "mercadopago webhook ok" });
}
