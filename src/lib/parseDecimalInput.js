/**
 * Normaliza texto numérico con decimales para `Number()` (teclados iOS que usan coma, NBSP, separadores árabes, etc.).
 * @returns {string} cadena con punto decimal o '' si vacío; no valida rango.
 */
export function normalizeDecimalString(value) {
  if (value === '' || value == null) return '';
  let s = String(value).trim();
  // Espacios de agrupación (NBSP, thin space)
  s = s.replace(/[\s\u00A0\u202F]/g, '');
  // Separadores decimales habituales en móviles → '.'
  // U+066B ٫ (Arabic decimal separator) y coma ASCII / Unicode
  s = s.replace(/[,٫]/g, '.');
  // Más de un punto: tratar miles tipo 1.234,56 ya convertido a 1.234.56 → dejar solo el último como decimal
  if ((s.match(/\./g) || []).length > 1) {
    const last = s.lastIndexOf('.');
    s = s.slice(0, last).replace(/\./g, '') + s.slice(last);
  }
  return s;
}

/** Igual que normalizeDecimalString; alias para lectura en validadores. */
export function parseDecimalInput(value) {
  return normalizeDecimalString(value);
}

/** `Number()` seguro para montos / decimales desde inputs (coma decimal iOS, etc.). */
export function parseDecimalNumber(value) {
  const s = normalizeDecimalString(value);
  if (s === '' || s === '.' || s === '-' || s === '-.') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
