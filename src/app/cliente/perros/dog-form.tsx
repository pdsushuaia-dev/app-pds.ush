"use client";

import { useActionState, useEffect, useState } from "react";
import { createDog, updateDog, type DogFormState } from "@/lib/actions/dogs";
import type { Dog } from "@/lib/types/database";

const initial: DogFormState = {};

const inputCls =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export function DogForm({
  dog,
  onDone,
  onCancel,
}: {
  dog?: Dog;
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = dog ? updateDog : createDog;
  const [state, formAction, pending] = useActionState(action, initial);
  const [preview, setPreview] = useState<string | null>(dog?.photo_url ?? null);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      {dog ? <input type="hidden" name="id" value={dog.id} /> : null}

      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview ?? "/dog-placeholder.svg"}
          alt=""
          className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
        />
        <label className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="mb-1 block">Foto</span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-neutral-800"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : dog?.photo_url ?? null);
            }}
          />
        </label>
      </div>

      <input
        name="name"
        placeholder="Nombre *"
        defaultValue={dog?.name ?? ""}
        required
        className={inputCls}
      />
      <input
        name="breed"
        placeholder="Raza"
        defaultValue={dog?.breed ?? ""}
        className={inputCls}
      />
      <input
        name="pickup_address"
        placeholder="Dirección de retiro"
        defaultValue={dog?.pickup_address ?? ""}
        className={inputCls}
      />
      <textarea
        name="notes"
        placeholder="Notas (carácter, indicaciones, etc.)"
        defaultValue={dog?.notes ?? ""}
        rows={2}
        className={inputCls}
      />

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Guardando…" : dog ? "Guardar cambios" : "Agregar perro"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-neutral-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
