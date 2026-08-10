"use client";

import { useCallback, useState } from "react";
import { BannerForm } from "./banner-form";

export function BannerCreate() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        + Nuevo banner
      </button>
    );
  }

  return (
    <div className="max-w-xl">
      <BannerForm onDone={close} onCancel={close} />
    </div>
  );
}
