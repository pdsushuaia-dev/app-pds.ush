import { RoleNav, type NavItem } from "@/components/RoleNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";

const items: NavItem[] = [
  { href: "/paseador", label: "Mi agenda", icon: "calendar" },
  { href: "/paseador/horarios", label: "Mis horarios", icon: "clock" },
  { href: "/paseador/perfil", label: "Mi perfil", icon: "user" },
];

export default async function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <PushRegistrar />
      <RoleNav title="Paseador" items={items} userName={profile?.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
