/** Gastos a descontar del pool del lote (objetivo manual). */
export const REPARTO_BUCKET_GASTOS = 'gastos';

/**
 * Filas de socias: bucket en BD + nombre para UI (tercios iguales).
 * La rebaja del tercio usa ventas del lote al cliente cuyo `nombre` coincide (normalizado, sin tildes).
 */
export const REPARTO_SOCIO_FILAS = [
  { bucket: 'carmen', nombre: 'Carmen Lopez' },
  { bucket: 'cherania', nombre: 'Cherania Granados' },
  { bucket: 'carlos', nombre: 'Carlos Martínez' },
];

export const SOCIAS_REPARTO_TERCIO_NOMBRES = REPARTO_SOCIO_FILAS.map((r) => r.nombre);

export const SOCIAS_REPARTO_TERCIO_COUNT = REPARTO_SOCIO_FILAS.length;

export const REPARTO_BUCKETS_VALIDOS = [REPARTO_BUCKET_GASTOS, ...REPARTO_SOCIO_FILAS.map((r) => r.bucket)];

/** Socia que cubre los gastos del negocio; su recuperación se muestra en reportes. */
export const REPARTO_SOCIO_INVERSION_BUCKET = 'carlos';

export const REPARTO_SOCIO_INVERSION_NOMBRE =
  REPARTO_SOCIO_FILAS.find((r) => r.bucket === REPARTO_SOCIO_INVERSION_BUCKET)?.nombre || 'Carlos Martínez';

export function labelRepartoBucket(bucket) {
  if (bucket === REPARTO_BUCKET_GASTOS) return 'Gastos a descontar';
  const r = REPARTO_SOCIO_FILAS.find((x) => x.bucket === bucket);
  return r?.nombre || bucket;
}
