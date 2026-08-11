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
        className="self-start btn-primary"
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
