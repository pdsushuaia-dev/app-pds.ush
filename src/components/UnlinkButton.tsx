"use client";

import { useTransition } from "react";
import { setUserActive } from "@/lib/actions/users";

export function UnlinkButton({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  if (active) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "¿Desvincular a esta persona? No va a poder entrar más a la app."
            )
          )
            return;
          start(() => {
            void setUserActive(userId, false);
          });
        }}
        className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-60"
      >
        {pending ? "…" : "Desvincular"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(() => {
          void setUserActive(userId, true);
        })
      }
      className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20 disabled:opacity-60"
    >
      {pending ? "…" : "Reactivar"}
    </button>
  );
}
