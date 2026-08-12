"use client";

import { useActionState, useEffect, useRef } from "react";
import { scheduleBath, type BathState } from "@/lib/actions/baths";

const initial: BathState = {};

export function BathForm({ dogs }: { dogs: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(scheduleBath, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  if (dogs.length === 0) {
    return (
      <p className="text-sm text-muted">
        Primero cargá un perro en Mis perros para poder agendar un baño.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <select name="dog_id" required defaultValue="" className="input">
        <option value="" disabled>
          Elegí el perro
        </option>
        {dogs.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <input type="datetime-local" name="scheduled_at" required className="input" />

      {state.error ? (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md bg-brand/10 px-3 py-2 text-sm text-brand">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Agendando…" : "Agendar baño"}
      </button>
    </form>
  );
}
