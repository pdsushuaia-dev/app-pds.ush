import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { getProfile } from "@/lib/auth";
import { RedeemForm } from "./redeem-form";

export default async function ActivarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Requiere sesión (pero NO está bajo un prefijo de rol, así el middleware
  // no bloquea a un cliente que viene a canjear el código).
  if (!user) redirect("/login?redirect=/activar");

  const profile = await getProfile();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">
        {APP_NAME}
      </Link>
      <h1 className="text-2xl font-semibold">Activar cuenta de paseador</h1>
      <p className="mt-1 text-sm text-muted">
        Ingresá el código de invitación que te dio el administrador.
      </p>

      {profile?.role === "walker" ? (
        <div className="mt-6 rounded-xl border border-brand/50 bg-brand/10 p-4 text-sm">
          Ya sos paseador.{" "}
          <Link href="/paseador" className="font-medium underline">
            Ir a mi agenda
          </Link>
          .
        </div>
      ) : profile?.role === "admin" ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
          Estás como administrador. Los códigos se generan desde{" "}
          <Link href="/admin/paseadores" className="font-medium underline">
            Paseadores
          </Link>
          .
        </div>
      ) : (
        <RedeemForm />
      )}
    </main>
  );
}
