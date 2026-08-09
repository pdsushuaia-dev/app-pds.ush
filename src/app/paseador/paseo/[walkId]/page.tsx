import { Placeholder } from "@/components/Placeholder";

export default async function PaseoEnCursoPage({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const { walkId } = await params;
  return (
    <Placeholder
      title="Paseo en curso"
      description={`Emisión de GPS (watchPosition + Wake Lock), mapa en vivo y botón terminar. walk_id: ${walkId}`}
      week={4}
    />
  );
}
