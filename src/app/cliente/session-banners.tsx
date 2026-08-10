"use client";

import { useState } from "react";

export interface ClientBanner {
  id: string;
  title: string;
  body: string | null;
}

/**
 * Banners vigentes en el panel del cliente. Descartables solo en la sesión
 * (estado en memoria; NO se persiste).
 */
export function SessionBanners({ banners }: { banners: ClientBanner[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = banners.filter((b) => !dismissed.has(b.id));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((b) => (
        <div
          key={b.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950"
        >
          <div className="text-sm">
            <p className="font-medium text-green-900 dark:text-green-100">
              {b.title}
            </p>
            {b.body ? (
              <p className="mt-0.5 text-green-800 dark:text-green-200">{b.body}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Descartar"
            onClick={() =>
              setDismissed((prev) => {
                const next = new Set(prev);
                next.add(b.id);
                return next;
              })
            }
            className="shrink-0 rounded-md px-2 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
