import { RoleNav } from "@/components/RoleNav";
import { getProfile } from "@/lib/auth";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/paseadores", label: "Paseadores" },
  { href: "/admin/planes", label: "Planes" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/resenas", label: "Reseñas" },
  { href: "/admin/banners", label: "Banners" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <RoleNav title="Admin" items={items} userName={profile?.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
