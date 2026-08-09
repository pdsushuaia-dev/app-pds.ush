"use client";

import { useEffect, useMemo, useState } from "react";
import LiveMap from "@/components/map/LiveMap";
import { createClient } from "@/lib/supabase/client";
import { pathDistanceMeters, type LatLng } from "@/lib/geo/haversine";
import type { WalkStatus } from "@/lib/types/database";

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

export function LiveWalkView({
  walkId,
  dogName,
  dogPhoto,
  initialPositions,
  status: initialStatus,
  startedAt,
  distanceM,
  durationS,
}: {
  walkId: string;
  dogName: string;
  dogPhoto: string | null;
  initialPositions: LatLng[];
  status: WalkStatus;
  startedAt: string | null;
  distanceM: number | null;
  durationS: number | null;
}) {
  const [supabase] = useState(() => createClient());
  const [startMs] = useState(() =>
    startedAt ? new Date(startedAt).getTime() : Date.now()
  );

  const [positions, setPositions] = useState<LatLng[]>(initialPositions);
  const [status, setStatus] = useState<WalkStatus>(initialStatus);
  const [finalDistanceM, setFinalDistanceM] = useState<number | null>(distanceM);
  const [finalDurationS, setFinalDurationS] = useState<number | null>(durationS);
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startMs) / 1000)
  );

  // Timer en vivo (solo mientras está en curso).
  useEffect(() => {
    if (status !== "in_progress") return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [status, startMs]);

  // Suscripción Realtime (solo mientras está en curso). RLS filtra por dueño.
  useEffect(() => {
    if (status !== "in_progress") return;

    const channel = supabase
      .channel(`walk:${walkId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "walk_positions",
          filter: `walk_id=eq.${walkId}`,
        },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          setPositions((prev) => [...prev, { lat: row.lat, lng: row.lng }]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "walks",
          filter: `id=eq.${walkId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: WalkStatus;
            distance_m: number | null;
            duration_s: number | null;
          };
          if (row.status && row.status !== "in_progress") {
            if (row.distance_m != null) setFinalDistanceM(row.distance_m);
            if (row.duration_s != null) setFinalDurationS(row.duration_s);
            setStatus(row.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, walkId, status]);

  const computedM = useMemo(() => pathDistanceMeters(positions), [positions]);
  const last = positions.length > 0 ? positions[positions.length - 1] : null;

  const enCurso = status === "in_progress";
  const cancelado = status === "canceled";

  const shownM = enCurso ? computedM : finalDistanceM ?? computedM;
  const shownDur = enCurso ? elapsed : finalDurationS ?? elapsed;
  const km = (shownM / 1000).toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{dogName} en vivo</h1>
        {enCurso ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            🟢 En curso
          </span>
        ) : cancelado ? (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            Cancelado
          </span>
        ) : (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            Finalizado
          </span>
        )}
      </div>

      {cancelado ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          Este paseo fue cancelado.
        </p>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Distancia
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{km} km</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                {enCurso ? "Tiempo" : "Duración"}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatDuration(shownDur)}
              </p>
            </div>
          </div>

          {/* Mapa */}
          <div className="h-72 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            {last ? (
              <LiveMap
                center={last}
                marker={last}
                path={positions}
                markerIconUrl={dogPhoto}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900">
                Esperando la ubicación del paseador…
              </div>
            )}
          </div>

          {!enCurso ? (
            <p className="text-sm text-neutral-500">
              Paseo finalizado. Recorrido total: <b>{km} km</b> en{" "}
              <b>{formatDuration(shownDur)}</b>.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
