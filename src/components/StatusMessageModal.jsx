import { useEffect, useRef } from 'react';

/**
 * Mensajes de éxito / error del hook (PostgREST, validación, etc.): capa fija centrada como DbLoadingOverlay.
 */
export default function StatusMessageModal({ open, message, variant = 'info', onDismiss }) {
  const acceptRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    acceptRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  if (!open || !message) return null;

  return (
    <div
      className="db-loading-overlay status-message-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="status-message-modal-title"
    >
      <div className="db-loading-overlay-card card status-message-modal-card">
        <p id="status-message-modal-title" className={`status-message-modal-text ${variant}`}>
          {message}
        </p>
        <button
          ref={acceptRef}
          type="button"
          className="auth-btn auth-btn-primary status-message-modal-btn"
          onClick={onDismiss}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
