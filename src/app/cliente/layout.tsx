import { RoleNav, type NavItem } from "@/components/RoleNav";
import { ClientMobileNav } from "@/components/ClientMobileNav";
import { PushRegistrar } from "@/components/PushRegistrar";
import { getProfile } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";

const items: NavItem[] = [
  { href: "/cliente", label: "Inicio", icon: "home" },
  { href: "/cliente/reservar", label: "Reservar", icon: "plus" },
  { href: "/cliente/perros", label: "Mi perro", icon: "paw" },
  { href: "/cliente/planes", label: "Planes", icon: "tag" },
  { href: "/cliente/turnos", label: "Turnos", icon: "calendar" },
  { href: "/cliente/banos", label: "Baños", icon: "droplet" },
  { href: "/cliente/historial", label: "Historial", icon: "route" },
  { href: "/cliente/pagos", label: "Pagos", icon: "card" },
  { href: "/cliente/perfil", label: "Perfil", icon: "user" },
];

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <PushRegistrar />

      {/* Desktop: sidebar */}
      <div className="hidden md:block">
        <RoleNav title="Cliente" items={items} userName={profile?.full_name} />
      </div>

      {/* Mobile: header de marca */}
      <header className="flex items-center gap-2.5 border-b border-border bg-surface p-4 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="size-9 shrink-0 rounded-xl object-cover ring-1 ring-border"
        />
        <div className="leading-tight">
          <span className="block text-base font-bold text-fg">{APP_NAME}</span>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-brand">
            Cliente
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>

      {/* Mobile: barra inferior */}
      <ClientMobileNav />
    </div>
  );
}
