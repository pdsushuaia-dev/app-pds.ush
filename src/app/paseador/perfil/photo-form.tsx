"use client";

import { useActionState, useState } from "react";
import {
  updateWalkerPhoto,
  type WalkerProfileState,
} from "@/lib/actions/walker-profile";

const initial: WalkerProfileState = {};
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export function WalkerPhotoForm({
  currentPhoto,
  name,
}: {
  currentPhoto: string | null;
  name: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateWalkerPhoto,
    initial
  );
  const [preview, setPreview] = useState<string | null>(currentPhoto);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border p-5"
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview ?? "/dog-placeholder.svg"}
          alt=""
          className="size-24 shrink-0 rounded-full object-cover ring-2 ring-border"
        />
        <div>
          <p className="font-medium">{name ?? "Tu perfil"}</p>
          <label className="mt-1 block text-sm text-muted">
            <span className="mb-1 block">Foto de perfil</span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > MAX_PHOTO_BYTES) {
                  setFileError(
                    "La foto pesa más de 5 MB. Sacala con menos calidad o achicala."
                  );
                  e.target.value = "";
                  setPreview(currentPhoto);
                  return;
                }
                setFileError(null);
                setPreview(file ? URL.createObjectURL(file) : currentPhoto);
              }}
            />
          </label>
        </div>
      </div>

      {fileError || state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {fileError ?? state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-brand">Foto actualizada ✓</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || fileError !== null}
        className="self-start btn-primary"
      >
        {pending ? "Guardando…" : "Guardar foto"}
      </button>
    </form>
  );
}
