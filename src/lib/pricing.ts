/**
 * Precio efectivo de una suscripción en ARS.
 * - Si hay precio personalizado (custom_price), gana ese.
 * - Si no, se usa el precio del plan.
 * - Devuelve null si ninguno está definido (ej. plan "a convenir" sin precio custom).
 *
 * Único lugar donde se resuelve el precio: usar en todas las vistas.
 */
export function effectivePriceARS(
  customPrice: number | null | undefined,
  planPrice: number | null | undefined
): number | null {
  if (customPrice != null) return customPrice;
  return planPrice ?? null;
}
