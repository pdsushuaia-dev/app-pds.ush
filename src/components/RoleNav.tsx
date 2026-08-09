import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LogoutButton } from "@/components/LogoutButton";

export interface NavItem {
  href: string;
  label: string;
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
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-black/10 bg-white md:h-dvh md:w-60 md:border-b-0 md:border-r dark:border-white/10 dark:bg-neutral-950">
      <div className="p-4">
        <Link href="/" className="text-lg font-bold">
          {APP_NAME}
        </Link>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-neutral-500">
          {title}
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:gap-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden border-t border-black/10 p-2 md:block dark:border-white/10">
        {userName ? (
          <p className="truncate px-3 py-1 text-xs text-neutral-500">{userName}</p>
        ) : null}
        <LogoutButton />
      </div>
    </aside>
  );
}
