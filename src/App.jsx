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
import DbLoadingOverlay from './components/DbLoadingOverlay';
import { MAIN_TABS } from './constants/app';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { usePollosManager } from './hooks/usePollosManager';
import { useAccessControl } from './hooks/useAccessControl';

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
  const [theme, setTheme] = useState(readStoredTheme);

  const accessUser = hasSupabaseConfig ? session?.user : null;
  const {
    loading: accessLoading,
    isAdmin,
    allowedTabs,
    profiles,
    matrixByUser,
    setModuleEnabled,
    inviteUser,
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
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(nextSession || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setAuthError('');
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    setRecoveryMode(false);
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
    gastoPorCategoriaVista,
    utilidadPorCicloVista,
  } = usePollosManager(session?.user);

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
  };

  if (hasSupabaseConfig && !session) {
    return (
      <>
        <DbLoadingOverlay />
        <AuthScreen onLogin={handleLogin} authError={authError} />
      </>
    );
  }

  if (hasSupabaseConfig && session && recoveryMode) {
    return (
      <>
        <DbLoadingOverlay />
        <SetPasswordScreen
          onDone={() => {
            setRecoveryMode(false);
          }}
        />
      </>
    );
  }

  if (hasSupabaseConfig && session && accessLoading) {
    return (
      <>
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
      <DbLoadingOverlay />
      <StatusHeader
        hasSupabaseConfig={hasSupabaseConfig}
        status={status}
        statusType={statusType}
        userEmail={session?.user?.email}
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
        />
      )}

      {tab === 'ventas' && (
        <VentasModule
          {...moduleProps}
          handleVenta={handleVenta}
          submitAbono={submitAbono}
          confirmDeleteAbono={confirmDeleteAbono}
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

      {tab === 'clientes' && <ClientesModule {...moduleProps} handleCliente={handleCliente} />}

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
