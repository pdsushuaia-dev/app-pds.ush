import { RoleNav } from "@/components/RoleNav";

const items = [
  { href: "/paseador", label: "Mi agenda" },
];

export default function PaseadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <RoleNav title="Paseador" items={items} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
