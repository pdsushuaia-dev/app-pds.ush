import { RoleNav } from "@/components/RoleNav";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/paseadores", label: "Paseadores" },
  { href: "/admin/planes", label: "Planes" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/resenas", label: "Reseñas" },
  { href: "/admin/banners", label: "Banners" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <RoleNav title="Admin" items={items} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
