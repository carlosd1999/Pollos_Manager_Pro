import { formatColones } from '../../lib/formatCurrency';
import { formatPrecioKgForForm, roundedVentaTotalAndPrecioKg } from '../../lib/ventaPricing';
import { VENTA_PAYMENT_METHOD_OPTIONS } from '../../constants/payments';

function mergeVentaConRedondeo(prevForm, patch) {
  const v = { ...prevForm.venta, ...patch };
  const pt = Number(v.peso_total);
  const pk = Number(v.precio_kg);
  if (pt > 0 && pk > 0) {
    const { totalVenta, precioKg } = roundedVentaTotalAndPrecioKg(pt, pk);
    v.precio_kg = formatPrecioKgForForm(precioKg);
    v.total_redondeado = totalVenta;
  } else {
    v.total_redondeado = '';
  }
  return { ...prevForm, venta: v };
}

function VentaForm({
  form,
  setForm,
  data,
  lotesWithAvailability,
  fieldErrors,
  inputClass,
  setFieldErrors,
  handleVenta,
  editingVentaId,
  onCancelEdit,
}) {
  const isEditing = Boolean(editingVentaId);
  const lockClienteLote = isEditing;

  const totalMostrar =
    form.venta.total_redondeado !== '' && form.venta.total_redondeado != null
      ? Number(form.venta.total_redondeado)
      : null;

  const requiereMetodoPago =
    !isEditing && (form.venta.pagoCompleto || (form.venta.primerAbono !== '' && Number(form.venta.primerAbono) > 0));

  return (
    <article className="card">
      <h3>{isEditing ? 'Editar venta' : 'Registrar venta'}</h3>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-fecha">
          Fecha
        </label>
        <input
          id="venta-fecha"
          type="date"
          value={form.venta.fecha}
          onChange={(e) => setForm({ ...form, venta: { ...form.venta, fecha: e.target.value } })}
        />
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-cliente">
          Cliente
        </label>
        <select
          id="venta-cliente"
          className={inputClass('venta.cliente_id')}
          value={form.venta.cliente_id}
          disabled={lockClienteLote}
          onChange={(e) => {
            setForm({ ...form, venta: { ...form.venta, cliente_id: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'venta.cliente_id': '' }));
          }}
        >
          <option value="">Seleccionar…</option>
          {data.clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
        {fieldErrors['venta.cliente_id'] && <p className="field-error">{fieldErrors['venta.cliente_id']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-lote">
          Lote
        </label>
        <select
          id="venta-lote"
          className={inputClass('venta.lote_id')}
          value={form.venta.lote_id}
          disabled={lockClienteLote}
          onChange={(e) => {
            setForm({ ...form, venta: { ...form.venta, lote_id: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'venta.lote_id': '' }));
          }}
        >
          <option value="">Seleccionar…</option>
          {lotesWithAvailability.map((lote) => (
            <option key={lote.id} value={lote.id}>
              Lote {lote.numero_lote} — disponibles {lote.disponibles}
            </option>
          ))}
        </select>
        {fieldErrors['venta.lote_id'] && <p className="field-error">{fieldErrors['venta.lote_id']}</p>}
      </div>
      {lockClienteLote && (
        <p className="lists-hint" style={{ margin: '0 0 8px' }}>
          Cliente y lote no se cambian al editar (evita inconsistencias de stock). Si necesitas otro lote, elimina y crea una venta nueva.
        </p>
      )}
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-cantidad">
          Cantidad de pollos
        </label>
        <input
          id="venta-cantidad"
          className={inputClass('venta.cantidad')}
          inputMode="numeric"
          autoComplete="off"
          value={form.venta.cantidad}
          onChange={(e) => {
            setForm({ ...form, venta: { ...form.venta, cantidad: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'venta.cantidad': '' }));
          }}
        />
        {fieldErrors['venta.cantidad'] && <p className="field-error">{fieldErrors['venta.cantidad']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-peso-total">
          Peso total
        </label>
        <div className={['input-affix', fieldErrors['venta.peso_total'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}>
          <input
            id="venta-peso-total"
            className={inputClass('venta.peso_total')}
            inputMode="decimal"
            autoComplete="off"
            value={form.venta.peso_total}
            onChange={(e) => {
              setForm((prev) => mergeVentaConRedondeo(prev, { peso_total: e.target.value }));
              setFieldErrors((prev) => ({ ...prev, 'venta.peso_total': '' }));
            }}
          />
          <span className="input-affix-symbol input-affix-symbol--trailing" aria-hidden="true">
            kg
          </span>
        </div>
        {fieldErrors['venta.peso_total'] && <p className="field-error">{fieldErrors['venta.peso_total']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-precio-kg">
          Precio por kilogramo
        </label>
        <div className={['input-affix', fieldErrors['venta.precio_kg'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}>
          <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
            ₡
          </span>
          <input
            id="venta-precio-kg"
            className={inputClass('venta.precio_kg')}
            inputMode="decimal"
            autoComplete="off"
            value={form.venta.precio_kg}
            onChange={(e) => {
              setForm((prev) => mergeVentaConRedondeo(prev, { precio_kg: e.target.value }));
              setFieldErrors((prev) => ({ ...prev, 'venta.precio_kg': '' }));
            }}
          />
        </div>
        {fieldErrors['venta.precio_kg'] && <p className="field-error">{fieldErrors['venta.precio_kg']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-peso-promedio">
          Peso promedio por pollo
        </label>
        <div className="input-affix">
          <input
            id="venta-peso-promedio"
            readOnly
            value={
              form.venta.cantidad && form.venta.peso_total
                ? (Number(form.venta.peso_total) / Number(form.venta.cantidad)).toFixed(2)
                : ''
            }
          />
          <span className="input-affix-symbol input-affix-symbol--trailing" aria-hidden="true">
            kg
          </span>
        </div>
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-total">
          Total venta
        </label>
        <input
          id="venta-total"
          readOnly
          value={totalMostrar != null && totalMostrar > 0 ? formatColones(totalMostrar) : ''}
        />
      </div>
      <p className="lists-hint" style={{ marginTop: 0 }}>
        El total se redondea <strong>hacia abajo</strong> al múltiplo de ₡25 más cercano. El precio por kg se ajusta automáticamente.
      </p>
      {!isEditing && (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.venta.pagoCompleto}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm({
                  ...form,
                  venta: {
                    ...form.venta,
                    pagoCompleto: checked,
                    primerAbono: checked ? '' : form.venta.primerAbono,
                  },
                });
                setFieldErrors((prev) => ({ ...prev, 'venta.primerAbono': '', 'venta.metodo_pago': '' }));
              }}
            />
            Pago al contado
          </label>
          {!form.venta.pagoCompleto && (
            <>
              <div className="form-field-stack">
                <label className="form-field-label" htmlFor="venta-primer-abono">
                  Abono inicial (opcional)
                </label>
                <div
                  className={['input-affix', fieldErrors['venta.primerAbono'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}
                >
                  <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
                    ₡
                  </span>
                  <input
                    id="venta-primer-abono"
                    className={inputClass('venta.primerAbono')}
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.venta.primerAbono}
                    onChange={(e) => {
                      setForm({ ...form, venta: { ...form.venta, primerAbono: e.target.value } });
                      setFieldErrors((prev) => ({ ...prev, 'venta.primerAbono': '', 'venta.metodo_pago': '' }));
                    }}
                  />
                </div>
                {fieldErrors['venta.primerAbono'] && <p className="field-error">{fieldErrors['venta.primerAbono']}</p>}
              </div>
              <p className="lists-hint" style={{ marginTop: 0 }}>
                Sin abono inicial la venta queda a crédito.
              </p>
            </>
          )}
        </>
      )}
      {(requiereMetodoPago || isEditing) && (
        <>
          <div className="form-field-stack">
            <label className="form-field-label" htmlFor="venta-metodo-pago">
              Forma de pago{requiereMetodoPago ? '' : ' (opcional al editar)'}
            </label>
            <select
              id="venta-metodo-pago"
              className={inputClass('venta.metodo_pago')}
              value={form.venta.metodo_pago || ''}
              onChange={(e) => {
                setForm({ ...form, venta: { ...form.venta, metodo_pago: e.target.value } });
                setFieldErrors((prev) => ({ ...prev, 'venta.metodo_pago': '' }));
              }}
            >
              {VENTA_PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {fieldErrors['venta.metodo_pago'] && <p className="field-error">{fieldErrors['venta.metodo_pago']}</p>}
          </div>
          {requiereMetodoPago && (
            <p className="lists-hint" style={{ marginTop: 0 }}>
              Obligatorio si la venta es al contado o si indicas un abono inicial.
            </p>
          )}
        </>
      )}
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="ghost-btn" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        <button type="button" onClick={handleVenta}>{isEditing ? 'Actualizar venta' : 'Guardar venta'}</button>
      </div>
    </article>
  );
}

export default VentaForm;
