import { REPARTO_BUCKET_GASTOS, SOCIAS_REPARTO_TERCIO_COUNT } from '../constants/sociasReparto';

export function sumVentasLotePorClienteId(ventas, loteId, clienteId) {
  const lid = Number(loteId);
  const cid = Number(clienteId);
  if (!Number.isFinite(lid) || !Number.isFinite(cid)) return 0;
  return (ventas || [])
    .filter((v) => Number(v.lote_id) === lid && Number(v.cliente_id) === cid && v.estado_pago === 'pagado')
    .reduce((s, v) => s + Number(v.total_venta || 0), 0);
}

function normNombreReparto(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

/** Encuentra `clientes.id` si el nombre coincide con el de la socia (para rebajar sus compras en el lote). */
export function clienteIdPorNombreSocio(clientes, nombreSocio) {
  const target = normNombreReparto(nombreSocio);
  if (!target) return null;
  const hit = (clientes || []).find((c) => normNombreReparto(c.nombre) === target);
  return hit != null ? hit.id : null;
}

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

/** Suma pendiente de los 4 buckets (gastos + 3 socios). `rebajasSocio`: monto a descontar del tercio por compras registradas como venta a ese cliente en el lote. */
export function totalPendienteRepartoLote({
  totalVentasLote,
  gastosObjetivo,
  pagos,
  loteId,
  rebajasSocio = {},
}) {
  const gObj = Math.max(0, Number(gastosObjetivo || 0));
  const net = netRepartoDespuesGastos(totalVentasLote, gastosObjetivo);
  const tercio = net / SOCIAS_REPARTO_TERCIO_COUNT;
  const pG = sumRepartoPagosLoteBucket(pagos, loteId, REPARTO_BUCKET_GASTOS);
  let sum = pendienteBucket({ objetivo: gObj, pagado: pG });
  const socios = ['carmen', 'cherania', 'carlos'];
  for (const b of socios) {
    const reb = Math.max(0, Number(rebajasSocio[b] || 0));
    const obj = Math.max(0, tercio - reb);
    sum += pendienteBucket({ objetivo: obj, pagado: sumRepartoPagosLoteBucket(pagos, loteId, b) });
  }
  return sum;
}
