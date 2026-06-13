/** Contador de peticiones HTTP a Supabase (PostgREST, storage, functions). */

let pending = 0;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(pending);
    } catch {
      /* ignore */
    }
  });
}

export function beginDbRequest() {
  pending += 1;
  emit();
}

export function endDbRequest() {
  pending = Math.max(0, pending - 1);
  emit();
}

export function subscribeDbPending(listener) {
  listeners.add(listener);
  listener(pending);
  return () => listeners.delete(listener);
}

/** No contar auth (getSession, refresh): evita parpadeos; sí REST, storage y functions. */
export function shouldTrackSupabaseFetch(input) {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : String(input?.url || '');
  if (!urlStr) return false;
  try {
    const { pathname } = new URL(urlStr);
    if (pathname.includes('/auth/v1/')) return false;
    return (
      pathname.includes('/rest/v1/') ||
      pathname.includes('/storage/v1/') ||
      pathname.includes('/functions/v1/')
    );
  } catch {
    return false;
  }
}
