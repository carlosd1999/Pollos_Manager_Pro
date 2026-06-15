import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthPageLayout } from './auth/AuthPageLayout';

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

function SetPasswordScreen({ onDone, variant = 'recovery' }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isInvite = variant === 'invite';

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!supabase) return;
    setBusy(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({
        password,
        data: { must_complete_password: false },
      });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageLayout
      title="Nueva contraseña"
      subtitle={
        isInvite
          ? 'Es tu primer acceso: crea una contraseña para poder iniciar sesión en el futuro.'
          : 'Define una contraseña segura. Luego podrás usar la app con normalidad.'
      }
      footer={
        <p className="auth-footer-note">{isInvite ? 'Invitación · Gestión Avícola' : 'Recuperación de contraseña · Gestión Avícola'}</p>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label className="auth-field-label" htmlFor="setpw-new">
            Nueva contraseña
          </label>
          <div className="auth-field-control">
            <FieldIconLock />
            <input
              id="setpw-new"
              className="auth-input"
              placeholder="Mínimo 6 caracteres"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field-label" htmlFor="setpw-confirm">
            Confirmar contraseña
          </label>
          <div className="auth-field-control">
            <FieldIconLock />
            <input
              id="setpw-confirm"
              className="auth-input"
              placeholder="Repite la contraseña"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="auth-alert auth-alert-error">{error}</p> : null}

        <button type="submit" className="auth-btn auth-btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthPageLayout>
  );
}

export default SetPasswordScreen;
