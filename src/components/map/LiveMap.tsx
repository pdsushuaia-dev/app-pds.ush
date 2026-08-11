"use client";

import dynamic from "next/dynamic";
import type { LiveMapProps } from "./live-map-inner";

/**
 * Mapa en vivo (Leaflet + OpenStreetMap), reutilizable.
 * Se carga con ssr:false porque Leaflet accede a `window`.
 *
 * Props: center, marker (opcional), path (polyline del recorrido),
 * markerIconUrl (opcional, ej. foto del perro como marcador).
 */
const LiveMapInner = dynamic(() => import("./live-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-muted">
      Cargando mapa…
    </div>
  ),
});

export default function LiveMap(props: LiveMapProps) {
  return <LiveMapInner {...props} />;
}

export type { LiveMapProps };
