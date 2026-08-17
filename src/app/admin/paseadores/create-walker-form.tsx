"use client";

import { useActionState } from "react";
import { createWalker, type CreateWalkerState } from "@/lib/actions/walkers";

const initial: CreateWalkerState = {};

export function CreateWalkerForm() {
  const [state, formAction, pending] = useActionState(createWalker, initial);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-muted">Tipo</span>
          <select name="role" required defaultValue="walker" className="input">
            <option value="walker">Paseador</option>
            <option value="bather">Bañador</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nombre y apellido</span>
          <input
            name="full_name"
            required
            className="input"
            placeholder="Bruno Giménez"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Ciudad</span>
          <select name="city" required defaultValue="ushuaia" className="input">
            <option value="ushuaia">Ushuaia</option>
            <option value="rio_grande">Río Grande</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            className="input"
            placeholder="paseador@email.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">
            Teléfono <span className="text-muted/60">(opcional)</span>
          </span>
          <input name="phone" className="input" placeholder="2901 55-6677" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-muted">Contraseña temporal</span>
          <input
            name="password"
            type="text"
            required
            minLength={6}
            className="input"
            placeholder="mínimo 6 caracteres"
          />
          <span className="text-xs text-muted">
            Se la pasás al paseador por WhatsApp; después él la puede cambiar.
          </span>
        </label>
      </div>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand">
          {state.message}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary px-5 py-2.5 disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear paseador"}
        </button>
      </div>
    </form>
  );
}
