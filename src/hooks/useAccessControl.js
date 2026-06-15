import { useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSupabaseRedirectUrl } from '../lib/appRedirectUrl';
import { isAdminUser } from '../constants/auth';
import { MAIN_TABS } from '../constants/app';
import {
  emptyPermissionsMap,
  fetchAllModuleAccess,
  fetchAllProfiles,
  fetchMyModuleAccessForUser,
  fetchMyProfileRow,
  fullPermissionsMap,
  upsertModuleAccess,
} from '../services/accessService';

export function useAccessControl(user) {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(() => emptyPermissionsMap());
  const [profiles, setProfiles] = useState([]);
  const [moduleRows, setModuleRows] = useState([]);
  const [dbIsAdmin, setDbIsAdmin] = useState(false);
  /** auth.users.id dueño de filas ciclos/ventas/… (compartido con invitados). */
  const [datasetUserId, setDatasetUserId] = useState(undefined);
  const [profileResolved, setProfileResolved] = useState(false);

  const isAdmin = useMemo(
    () => Boolean(user && (isAdminUser(user) || dbIsAdmin)),
    [user, user?.app_metadata?.role, user?.id, dbIsAdmin],
  );

  useEffect(() => {
    if (!user?.id || !supabase) {
      setDbIsAdmin(false);
      setDatasetUserId(undefined);
      setProfileResolved(true);
      return undefined;
    }
    let cancelled = false;
    setProfileResolved(false);
    setDatasetUserId(undefined);
    fetchMyProfileRow(user.id).then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) {
        setDbIsAdmin(Boolean(data.is_admin));
        setDatasetUserId(data.data_owner_id || user.id);
      } else {
        setDbIsAdmin(false);
        setDatasetUserId(user.id);
      }
      setProfileResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadAdminData = useCallback(async () => {
    if (!supabase) return;
    const [pr, mod] = await Promise.all([fetchAllProfiles(), fetchAllModuleAccess()]);
    if (pr.error) throw new Error(pr.error.message);
    if (mod.error) throw new Error(mod.error.message);
    setProfiles(pr.data || []);
    setModuleRows(mod.data || []);
    setPermissions(fullPermissionsMap());
  }, []);

  const loadMemberData = useCallback(async (userId) => {
    if (!supabase) return;
    const { data, error } = await fetchMyModuleAccessForUser(userId);
    if (error) throw new Error(error.message);
    const next = emptyPermissionsMap();
    (data || []).forEach((row) => {
      if (row.module_key in next) next[row.module_key] = Boolean(row.enabled);
    });
    setPermissions(next);
  }, []);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setLoading(false);
      return undefined;
    }
    if (!profileResolved) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isAdmin) await loadAdminData();
        else await loadMemberData(user.id);
      } catch {
        if (!cancelled) setPermissions(emptyPermissionsMap());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isAdmin, profileResolved, loadAdminData, loadMemberData]);

  const allowedTabs = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return [...MAIN_TABS, 'admin'];
    return MAIN_TABS.filter((t) => permissions[t]);
  }, [user, isAdmin, permissions]);

  const refresh = useCallback(async () => {
    if (!user?.id || !supabase) return;
    const { data: row } = await fetchMyProfileRow(user.id);
    setDbIsAdmin(Boolean(row?.is_admin));
    setDatasetUserId(row?.data_owner_id || user.id);
    if (isAdminUser(user) || row?.is_admin) await loadAdminData();
    else await loadMemberData(user.id);
  }, [user, loadAdminData, loadMemberData]);

  const setModuleEnabled = useCallback(
    async (userId, moduleKey, enabled) => {
      const { error } = await upsertModuleAccess(userId, moduleKey, enabled);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const inviteUser = useCallback(
    async (email, fullName) => {
      if (!supabase) throw new Error('Sin conexión');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Sesión no válida o caducada. Cierra sesión y vuelve a entrar.');
      }
      const redirectTo = getSupabaseRedirectUrl();
      const { data, error } = await supabase.functions.invoke('invite-user', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: email.trim().toLowerCase(),
          full_name: (fullName || '').trim(),
          redirect_to: redirectTo,
        },
      });
      if (error) {
        let detail = error.message;
        if (data && typeof data === 'object' && data.error) {
          detail = String(data.error);
        } else if (error instanceof FunctionsHttpError || error?.name === 'FunctionsHttpError') {
          try {
            const body = await error.context.json();
            if (body && typeof body === 'object' && body.error) detail = String(body.error);
          } catch {
            /* ignore */
          }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(String(data.error));
      await refresh();
      return data;
    },
    [refresh],
  );

  const matrixByUser = useMemo(() => {
    const map = {};
    moduleRows.forEach((row) => {
      if (!map[row.user_id]) map[row.user_id] = emptyPermissionsMap();
      if (row.module_key in map[row.user_id]) map[row.user_id][row.module_key] = Boolean(row.enabled);
    });
    return map;
  }, [moduleRows]);

  /** undefined hasta resolver perfil; luego uuid del dueño de datos (RLS). */
  const dataRowOwnerId = useMemo(() => {
    if (!user?.id || !profileResolved) return undefined;
    return datasetUserId;
  }, [user?.id, profileResolved, datasetUserId]);

  return {
    loading: loading || !profileResolved,
    isAdmin,
    permissions,
    allowedTabs,
    profiles,
    matrixByUser,
    refresh,
    setModuleEnabled,
    inviteUser,
    dataRowOwnerId,
  };
}
