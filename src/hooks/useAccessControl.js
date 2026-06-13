import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  const [profileResolved, setProfileResolved] = useState(false);

  const isAdmin = useMemo(
    () => Boolean(user && (isAdminUser(user) || dbIsAdmin)),
    [user, user?.app_metadata?.role, user?.id, dbIsAdmin],
  );

  useEffect(() => {
    if (!user?.id || !supabase) {
      setDbIsAdmin(false);
      setProfileResolved(true);
      return undefined;
    }
    let cancelled = false;
    setProfileResolved(false);
    fetchMyProfileRow(user.id).then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setDbIsAdmin(Boolean(data.is_admin));
      else setDbIsAdmin(false);
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
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: email.trim().toLowerCase(),
          full_name: (fullName || '').trim(),
          redirect_to: redirectTo,
        },
      });
      if (error) {
        const detail = data && typeof data === 'object' && data.error ? String(data.error) : error.message;
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
  };
}
