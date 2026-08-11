"use client";

import { useActionState, useEffect } from "react";
import {
  createBannerAction,
  updateBannerAction,
  type BannerState,
} from "@/lib/actions/banners";
import type { Banner } from "@/lib/types/database";

const initial: BannerState = {};

const inputCls =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

/** timestamptz ISO → valor de <input datetime-local> en hora de Ushuaia. */
function toArInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Ushuaia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function BannerForm({
  banner,
  onDone,
  onCancel,
}: {
  banner?: Banner;
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = banner ? updateBannerAction : createBannerAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      <input
        name="title"
        placeholder="Título *"
        defaultValue={banner?.title ?? ""}
        required
        className={inputCls}
      />
      <textarea
        name="body"
        placeholder="Texto (opcional)"
        defaultValue={banner?.body ?? ""}
        rows={2}
        className={inputCls}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-neutral-500">
          Desde (opcional)
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={toArInput(banner?.starts_at)}
            className={`${inputCls} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-neutral-500">
          Hasta (opcional)
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={toArInput(banner?.ends_at)}
            className={`${inputCls} mt-1 block w-full`}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={banner ? banner.active : true}
          className="size-4"
        />
        Activo
      </label>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Guardando…" : banner ? "Guardar cambios" : "Publicar banner"}
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
