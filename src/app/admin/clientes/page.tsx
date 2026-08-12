import { createClient } from "@/lib/supabase/server";
import { effectivePriceARS } from "@/lib/pricing";
import { formatARS } from "@/lib/format";
import { PriceEditor } from "./price-editor";
import { PaymentControl } from "./payment-control";

interface ClientRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
}
interface DogRow {
  id: string;
  owner_id: string;
  name: string;
}
interface SubRow {
  id: string;
  dog_id: string;
  custom_price: number | null;
  plans: { name: string; price: number | null } | null;
}
interface PayRow {
  subscription_id: string | null;
  status: string;
}

function currentPeriod(): { key: string; label: string } {
  const now = new Date();
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Ushuaia",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = p.find((x) => x.type === "year")?.value ?? "";
  const m = p.find((x) => x.type === "month")?.value ?? "";
  const label = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Ushuaia",
    month: "long",
    year: "numeric",
  }).format(now);
  return { key: `${y}-${m}`, label };
}

export default async function AdminClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const period = currentPeriod();
  const supabase = await createClient();

  const [clientsRes, dogsRes, subsRes, paysRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, city")
      .eq("role", "client")
      .order("full_name", { ascending: true }),
    supabase.from("dogs").select("id, owner_id, name"),
    supabase
      .from("subscriptions")
      .select("id, dog_id, custom_price, plans(name, price)")
      .eq("status", "active"),
    supabase
      .from("payments")
      .select("subscription_id, status")
      .eq("period", period.key),
  ]);

  const clients = (clientsRes.data ?? []) as ClientRow[];
  const dogs = (dogsRes.data ?? []) as DogRow[];
  const subs = (subsRes.data ?? []) as unknown as SubRow[];
  const pays = (paysRes.data ?? []) as PayRow[];

  const dogsByOwner = new Map<string, DogRow[]>();
  for (const d of dogs) {
    const list = dogsByOwner.get(d.owner_id) ?? [];
    list.push(d);
    dogsByOwner.set(d.owner_id, list);
  }
  const subByDog = new Map(subs.map((s) => [s.dog_id, s]));
  const payBySub = new Map(
    pays.filter((p) => p.subscription_id).map((p) => [p.subscription_id!, p.status])
  );

  // Resumen del mes sobre las suscripciones activas.
  let alDia = 0;
  let vencidos = 0;
  let pendientes = 0;
  for (const s of subs) {
    const st = payBySub.get(s.id) ?? null;
    if (st === "paid") alDia++;
    else if (st === "overdue") vencidos++;
    else pendientes++; // pending o sin registro
  }

  // Filtro por nombre de cliente o de perro.
  const filtered = q
    ? clients.filter((c) => {
        const nameHit = (c.full_name ?? "").toLowerCase().includes(q);
        const dogHit = (dogsByOwner.get(c.id) ?? []).some((d) =>
          d.name.toLowerCase().includes(q)
        );
        return nameHit || dogHit;
      })
    : clients;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted">Precios y cobros — {period.label}.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-950 dark:text-green-300">
              Al día: {alDia}
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-950 dark:text-red-300">
              Vencidos: {vencidos}
            </span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
              Pendientes: {pendientes}
            </span>
          </div>
        </div>
        <form method="get">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por cliente o perro…"
            className="input w-64"
            aria-label="Buscar"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {clients.length === 0 ? "Todavía no hay clientes." : "Sin resultados."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => {
            const ownerDogs = dogsByOwner.get(c.id) ?? [];
            return (
              <div key={c.id} className="card p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">
                    {c.full_name ?? "(sin nombre)"}
                  </span>
                  {c.city ? (
                    <span className="text-xs text-muted">
                      {c.city === "rio_grande" ? "Río Grande" : "Ushuaia"}
                    </span>
                  ) : null}
                  {c.phone ? (
                    <span className="text-xs text-muted">{c.phone}</span>
                  ) : null}
                </div>

                {ownerDogs.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Sin perros cargados.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {ownerDogs.map((d) => {
                      const sub = subByDog.get(d.id);
                      if (!sub) {
                        return (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                          >
                            <span className="font-medium">{d.name}</span>
                            <span className="text-xs text-muted">sin plan activo</span>
                          </li>
                        );
                      }
                      const eff = effectivePriceARS(
                        sub.custom_price,
                        sub.plans?.price ?? null
                      );
                      return (
                        <li
                          key={d.id}
                          className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0"
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-muted">
                              {sub.plans?.name ?? "Plan"}
                            </span>
                            <span className="font-semibold text-brand">
                              {formatARS(eff)}
                            </span>
                            <span className="ml-auto">
                              <PaymentControl
                                subscriptionId={sub.id}
                                period={period.key}
                                amount={eff}
                                current={payBySub.get(sub.id) ?? null}
                              />
                            </span>
                          </div>
                          <PriceEditor
                            subscriptionId={sub.id}
                            customPrice={sub.custom_price}
                            planPrice={sub.plans?.price ?? null}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
