import { createClient } from '@supabase/supabase-js';
import { beginDbRequest, endDbRequest, shouldTrackSupabaseFetch } from './dbLoadingBus';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const rawFetch = typeof fetch !== 'undefined' ? fetch.bind(globalThis) : fetch;

function trackedFetch(input, init) {
  const track = shouldTrackSupabaseFetch(input);
  if (track) beginDbRequest();
  return rawFetch(input, init).finally(() => {
    if (track) endDbRequest();
  });
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: trackedFetch } })
    : null;

export const hasSupabaseConfig = Boolean(supabase);
