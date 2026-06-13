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
