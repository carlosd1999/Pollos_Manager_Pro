/**
 * Sesión (full_name): pestaña «Apartado» por defecto al registrar venta.
 */
export const VENTA_DEFAULT_APARTADO_TAB_NAMES = ['Carmen', 'Carlos', 'Cherania'];

/**
 * Personas para filtrar la lista de clientes en el formulario de ventas
 * (coincidencia parcial en `cliente.nombre`, p. ej. texto entre paréntesis).
 */
export const VENTA_FILTRO_PERSONA_OPCIONES = ['Carmen', 'Carlos', 'Auxi', 'Ligia', 'Cherania'];

/**
 * Elige la opción de filtro según el nombre del usuario en sesión (user_metadata.full_name).
 */
export function defaultVentaClientePersonaFromFullName(fullName) {
  const raw = String(fullName ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return '';
  for (const p of VENTA_FILTRO_PERSONA_OPCIONES) {
    const pl = p.toLowerCase();
    if (raw.includes(pl)) return p;
  }
  const first = (raw.split(/\s+/)[0] || '').trim();
  if (!first) return '';
  for (const p of VENTA_FILTRO_PERSONA_OPCIONES) {
    const pl = p.toLowerCase();
    if (first === pl || first.startsWith(pl)) return p;
  }
  return '';
}

/** Pestaña inicial en «Registrar venta»: Apartado para Carmen / Carlos / Cherania (según nombre en sesión). */
export function defaultRegistrarVentaTabFromFullName(fullName) {
  const raw = String(fullName ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return 'venta';
  for (const p of VENTA_DEFAULT_APARTADO_TAB_NAMES) {
    if (raw.includes(p.toLowerCase())) return 'apartado';
  }
  const first = (raw.split(/\s+/)[0] || '').trim();
  if (!first) return 'venta';
  for (const p of VENTA_DEFAULT_APARTADO_TAB_NAMES) {
    const pl = p.toLowerCase();
    if (first === pl || first.startsWith(pl)) return 'apartado';
  }
  return 'venta';
}

