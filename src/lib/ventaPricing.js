/** Total de venta en colones: piso a entero ₡ (tras fijar el producto a 2 decimales por float), luego a múltiplo de 25 hacia abajo. */
export function floorTotalVentaColones(amount) {
  const a = Number(amount) || 0;
  // pt * precio_ajustado suele quedar 9374.999…; redondear a céntimos evita bajar de más al piso de 25.
  const colonesTwoDec = Math.round(a * 100) / 100;
  const n = Math.floor(colonesTwoDec);
  return Math.max(0, Math.floor(n / 25) * 25);
}

/** Precio por kg en el formulario: bastantes decimales para que peso×precio no pierda ₡ al recalcular; se recortan ceros finales. */
export function formatPrecioKgForForm(precioKg) {
  const n = Number(precioKg);
  if (!Number.isFinite(n) || n <= 0) return '';
  const r = Math.round(n * 1e8) / 1e8;
  let s = r.toFixed(8);
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  return s;
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
