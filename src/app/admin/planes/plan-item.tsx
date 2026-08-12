"use client";

import { useCallback, useState, useTransition } from "react";
import { setPlanActive, deletePlan } from "@/lib/actions/plans";
import { formatARS } from "@/lib/format";
import type { Plan } from "@/lib/types/database";
import { PlanForm } from "./plan-form";

export function PlanItem({ plan }: { plan: Plan }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = useCallback(() => setEditing(false), []);

  if (editing) {
    return <PlanForm plan={plan} onDone={done} onCancel={done} />;
  }

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setPlanActive(plan.id, !plan.active);
      if (res.error) setError(res.error);
    });
  }

  function remove() {
    if (!confirm(`¿Borrar el plan “${plan.name}”?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deletePlan(plan.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <li className="rounded-xl border border-border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{plan.name}</span>
        <span className="text-muted">
          {plan.days_per_week ? `${plan.days_per_week} días/sem` : "personalizado"}
        </span>
        <span className="font-semibold text-brand">{formatARS(plan.price)}</span>
        {plan.active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
            Activo
          </span>
        ) : (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
            Inactivo
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="btn-secondary px-3 py-1.5"
          >
            {plan.active ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-secondary px-3 py-1.5"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Borrar
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : null}
    </li>
  );
}
