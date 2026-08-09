import { Placeholder } from "@/components/Placeholder";

export default function PaseadorHome() {
  return (
    <Placeholder
      title="Agenda del paseador"
      description="Turnos del día/semana (qué perro, hora, dirección de retiro) y botón para iniciar el paseo."
      week={3}
    />
  );
}
