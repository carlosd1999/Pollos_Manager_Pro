import { useEffect, useMemo, useState } from 'react';
import AuthScreen from './components/AuthScreen';
import SetPasswordScreen from './components/SetPasswordScreen';
import AdminUsersTab from './components/AdminUsersTab';
import DashboardTab from './components/DashboardTab';
import NavigationTabs from './components/NavigationTabs';
import GastosModule from './components/modules/GastosModule';
import VentasModule from './components/modules/VentasModule';
import MortalidadModule from './components/modules/MortalidadModule';
import ClientesModule from './components/modules/ClientesModule';
import CiclosModule from './components/modules/CiclosModule';
import ReportesTab from './components/ReportesTab';
import StatusHeader from './components/StatusHeader';
import StatusMessageModal from './components/StatusMessageModal';
import DbLoadingOverlay from './components/DbLoadingOverlay';
import { MAIN_TABS } from './constants/app';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { applyInviteFromHash } from './lib/applyInviteFromHash';
import {
  formatAuthLinkErrorMessage,
  readSupabaseAuthLinkError,
  stripSupabaseAuthErrorFromUrl,
} from './lib/authLinkErrors';
import { usePollosManager } from './hooks/usePollosManager';
import { useAccessControl } from './hooks/useAccessControl';

function LinkAuthNoticeBar({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div role="alert" className="link-auth-notice-bar auth-alert auth-alert-error">
      <p style={{ margin: 0, flex: '1 1 12rem' }}>{message}</p>
      {onDismiss ? (
        <button type="button" className="auth-btn auth-btn-link" onClick={onDismiss}>
          Cerrar
        </button>
      ) : null}
    </div>
  );
}

