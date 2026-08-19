"use client";

import { useState, useTransition } from "react";
import { acceptRequest, rejectRequest } from "@/lib/actions/requests";

export function RequestActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await acceptRequest(id);
              if (r.error) setErr(r.error);
            });
          }}
          className="btn-primary px-4 py-1.5 text-sm"
        >
          {pending ? "…" : "Aceptar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("¿Rechazar esta solicitud?")) return;
            setErr(null);
            start(async () => {
              const r = await rejectRequest(id);
              if (r.error) setErr(r.error);
            });
          }}
          className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-60"
        >
          Rechazar
        </button>
      </div>
      {err ? <span className="text-xs text-red-400">{err}</span> : null}
    </div>
  );
}
