"use client";

import { useState, useTransition } from "react";
import { startAutoDebit, cancelAutoDebit } from "@/lib/actions/autodebit";

export function AutoDebitControls({
  subscriptionId,
  mpStatus,
  configured,
  hasPrice,
}: {
  subscriptionId: string;
  mpStatus: string | null;
  configured: boolean;
  hasPrice: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activo = mpStatus === "authorized";
  const pendiente = mpStatus === "pending";

  function activar() {
    setError(null);
    startTransition(async () => {
      const res = await startAutoDebit(subscriptionId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.initPoint) window.location.href = res.initPoint;
    });
  }

  function cancelar() {
    setError(null);
    startTransition(async () => {
      const res = await cancelAutoDebit(subscriptionId);
      if (res.error) setError(res.error);
    });
  }

  if (activo) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          La cuota se debita automáticamente cada mes.
        </p>
        <button
          onClick={cancelar}
          disabled={pending}
          className="btn-secondary self-start px-4 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "…" : "Cancelar débito automático"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={activar}
        disabled={pending || !configured || !hasPrice}
        className="btn-primary self-start px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {pending
          ? "Redirigiendo…"
          : pendiente
            ? "Terminar de autorizar"
            : "Activar débito automático"}
      </button>
      {!configured ? (
        <p className="text-xs text-muted">
          Se habilita en cuanto conectemos MercadoPago.
        </p>
      ) : !hasPrice ? (
        <p className="text-xs text-muted">Falta definir el precio de tu plan.</p>
      ) : (
        <p className="text-xs text-muted">
          Autorizás tu tarjeta una vez y listo — se descuenta solo cada mes.
        </p>
      )}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
