"use client";

import { useCallback, useState, useTransition } from "react";
import { setBannerActive, deleteBanner } from "@/lib/actions/banners";
import type { Banner } from "@/lib/types/database";
import { BannerForm } from "./banner-form";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function BannerItem({ banner }: { banner: Banner }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = useCallback(() => setEditing(false), []);

  if (editing) {
    return <BannerForm banner={banner} onDone={done} onCancel={done} />;
  }

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setBannerActive(banner.id, !banner.active);
      if (res.error) setError(res.error);
    });
  }

  function remove() {
    if (!confirm(`¿Borrar el banner “${banner.title}”?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteBanner(banner.id);
      if (res.error) setError(res.error);
    });
  }

  const ventana =
    banner.starts_at || banner.ends_at
      ? `${banner.starts_at ? dateFmt.format(new Date(banner.starts_at)) : "…"} → ${
          banner.ends_at ? dateFmt.format(new Date(banner.ends_at)) : "…"
        }`
      : null;

  return (
    <li className="rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{banner.title}</span>
        {banner.active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
            Activo
          </span>
        ) : (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            Inactivo
          </span>
        )}
        {ventana ? (
          <span className="text-xs text-neutral-400">{ventana}</span>
        ) : null}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60 dark:border-neutral-700"
          >
            {banner.active ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
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
      {banner.body ? (
        <p className="mt-1 text-neutral-600 dark:text-neutral-300">{banner.body}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </li>
  );
}
