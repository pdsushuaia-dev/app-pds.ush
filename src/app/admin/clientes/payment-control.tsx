"use client";

import { useState, useTransition } from "react";
import { setPaymentStatus, type PayStatus } from "@/lib/actions/payments";

const OPTIONS: { value: PayStatus; label: string; active: string }[] = [
  { value: "paid", label: "Pagado", active: "bg-green-600 text-white" },
  { value: "pending", label: "Pendiente", active: "bg-amber-500 text-white" },
  { value: "overdue", label: "Vencido", active: "bg-red-600 text-white" },
];

export function PaymentControl({
  subscriptionId,
  period,
  amount,
  current,
}: {
  subscriptionId: string;
  period: string;
  amount: number | null;
  current: string | null;
}) {
  const [status, setStatus] = useState<string | null>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(value: PayStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setPaymentStatus(subscriptionId, period, value, amount);
      if (res.error) setError(res.error);
      else setStatus(value);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {OPTIONS.map((o) => {
        const isActive = status === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={pending}
            onClick={() => set(o.value)}
            className={`rounded-full px-2.5 py-0.5 text-xs disabled:opacity-60 ${
              isActive
                ? o.active
                : "border border-border text-muted hover:bg-surface-2"
            }`}
          >
            {o.label}
          </button>
        );
      })}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
