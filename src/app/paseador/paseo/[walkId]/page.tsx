import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActiveWalk } from "./active-walk";

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

  // RLS ya limita a los walks del paseador; validamos igual el dueño y el estado.
  const { data: walkRaw } = await supabase
    .from("walks")
    .select("id, walker_id, dog_id, started_at, status")
    .eq("id", walkId)
    .maybeSingle();
  const walk = walkRaw as {
    id: string;
    walker_id: string;
    dog_id: string;
    started_at: string | null;
    status: string;
  } | null;

  if (!walk || walk.walker_id !== user.id || walk.status !== "in_progress") {
    redirect("/paseador");
  }

  const { data: dogRaw } = await supabase
    .from("dogs")
    .select("name, photo_url")
    .eq("id", walk.dog_id)
    .maybeSingle();
  const dog = dogRaw as { name: string; photo_url: string | null } | null;

  return (
    <ActiveWalk
      walkId={walk.id}
      dogName={dog?.name ?? "el perro"}
      dogPhoto={dog?.photo_url ?? null}
      startedAt={walk.started_at ?? new Date().toISOString()}
    />
  );
}
