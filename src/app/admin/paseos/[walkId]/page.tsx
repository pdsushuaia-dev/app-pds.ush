import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LatLng } from "@/lib/geo/haversine";
import type { WalkStatus } from "@/lib/types/database";
import { LiveWalkView } from "@/components/walk/live-walk-view";

export default async function AdminPaseoDetalle({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const { walkId } = await params;
  const supabase = await createClient();

  // La RLS walks_admin permite al admin ver cualquier paseo.
  const { data: walkRaw } = await supabase
    .from("walks")
    .select(
      "id, dog_id, walker_id, started_at, ended_at, distance_m, duration_s, status"
    )
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as {
    id: string;
    dog_id: string;
    walker_id: string | null;
    started_at: string | null;
    ended_at: string | null;
    distance_m: number | null;
    duration_s: number | null;
    status: WalkStatus;
  } | null;
  if (!walk) notFound();

  const [dogRes, posRes] = await Promise.all([
    supabase
      .from("dogs")
      .select("name, photo_url")
      .eq("id", walk.dog_id)
      .maybeSingle(),
    supabase
      .from("walk_positions")
      .select("lat, lng")
      .eq("walk_id", walkId)
      .order("recorded_at", { ascending: true }),
  ]);

  let walkerName: string | null = null;
  if (walk.walker_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", walk.walker_id)
      .maybeSingle();
    walkerName = (data as { full_name: string | null } | null)?.full_name ?? null;
  }

  const dog = dogRes.data as { name: string; photo_url: string | null } | null;
  const initialPositions = (
    (posRes.data ?? []) as { lat: number; lng: number }[]
  ).map((p): LatLng => ({ lat: p.lat, lng: p.lng }));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/paseos" className="text-sm text-brand hover:underline">
        ← Volver a paseos
      </Link>

      {walkerName ? (
        <p className="text-sm text-muted">
          Paseador: <span className="text-fg">{walkerName}</span>
        </p>
      ) : null}

      <LiveWalkView
        walkId={walk.id}
        dogName={dog?.name ?? "Perro"}
        dogPhoto={dog?.photo_url ?? null}
        initialPositions={initialPositions}
        status={walk.status}
        startedAt={walk.started_at}
        distanceM={walk.distance_m}
        durationS={walk.duration_s}
      />
    </div>
  );
}
