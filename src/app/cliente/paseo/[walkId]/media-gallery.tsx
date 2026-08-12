"use client";

import { useState } from "react";

export interface GalleryItem {
  id: string;
  url: string;
  type: "photo" | "video";
}

export function MediaGallery({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold">Fotos y videos</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setSelected(it)}
            className="aspect-square overflow-hidden rounded-xl border border-border bg-surface"
          >
            {it.type === "video" ? (
              <video src={it.url} muted className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.url} alt="" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute right-4 top-4 text-2xl text-white"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
          <div
            className="max-h-[90vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.type === "video" ? (
              <video
                src={selected.url}
                controls
                autoPlay
                className="max-h-[90vh] w-full rounded-xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.url}
                alt=""
                className="max-h-[90vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
