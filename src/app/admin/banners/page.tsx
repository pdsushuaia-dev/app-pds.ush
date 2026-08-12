import { createClient } from "@/lib/supabase/server";
import type { Banner } from "@/lib/types/database";
import { BannerCreate } from "./banner-create";
import { BannerItem } from "./banner-item";

export default async function AdminBanners() {
  const supabase = await createClient();

  // RLS deja al admin ver todos (activos e inactivos).
  const { data } = await supabase
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });
  const banners = (data ?? []) as Banner[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Banners</h1>
          <p className="text-sm text-muted">
            Avisos que ven los clientes en su panel.
          </p>
        </div>
        <BannerCreate />
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no publicaste ningún banner.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {banners.map((b) => (
            <BannerItem key={b.id} banner={b} />
          ))}
        </ul>
      )}
    </div>
  );
}
