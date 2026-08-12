"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "walk-media";
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export interface MediaItem {
  id: string;
  path: string;
  url: string;
  type: "photo" | "video";
}

export function WalkMediaUploader({
  walkId,
  initialMedia,
}: {
  walkId: string;
  initialMedia: MediaItem[];
}) {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        setError("Solo se permiten fotos o videos.");
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        setError(`"${file.name}" supera los 50 MB.`);
        continue;
      }

      const ext = (file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg")).toLowerCase();
      const path = `${walkId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(`No se pudo subir "${file.name}": ${upErr.message}`);
        continue;
      }

      const type: "photo" | "video" = isVideo ? "video" : "photo";
      const { data: row, error: insErr } = await supabase
        .from("walk_media")
        .insert({ walk_id: walkId, storage_path: path, media_type: type })
        .select("id")
        .single();
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        setError(insErr.message);
        continue;
      }

      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      setItems((prev) => [...prev, { id: (row as { id: string }).id, path, url, type }]);
    }
    setUploading(false);
  }

  async function remove(item: MediaItem) {
    if (!confirm("¿Borrar este archivo?")) return;
    const { error: delErr } = await supabase
      .from("walk_media")
      .delete()
      .eq("id", item.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([item.path]);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Fotos y videos del paseo</h2>
          <p className="text-xs text-muted">
            Subí lo que sacaste durante el paseo. El dueño lo va a ver.
          </p>
        </div>
        <label className="btn-primary cursor-pointer px-4 py-2">
          {uploading ? "Subiendo…" : "Agregar"}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={onFiles}
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          Todavía no subiste fotos ni videos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label="Borrar"
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
