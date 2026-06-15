export const EXPENSE_CATEGORY_PURCHASE = 'Compra de Pollos';

/**
 * Ciclo "actual" = entre los marcados como activos, el de mayor `numero`
 * (evita tomar un ciclo viejo si hubiera más de un activo por error).
 */
export function computeCurrentCycle(cycles) {
  if (!cycles?.length) return null;
  const active = cycles.filter((c) => c.estado === 'activo');
  if (active.length === 0) return null;
  return active.reduce((best, c) =>
    (Number(c.numero) || 0) >= (Number(best.numero) || 0) ? c : best,
  );
}

/** Siguiente número de ciclo según los existentes (no solo el conteo de filas). */
export function nextCicloNumero(ciclos) {
  if (!ciclos?.length) return 1;
  return Math.max(...ciclos.map((c) => Number(c.numero) || 0)) + 1;
}

/**
 * Pagos efectivos: si hay filas en abonos, la suma de abonos; si no, monto_cancelado en venta (ventas antiguas o pago al contado sin abono).
 */
export function effectivePaidVenta(venta, abonosAll) {
  const forV = (abonosAll || []).filter((a) => Number(a.venta_id) === Number(venta.id));
  if (forV.length > 0) {
    return forV.reduce((s, a) => s + Number(a.monto || 0), 0);
  }
  return Number(venta.monto_cancelado || 0);
}

/** Siguiente número de lote dentro del ciclo (según max numero_lote, no solo cantidad de filas). */
export function nextLoteNumber(lotes, cicloId) {
  const inCiclo = (lotes || []).filter((lote) => lote.ciclo_id === cicloId);
  if (inCiclo.length === 0) return 1;
  const maxNum = Math.max(...inCiclo.map((l) => Number(l.numero_lote) || 0));
  return maxNum + 1;
}

/** Lotes de más antiguo a más reciente: `numero_lote` y desempate por `fecha_ingreso`. */
export function compareLotesOldestFirst(a, b) {
  const n = Number(a.numero_lote) - Number(b.numero_lote);
  if (n !== 0) return n;
  return String(a.fecha_ingreso || '').localeCompare(String(b.fecha_ingreso || ''));
}

export function sortLotesOldestFirst(lotes) {
  return [...(lotes || [])].sort(compareLotesOldestFirst);
}

export function calculateAvailableByLote(lotes, mortalidad, ventas) {
  const soldByLote = ventas.reduce((acc, venta) => {
    acc[venta.lote_id] = (acc[venta.lote_id] || 0) + Number(venta.cantidad || 0);
    return acc;
  }, {});
  const deadByLote = mortalidad.reduce((acc, baja) => {
    acc[baja.lote_id] = (acc[baja.lote_id] || 0) + Number(baja.cantidad || 0);
    return acc;
  }, {});
  return sortLotesOldestFirst(
    (lotes || []).map((lote) => ({
      ...lote,
      disponibles:
        Number(lote.cantidad_comprada || 0) - (soldByLote[lote.id] || 0) - (deadByLote[lote.id] || 0),
    })),
  );
}

export function calculateGlobalStats({ ciclos, lotes, gastos, ventas, mortalidad }) {
  const totalGastos = gastos.reduce((acc, item) => acc + Number(item.monto || 0), 0);
  const totalVentas = ventas.reduce((acc, item) => acc + Number(item.total_venta || 0), 0);
  const totalComprados = lotes.reduce((acc, lote) => acc + Number(lote.cantidad_comprada || 0), 0);
  const totalVendidos = ventas.reduce((acc, venta) => acc + Number(venta.cantidad || 0), 0);
  const totalMuertos = mortalidad.reduce((acc, baja) => acc + Number(baja.cantidad || 0), 0);
  const totalUtilidad = totalVentas - totalGastos;
  const ciclosCount = Math.max(ciclos.length, 1);
  const lotesCount = Math.max(lotes.length, 1);
  return {
    rentabilidad: totalGastos ? (totalUtilidad / totalGastos) * 100 : 0,
    totalUtilidad,
    promedioGananciaCiclo: totalUtilidad / ciclosCount,
    promedioGananciaLote: totalUtilidad / lotesCount,
    totalGastos,
    promedioGastoCiclo: totalGastos / ciclosCount,
    promedioGastoLote: totalGastos / lotesCount,
    totalComprados,
    totalVendidos,
    totalMuertos,
    mortalidadGeneral: totalComprados ? (totalMuertos / totalComprados) * 100 : 0,
  };
}
