import { supabase } from '../lib/supabase';
import { PERMISSION_MODULE_KEYS } from '../constants/auth';

/** @param {string} userId auth.users.id */
export async function fetchMyModuleAccessForUser(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  return supabase.from('user_module_access').select('module_key, enabled').eq('user_id', userId);
}

/** Fila de perfil del usuario actual (incluye is_admin para RLS alineado con la app). */
export async function fetchMyProfileRow(userId) {
  if (!supabase || !userId) return { data: null, error: null };
  return supabase.from('profiles').select('id, is_admin, data_owner_id').eq('id', userId).maybeSingle();
}

export async function fetchAllProfiles() {
  if (!supabase) return { data: [], error: new Error('Sin cliente') };
  return supabase.from('profiles').select('id, email, full_name, is_admin, updated_at').order('email');
}

export async function fetchAllModuleAccess() {
  if (!supabase) return { data: [], error: new Error('Sin cliente') };
  return supabase.from('user_module_access').select('user_id, module_key, enabled');
}

export async function upsertModuleAccess(userId, moduleKey, enabled) {
  if (!supabase) return { error: new Error('Sin cliente') };
  return supabase.from('user_module_access').upsert(
    { user_id: userId, module_key: moduleKey, enabled },
    { onConflict: 'user_id,module_key' },
  );
}

export function emptyPermissionsMap() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
}

export function fullPermissionsMap() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}
