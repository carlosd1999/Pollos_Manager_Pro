/**
 * Errores que Supabase añade al volver del enlace del correo (invitación, recovery, etc.)
 * en el fragment (#) o, en algunos flujos, en la query (?).
 */

function safeDecode(s) {
  if (!s) return '';
  try {
    return decodeURIComponent(String(s).replace(/\+/g, ' '));
  } catch {
    return String(s);
  }
}

function collectParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const merged = new URLSearchParams();
  for (const [k, v] of searchParams) merged.set(k, v);
  for (const [k, v] of hashParams) merged.set(k, v);
  return merged;
}

/**
 * @returns {{ error: string, error_code: string, error_description: string } | null}
 */
export function readSupabaseAuthLinkError() {
  const p = collectParams();
  const error = p.get('error') || '';
  const error_code = p.get('error_code') || '';
  const error_description = safeDecode(p.get('error_description') || '');
  if (!error && !error_code) return null;
  return { error, error_code, error_description };
}

/**
 * Mensaje claro según el error real (evita confundir redirect no permitido con “enlace usado”).
 */
export function formatAuthLinkErrorMessage({ error, error_code, error_description }) {
  const bundle = `${error} ${error_code} ${error_description}`.toLowerCase();

  if (
    /redirect_uri|redirect uri|callback url|url configuration|not\s+allowed|site\s+url|invalid\s+redirect/i.test(
      bundle,
    )
  ) {
    return (
      'El enlace falló por la URL de retorno: en Supabase ve a Authentication → URL configuration y añade la URL exacta ' +
      'donde abres la app en «Redirect URLs» (por ejemplo http://localhost:5173 y la barra final si la usas en la invitación). ' +
      'Guarda cambios y pide una nueva invitación.'
    );
  }

  const expiredOrConsumed =
    error_code === 'otp_expired' ||
    error_code === 'otp_disabled' ||
    error === 'invalid_grant' ||
    /expired|already been used|already used|one-time|has expired|invalid or has expired|invalid or expired|no longer valid|ya no es válido|caduc|invalid_grant/i.test(
      `${error_description} ${error}`.trim(),
    );

  if (expiredOrConsumed) {
    return (
      'Este enlace ya no sirve: caducó, solo se puede usar una vez, o a veces el antivirus / vista previa del correo lo abre antes que tú y lo invalida. ' +
      'Si usas Gmail u Outlook corporativo, prueba «Abrir en el navegador» o una ventana de incógnito, o pide al administrador que reenvíe la invitación. ' +
      'Si acabas de usarlo bien y falla, revisa también que la Redirect URL en Supabase coincida con tu app (p. ej. http://localhost:5173/).'
    );
  }

  const tail = error_description ? ` Detalle técnico: ${error_description}` : '';
  return `No se pudo completar el acceso desde el enlace del correo (${error_code || error || 'error'}).${tail} Pide una nueva invitación o revisa la configuración en Supabase.`;
}

/** Quita error/error_code/error_description del hash y de la query para no repetir el aviso al recargar. */
export function stripSupabaseAuthErrorFromUrl() {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  ['error', 'error_code', 'error_description'].forEach((k) => u.searchParams.delete(k));

  const hp = new URLSearchParams(u.hash.replace(/^#/, ''));
  ['error', 'error_code', 'error_description'].forEach((k) => hp.delete(k));

  /**
   * Si ya no quedan tokens de sesión en el fragmento, lo vaciamos del todo.
   * Así evitamos residuos raros en la barra (p. ej. #sb=) cuando el error_description
   * venía mal partido y URLSearchParams interpretó claves basura.
   */
  const hasImplicitSession = hp.has('access_token') && hp.has('refresh_token');
  if (!hasImplicitSession) {
    u.hash = '';
  } else {
    const rest = hp.toString();
    u.hash = rest ? `#${rest}` : '';
  }

  window.history.replaceState(null, '', `${u.pathname}${u.search}${u.hash}`);
}
