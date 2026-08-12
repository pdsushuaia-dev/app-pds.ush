"use client";

import { useState, useTransition } from "react";
import { createInvite } from "@/lib/actions/invites";

export function CreateInviteButton() {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const res = await createInvite();
      if (res.error) setError(res.error);
      else if (res.code) setCode(res.code);
    });
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="self-start btn-primary"
      >
        {pending ? "Generando…" : "Generar código"}
      </button>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {code ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/50 bg-brand/10 px-4 py-3">
          <span className="font-mono text-2xl font-bold tracking-widest">
            {code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-brand/50 px-3 py-1.5 text-sm text-brand"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
          <span className="text-xs text-brand">
            Compartilo con el paseador para que lo active en <b>/activar</b>.
          </span>
        </div>
      ) : null}
    </div>
  );
}
