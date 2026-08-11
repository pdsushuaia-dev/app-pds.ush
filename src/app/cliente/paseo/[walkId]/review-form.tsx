"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createReviewAction, type ReviewState } from "@/lib/actions/reviews";

const initial: ReviewState = {};

export function ReviewForm({ walkId }: { walkId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction, pending] = useActionState(createReviewAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        ¡Gracias por tu reseña! 🐾
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div>
        <h2 className="font-semibold">¿Cómo estuvo el paseo?</h2>
        <p className="text-xs text-neutral-500">
          Tu reseña es privada (solo la ve el equipo de PDS).
        </p>
      </div>

      <input type="hidden" name="walkId" value={walkId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            className="text-3xl leading-none"
          >
            <span
              className={
                (hover || rating) >= n
                  ? "text-amber-400"
                  : "text-neutral-300 dark:text-neutral-700"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        placeholder="Comentario (opcional)"
        rows={3}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="self-start btn-primary"
      >
        {pending ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
