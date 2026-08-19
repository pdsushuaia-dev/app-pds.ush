"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { slotLabel } from "@/lib/turnos";
import type { TimeSlot } from "@/lib/types/database";

export type RequestState = { error?: string };

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface ApptWithDog {
  id: string;
  status: string;
  scheduled_at: string;
  time_slot: TimeSlot | null;
  walker_id: string | null;
  dogs: { name: string; owner_id: string } | null;
}

async function loadOwnRequest(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." as string };

  const { data } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, time_slot, walker_id, dogs(name, owner_id)")
    .eq("id", id)
    .maybeSingle();
  const a = data as unknown as ApptWithDog | null;

  if (!a || a.walker_id !== user.id) {
    return { error: "No encontramos esa solicitud." as string };
  }
  if (a.status !== "requested") {
    return { error: "Esa solicitud ya no está pendiente." as string };
  }
  return { supabase, appt: a };
}

/** El paseador acepta la solicitud → el turno queda confirmado ('scheduled'). */
export async function acceptRequest(id: string): Promise<RequestState> {
  const res = await loadOwnRequest(id);
  if ("error" in res) return { error: res.error };
  const { supabase, appt } = res;

  const { error } = await supabase
    .from("appointments")
    .update({ status: "scheduled", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudo confirmar. Probá de nuevo." };

  if (appt.dogs?.owner_id) {
    await sendPushToUser(appt.dogs.owner_id, {
      title: "¡Paseo confirmado! 🐾",
      body: `${appt.dogs.name} · ${dateFmt.format(new Date(appt.scheduled_at))} · ${slotLabel(appt.time_slot)}`,
      url: "/cliente/turnos",
    });
  }

  revalidatePath("/paseador");
  return {};
}

/** El paseador rechaza la solicitud → el cliente puede pedirle a otro. */
export async function rejectRequest(id: string): Promise<RequestState> {
  const res = await loadOwnRequest(id);
  if ("error" in res) return { error: res.error };
  const { supabase, appt } = res;

  const { error } = await supabase
    .from("appointments")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudo rechazar. Probá de nuevo." };

  if (appt.dogs?.owner_id) {
    await sendPushToUser(appt.dogs.owner_id, {
      title: "El paseador no pudo tomar el paseo",
      body: `${appt.dogs.name}: elegí a otro paseador para ese horario.`,
      url: "/cliente/reservar",
    });
  }

  revalidatePath("/paseador");
  return {};
}
