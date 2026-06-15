import { useState } from 'react';
import { MAIN_TABS, TAB_LABELS } from '../constants/app';

function AdminUsersTab({
  currentUserId,
  currentUserEmail,
  profiles,
  matrixByUser,
  onInvite,
  onToggleModule,
  busy: parentBusy,
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [inviting, setInviting] = useState(false);

  const invite = async () => {
    setErr('');
    setMsg('');
    const e = email.trim().toLowerCase();
    if (!e) {
      setErr('Indica el correo del nuevo usuario.');
      return;
    }
    if (currentUserEmail && e === currentUserEmail.trim().toLowerCase()) {
      setErr('No puedes enviarte una invitación a tu propio correo.');
      return;
    }
    setInviting(true);
    try {
      await onInvite(e, fullName);
      setMsg(`Invitación enviada a ${e}. Revisa también la carpeta de spam.`);
      setEmail('');
      setFullName('');
    } catch (error) {
      setErr(error.message || 'No se pudo enviar la invitación.');
    } finally {
      setInviting(false);
    }
  };

  const toggle = async (userId, moduleKey, current) => {
    setErr('');
    try {
      await onToggleModule(userId, moduleKey, !current);
    } catch (error) {
      setErr(error.message || 'No se pudo actualizar el permiso.');
    }
  };

  const busy = inviting || parentBusy;
  const others = (profiles || []).filter((p) => p.id !== currentUserId && !p.is_admin);

  return (
    <div className="module-split admin-users">
      <section className="module-form card">
        <h2 className="card-title">Invitar usuario</h2>
        <p className="card-sub">
          Supabase enviará un correo para que el usuario defina su contraseña. Requiere la función Edge{' '}
          <code>invite-user</code> desplegada. Si ves error de «límite de correos», el SMTP integrado de Supabase
          permite pocos envíos por hora: configura SMTP propio en Authentication → Emails → SMTP Settings, o espera
          antes de volver a invitar.
        </p>
        <label className="field-label">
          Correo
          <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="correo@ejemplo.com" />
        </label>
        <label className="field-label">
          Nombre (opcional)
          <input type="text" value={fullName} onChange={(ev) => setFullName(ev.target.value)} placeholder="Nombre completo" />
        </label>
        {err && <p className="field-error">{err}</p>}
        {msg && <p className="field-info">{msg}</p>}
        <button type="button" className="primary-btn" disabled={busy} onClick={invite}>
          {inviting ? 'Enviando…' : 'Enviar invitación'}
        </button>
      </section>

      <section className="module-table card">
        <h2 className="card-title">Permisos por módulo</h2>
        <p className="card-sub">Activa o desactiva las secciones visibles para cada usuario (excepto tu cuenta de admin).</p>
        {others.length === 0 ? (
          <p>No hay otros usuarios todavía.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="data-table admin-matrix">
              <thead>
                <tr>
                  <th>Usuario</th>
                  {MAIN_TABS.map((key) => (
                    <th key={key} title={TAB_LABELS[key]}>
                      {TAB_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((p) => {
                  const row = matrixByUser[p.id] || {};
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-user-cell">
                          <strong>{p.full_name || '—'}</strong>
                          <span className="admin-user-email">{p.email}</span>
                        </div>
                      </td>
                      {MAIN_TABS.map((key) => {
                        const on = Boolean(row[key]);
                        return (
                          <td key={key} className="admin-toggle-cell">
                            <button
                              type="button"
                              className={`admin-module-toggle ${on ? 'on' : 'off'}`}
                              disabled={busy}
                              onClick={() => toggle(p.id, key, on)}
                              aria-pressed={on}
                              title={`${TAB_LABELS[key]}: ${on ? 'activo' : 'inactivo'}`}
                            >
                              {on ? 'Sí' : 'No'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminUsersTab;
