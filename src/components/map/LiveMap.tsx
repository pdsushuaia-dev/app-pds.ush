"use client";

import type { LatLng } from "@/lib/geo/haversine";

/**
 * Mapa en vivo del paseo (placeholder).
 *
 * Semana 4: reemplazar por Leaflet + OpenStreetMap.
 * - Marker con la foto del perro como icono (react-leaflet).
 * - Suscripción a Supabase Realtime (broadcast por walk_id) para mover el marker.
 * - Polyline del recorrido a partir de walk_positions.
 *
 * Se carga con `next/dynamic` + `{ ssr: false }` porque Leaflet accede a `window`.
 */
export default function LiveMap({
  walkId,
  center,
  path = [],
}: {
  walkId: string;
  center: [number, number];
  path?: LatLng[];
}) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="text-center">
        <p>Mapa en vivo (Leaflet + OSM) — Semana 4</p>
        <p className="mt-1 text-xs text-neutral-400">
          walk_id: {walkId} · centro: {center.join(", ")} · puntos: {path.length}
        </p>
      </div>
    </div>
  );
}
