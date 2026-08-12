import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { slotLabel } from "@/lib/turnos";

export const runtime = "nodejs";

const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Ushuaia",
  hour: "2-digit",
  minute: "2-digit",
});

interface ApptRow {
  id: string;
  walker_id: string;
  scheduled_at: string;
  time_slot: "morning" | "midday" | "afternoon" | null;
  dogs: { name: string; owner_id: string } | null;
}

/**
 * Envía los recordatorios de paseos próximos. Lo agenda un cron externo
 * (pg_cron + pg_net) cada pocos minutos con el header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const leadMin = Number(process.env.REMINDER_LEAD_MINUTES ?? 30);
  const now = new Date();
  const until = new Date(now.getTime() + leadMin * 60_000);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("id, walker_id, scheduled_at, time_slot, dogs(name, owner_id)")
    .not("walker_id", "is", null)
    .eq("status", "scheduled")
    .is("reminded_at", null)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", until.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appts = (data ?? []) as unknown as ApptRow[];
  let sent = 0;

  for (const a of appts) {
    const hora = timeFmt.format(new Date(a.scheduled_at));
    const perro = a.dogs?.name ?? "Un perro";
    await sendPushToUser(a.walker_id, {
      title: "Paseo en breve",
      body: `${perro} a las ${hora} (${slotLabel(a.time_slot)})`,
      url: "/paseador",
    });
    // Recordatorio también para el dueño del perro.
    if (a.dogs?.owner_id) {
      await sendPushToUser(a.dogs.owner_id, {
        title: "Recordatorio de paseo",
        body: `Hoy ${perro} tiene paseo a las ${hora}`,
        url: "/cliente",
      });
    }
    await admin
      .from("appointments")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", a.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
