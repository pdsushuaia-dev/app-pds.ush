"use client";

import { useCallback, useState } from "react";
import { PlanForm } from "./plan-form";

export function PlanCreate() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary self-start"
      >
        + Nuevo plan
      </button>
    );
  }

  return (
    <div className="max-w-xl">
      <PlanForm onDone={close} onCancel={close} />
    </div>
  );
}
