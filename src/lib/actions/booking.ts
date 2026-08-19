"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { SLOTS, slotLabel, type TimeSlot } from "@/lib/turnos";

export type BookState = { ok?: boolean; error?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_SLOTS = SLOTS.map((s) => s.key);

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * Reserva un paseo (modelo marketplace): el cliente elige día, franja y un
 * paseador LIBRE. Se crea el turno en estado 'requested' y le llega una
 * solicitud (push) al paseador para aceptar o rechazar.
 */
export async function bookWalk(
  dogId: string,
  dateStr: string,
  slot: TimeSlot,
  walkerId: string
): Promise<BookState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  if (!DATE_RE.test(dateStr)) return { error: "Fecha inválida." };
  if (!VALID_SLOTS.includes(slot)) return { error: "Franja inválida." };
  if (!walkerId) return { error: "Elegí un paseador." };

  // Dueño del perro (validado en el server).
  const { data: dogRow } = await supabase
    .from("dogs")
    .select("id, name, owner_id")
    .eq("id", dogId)
    .maybeSingle();
  const dog = dogRow as { id: string; name: string; owner_id: string } | null;
  if (!dog || dog.owner_id !== user.id) {
    return { error: "Ese perro no es tuyo." };
  }

  // Fecha/hora con offset fijo AR y día de la semana del calendario.
  const [y, mo, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  const startH = SLOTS.find((s) => s.key === slot)?.hour ?? 9;
  const HH = String(startH).padStart(2, "0");
  const scheduledAt = `${dateStr}T${HH}:00:00-03:00`;
  const slotStart = `${HH}:00:00`;
  const slotEnd = `${String(startH + 2).padStart(2, "0")}:00:00`;

  if (new Date(scheduledAt).getTime() <= Date.now()) {
    return { error: "Elegí un día y una hora que todavía no hayan pasado." };
  }

  const admin = createAdminClient();

  // Re-chequeo: ese paseador tiene que estar realmente libre en ese momento.
  const { data: avail } = await admin.rpc("available_walkers", {
    p_scheduled_at: scheduledAt,
    p_weekday: weekday,
    p_slot_start: slotStart,
    p_slot_end: slotEnd,
  });
  const free = (avail ?? []) as { id: string }[];
  if (!free.some((w) => w.id === walkerId)) {
    return {
      error: "Ese paseador ya no está libre a esa hora. Elegí otro u otro horario.",
    };
  }

  // Alta del turno en estado 'requested' (service-role: el candado de insert
  // del cliente exige walker_id null; acá el cliente sí elige paseador).
  const { error } = await admin.from("appointments").insert({
    dog_id: dog.id,
    walker_id: walkerId,
    scheduled_at: scheduledAt,
    time_slot: slot,
    status: "requested",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Ya tenés un turno a esa hora (o el paseador se ocupó). Elegí otro horario.",
      };
    }
    return { error: "No se pudo enviar la solicitud. Probá de nuevo." };
  }

  // Aviso al paseador (best-effort).
  await sendPushToUser(walkerId, {
    title: "Nueva solicitud de paseo",
    body: `${dog.name} · ${dateFmt.format(new Date(scheduledAt))} · ${slotLabel(slot)}`,
    url: "/paseador",
  });

  revalidatePath("/cliente/turnos");
  return { ok: true };
}
