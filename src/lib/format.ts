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