function App() {
  const THEME_KEY = 'pollos-manager-theme';

  const readStoredTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  };

  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  /** Primer acceso vía enlace de invitación (hash type=invite antes de que desaparezca). */
  const [invitePasswordGate, setInvitePasswordGate] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      return new URLSearchParams(raw).get('type') === 'invite';
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState(readStoredTheme);
  /** Mensaje si Supabase redirige con #error=… (enlace caducado, ya usado, etc.). */
  const [linkAuthNotice, setLinkAuthNotice] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !hasSupabaseConfig) return;
    try {
      const info = readSupabaseAuthLinkError();
      if (!info) return;
      setLinkAuthNotice(formatAuthLinkErrorMessage(info));
      stripSupabaseAuthErrorFromUrl();
    } catch {
      /* ignore */
    }
  }, [hasSupabaseConfig]);

  const needsInitialPassword = useMemo(() => {
    const v = session?.user?.user_metadata?.must_complete_password;
    return v === true || v === 'true';
  }, [session?.user?.id, session?.user?.user_metadata?.must_complete_password]);

  const showSetPasswordScreen = Boolean(
    session && (recoveryMode || needsInitialPassword || invitePasswordGate),
  );
  const setPasswordVariant = recoveryMode ? 'recovery' : 'invite';

  const accessUser = hasSupabaseConfig ? session?.user : null;
  const {
    loading: accessLoading,
    isAdmin,
    allowedTabs,
    profiles,
    matrixByUser,
    setModuleEnabled,
    inviteUser,
    dataRowOwnerId,
  } = useAccessControl(accessUser);

  const visibleTabs = useMemo(() => {
    if (!hasSupabaseConfig || !session) return MAIN_TABS;
    return allowedTabs.length ? allowedTabs : MAIN_TABS;
  }, [hasSupabaseConfig, session, allowedTabs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0a1210' : '#1b4332');
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;
    (async () => {
      await applyInviteFromHash(supabase);
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setSession(data.session || null);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          const raw = window.location.hash.replace(/^#/, '');
          if (new URLSearchParams(raw).get('type') === 'invite') setInvitePasswordGate(true);
        } catch {
          /* ignore */
        }
      }
      setSession(nextSession || null);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email, password) => {
    setAuthError('');
    setLinkAuthNotice('');
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    setRecoveryMode(false);
    setInvitePasswordGate(false);
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const {
    tab,
    setTab,
    data,
    form,
    setForm,
    status,
    statusType,
    dismissStatus,
    fieldErrors,
    setFieldErrors,
    inputClass,
    stats,
    gastoPorCategoria,
    utilidadPorCiclo,
    handleGasto,
    handleCliente,
    handleVenta,
    handleMortalidad,
    exportExcel,
    exportPDF,
    purchaseCategory,
    editingGastoId,
    editingVentaId,
    editingMortalidadId,
    editingClienteId,
    startEditGasto,
    startEditVenta,
    startEditMortalidad,
    startEditCliente,
    cancelOperacionesEdit,
    confirmDeleteGasto,
    confirmDeleteVenta,
    confirmDeleteMortalidad,
    confirmDeleteCliente,
    submitAbono,
    confirmDeleteAbono,
    toggleVentaEntregada,
    guardarRepartoGastosObjetivo,
    liquidarRepartoBucket,
    deshacerUltimoRepartoPago,
    cerrarCicloPorId,
    abrirNuevoCiclo,
    siguienteLoteCompra,
    dataVista,
    lotesWithAvailability,
    lotesWithAvailabilityOperaciones,
    vistaCicloId,
    setVistaCicloId,
    vistaCicloLabel,
    statsVista,
    ventasPendientesResumen,
    gastoPorCategoriaVista,
    utilidadPorCicloVista,
    formResetGeneration,
  } = usePollosManager(session?.user, dataRowOwnerId, { isAdmin });

  useEffect(() => {
    if (!hasSupabaseConfig || !session) return;
    if (!allowedTabs.length) return;
    if (!allowedTabs.includes(tab)) setTab(allowedTabs[0]);
  }, [hasSupabaseConfig, session, allowedTabs, tab, setTab]);

  const moduleProps = {
    form,
    data,
    dataVista,
    vistaCicloLabel,
    lotesWithAvailability: lotesWithAvailabilityOperaciones,
    fieldErrors,
    inputClass,
    setForm,
    setFieldErrors,
    editingGastoId,
    editingVentaId,
    editingMortalidadId,
    editingClienteId,
    cancelOperacionesEdit,
    startEditGasto,
    startEditVenta,
    startEditMortalidad,
    startEditCliente,
    confirmDeleteGasto,
    confirmDeleteVenta,
    confirmDeleteMortalidad,
    confirmDeleteCliente,
    formResetGeneration,
  };

  if (hasSupabaseConfig && !session) {
    return (
      <>
        <DbLoadingOverlay />
        <AuthScreen
          onLogin={handleLogin}
          authError={authError}
          linkNotice={linkAuthNotice}
          onDismissLinkNotice={() => setLinkAuthNotice('')}
        />
      </>
    );
  }

  if (hasSupabaseConfig && session && showSetPasswordScreen) {
    return (
      <>
        <LinkAuthNoticeBar message={linkAuthNotice} onDismiss={() => setLinkAuthNotice('')} />
        <DbLoadingOverlay />
        <SetPasswordScreen
          variant={setPasswordVariant}
          onDone={() => {
            setRecoveryMode(false);
            setInvitePasswordGate(false);
          }}
        />
      </>
    );
  }

  if (hasSupabaseConfig && session && accessLoading) {
    return (
      <>
        <LinkAuthNoticeBar message={linkAuthNotice} onDismiss={() => setLinkAuthNotice('')} />
        <DbLoadingOverlay suppress />
        <main className="auth-page">
          <div className="auth-page-bg" aria-hidden="true" />
          <div className="auth-page-noise" aria-hidden="true" />
          <div className="auth-page-inner">
            <article className="auth-panel auth-panel-compact">
              <div className="auth-loading-spinner" aria-hidden="true" />
              <p className="auth-loading-text">Cargando permisos…</p>
            </article>
          </div>
        </main>
      </>
    );
  }

  if (hasSupabaseConfig && session && !isAdmin && allowedTabs.length === 0) {
    return (
      <>
        <LinkAuthNoticeBar message={linkAuthNotice} onDismiss={() => setLinkAuthNotice('')} />
        <DbLoadingOverlay />
        <main className="auth-page">
          <div className="auth-page-bg" aria-hidden="true" />
          <div className="auth-page-noise" aria-hidden="true" />
          <div className="auth-page-inner">
            <article className="auth-panel auth-panel-compact">
              <h2>Sin acceso</h2>
              <p>Tu cuenta no tiene ningún módulo habilitado. Pide al administrador que active las secciones que necesitas.</p>
              <button type="button" className="auth-btn auth-btn-primary" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </article>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="app-shell">
      <LinkAuthNoticeBar message={linkAuthNotice} onDismiss={() => setLinkAuthNotice('')} />
      <DbLoadingOverlay />
      <StatusMessageModal
        open={hasSupabaseConfig && Boolean(status)}
        message={status}
        variant={statusType}
        onDismiss={dismissStatus}
      />
      <StatusHeader
        hasSupabaseConfig={hasSupabaseConfig}
        userEmail={session?.user?.user_metadata?.full_name || session?.user?.email}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        ciclos={data.ciclos || []}
        vistaCicloId={vistaCicloId}
        onVistaCicloChange={setVistaCicloId}
      />
      <NavigationTabs tab={tab} setTab={setTab} className="top-tabs" visibleTabs={visibleTabs} />

      {tab === 'dashboard' && (
        <DashboardTab
          stats={vistaCicloId ? statsVista : stats}
          utilidadPorCiclo={vistaCicloId ? utilidadPorCicloVista : utilidadPorCiclo}
          gastoPorCategoria={vistaCicloId ? gastoPorCategoriaVista : gastoPorCategoria}
          filtroCicloLabel={vistaCicloLabel}
          ventasPendientesResumen={ventasPendientesResumen}
        />
      )}

      {tab === 'ventas' && (
        <VentasModule
          {...moduleProps}
          currentUserFullName={session?.user?.user_metadata?.full_name || ''}
          handleVenta={handleVenta}
          submitAbono={submitAbono}
          confirmDeleteAbono={confirmDeleteAbono}
          toggleVentaEntregada={toggleVentaEntregada}
          guardarRepartoGastosObjetivo={guardarRepartoGastosObjetivo}
          liquidarRepartoBucket={liquidarRepartoBucket}
          deshacerUltimoRepartoPago={deshacerUltimoRepartoPago}
          isAdmin={isAdmin}
        />
      )}

      {tab === 'gastos' && (
        <GastosModule
          {...moduleProps}
          handleGasto={handleGasto}
          purchaseCategory={purchaseCategory}
          siguienteLoteCompra={siguienteLoteCompra}
        />
      )}

      {tab === 'mortalidad' && <MortalidadModule {...moduleProps} handleMortalidad={handleMortalidad} />}

      {tab === 'clientes' && (
        <ClientesModule
          {...moduleProps}
          handleCliente={handleCliente}
          currentUserFullName={session?.user?.user_metadata?.full_name || ''}
        />
      )}

      {tab === 'ciclos' && (
        <CiclosModule
          data={data}
          lotesWithAvailability={lotesWithAvailability}
          cerrarCicloPorId={cerrarCicloPorId}
          abrirNuevoCiclo={abrirNuevoCiclo}
        />
      )}

      {tab === 'reportes' && (
        <ReportesTab
          data={vistaCicloId ? dataVista : data}
          exportPDF={exportPDF}
          exportExcel={exportExcel}
          ventasPendientesResumen={ventasPendientesResumen}
        />
      )}

      {tab === 'admin' && isAdmin && (
        <AdminUsersTab
          currentUserId={session?.user?.id}
          currentUserEmail={session?.user?.email}
          profiles={profiles}
          matrixByUser={matrixByUser}
          onInvite={inviteUser}
          onToggleModule={setModuleEnabled}
          busy={accessLoading}
        />
      )}

      <NavigationTabs tab={tab} setTab={setTab} className="bottom-nav" visibleTabs={visibleTabs} />
    </div>
  );
}

export default App;
