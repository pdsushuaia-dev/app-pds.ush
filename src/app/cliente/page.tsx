import { EnableNotifications } from "@/components/EnableNotifications";
import { Placeholder } from "@/components/Placeholder";

export default function ClienteHome() {
  return (
    <div className="flex flex-col gap-6">
      <EnableNotifications />
      <Placeholder
        title="Inicio del cliente"
        description="Próximos turnos, banners/novedades y acceso al seguimiento en vivo del paseo del día."
        week={2}
      />
    </div>
  );
}
