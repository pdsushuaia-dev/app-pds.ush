import { RoleNav, type NavItem } from "@/components/RoleNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";

const items: NavItem[] = [
  { href: "/cliente", label: "Inicio", icon: "home" },
  { href: "/cliente/perros", label: "Mis perros", icon: "paw" },
  { href: "/cliente/planes", label: "Planes", icon: "tag" },
  { href: "/cliente/turnos", label: "Turnos", icon: "calendar" },
  { href: "/cliente/banos", label: "Baños", icon: "droplet" },
  { href: "/cliente/historial", label: "Historial", icon: "route" },
  { href: "/cliente/pagos", label: "Pagos", icon: "card" },
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
