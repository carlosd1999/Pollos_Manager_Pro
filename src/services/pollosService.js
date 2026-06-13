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
 * Recalcula monto_cancelado, saldo_pendiente y estado_pago a partir de abonos
 * (si no hay abonos, mantiene lógica por monto_cancelado en venta).
 */
export async function recalculateVentaEstado(ventaId) {
  const { data: venta, error: e1 } = await supabase.from('ventas').select('*').eq('id', ventaId).single();
  if (e1 || !venta) return { error: e1 || new Error('Venta no encontrada') };
  const { data: abRows } = await supabase.from('abonos').select('monto').eq('venta_id', ventaId);
  const list = abRows || [];
  const sumAb = list.reduce((s, a) => s + Number(a.monto || 0), 0);
  const total = Number(venta.total_venta || 0);
  let paid = list.length > 0 ? sumAb : Number(venta.monto_cancelado || 0);
  if (paid > total) paid = total;
  const saldo = Math.max(0, total - paid);
  let estado = 'pendiente';
  if (total > 0 && saldo <= 0.0001) estado = 'pagado';
  else if (paid > 0 && saldo > 0.0001) estado = 'parcial';
  return supabase
    .from('ventas')
    .update({
      monto_cancelado: paid,
      saldo_pendiente: saldo,
      estado_pago: estado,
    })
    .eq('id', ventaId);
}
