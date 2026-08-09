"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { LatLng } from "@/lib/geo/haversine";

// Workaround del ícono default de Leaflet con bundlers (rutas de imágenes).
type ProtoWithGetIconUrl = { _getIconUrl?: unknown };
delete (L.Icon.Default.prototype as unknown as ProtoWithGetIconUrl)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: (markerIcon as { src: string }).src,
  iconRetinaUrl: (markerIcon2x as { src: string }).src,
  shadowUrl: (markerShadow as { src: string }).src,
});

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
    if (!markerIconUrl) return undefined;
    return L.divIcon({
      html: `<img src="${markerIconUrl}" alt="" style="width:42px;height:42px;border-radius:9999px;object-fit:cover;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"/>`,
      className: "",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  }, [markerIconUrl]);

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {marker ? <Marker position={marker} icon={icon} /> : null}
      {path.length > 1 ? <Polyline positions={path} /> : null}
      <Recenter center={center} />
    </MapContainer>
  );
}
