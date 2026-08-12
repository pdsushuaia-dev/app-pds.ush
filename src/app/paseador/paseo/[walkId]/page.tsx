import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActiveWalk } from "./active-walk";
import { WalkMediaUploader, type MediaItem } from "./walk-media-uploader";

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

export default async function PaseoEnCursoPage({
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

  const { data: walkRaw } = await supabase
    .from("walks")
    .select("id, walker_id, dog_id, started_at, status, distance_m, duration_s")
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as {
    id: string;
    walker_id: string;
    dog_id: string;
    started_at: string | null;
    status: string;
    distance_m: number | null;
    duration_s: number | null;
  } | null;

  // El paseador puede entrar mientras está en curso o cuando ya terminó
  // (para subir/ver fotos después). No para cancelados.
  if (
    !walk ||
    walk.walker_id !== user.id ||
    (walk.status !== "in_progress" && walk.status !== "done")
  ) {
    redirect("/paseador");
  }

  const [dogRes, mediaRes] = await Promise.all([
    supabase.from("dogs").select("name, photo_url").eq("id", walk.dog_id).maybeSingle(),
    supabase
      .from("walk_media")
      .select("id, storage_path, media_type")
      .eq("walk_id", walkId)
      .order("created_at", { ascending: true }),
  ]);

  const dog = dogRes.data as { name: string; photo_url: string | null } | null;
  const media: MediaItem[] = (
    (mediaRes.data ?? []) as {
      id: string;
      storage_path: string;
      media_type: "photo" | "video";
    }[]
  ).map((m) => ({
    id: m.id,
    path: m.storage_path,
    url: supabase.storage.from("walk-media").getPublicUrl(m.storage_path).data.publicUrl,
    type: m.media_type,
  }));

  const dogName = dog?.name ?? "el perro";

  return (
    <div className="flex flex-col gap-6">
      {walk.status === "in_progress" ? (
        <ActiveWalk
          walkId={walk.id}
          dogName={dogName}
          dogPhoto={dog?.photo_url ?? null}
          startedAt={walk.started_at ?? new Date().toISOString()}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">
            Paseo finalizado — {dogName}
          </h1>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Distancia</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {((walk.distance_m ?? 0) / 1000).toFixed(1)} km
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Duración</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatDuration(walk.duration_s ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <WalkMediaUploader walkId={walk.id} initialMedia={media} />
    </div>
  );
}
