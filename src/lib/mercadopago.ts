import "server-only";

/**
 * Cliente mínimo de MercadoPago Suscripciones (preapproval) para el débito
 * automático. SOLO servidor. Si no está `MP_ACCESS_TOKEN`, `mpConfigured()`
 * devuelve false y las acciones muestran un estado "próximamente" — así la
 * app no rompe hasta que Agustín cargue el token.
 */

const BASE = "https://api.mercadopago.com";

export function mpConfigured(): boolean {
  // Solo lo damos por configurado si hay un token REAL de MercadoPago (arrancan
  // con "APP_USR-" en producción o "TEST-" en pruebas). Así, mientras esté el
  // placeholder de .env.local, el botón queda deshabilitado en vez de fallar.
  const t = process.env.MP_ACCESS_TOKEN ?? "";
  return t.startsWith("APP_USR-") || t.startsWith("TEST-");
}

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN no configurado");
  return t;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    throw new Error(`MercadoPago ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

export interface Preapproval {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  init_point?: string;
  external_reference?: string;
  auto_recurring?: { transaction_amount?: number };
}

export async function createPreapproval(params: {
  reason: string;
  externalReference: string;
  payerEmail: string;
  amount: number;
}): Promise<Preapproval> {
  return mpFetch<Preapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: params.reason,
      external_reference: params.externalReference,
      payer_email: params.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: params.amount,
        currency_id: "ARS",
      },
      back_url: `${appUrl()}/cliente/pagos`,
      notification_url: `${appUrl()}/api/mercadopago/webhook`,
      status: "pending",
    }),
  });
}

export async function getPreapproval(id: string): Promise<Preapproval> {
  return mpFetch<Preapproval>(`/preapproval/${id}`);
}

export async function cancelPreapproval(id: string): Promise<Preapproval> {
  return mpFetch<Preapproval>(`/preapproval/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export interface AuthorizedPayment {
  id: number | string;
  preapproval_id?: string;
  status?: string; // scheduled | processed | recycling | ...
  transaction_amount?: number;
  payment?: { id?: number; status?: string };
  date_created?: string;
}

export async function getAuthorizedPayment(id: string): Promise<AuthorizedPayment> {
  return mpFetch<AuthorizedPayment>(`/authorized_payments/${id}`);
}
