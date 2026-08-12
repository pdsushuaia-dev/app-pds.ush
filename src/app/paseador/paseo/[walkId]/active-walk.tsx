"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LiveMap from "@/components/map/LiveMap";
import { createClient } from "@/lib/supabase/client";
import { haversineMeters, type LatLng } from "@/lib/geo/haversine";
import { endWalk } from "@/lib/actions/walks";

// Umbrales de captura.
const MIN_INTERVAL_MS = 5_000; // guardar al menos cada 5s...
const MIN_DISTANCE_M = 10; // ...o si se movió >10m
const MAX_ACCURACY_M = 50; // ignorar lecturas muy imprecisas

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

export function ActiveWalk({
  walkId,
  dogName,
  dogPhoto,
  startedAt,
}: {
  walkId: string;
  dogName: string;
  dogPhoto: string | null;
  startedAt: string;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const startMs = new Date(startedAt).getTime();

  const [current, setCurrent] = useState<LatLng | null>(null);
  const [path, setPath] = useState<LatLng[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startMs) / 1000)
  );
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  // Refs para el tracking (evitan closures viejos en el callback del watch).
  const watchId = useRef<number | null>(null);
  const lastSavedAt = useRef(0);
  const lastPoint = useRef<LatLng | null>(null);
  const distanceRef = useRef(0);

  // Timer en vivo.
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startMs]);

  // Wake Lock (best-effort) para que no se apague la pantalla durante el paseo.
  useEffect(() => {
    type WakeLockSentinelLike = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> };
    };
    let sentinel: WakeLockSentinelLike | null = null;
    if (nav.wakeLock) {
      nav.wakeLock
        .request("screen")
        .then((s) => {
          sentinel = s;
        })
        .catch(() => {
          /* no crítico */
        });
    }
    return () => {
      sentinel?.release().catch(() => {});
    };
  }, []);

  // Captura de GPS.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      queueMicrotask(() =>
        setError("Tu dispositivo no soporta geolocalización.")
      );
      return;
    }

    const onPos = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      if (accuracy != null && accuracy > MAX_ACCURACY_M) return; // lectura imprecisa

      const p: LatLng = { lat: latitude, lng: longitude };
      setCurrent(p);
      setError(null);

      const now = Date.now();
      const last = lastPoint.current;
      const moved = last ? haversineMeters(last, p) : Infinity;
      const timeEnough = now - lastSavedAt.current >= MIN_INTERVAL_MS;
      const movedEnough = moved > MIN_DISTANCE_M;

      if (!(timeEnough || movedEnough)) return;

      if (last) {
        distanceRef.current += moved;
        setDistanceM(distanceRef.current);
      }
      lastSavedAt.current = now;
      lastPoint.current = p;
      setPath((prev) => [...prev, p]);

      // Inserción de alta frecuencia desde el navegador (RLS lo permite).
      supabase
        .from("walk_positions")
        .insert({ walk_id: walkId, lat: p.lat, lng: p.lng })
        .then(({ error: insErr }) => {
          if (insErr) console.error("walk_positions insert:", insErr.message);
        });
    };

    const onErr = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setError(
          "Necesitamos tu ubicación para registrar el paseo. Activá los permisos de ubicación."
        );
      } else {
        setError("No pudimos obtener tu ubicación. Reintentá en unos segundos.");
      }
    };

    const id = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });
    watchId.current = id;

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [supabase, walkId]);

  const finish = useCallback(async () => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setEnding(true);
    const durationS = Math.floor((Date.now() - startMs) / 1000);
    const res = await endWalk(walkId, distanceRef.current, durationS);
    if (res.error) {
      setError(res.error);
      setEnding(false);
      return;
    }
    // Quedate en la pantalla del paseo (ahora finalizado) para subir las fotos.
    router.refresh();
  }, [router, startMs, walkId]);

  const km = (distanceM / 1000).toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Paseo con {dogName}</h1>
        <p className="text-sm text-neutral-500">
          Mantené la app abierta durante el paseo para registrar el recorrido.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {/* Métricas en vivo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Distancia</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{km} km</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Tiempo</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatDuration(elapsed)}
          </p>
        </div>
      </div>

      {/* Mapa */}
      <div className="h-72 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        {current ? (
          <LiveMap
            center={current}
            marker={current}
            path={path}
            markerIconUrl={dogPhoto}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900">
            Obteniendo tu ubicación…
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={finish}
        disabled={ending}
        className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {ending ? "Terminando…" : "Terminar paseo"}
      </button>
    </div>
  );
}
