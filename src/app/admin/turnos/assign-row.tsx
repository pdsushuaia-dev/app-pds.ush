"use client";

import { useActionState } from "react";
import {
  assignWalkerAction,
  type AssignState,
} from "@/lib/actions/assignments";

const initial: AssignState = {};

export interface WalkerOption {
  id: string;
  full_name: string | null;
}

export function AssignRow({
  appointmentId,
  walkers,
  currentWalkerId = null,
}: {
  appointmentId: string;
  walkers: WalkerOption[];
  currentWalkerId?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    assignWalkerAction,
    initial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="appointmentId" value={appointmentId} />

      <select
        name="walkerId"
        defaultValue={currentWalkerId ?? ""}
        className="input"
      >
        <option value="">Sin asignar</option>
        {walkers.map((w) => (
          <option key={w.id} value={w.id}>
            {w.full_name ?? "(sin nombre)"}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-3 py-1"
      >
        {pending ? "Guardando…" : currentWalkerId ? "Reasignar" : "Asignar"}
      </button>

      {state.error ? (
        <span className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </span>
      ) : null}
      {state.ok ? (
        <span className="text-xs text-brand">✓</span>
      ) : null}
    </form>
  );
}
