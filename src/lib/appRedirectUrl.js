/**
 * URL absoluta de la app para `redirectTo` / `redirect_to` en Supabase (invitación, recovery, etc.).
 * En GitHub Pages con subcarpeta, `import.meta.env.BASE_URL` es p. ej. `/Pollos_Manager_Pro/`;
 * no basta con `window.location.origin + '/'`.
 */
export function getSupabaseRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  const base = import.meta.env.BASE_URL || '/';
  return new URL(base, window.location.origin).href;
}
