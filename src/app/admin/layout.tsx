import { RoleNav, type NavItem } from "@/components/RoleNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/turnos", label: "Turnos", icon: "calendar" },
  { href: "/admin/paseadores", label: "Paseadores", icon: "users" },
  { href: "/admin/planes", label: "Planes", icon: "tag" },
  { href: "/admin/clientes", label: "Clientes", icon: "user" },
  { href: "/admin/resenas", label: "Reseñas", icon: "star" },
  { href: "/admin/banners", label: "Banners", icon: "bell" },
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
