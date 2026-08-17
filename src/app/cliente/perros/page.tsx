import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { Dog } from "@/lib/types/database";
import { DogCard } from "./dog-card";
import { NewDogSection } from "./new-dog-section";

export default async function PerrosPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("owner_id", profile?.id ?? "")
    .order("created_at", { ascending: true });

  const dogs = (data ?? []) as Dog[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mi perro</h1>
          <p className="text-sm text-muted">
            Cargá la ficha de cada perro: foto, raza, dirección de retiro y notas.
          </p>
        </div>
        <NewDogSection />
      </div>

      {error ? (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          No se pudieron cargar tus perros. Probá recargar la página.
        </p>
      ) : dogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no cargaste ningún perro. Tocá <b>“Agregar perro”</b> para empezar.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>
      )}
    </div>
  );
}
