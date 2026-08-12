const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * Formatea un precio en pesos argentinos.
 * Devuelve "A convenir" cuando el precio es null (ej. plan Aventura Pro).
 */
export function formatARS(price: number | null | undefined): string {
  if (price == null) return "A convenir";
  return ARS.format(price);
}

/**
 * Formatea una duración en segundos como mm:ss (o hh:mm:ss si supera la hora).
 */
export function formatDuration(totalSec: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSec ?? 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}
