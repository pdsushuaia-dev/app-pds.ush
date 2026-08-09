import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LatLng } from "@/lib/geo/haversine";
import type { WalkStatus } from "@/lib/types/database";
import { LiveWalkView } from "./live-walk-view";

export default async function ClientePaseoPage({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const { walkId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS walks_owner_select limita a los walks de los perros del dueño.
  const { data: walkRaw } = await supabase
    .from("walks")
    .select("id, dog_id, started_at, ended_at, distance_m, duration_s, status")
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as {
    id: string;
    dog_id: string;
    started_at: string | null;
    ended_at: string | null;
    distance_m: number | null;
    duration_s: number | null;
    status: WalkStatus;
  } | null;

  if (!walk) redirect("/cliente/turnos");

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

  const dog = dogRes.data as { name: string; photo_url: string | null } | null;
  const initialPositions = ((posRes.data ?? []) as { lat: number; lng: number }[]).map(
    (p): LatLng => ({ lat: p.lat, lng: p.lng })
  );

  return (
    <LiveWalkView
      walkId={walk.id}
      dogName={dog?.name ?? "Tu perro"}
      dogPhoto={dog?.photo_url ?? null}
      initialPositions={initialPositions}
      status={walk.status}
      startedAt={walk.started_at}
      distanceM={walk.distance_m}
      durationS={walk.duration_s}
    />
  );
}
