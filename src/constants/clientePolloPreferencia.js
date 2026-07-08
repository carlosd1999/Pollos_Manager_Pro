export const CLIENTE_POLLO_PREFERENCIA = {
  GRANDE: 'grande',
  MEDIANO: 'mediano',
  PEQUENO: 'pequeno',
};

export const CLIENTE_POLLO_PREFERENCIA_VALUES = [
  CLIENTE_POLLO_PREFERENCIA.GRANDE,
  CLIENTE_POLLO_PREFERENCIA.MEDIANO,
  CLIENTE_POLLO_PREFERENCIA.PEQUENO,
];

export const CLIENTE_POLLO_PREFERENCIA_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: CLIENTE_POLLO_PREFERENCIA.GRANDE, label: 'Grandes (+2,5 kg)' },
  { value: CLIENTE_POLLO_PREFERENCIA.MEDIANO, label: 'Medianos (2,2 – 2,5 kg)' },
  { value: CLIENTE_POLLO_PREFERENCIA.PEQUENO, label: 'Pequeños (-2,2 kg)' },
];

export function labelPreferenciaPollo(value) {
  const hit = CLIENTE_POLLO_PREFERENCIA_OPTIONS.find((o) => o.value === value);
  return hit?.label || '—';
}

/** Etiqueta corta para tablas. */
export function labelPreferenciaPolloCorto(value) {
  switch (value) {
    case CLIENTE_POLLO_PREFERENCIA.GRANDE:
      return 'Grande +2,5';
    case CLIENTE_POLLO_PREFERENCIA.MEDIANO:
      return 'Mediano 2,2–2,5';
    case CLIENTE_POLLO_PREFERENCIA.PEQUENO:
      return 'Pequeño -2,2';
    default:
      return '';
  }
}

export function isValidPreferenciaPollo(value) {
  return value === '' || value == null || CLIENTE_POLLO_PREFERENCIA_VALUES.includes(value);
}

/** Clasifica peso promedio por pollo (kg) según rangos del negocio. */
export function clasificarTamanoPolloPorKg(kgPromedio) {
  const kg = Number(kgPromedio);
  if (!Number.isFinite(kg) || kg <= 0) return null;
  if (kg > 2.5) return CLIENTE_POLLO_PREFERENCIA.GRANDE;
  if (kg >= 2.2) return CLIENTE_POLLO_PREFERENCIA.MEDIANO;
  return CLIENTE_POLLO_PREFERENCIA.PEQUENO;
}

export function pesoPromedioPorPolloVenta(venta) {
  const cantidad = Number(venta?.cantidad || 0);
  const peso = Number(venta?.peso_total || 0);
  if (cantidad <= 0 || peso <= 0) return null;
  return peso / cantidad;
}
