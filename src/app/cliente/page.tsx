import { createClient } from "@/lib/supabase/server";
import { EnableNotifications } from "@/components/EnableNotifications";
import { Placeholder } from "@/components/Placeholder";
import { SessionBanners, type ClientBanner } from "./session-banners";

export default async function ClienteHome() {
  const supabase = await createClient();

  // RLS devuelve solo los banners vigentes para el cliente.
  const { data } = await supabase.from("banners").select("id, title, body");
  const banners = (data ?? []) as ClientBanner[];

  return (
    <div className="flex flex-col gap-6">
      <SessionBanners banners={banners} />
      <EnableNotifications />
      <Placeholder
        title="Inicio del cliente"
        description="Próximos turnos, banners/novedades y acceso al seguimiento en vivo del paseo del día."
        week={2}
      />
    </div>
  );
}
