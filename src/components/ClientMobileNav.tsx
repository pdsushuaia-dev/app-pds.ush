"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "@/components/icons";

const tabs = [
  { href: "/cliente", label: "Inicio", icon: "home" as const },
  { href: "/cliente/reservar", label: "Reservar", icon: "plus" as const },
  { href: "/cliente/turnos", label: "Turnos", icon: "calendar" as const },
  { href: "/cliente/banos", label: "Baños", icon: "droplet" as const },
  { href: "/cliente/perfil", label: "Perfil", icon: "user" as const },
];

/**
 * Barra de navegación inferior fija, solo en mobile (estilo app), para el
 * cliente. En desktop se usa el sidebar de RoleNav.
 */
export function ClientMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden">
      {tabs.map((t) => {
        const Icon = icons[t.icon];
        const active =
          t.href === "/cliente"
            ? pathname === "/cliente"
            : pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon className="h-6 w-6" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
