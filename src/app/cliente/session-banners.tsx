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
          className="flex items-start justify-between gap-3 rounded-xl border border-brand/50 bg-brand/10 px-4 py-3"
        >
          <div className="text-sm">
            <p className="font-medium text-brand">{b.title}</p>
            {b.body ? <p className="mt-0.5 text-fg">{b.body}</p> : null}
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
            className="shrink-0 rounded-md px-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
