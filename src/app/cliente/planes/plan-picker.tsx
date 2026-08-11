"use client";

import { useActionState } from "react";
import {
  subscribeDogAction,
  type SubscribeState,
} from "@/lib/actions/subscriptions";
import { formatARS } from "@/lib/format";

const initial: SubscribeState = {};

export interface PlanOption {
  id: string;
  name: string;
  days_per_week: number | null;
  price: number | null;
}

export interface DogWithPlan {
  id: string;
  name: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
}

function optionLabel(p: PlanOption): string {
  const dias = p.days_per_week ? `${p.days_per_week} días/sem` : "días a convenir";
  return `${p.name} · ${dias} · ${formatARS(p.price)}`;
}

function DogPlanRow({ dog, plans }: { dog: DogWithPlan; plans: PlanOption[] }) {
  const [state, formAction, pending] = useActionState(subscribeDogAction, initial);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <input type="hidden" name="dogId" value={dog.id} />

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{dog.name}</span>
        <span className="text-xs text-neutral-500">
          Plan actual:{" "}
          <b className="text-neutral-700 dark:text-neutral-300">
            {dog.currentPlanName ?? "sin plan"}
          </b>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          name="planId"
          defaultValue={dog.currentPlanId ?? ""}
          required
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>
            Elegí un plan
          </option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {optionLabel(p)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Guardando…" : dog.currentPlanId ? "Cambiar plan" : "Suscribir"}
        </button>
      </div>

      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-green-600 dark:text-green-400">Plan actualizado ✓</p>
      ) : null}
    </form>
  );
}

export function PlanPicker({
  dogs,
  plans,
}: {
  dogs: DogWithPlan[];
  plans: PlanOption[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {dogs.map((dog) => (
        <DogPlanRow key={dog.id} dog={dog} plans={plans} />
      ))}
    </div>
  );
}
