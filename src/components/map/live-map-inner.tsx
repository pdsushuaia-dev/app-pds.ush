"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo/haversine";

const BRAND = "#1db954";

export interface LiveMapProps {
  center: LatLng;
  marker?: LatLng | null;
  path?: LatLng[];
  markerIconUrl?: string | null;
}

/** Recentra el mapa cuando cambia `center`. */
function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LiveMapInner({
  center,
  marker,
  path = [],
  markerIconUrl,
}: LiveMapProps) {
  const icon = useMemo(() => {
    if (markerIconUrl) {
      // Foto del perro con borde verde de marca.
      return L.divIcon({
        html: `<img src="${markerIconUrl}" alt="" style="width:42px;height:42px;border-radius:9999px;object-fit:cover;border:3px solid ${BRAND};box-shadow:0 1px 6px rgba(0,0,0,.6)"/>`,
        className: "",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
    }
    // Punto verde.
    return L.divIcon({
      html: `<div style="width:18px;height:18px;border-radius:9999px;background:${BRAND};border:3px solid #06210f;box-shadow:0 0 0 4px rgba(29,185,84,.35)"></div>`,
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }, [markerIconUrl]);

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {marker ? <Marker position={marker} icon={icon} /> : null}
      {path.length > 1 ? (
        <Polyline positions={path} pathOptions={{ color: BRAND, weight: 4 }} />
      ) : null}
      <Recenter center={center} />
    </MapContainer>
  );
}
