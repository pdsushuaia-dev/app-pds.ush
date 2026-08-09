import { RoleNav } from "@/components/RoleNav";
import { getProfile } from "@/lib/auth";

const items = [
  { href: "/paseador", label: "Mi agenda" },
];

export default async function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <RoleNav title="Paseador" items={items} userName={profile?.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
