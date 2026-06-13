import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthPageLayout } from './auth/AuthPageLayout';

function FieldIconMail() {
  return (
    <span className="auth-field-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    </span>
  );
}

function FieldIconLock() {
  return (
    <span className="auth-field-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );
}

function AuthScreen({ onLogin, authError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [info, setInfo] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const combinedError = authError || localError;

  const submitLogin = async (e) => {
    e?.preventDefault?.();
    setLocalError('');
    setInfo('');
    await onLogin(email, password);
  };

  const sendReset = async () => {
    setLocalError('');
    setInfo('');
    if (!supabase) {
      setLocalError('Configura Supabase para recuperar la contraseña.');
      return;
    }
    const addr = email.trim();
    if (!addr) {
      setLocalError('Escribe tu correo para enviarte el enlace.');
      return;
    }
    setSendingReset(true);
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo });
      if (error) {
        setLocalError(error.message);
        return;
      }
      setInfo('Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <AuthPageLayout
      title="Gestión Avícola"
      subtitle="Ingresa con la cuenta que te asignó el administrador."
      footer={
        <p className="auth-footer-note">
          Gestión Avícola segura · acceso restringido
        </p>
      }
    >
      <form className="auth-form" onSubmit={submitLogin} noValidate>
        <div className="auth-field">
          <label className="auth-field-label" htmlFor="auth-email">
            Correo electrónico
          </label>
          <div className="auth-field-control">
            <FieldIconMail />
            <input
              id="auth-email"
              className="auth-input"
              placeholder="nombre@empresa.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field-label" htmlFor="auth-password">
            Contraseña
          </label>
          <div className="auth-field-control">
            <FieldIconLock />
            <input
              id="auth-password"
              className="auth-input"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {combinedError ? <p className="auth-alert auth-alert-error">{combinedError}</p> : null}
        {info ? <p className="auth-alert auth-alert-info">{info}</p> : null}

        <button type="submit" className="auth-btn auth-btn-primary">
          Iniciar sesión
        </button>

        <div className="auth-row-actions">
          <button
            type="button"
            className="auth-btn auth-btn-link"
            disabled={sendingReset}
            onClick={sendReset}
          >
            {sendingReset ? 'Enviando enlace…' : '¿Olvidaste tu contraseña?'}
          </button>
        </div>
      </form>
    </AuthPageLayout>
  );
}

export default AuthScreen;
