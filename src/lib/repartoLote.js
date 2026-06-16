import { REPARTO_BUCKET_GASTOS, SOCIAS_REPARTO_TERCIO_COUNT } from '../constants/sociasReparto';

export function sumRepartoPagosLoteBucket(pagos, loteId, bucket) {
  const lid = Number(loteId);
  return (pagos || [])
    .filter((p) => Number(p.lote_id) === lid && String(p.bucket) === String(bucket))
    .reduce((s, p) => s + Number(p.monto || 0), 0);
}

export function netRepartoDespuesGastos(totalVentasLote, gastosObjetivo) {
  const t = Number(totalVentasLote || 0);
  const g = Math.max(0, Number(gastosObjetivo || 0));
  return Math.max(0, t - g);
}

export function tercioReparto(totalVentasLote, gastosObjetivo) {
  return netRepartoDespuesGastos(totalVentasLote, gastosObjetivo) / SOCIAS_REPARTO_TERCIO_COUNT;
}

export function pendienteBucket({ objetivo, pagado }) {
  return Math.max(0, Number(objetivo || 0) - Number(pagado || 0));
}

/** Suma pendiente de los 4 buckets (gastos + 3 socios) respecto a objetivos actuales. */
export function totalPendienteRepartoLote({ totalVentasLote, gastosObjetivo, pagos, loteId }) {
  const gObj = Math.max(0, Number(gastosObjetivo || 0));
  const net = netRepartoDespuesGastos(totalVentasLote, gastosObjetivo);
  const tercio = net / SOCIAS_REPARTO_TERCIO_COUNT;
  const pG = sumRepartoPagosLoteBucket(pagos, loteId, REPARTO_BUCKET_GASTOS);
  let sum = pendienteBucket({ objetivo: gObj, pagado: pG });
  const socios = ['carmen', 'cherania', 'carlos'];
  for (const b of socios) {
    sum += pendienteBucket({ objetivo: tercio, pagado: sumRepartoPagosLoteBucket(pagos, loteId, b) });
  }
  return sum;
}
