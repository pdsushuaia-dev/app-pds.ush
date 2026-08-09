"use client";

import { useEffect, useState } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/actions/push";

type Status =
  | "checking"
  | "unsupported"
  | "ios-install"
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function EnableNotifications() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!supported) {
      const ua = navigator.userAgent;
      const isIOS = /iP(hone|ad|od)/.test(ua);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      queueMicrotask(() =>
        setStatus(isIOS && !isStandalone ? "ios-install" : "unsupported")
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (Notification.permission === "denied") setStatus("denied");
        else if (sub) setStatus("on");
        else setStatus("off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
          ),
        });
      }
      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setStatus("on");
    } catch {
      setError("No pudimos activar las notificaciones. Reintentá.");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("No pudimos desactivar las notificaciones.");
    } finally {
      setPending(false);
    }
  }

  if (status === "checking") return null;

  const base =
    "rounded-xl border px-4 py-3 text-sm border-neutral-200 dark:border-neutral-800";

  if (status === "unsupported") {
    return (
      <div className={`${base} text-neutral-500`}>
        Tu navegador no soporta notificaciones.
      </div>
    );
  }

  if (status === "ios-install") {
    return (
      <div className={`${base} text-neutral-500`}>
        📲 En iPhone, instalá la app (<b>Compartir → Agregar a inicio</b>) para
        recibir avisos.
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className={`${base} text-neutral-500`}>
        Las notificaciones están bloqueadas. Activalas desde los ajustes del
        navegador para este sitio.
      </div>
    );
  }

  return (
    <div className={`${base} flex flex-wrap items-center justify-between gap-3`}>
      <div>
        <p className="font-medium">Notificaciones</p>
        <p className="text-xs text-neutral-500">
          {status === "on"
            ? "Activadas — te avisamos de tus paseos."
            : "Activalas para enterarte de tus paseos."}
        </p>
        {error ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
      {status === "on" ? (
        <button
          type="button"
          onClick={disable}
          disabled={pending}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60 dark:border-neutral-700"
        >
          {pending ? "…" : "Desactivar"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Activando…" : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}
