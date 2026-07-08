/** Mensajes claros cuando falta ejecutar una migración SQL en Supabase. */
export function friendlySupabaseError(message) {
  const msg = String(message || '');
  if (msg.includes('preferencia_pollo')) {
    return 'Falta la columna preferencia_pollo en clientes. Ejecutá supabase-cliente-preferencia-venta-entregado.sql en Supabase.';
  }
  if (msg.includes("'entregado'") || msg.includes('entregado')) {
    return 'Falta la columna entregado en ventas. Ejecutá supabase-cliente-preferencia-venta-entregado.sql en Supabase.';
  }
  return msg;
}
