import { RoleNav } from "@/components/RoleNav";

const items = [
  { href: "/cliente", label: "Inicio" },
  { href: "/cliente/perros", label: "Mis perros" },
  { href: "/cliente/turnos", label: "Turnos" },
  { href: "/cliente/pagos", label: "Pagos" },
];

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <RoleNav title="Cliente" items={items} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
