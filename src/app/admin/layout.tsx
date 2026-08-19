import { RoleNav, type NavItem } from "@/components/RoleNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";

// Modelo marketplace: el admin ya NO asigna turnos. Solo supervisa (en vivo),
// gestiona planes y da de alta / desvincula personal y clientes.
const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/paseos", label: "En vivo", icon: "route" },
  { href: "/admin/paseadores", label: "Paseadores", icon: "users" },
  { href: "/admin/clientes", label: "Clientes", icon: "user" },
  { href: "/admin/planes", label: "Planes", icon: "tag" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <PushRegistrar />
      <RoleNav title="Admin" items={items} userName={profile?.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
