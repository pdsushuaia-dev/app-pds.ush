import { Placeholder } from "@/components/Placeholder";

export default function AdminResenas() {
  return (
    <Placeholder
      title="Reseñas"
      description="Reseñas privadas de clientes (solo el admin puede leerlas, por RLS)."
      week={3}
    />
  );
}
