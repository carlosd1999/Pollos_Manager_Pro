/**
 * Si la URL trae tokens de invitación (#type=invite) y ya hay otra sesión (p. ej. admin),
 * Supabase a veces no sustituye la sesión sola. Cerramos sesión local y aplicamos los tokens del hash.
 */
function decodeJwtSub(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const json = JSON.parse(atob(b64));
    return typeof json.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 */
export async function applyInviteFromHash(client) {
  if (typeof window === 'undefined' || !client) return;

  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;

  const p = new URLSearchParams(raw);
  if (p.get('type') !== 'invite') return;

  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const incomingSub = decodeJwtSub(access_token);
  if (!incomingSub) return;

  const {
    data: { session: cur },
  } = await client.auth.getSession();

  if (cur?.user?.id === incomingSub) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    return;
  }

  await client.auth.signOut({ scope: 'local' });
  const { error } = await client.auth.setSession({ access_token, refresh_token });
  if (!error) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}
