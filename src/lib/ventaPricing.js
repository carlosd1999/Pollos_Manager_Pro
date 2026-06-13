/** Total de venta en colones: siempre hacia abajo a múltiplo de 25 (…25, 50, 75, 00). */
export function floorTotalVentaColones(amount) {
  const n = Math.floor(Number(amount) || 0);
  return Math.max(0, Math.floor(n / 25) * 25);
}

/** Precio por kg en UI (hasta 4 decimales, sin ceros de más). */
export function formatPrecioKgForForm(precioKg) {
  const n = Number(precioKg);
  if (!Number.isFinite(n) || n <= 0) return '';
  const r = Math.round(n * 10000) / 10000;
  return String(r);
}

/**
 * A partir de peso total y precio/kg ingresados: total redondeado y precio/kg coherente.
 */
export function roundedVentaTotalAndPrecioKg(pesoTotal, precioKgInput) {
  const pt = Number(pesoTotal);
  const pk = Number(precioKgInput);
  if (!(pt > 0) || !(pk > 0)) {
    return { totalVenta: 0, precioKg: pk };
  }
  const raw = pt * pk;
  const totalVenta = floorTotalVentaColones(raw);
  const precioKg = totalVenta / pt;
  return { totalVenta, precioKg };
}
