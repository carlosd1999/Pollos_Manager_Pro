import { EXPENSE_CATEGORY_PURCHASE } from '../lib/business';
import { isValidVentaPaymentMethod } from '../constants/payments';

export function validateGasto(gasto, options = {}) {
  const { skipCiclo } = options;
  const errors = {};
  const parsedAmount = Number(gasto.monto);
  if (!parsedAmount || parsedAmount <= 0) errors['gasto.monto'] = 'El monto debe ser mayor a cero';
  if (!skipCiclo && (gasto.ciclo_id === '' || gasto.ciclo_id === undefined || gasto.ciclo_id === null)) {
    errors['gasto.ciclo_id'] = 'Selecciona un ciclo';
  }
  if (gasto.categoria === EXPENSE_CATEGORY_PURCHASE) {
    const cantidadComprada = Number(gasto.cantidad_pollos);
    if (!cantidadComprada || cantidadComprada <= 0) errors['gasto.cantidad_pollos'] = 'Debes ingresar la cantidad de pollos';
  }
  return { errors, parsedAmount };
}

export function validateVenta(venta, lote, options = {}) {
  const { editingVenta } = options;
  const errors = {};
  if (!venta.cliente_id) errors['venta.cliente_id'] = 'Selecciona un cliente';
  if (!lote) errors['venta.lote_id'] = 'Selecciona un lote valido';
  const cantidad = Number(venta.cantidad);
  const pesoTotal = Number(venta.peso_total || 0);
  const precioKg = Number(venta.precio_kg || 0);
  if (!cantidad || cantidad <= 0) errors['venta.cantidad'] = 'La cantidad debe ser mayor a cero';
  let cupo = lote ? Number(lote.disponibles) : 0;
  if (
    lote &&
    editingVenta &&
    Number(editingVenta.lote_id) === Number(lote.id)
  ) {
    cupo += Number(editingVenta.cantidad || 0);
  }
  if (lote && cantidad > cupo) errors['venta.cantidad'] = 'No puedes vender mas de los disponibles';
  if (!pesoTotal || pesoTotal <= 0) errors['venta.peso_total'] = 'El peso total debe ser mayor a cero';
  if (!precioKg || precioKg <= 0) errors['venta.precio_kg'] = 'El precio por kg debe ser mayor a cero';
  return { errors, cantidad, pesoTotal, precioKg };
}

export function validateMortalidad(mortalidad) {
  const errors = {};
  if (!mortalidad.lote_id) errors['mortalidad.lote_id'] = 'Debes seleccionar un lote';
  const cantidad = Number(mortalidad.cantidad);
  if (!cantidad || cantidad <= 0) errors['mortalidad.cantidad'] = 'La cantidad debe ser mayor a cero';
  return { errors, cantidad };
}

export function validateCliente(cliente) {
  const errors = {};
  if (!cliente.nombre.trim()) errors['cliente.nombre'] = 'Debes ingresar el nombre del cliente';
  return { errors };
}

/** Valida abono inicial al crear venta a crédito (opcional). */
export function validatePrimerAbono(primerStr, totalVenta, pagoCompleto) {
  if (pagoCompleto) return { errors: {}, primer: 0 };
  if (primerStr === '' || primerStr === undefined || primerStr === null) return { errors: {}, primer: 0 };
  const errors = {};
  const primer = Number(primerStr);
  if (!primer || primer <= 0) errors['venta.primerAbono'] = 'El abono inicial debe ser mayor a cero';
  if (primer > totalVenta) errors['venta.primerAbono'] = 'El abono no puede superar el total de la venta';
  return { errors, primer: errors['venta.primerAbono'] ? 0 : primer };
}

/** Obligatorio si pago al contado o si hay abono inicial. */
export function validateVentaMetodoPago(venta, primer) {
  const errors = {};
  const need = Boolean(venta.pagoCompleto || primer > 0);
  if (need && !isValidVentaPaymentMethod(venta.metodo_pago)) {
    errors['venta.metodo_pago'] = 'Selecciona la forma de pago';
  }
  return errors;
}

export function validateAbonoForm({ fecha, monto, metodo_pago }) {
  const errors = {};
  if (!fecha) errors['abono.fecha'] = 'Indica la fecha';
  const amt = Number(monto);
  if (!amt || amt <= 0) errors['abono.monto'] = 'El monto debe ser mayor a cero';
  if (!isValidVentaPaymentMethod(metodo_pago)) {
    errors['abono.metodo_pago'] = 'Selecciona la forma de pago';
  }
  return { errors, monto: amt };
}
