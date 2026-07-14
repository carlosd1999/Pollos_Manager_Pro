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

export const VENTA_PAGO_EPS = 1e-4;

/** Apartado aún sin pesar (peso y total en cero). */
export function ventaEsApartadoSinPesar(venta) {
  const peso = Number(venta?.peso_total ?? 0);
  const total = Number(venta?.total_venta ?? 0);
  return peso <= VENTA_PAGO_EPS && total <= VENTA_PAGO_EPS;
}

/** Venta/apartado pendiente de marcar como entregado al cliente. */
export function ventaPendienteEntrega(venta) {
  return !Boolean(venta?.entregado);
}

/** Saldo de cobro pendiente de la venta. */
export function saldoCobroVenta(venta, abonos) {
  const total = Number(venta?.total_venta || 0);
  const paid = effectivePaidVenta(venta, abonos);
  return Math.max(0, total - paid);
}

export function ventaConCobroPendiente(venta, abonos) {
  return saldoCobroVenta(venta, abonos) > VENTA_PAGO_EPS;
}

/**
 * Prioridad de orden en lista: 0 pendiente, 1 parcial (con abonos), 2 pagado.
 */
export function ventaPagoSortRank(venta, abonos) {
  const total = Number(venta?.total_venta || 0);
  const paid = effectivePaidVenta(venta, abonos);
  const saldo = Math.max(0, total - paid);
  const tieneAbonos = (abonos || []).some((a) => Number(a.venta_id) === Number(venta.id));

  if (total > VENTA_PAGO_EPS && saldo <= VENTA_PAGO_EPS) return 2;
  if (paid > VENTA_PAGO_EPS && saldo > VENTA_PAGO_EPS) return 1;
  if (tieneAbonos && saldo > VENTA_PAGO_EPS) return 1;
  return 0;
}

export function compareVentasPorEstadoPago(a, b, abonos) {
  const diff = ventaPagoSortRank(a, abonos) - ventaPagoSortRank(b, abonos);
  if (diff !== 0) return diff;
  const byFecha = String(b.fecha || '').localeCompare(String(a.fecha || ''));
  if (byFecha !== 0) return byFecha;
  return Number(b.id || 0) - Number(a.id || 0);
}

export function sortVentasPorEstadoPago(ventas, abonos) {
  return [...(ventas || [])].sort((a, b) => compareVentasPorEstadoPago(a, b, abonos));
}

/** Conteos operativos para dashboard y panel de ventas. */
export function resumenPendientesVentas(ventas, abonos) {
  const r = {
    sinPesar: 0,
    sinEntregar: 0,
    pollosSinEntregar: 0,
    cobroPendiente: 0,
    entregadas: 0,
  };
  for (const v of ventas || []) {
    if (ventaEsApartadoSinPesar(v)) r.sinPesar += Number(v.cantidad || 0);
    if (ventaPendienteEntrega(v)) {
      r.sinEntregar += Number(v.cantidad || 0);
      r.pollosSinEntregar += Number(v.cantidad || 0);
    } else {
      r.entregadas += Number(v.cantidad || 0);
    }
    if (ventaConCobroPendiente(v, abonos)) r.cobroPendiente += 1;
  }
  return r;
}

/** Abonos más recientes primero (fecha, luego id). */
export function sortAbonosNewestFirst(rows) {
  return [...(rows || [])].sort((a, b) => {
    const c = String(b.fecha || '').localeCompare(String(a.fecha || ''));
    if (c !== 0) return c;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

export function sumAbonoMontos(rows) {
  return (rows || []).reduce((s, a) => s + Number(a.monto || 0), 0);
}

/**
 * Cobro cuando no hay filas en `abonos`: solo ventas marcadas `venta_al_contado` (registro al contado
 * sin usar tabla abonos) usan `monto_cancelado` en estado pagado. El resto = 0 (crédito sin abonos o
 * se borraron todos los abonos).
 */
export function paidFromVentaRowWithoutAbonos(venta) {
  const total = Number(venta.total_venta || 0);
  const mc = Number(venta.monto_cancelado || 0);
  const sp = Number(venta.saldo_pendiente || 0);
  const estado = venta.estado_pago;
  const alContado = Boolean(venta.venta_al_contado);
  const legacyContadoCompleto =
    total > 0 &&
    estado === 'pagado' &&
    sp <= VENTA_PAGO_EPS &&
    mc >= total - VENTA_PAGO_EPS;
  if (alContado && legacyContadoCompleto) return Math.min(mc, total);
  return 0;
}

/**
 * Pagos efectivos: con filas en `abonos`, suma de abonos; sin filas, ver `paidFromVentaRowWithoutAbonos`.
 */
export function effectivePaidVenta(venta, abonosAll) {
  const total = Number(venta.total_venta || 0);
  const forV = (abonosAll || []).filter((a) => Number(a.venta_id) === Number(venta.id));
  if (forV.length > 0) {
    let s = forV.reduce((acc, a) => acc + Number(a.monto || 0), 0);
    if (total > 0 && s > total) s = total;
    return s;
  }
  return paidFromVentaRowWithoutAbonos(venta);
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

/** Pollos ya vendidos o dados de baja en un lote; la comprada no puede bajar de esta suma. */
export function pollosComprometidosPorLote(loteId, ventas, mortalidad) {
  const id = Number(loteId);
  const sold = (ventas || []).reduce(
    (acc, v) => acc + (Number(v.lote_id) === id ? Number(v.cantidad || 0) : 0),
    0,
  );
  const dead = (mortalidad || []).reduce(
    (acc, m) => acc + (Number(m.lote_id) === id ? Number(m.cantidad || 0) : 0),
    0,
  );
  return sold + dead;
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
