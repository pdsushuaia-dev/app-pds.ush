import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { CITIES } from "@/lib/constants";
import { icons } from "@/components/icons";

export default async function PerfilPage() {
  const profile = await getProfile();
  const cityLabel =
    CITIES.find((c) => c.value === profile?.city)?.label ?? "—";
  const Card = icons.card;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted">Tus datos y tu cuenta.</p>
      </header>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <dl className="flex flex-col divide-y divide-border text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Nombre</dt>
            <dd className="font-medium">{profile?.full_name ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Teléfono</dt>
            <dd className="font-medium">{profile?.phone ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Ciudad</dt>
            <dd className="font-medium">{cityLabel}</dd>
          </div>
        </dl>
      </div>

      <Link
        href="/cliente/pagos"
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand/50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Card className="h-5 w-5" />
        </span>
        <span className="flex-1 font-medium">Pagos</span>
        <span className="text-brand">→</span>
      </Link>

      <LogoutButton />
    </div>
  );
}
