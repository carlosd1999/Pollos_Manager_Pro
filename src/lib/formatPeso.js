import { formatColones } from './formatCurrency';

export function formatKg(value, { decimals = 3 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} kg`;
}

export function formatPrecioKg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${formatColones(n)}/kg`;
}

export function formatPollos(value, { decimals = 1 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatGananciaDiaria(g) {
  const n = Number(g);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} g/día`;
}

export function formatDiasEnGalera(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n * 10) / 10;
  const decimals = Number.isInteger(rounded) ? 0 : 1;
  return `${rounded.toLocaleString('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} días`;
}
