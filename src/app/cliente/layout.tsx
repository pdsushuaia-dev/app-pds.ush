import { RoleNav } from "@/components/RoleNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";

const items = [
  { href: "/cliente", label: "Inicio" },
  { href: "/cliente/perros", label: "Mis perros" },
  { href: "/cliente/planes", label: "Planes" },
  { href: "/cliente/turnos", label: "Turnos" },
  { href: "/cliente/historial", label: "Historial" },
  { href: "/cliente/pagos", label: "Pagos" },
];

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <PushRegistrar />
      <RoleNav title="Cliente" items={items} userName={profile?.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
