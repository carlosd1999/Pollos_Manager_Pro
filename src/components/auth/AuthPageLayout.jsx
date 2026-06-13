import ChickenLogo from '../ChickenLogo';

/** Marco visual común para login y pantallas de acceso. */
export function AuthPageLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <div className="auth-page-bg" aria-hidden="true" />
      <div className="auth-page-noise" aria-hidden="true" />
      <div className="auth-page-inner">
        <article className="auth-panel">
          <header className="auth-panel-header">
            <div className="auth-brand-mark">
              <ChickenLogo variant="auth" size={54} />
            </div>
            <h1 className="auth-panel-title">{title}</h1>
            {subtitle ? <p className="auth-panel-subtitle">{subtitle}</p> : null}
          </header>
          <div className="auth-panel-body">{children}</div>
          {footer ? <footer className="auth-panel-footer">{footer}</footer> : null}
        </article>
      </div>
    </main>
  );
}
