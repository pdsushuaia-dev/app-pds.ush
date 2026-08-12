import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Dog, Plan, Subscription } from "@/lib/types/database";
import { formatARS } from "@/lib/format";
import { PlanPicker, type DogWithPlan, type PlanOption } from "./plan-picker";

export default async function PlanesPage() {
  const supabase = await createClient();

  const [plansRes, dogsRes, subsRes] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("days_per_week", { ascending: true, nullsFirst: false }),
    supabase.from("dogs").select("*").order("created_at", { ascending: true }),
    // La RLS limita estas suscripciones a las de los perros del usuario.
    supabase.from("subscriptions").select("*").eq("status", "active"),
  ]);

  const plans = (plansRes.data ?? []) as Plan[];
  const dogs = (dogsRes.data ?? []) as Dog[];
  const subs = (subsRes.data ?? []) as Subscription[];

  const planById = new Map(plans.map((p) => [p.id, p]));
  const activePlanByDog = new Map(subs.map((s) => [s.dog_id, s.plan_id]));

  const dogsWithPlan: DogWithPlan[] = dogs.map((d) => {
    const planId = activePlanByDog.get(d.id) ?? null;
    return {
      id: d.id,
      name: d.name,
      currentPlanId: planId,
      currentPlanName: planId ? planById.get(planId)?.name ?? null : null,
    };
  });

  const planOptions: PlanOption[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    days_per_week: p.days_per_week,
    price: p.price,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Elegir plan</h1>
        <p className="text-sm text-muted">
          Elegí la cantidad de paseos por semana para cada perro.
        </p>
      </div>

      {/* Catálogo de planes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const destacado = plan.name === "Performance";
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                destacado ? "border-brand ring-1 ring-brand" : "border-border"
              }`}
            >
              {destacado ? (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-[#06210f]">
                  Más elegido
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {plan.days_per_week
                  ? `${plan.days_per_week} paseos por semana`
                  : "Días a convenir"}
              </p>
              <p className="mt-3 text-2xl font-bold">{formatARS(plan.price)}</p>
              {plan.price != null ? (
                <p className="text-xs text-muted">por mes</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Suscribir perros */}
      <div>
        <h2 className="text-lg font-semibold">Suscribir mis perros</h2>
        {dogsWithPlan.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            Primero cargá un perro en{" "}
            <Link href="/cliente/perros" className="text-brand hover:underline">
              Mis perros
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3">
            <PlanPicker dogs={dogsWithPlan} plans={planOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
