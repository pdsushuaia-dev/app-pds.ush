"use client";

import { useActionState } from "react";
import { setCustomPriceAction, type PriceState } from "@/lib/actions/pricing";
import { formatARS } from "@/lib/format";

const initial: PriceState = {};

export function PriceEditor({
  subscriptionId,
  customPrice,
  planPrice,
}: {
  subscriptionId: string;
  customPrice: number | null;
  planPrice: number | null;
}) {
  const [state, formAction, pending] = useActionState(
    setCustomPriceAction,
    initial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <input
        name="price"
        type="number"
        min="0"
        step="1000"
        defaultValue={customPrice ?? ""}
        placeholder={planPrice != null ? String(planPrice) : "a convenir"}
        className="input w-28 py-1"
        aria-label="Precio personalizado"
      />
      <button type="submit" disabled={pending} className="btn-secondary px-3 py-1">
        {pending ? "…" : "Guardar"}
      </button>
      <span className="text-xs text-muted">
        Plan: {formatARS(planPrice)}
      </span>
      {state.ok ? <span className="text-xs text-brand">✓</span> : null}
      {state.error ? (
        <span className="text-xs text-red-500">{state.error}</span>
      ) : null}
    </form>
  );
}
