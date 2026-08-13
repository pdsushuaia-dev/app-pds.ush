import type { City } from "@/lib/types/database";

export const APP_NAME = "PDS.ushuaia";

// WhatsApp del club para el botón "Ayuda" (formato internacional SIN "+", ni
// espacios ni guiones). Ej: 5492901556677. Cambialo por el número real de Agustín.
export const CLUB_WHATSAPP = "5492901000000";

export const CITIES: { value: City; label: string; center: [number, number] }[] = [
  { value: "ushuaia", label: "Ushuaia", center: [-54.8019, -68.303] },
  { value: "rio_grande", label: "Río Grande", center: [-53.7877, -67.7093] },
];

export const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// Frecuencia de emisión GPS (ms) durante el paseo.
export const GPS_EMIT_INTERVAL_MS = 8_000;
