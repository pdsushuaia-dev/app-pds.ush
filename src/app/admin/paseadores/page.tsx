import { createClient } from "@/lib/supabase/server";
import { CreateInviteButton } from "./create-invite-button";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface WalkerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
}
interface InviteRow {
  id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export default async function AdminPaseadores() {
  const supabase = await createClient();

  const [walkersRes, invitesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, city")
      .eq("role", "walker")
      .order("full_name", { ascending: true }),
    supabase
      .from("walker_invites")
      .select("id, code, used_by, used_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const walkers = (walkersRes.data ?? []) as WalkerRow[];
  const invites = (invitesRes.data ?? []) as InviteRow[];
  const walkerName = new Map(walkers.map((w) => [w.id, w.full_name]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Paseadores</h1>
        <p className="text-sm text-muted">
          Generá un código de invitación y compartilo. La persona lo canjea en{" "}
          <b>/activar</b> y queda habilitada como paseador.
        </p>
      </div>

      {/* Generar código */}
      <section>
        <h2 className="text-lg font-semibold">Nuevo código de invitación</h2>
        <div className="mt-3">
          <CreateInviteButton />
        </div>
      </section>

      {/* Códigos */}
      <section>
        <h2 className="text-lg font-semibold">
          Códigos{" "}
          <span className="text-sm font-normal text-muted">
            ({invites.length})
          </span>
        </h2>
        {invites.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            Todavía no generaste ningún código.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono text-base font-bold tracking-widest">
                  {inv.code}
                </span>
                <span className="text-xs text-muted">
                  creado {dateFmt.format(new Date(inv.created_at))}
                </span>
                {inv.used_by ? (
                  <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    Usado{" "}
                    {walkerName.get(inv.used_by)
                      ? `por ${walkerName.get(inv.used_by)}`
                      : ""}
                  </span>
                ) : (
                  <span className="ml-auto badge-brand">
                    Disponible
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Paseadores actuales */}
      <section>
        <h2 className="text-lg font-semibold">
          Paseadores activos{" "}
          <span className="text-sm font-normal text-muted">
            ({walkers.length})
          </span>
        </h2>
        {walkers.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
            Todavía no hay paseadores.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {walkers.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {w.full_name ?? "(sin nombre)"}
                </span>
                {w.phone ? (
                  <span className="text-muted">{w.phone}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
