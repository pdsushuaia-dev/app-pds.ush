"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startWalk } from "@/lib/actions/walks";

export function StartWalkButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await startWalk(appointmentId);
      if (res.error) {
        setError(res.error);
      } else if (res.walkId) {
        router.push(`/paseador/paseo/${res.walkId}`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Iniciando…" : "Iniciar paseo"}
      </button>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
