import { createClient } from "@/lib/supabase/server";
import { WalkerPhotoForm } from "./photo-form";

export default async function PaseadorPerfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let photo: string | null = null;
  let name: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, photo_url")
      .eq("id", user.id)
      .single();
    const p = data as { full_name: string | null; photo_url: string | null } | null;
    photo = p?.photo_url ?? null;
    name = p?.full_name ?? null;
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted">
          Subí tu foto. Los clientes la ven cuando te eligen para pasear a su
          perro — una buena foto genera más confianza.
        </p>
      </div>
      <WalkerPhotoForm currentPhoto={photo} name={name} />
    </div>
  );
}
