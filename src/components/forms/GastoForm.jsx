import { useMemo } from 'react';
import { expenseCategories } from '../../constants/forms';

function GastoForm({
  form,
  setForm,
  fieldErrors,
  inputClass,
  setFieldErrors,
  handleGasto,
  purchaseCategory,
  lockPurchaseCategory,
  editingGastoId,
  onCancelEdit,
  ciclos = [],
  siguienteLoteCompra,
}) {
  const isEditing = Boolean(editingGastoId);
  const ciclosOrdenados = useMemo(
    () => [...ciclos].sort((a, b) => Number(b.numero) - Number(a.numero)),
    [ciclos],
  );
  return (
    <article className="card">
      <h3>{isEditing ? 'Editar gasto' : 'Registrar gasto'}</h3>
      {!isEditing && (
        <p className="lists-hint" style={{ marginBottom: 12 }}>
          Elige el <strong>ciclo</strong> donde va este gasto (puedes tener varios abiertos). Una{' '}
          <strong>{purchaseCategory}</strong> usa el número de lote dentro <strong>de ese ciclo</strong>. El cierre de un ciclo es
          solo manual (pestaña Ciclos). Para un ciclo nuevo sin cerrar los demás, usa <strong>Abrir nuevo ciclo</strong> allí.
        </p>
      )}
      {!isEditing && ciclos.length > 0 && (
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="gasto-ciclo">
            Ciclo destino
          </label>
          <select
            id="gasto-ciclo"
            className={inputClass('gasto.ciclo_id')}
            value={form.gasto.ciclo_id}
            onChange={(e) => {
              setForm({ ...form, gasto: { ...form.gasto, ciclo_id: e.target.value } });
              setFieldErrors((prev) => ({ ...prev, 'gasto.ciclo_id': '' }));
            }}
          >
            <option value="">Seleccionar…</option>
            {ciclosOrdenados.map((c) => (
              <option key={c.id} value={String(c.id)}>
                Ciclo {c.numero} · {c.estado}
                {c.fecha_cierre ? ` · cerró ${c.fecha_cierre}` : ''}
              </option>
            ))}
          </select>
          {fieldErrors['gasto.ciclo_id'] && <p className="field-error">{fieldErrors['gasto.ciclo_id']}</p>}
        </div>
      )}
      {isEditing && (
        <p className="lists-hint" style={{ marginBottom: 12 }}>
          Ciclo del gasto fijado en el registro original (no se puede cambiar de ciclo al editar).
        </p>
      )}
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="gasto-fecha">
          Fecha
        </label>
        <input
          id="gasto-fecha"
          type="date"
          value={form.gasto.fecha}
          onChange={(e) => setForm({ ...form, gasto: { ...form.gasto, fecha: e.target.value } })}
        />
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="gasto-monto">
          Monto
        </label>
        <div className={['input-affix', fieldErrors['gasto.monto'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}>
          <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
            ₡
          </span>
          <input
            id="gasto-monto"
            className={inputClass('gasto.monto')}
            inputMode="decimal"
            autoComplete="off"
            value={form.gasto.monto}
            onChange={(e) => {
              setForm({ ...form, gasto: { ...form.gasto, monto: e.target.value } });
              setFieldErrors((prev) => ({ ...prev, 'gasto.monto': '' }));
            }}
          />
        </div>
        {fieldErrors['gasto.monto'] && <p className="field-error">{fieldErrors['gasto.monto']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="gasto-categoria">
          Categoría
        </label>
        <select
          id="gasto-categoria"
          value={form.gasto.categoria}
          disabled={lockPurchaseCategory}
          onChange={(e) => setForm({ ...form, gasto: { ...form.gasto, categoria: e.target.value } })}
        >
          {expenseCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {lockPurchaseCategory && (
        <p className="lists-hint" style={{ margin: '0 0 8px' }}>
          La categoría queda fijada porque este gasto creó un lote; puedes corregir cantidad, monto y fecha (se actualiza el lote).
        </p>
      )}
      {form.gasto.categoria === purchaseCategory && !isEditing && form.gasto.ciclo_id && siguienteLoteCompra != null && (
        <p className="lists-hint" style={{ margin: '0 0 8px' }}>
          En el ciclo elegido, esta compra será el <strong>lote {siguienteLoteCompra}</strong>.
        </p>
      )}
      {form.gasto.categoria === purchaseCategory && (
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="gasto-cantidad-pollos">
            Cantidad de pollos comprados
          </label>
          <input
            id="gasto-cantidad-pollos"
            className={inputClass('gasto.cantidad_pollos')}
            inputMode="numeric"
            autoComplete="off"
            value={form.gasto.cantidad_pollos}
            onChange={(e) => {
              setForm({ ...form, gasto: { ...form.gasto, cantidad_pollos: e.target.value } });
              setFieldErrors((prev) => ({ ...prev, 'gasto.cantidad_pollos': '' }));
            }}
          />
          {fieldErrors['gasto.cantidad_pollos'] && <p className="field-error">{fieldErrors['gasto.cantidad_pollos']}</p>}
        </div>
      )}
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="gasto-detalle">
          Detalle (opcional)
        </label>
        <input
          id="gasto-detalle"
          autoComplete="off"
          value={form.gasto.detalle}
          onChange={(e) => setForm({ ...form, gasto: { ...form.gasto, detalle: e.target.value } })}
        />
      </div>
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="ghost-btn" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        <button type="button" onClick={handleGasto}>{isEditing ? 'Actualizar gasto' : 'Guardar gasto'}</button>
      </div>
    </article>
  );
}

export default GastoForm;
