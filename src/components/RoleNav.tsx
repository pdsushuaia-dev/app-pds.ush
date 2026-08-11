"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { LogoutButton } from "@/components/LogoutButton";

export interface NavItem {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Sub-rutas (ej. /cliente/perros) marcan activo su ítem; el índice del rol
  // (/cliente, /paseador, /admin) solo con match exacto.
  const isSubRoute = href.split("/").length > 2;
  return isSubRoute && pathname.startsWith(href + "/");
}

/**
 * Barra de navegación lateral/superior compartida por los paneles de rol.
 */
export function RoleNav({
  title,
  items,
  userName,
}: {
  title: string;
  items: NavItem[];
  userName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="size-8 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <Link href="/" className="block truncate text-base font-bold text-fg">
            {APP_NAME}
          </Link>
          <p className="text-xs uppercase tracking-wide text-brand">{title}</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:gap-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive(pathname, item.href) ? "nav-item nav-item-active" : "nav-item"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden border-t border-border p-2 md:block">
        {userName ? (
          <p className="truncate px-3 py-1 text-xs text-muted">{userName}</p>
        ) : null}
        <LogoutButton />
      </div>
    </aside>
  );
}
