import { useEffect, useState } from 'react';
import { subscribeDbPending } from '../lib/dbLoadingBus';

/**
 * Capa global mientras hay peticiones a PostgREST / storage / Edge Functions (vía fetch del cliente Supabase).
 */
export function DbLoadingOverlay({ suppress = false }) {
  const [pending, setPending] = useState(0);

  useEffect(() => subscribeDbPending(setPending), []);

  if (suppress || pending === 0) return null;

  return (
    <div
      className="db-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando datos"
    >
      <div className="db-loading-overlay-card">
        <div className="auth-loading-spinner" aria-hidden="true" />
        <p className="auth-loading-text">Cargando…</p>
      </div>
    </div>
  );
}

export default DbLoadingOverlay;
