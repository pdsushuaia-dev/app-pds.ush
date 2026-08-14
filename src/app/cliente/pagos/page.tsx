import { createClient } from "@/lib/supabase/server";
import { mpConfigured } from "@/lib/mercadopago";
import { formatARS } from "@/lib/format";
import type { Payment } from "@/lib/types/database";
import { AutoDebitControls } from "./auto-debit-controls";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
function periodLabel(p: string | null): string {
  if (!p) return "—";
  const [y, m] = p.split("-");
  return `${MESES[Number(m) - 1] ?? m}. ${y}`;
}

interface SubRow {
  id: string;
  status: string;
  custom_price: number | null;
  mp_status: string | null;
  dogs: { name: string } | null;
  plans: { price: number | null } | null;
}

function StatusBadge({ mpStatus }: { mpStatus: string | null }) {
  if (mpStatus === "authorized") return <span className="badge-brand">Débito activo</span>;
  if (mpStatus === "pending")
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
        Pendiente
      </span>
    );
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
      Sin débito
    </span>
  );
}

export default async function PagosPage() {
  const supabase = await createClient();
  const configured = mpConfigured();

  const [subsRes, paysRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, custom_price, mp_status, dogs(name), plans(price)")
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("id, amount, status, period, method, paid_at, subscription_id, mp_payment_id, created_at")
      .order("period", { ascending: false })
      .limit(12),
  ]);

  const subs = (subsRes.data ?? []) as unknown as SubRow[];
  const pays = (paysRes.data ?? []) as Payment[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Pagos</h1>
        <p className="mt-1 text-sm text-muted">
          Tu membresía y el débito automático.
        </p>
      </header>

      {!configured ? (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm text-muted">
          El <b className="text-fg">débito automático</b> con MercadoPago está por
          habilitarse. En cuanto quede activo vas a poder autorizarlo desde acá y
          la cuota se te descuenta sola todos los meses.
        </div>
      ) : null}

      {subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">
          Todavía no tenés una suscripción activa. Elegí un plan en <b>Planes</b>.
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          {subs.map((s) => {
            const price = s.custom_price ?? s.plans?.price ?? null;
            return (
              <div key={s.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.dogs?.name ?? "Tu perro"}</p>
                    <p className="text-sm text-muted">
                      {price != null
                        ? `${formatARS(price)} por mes`
                        : "Precio a coordinar"}
                    </p>
                  </div>
                  <StatusBadge mpStatus={s.mp_status} />
                </div>
                <AutoDebitControls
                  subscriptionId={s.id}
                  mpStatus={s.mp_status}
                  configured={configured}
                  hasPrice={price != null && price > 0}
                />
              </div>
            );
          })}
        </section>
      )}

      {pays.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Historial de pagos</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {pays.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{periodLabel(p.period)}</span>
                <span className="text-muted">
                  {p.amount != null ? formatARS(p.amount) : ""}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    p.status === "paid"
                      ? "bg-brand/15 text-brand"
                      : p.status === "overdue"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {p.status === "paid"
                    ? "Pagado"
                    : p.status === "overdue"
                      ? "Vencido"
                      : "Pendiente"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
