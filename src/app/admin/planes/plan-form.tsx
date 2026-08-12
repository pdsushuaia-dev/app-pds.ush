"use client";

import { useActionState, useEffect } from "react";
import { createPlanAction, updatePlanAction, type PlanState } from "@/lib/actions/plans";
import type { Plan } from "@/lib/types/database";

const initial: PlanState = {};

export function PlanForm({
  plan,
  onDone,
  onCancel,
}: {
  plan?: Plan;
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = plan ? updatePlanAction : createPlanAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="card flex flex-col gap-3 p-4">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

      <input
        name="name"
        placeholder="Nombre *"
        defaultValue={plan?.name ?? ""}
        required
        className="input"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Días por semana (2–6; vacío = personalizado)
          <input
            name="days_per_week"
            type="number"
            min="2"
            max="6"
            defaultValue={plan?.days_per_week ?? ""}
            className="input mt-1 block w-full"
          />
        </label>
        <label className="text-xs text-muted">
          Precio ARS (vacío = a convenir)
          <input
            name="price"
            type="number"
            min="0"
            step="1000"
            defaultValue={plan?.price ?? ""}
            className="input mt-1 block w-full"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={plan ? plan.active : true}
          className="size-4"
        />
        Activo
      </label>

      {state.error ? (
        <p className="text-sm text-red-500">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : plan ? "Guardar cambios" : "Crear plan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
