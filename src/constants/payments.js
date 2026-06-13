/** Valores guardados en BD (ventas.metodo_pago, abonos.metodo_pago). */
export const VENTA_PAYMENT_METHOD_VALUES = ['efectivo', 'transferencia', 'sinpe'];

export const VENTA_PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Seleccione…' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'sinpe', label: 'SINPE móvil' },
];

export function isValidVentaPaymentMethod(value) {
  return VENTA_PAYMENT_METHOD_VALUES.includes(value);
}

export function labelMetodoPago(value) {
  if (!value) return '—';
  const row = VENTA_PAYMENT_METHOD_OPTIONS.find((o) => o.value === value);
  return row?.label || value;
}
