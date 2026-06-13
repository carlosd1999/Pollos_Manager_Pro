import ChickenLogo from './ChickenLogo';

function IconMoon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusHeader({
  hasSupabaseConfig,
  status,
  statusType,
  userEmail,
  onLogout,
  theme,
  onToggleTheme,
  ciclos = [],
  vistaCicloId,
  onVistaCicloChange,
}) {
  const dark = theme === 'dark';
  const ciclosOrdenados = [...ciclos].sort((a, b) => Number(a.numero) - Number(b.numero));

  return (
    <header className="app-header">
      <div className="header-brand-row">
        <div className="header-brand header-brand-lockup">
          <ChickenLogo variant="header" size={44} />
          <div className="header-brand-text">
            <h1>Gestión Avícola</h1>
            {userEmail && <p className="header-kicker">{userEmail}</p>}
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          {userEmail && (
            <button type="button" className="logout-btn" onClick={onLogout}>
              Salir
            </button>
          )}
        </div>
      </div>
      {ciclos.length > 0 && onVistaCicloChange && (
        <div className="header-vista-ciclo">
          <label htmlFor="vista-ciclo-global">Ver datos por ciclo</label>
          <select
            id="vista-ciclo-global"
            value={vistaCicloId}
            onChange={(e) => onVistaCicloChange(e.target.value)}
          >
            <option value="">Todos los ciclos</option>
            {ciclosOrdenados.map((c) => (
              <option key={c.id} value={String(c.id)}>
                Ciclo {c.numero} ({c.estado})
              </option>
            ))}
          </select>
        </div>
      )}
      {(status || !hasSupabaseConfig) &&
        <p className={`status ${statusType}`}>
          {hasSupabaseConfig ? status : 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar datos'}
        </p>
      }
    </header>
  );
}

export default StatusHeader;
