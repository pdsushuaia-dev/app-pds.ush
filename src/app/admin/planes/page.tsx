import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types/database";
import { PlanCreate } from "./plan-create";
import { PlanItem } from "./plan-item";

export default async function AdminPlanes() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("plans")
    .select("*")
    .order("days_per_week", { ascending: true, nullsFirst: false });
  const plans = (data ?? []) as Plan[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Planes</h1>
          <p className="text-sm text-muted">
            Catálogo de planes que ven los clientes al suscribir un perro.
          </p>
        </div>
        <PlanCreate />
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no hay planes.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {plans.map((p) => (
            <PlanItem key={p.id} plan={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
