/**
 * Sesión (full_name): pestaña «Apartado» por defecto al registrar venta.
 */
export const VENTA_DEFAULT_APARTADO_TAB_NAMES = ['Carmen', 'Carlos', 'Cherania'];

/**
 * Personas para filtrar la lista de clientes en el formulario de ventas
 * (coincidencia parcial en `cliente.nombre`, p. ej. texto entre paréntesis).
 */
export const VENTA_FILTRO_PERSONA_OPCIONES = ['Carmen', 'Carlos', 'Auxi', 'Ligia', 'Cherania'];

/** Arma el nombre guardado: `Karla` + `Ligia` → `Karla (Ligia)`. */
export function buildClienteNombreConPersona(nombreBase, persona) {
  const base = String(nombreBase ?? '').trim();
  const p = String(persona ?? '').trim();
  if (!base) return '';
  if (!p) return base;
  return `${base} (${p})`;
}

/** Separa `Karla (Ligia)` en nombre base y persona conocida. */
export function parseClienteNombreConPersona(nombre) {
  const raw = String(nombre ?? '').trim();
  if (!raw) return { nombreBase: '', persona: '' };
  const match = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { nombreBase: raw, persona: '' };
  const base = match[1].trim();
  const tag = match[2].trim();
  const personaHit = VENTA_FILTRO_PERSONA_OPCIONES.find((p) => p.toLowerCase() === tag.toLowerCase());
  if (personaHit) return { nombreBase: base, persona: personaHit };
  return { nombreBase: raw, persona: '' };
}

export function clienteCoincideFiltroTexto(nombre, texto) {
  const q = String(texto ?? '').trim().toLowerCase();
  if (!q) return true;
  return String(nombre ?? '').toLowerCase().includes(q);
}

export function clienteCoincideFiltroPersona(nombre, personaFiltro) {
  const p = String(personaFiltro ?? '').trim().toLowerCase();
  if (!p) return true;
  return String(nombre ?? '').toLowerCase().includes(p);
}

export function filtrarClientes(clientes, { texto = '', persona = '' } = {}) {
  return (clientes || []).filter(
    (c) => clienteCoincideFiltroTexto(c.nombre, texto) && clienteCoincideFiltroPersona(c.nombre, persona),
  );
}

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
export function defaultRegistrarVentaTabFromFullName(fullName, isAdmin) {
  const raw = String(fullName ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return 'venta';
  if (isAdmin) return 'venta';
  for (const p of VENTA_DEFAULT_APARTADO_TAB_NAMES) {
    if (raw.includes(p.toLowerCase())) return 'apartado';
  }
  const first = (raw.split(/\s+/)[0] || '').trim();
  if (!first) return 'venta';
  if (isAdmin) return 'venta';
  for (const p of VENTA_DEFAULT_APARTADO_TAB_NAMES) {
    const pl = p.toLowerCase();
    if (first === pl || first.startsWith(pl)) return 'apartado';
  }
  return 'venta';
}

