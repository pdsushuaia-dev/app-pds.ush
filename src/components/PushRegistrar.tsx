"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (/sw.js) al montar. Degrada sin romper si el
 * navegador no soporta service workers.
 */
export function PushRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registro fallido: no es crítico */
    });
  }, []);

  return null;
}
