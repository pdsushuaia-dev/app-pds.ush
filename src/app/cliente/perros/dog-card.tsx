"use client";

import { useCallback, useState, useTransition } from "react";
import { deleteDog } from "@/lib/actions/dogs";
import type { Dog } from "@/lib/types/database";
import { DogForm } from "./dog-form";

export function DogCard({ dog }: { dog: Dog }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const done = useCallback(() => setEditing(false), []);
  const cancel = useCallback(() => setEditing(false), []);

  if (editing) {
    return <DogForm dog={dog} onDone={done} onCancel={cancel} />;
  }

  function onDelete() {
    if (!confirm(`¿Borrar a ${dog.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteDog(dog.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-900">
        {dog.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dog.photo_url}
            alt={dog.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🐕</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{dog.name}</h3>
        {dog.breed ? (
          <p className="text-sm text-neutral-500">{dog.breed}</p>
        ) : null}
        {dog.pickup_address ? (
          <p className="mt-1 text-xs text-neutral-400">📍 {dog.pickup_address}</p>
        ) : null}
        {dog.notes ? (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{dog.notes}</p>
        ) : null}

        {error ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            {pending ? "Borrando…" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
