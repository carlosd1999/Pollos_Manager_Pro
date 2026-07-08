import {
  CLIENTE_POLLO_PREFERENCIA_OPTIONS,
} from '../../constants/clientePolloPreferencia';
import {
  VENTA_FILTRO_PERSONA_OPCIONES,
  buildClienteNombreConPersona,
} from '../../constants/ventaClientePersonas';

function ClienteForm({
  form,
  setForm,
  fieldErrors,
  inputClass,
  setFieldErrors,
  handleCliente,
  editingClienteId,
  onCancelEdit,
}) {
  const isEditing = Boolean(editingClienteId);
  const nombrePreview = buildClienteNombreConPersona(form.cliente.nombre, form.cliente.persona);

  return (
    <article className="card">
      <h3>{isEditing ? 'Editar cliente' : 'Registrar cliente'}</h3>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="cliente-nombre">
          Nombre
        </label>
        <input
          id="cliente-nombre"
          className={inputClass('cliente.nombre')}
          autoComplete="name"
          value={form.cliente.nombre}
          onChange={(e) => {
            setForm({ ...form, cliente: { ...form.cliente, nombre: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'cliente.nombre': '' }));
          }}
        />
        {fieldErrors['cliente.nombre'] && <p className="field-error">{fieldErrors['cliente.nombre']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="cliente-persona">
          Cliente de (opcional)
        </label>
        <select
          id="cliente-persona"
          className="venta-cliente-persona-filter"
          value={form.cliente.persona ?? ''}
          onChange={(e) => {
            setForm({ ...form, cliente: { ...form.cliente, persona: e.target.value } });
          }}
        >
          <option value="">Sin asignar</option>
          {VENTA_FILTRO_PERSONA_OPCIONES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <p className="lists-hint" style={{ marginTop: 4 }}>
          {nombrePreview && form.cliente.persona
            ? (
              <>
                Se guardará como: <strong>{nombrePreview}</strong>
              </>
            )
            : 'Si eliges una persona, el nombre se guarda con paréntesis para identificar a quién pertenece el cliente.'}
        </p>
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="cliente-telefono">
          Teléfono
        </label>
        <input
          id="cliente-telefono"
          type="tel"
          autoComplete="tel"
          value={form.cliente.telefono}
          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, telefono: e.target.value } })}
        />
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="cliente-direccion">
          Dirección
        </label>
        <input
          id="cliente-direccion"
          autoComplete="street-address"
          value={form.cliente.direccion}
          onChange={(e) => setForm({ ...form, cliente: { ...form.cliente, direccion: e.target.value } })}
        />
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="cliente-preferencia-pollo">
          Tamaño de pollo preferido
        </label>
        <select
          id="cliente-preferencia-pollo"
          className={inputClass('cliente.preferencia_pollo')}
          value={form.cliente.preferencia_pollo ?? ''}
          onChange={(e) => {
            setForm({ ...form, cliente: { ...form.cliente, preferencia_pollo: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'cliente.preferencia_pollo': '' }));
          }}
        >
          {CLIENTE_POLLO_PREFERENCIA_OPTIONS.map((o) => (
            <option key={o.value || 'empty'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {fieldErrors['cliente.preferencia_pollo'] && (
          <p className="field-error">{fieldErrors['cliente.preferencia_pollo']}</p>
        )}
        <p className="lists-hint" style={{ marginTop: 4 }}>
          Se muestra en ventas al apartar o entregar pollos a este cliente.
        </p>
      </div>
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="ghost-btn" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        <button type="button" onClick={handleCliente}>{isEditing ? 'Actualizar cliente' : 'Guardar cliente'}</button>
      </div>
    </article>
  );
}

export default ClienteForm;
