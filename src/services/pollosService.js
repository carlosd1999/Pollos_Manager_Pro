import {
  paidFromVentaRowWithoutAbonos,
  sortAbonosNewestFirst,
  sumAbonoMontos,
  VENTA_PAGO_EPS,
} from '../lib/business';
import { supabase } from '../lib/supabase';

export async function fetchTable(table) {
  return supabase.from(table).select('*').order('id', { ascending: false });
}

export async function createCiclo(payload) {
  return supabase.from('ciclos').insert(payload).select().single();
}

export async function closeCiclo(cicloId, payload) {
  return supabase.from('ciclos').update(payload).eq('id', cicloId);
}

export async function createLote(payload) {
  return supabase.from('lotes').insert(payload).select().single();
}

export async function updateLote(id, payload) {
  return supabase.from('lotes').update(payload).eq('id', id);
}

export async function createGasto(payload) {
  return supabase.from('gastos').insert(payload);
}

export async function createVenta(payload) {
  return supabase.from('ventas').insert(payload).select().single();
}

export async function createMortalidad(payload) {
  return supabase.from('mortalidad').insert(payload);
}

export async function createCliente(payload) {
  return supabase.from('clientes').insert(payload);
}

export async function updateGasto(id, payload) {
  return supabase.from('gastos').update(payload).eq('id', id);
}

export async function deleteLote(id) {
  return supabase.from('lotes').delete().eq('id', id);
}

export async function deleteGasto(id) {
  return supabase.from('gastos').delete().eq('id', id);
}

export async function updateVenta(id, payload) {
  return supabase.from('ventas').update(payload).eq('id', id);
}

export async function deleteVenta(id) {
  return supabase.from('ventas').delete().eq('id', id);
}

export async function updateMortalidad(id, payload) {
  return supabase.from('mortalidad').update(payload).eq('id', id);
}

export async function deleteMortalidad(id) {
  return supabase.from('mortalidad').delete().eq('id', id);
}

export async function updateCliente(id, payload) {
  return supabase.from('clientes').update(payload).eq('id', id);
}

export async function deleteCliente(id) {
  return supabase.from('clientes').delete().eq('id', id);
}

export async function createAbono(payload) {
  return supabase.from('abonos').insert(payload).select().single();
}

export async function updateAbono(id, payload) {
  return supabase.from('abonos').update(payload).eq('id', id);
}

export async function deleteAbono(id) {
  return supabase.from('abonos').delete().eq('id', id);
}

/**
 * Recalcula monto_cancelado, saldo_pendiente, estado_pago y `metodo_pago` de la venta (último abono).
 */
export async function recalculateVentaEstado(ventaId) {
  const { data: venta, error: e1 } = await supabase.from('ventas').select('*').eq('id', ventaId).single();
  if (e1 || !venta) return { error: e1 || new Error('Venta no encontrada') };
  const { data: abRows, error: e2 } = await supabase
    .from('abonos')
    .select('id, fecha, monto, metodo_pago')
    .eq('venta_id', ventaId);
  if (e2) return { error: e2 };
  const list = abRows || [];
  const sorted = sortAbonosNewestFirst(list);
  const total = Number(venta.total_venta || 0);
  const sumAb = sumAbonoMontos(list);
  let paid = list.length > 0 ? sumAb : paidFromVentaRowWithoutAbonos(venta);
  if (paid > total) paid = total;
  const saldo = Math.max(0, total - paid);
  let estado = 'pendiente';
  if (total > 0 && saldo <= VENTA_PAGO_EPS) estado = 'pagado';
  else if (paid > VENTA_PAGO_EPS && saldo > VENTA_PAGO_EPS) estado = 'parcial';

  const updatePayload = {
    monto_cancelado: paid,
    saldo_pendiente: saldo,
    estado_pago: estado,
  };
  if (sorted.length > 0) {
    const last = sorted[0];
    if (last?.metodo_pago && String(last.metodo_pago).trim()) {
      updatePayload.metodo_pago = last.metodo_pago;
    }
  } else if (!venta.venta_al_contado) {
    updatePayload.metodo_pago = null;
  }

  return supabase.from('ventas').update(updatePayload).eq('id', ventaId);
}

export async function createLoteRepartoPago(payload) {
  return supabase.from('lote_reparto_pagos').insert(payload).select().single();
}

export async function deleteLastLoteRepartoPago(loteId, bucket) {
  const { data: rows, error } = await supabase
    .from('lote_reparto_pagos')
    .select('id')
    .eq('lote_id', loteId)
    .eq('bucket', bucket)
    .order('id', { ascending: false })
    .limit(1);
  if (error) return { error };
  if (!rows?.length) return { error: null };
  return supabase.from('lote_reparto_pagos').delete().eq('id', rows[0].id);
}
