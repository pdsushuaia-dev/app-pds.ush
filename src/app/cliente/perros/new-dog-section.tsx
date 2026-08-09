"use client";

import { useCallback, useState } from "react";
import { DogForm } from "./dog-form";

export function NewDogSection() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        + Agregar perro
      </button>
    );
  }

  return (
    <div className="max-w-md">
      <DogForm onDone={close} onCancel={close} />
    </div>
  );
}
