import { useEffect, useMemo, useRef, useState } from 'react';
import { formatColones } from '../../lib/formatCurrency';
import { sortLotesOldestFirst } from '../../lib/business';
import { normalizeDecimalString, parseDecimalNumber } from '../../lib/parseDecimalInput';
import { formatPrecioKgForForm, roundedVentaTotalAndPrecioKg } from '../../lib/ventaPricing';
import { VENTA_PAYMENT_METHOD_OPTIONS } from '../../constants/payments';
import {
  VENTA_FILTRO_PERSONA_OPCIONES,
  defaultRegistrarVentaTabFromFullName,
  defaultVentaClientePersonaFromFullName,
} from '../../constants/ventaClientePersonas';

function mergeVentaConRedondeo(prevForm, patch) {
  const v = { ...prevForm.venta, ...patch };
  const pesoStr = normalizeDecimalString(v.peso_total);
  const pt = pesoStr === '' ? NaN : Number(pesoStr);
  const pkStr = normalizeDecimalString(v.precio_kg);
  const pkNum = pkStr === '' ? NaN : Number(pkStr);

  /** Apartado: peso 0 → reserva pollos sin pesar; total 0 hasta editar con peso real. */
  if (pesoStr !== '' && Number.isFinite(pt) && pt === 0) {
    v.total_redondeado = 0;
    v.pagoCompleto = false;
    v.primerAbono = '';
    return { ...prevForm, venta: v };
  }

  if (pt > 0 && pkNum > 0) {
    const { totalVenta, precioKg } = roundedVentaTotalAndPrecioKg(pt, pkNum);
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
  formResetGeneration = 0,
  currentUserFullName = '',
  isAdmin,
}) {
  const isEditing = Boolean(editingVentaId);
  const edicionSoloPeso = isEditing && !isAdmin;
  const lockLote = isEditing;
  const lotesOrdenados = useMemo(
    () => sortLotesOldestFirst(lotesWithAvailability || []),
    [lotesWithAvailability],
  );

  const loteVentaPorDefecto = useMemo(() => {
    const hit = lotesOrdenados.find((l) => Number(l.disponibles) > 0);
    return hit ? String(hit.id) : '';
  }, [lotesOrdenados]);

  const [loteVentaManual, setLoteVentaManual] = useState(false);
  const [personaClienteFiltro, setPersonaClienteFiltro] = useState(() =>
    defaultVentaClientePersonaFromFullName(currentUserFullName),
  );
  const [registrarTab, setRegistrarTab] = useState(() =>
    defaultRegistrarVentaTabFromFullName(currentUserFullName, isAdmin),
  );
  const prevFormResetGenRef = useRef(null);

  const selectRegistrarTab = (next) => {
    if (next === 'venta' && registrarTab === 'apartado') {
      const ps = normalizeDecimalString(form.venta.peso_total);
      if (ps !== '' && Number.isFinite(Number(ps)) && Number(ps) === 0) {
        setForm((prev) => ({ ...prev, venta: { ...prev.venta, peso_total: '' } }));
      }
    }
    setRegistrarTab(next);
  };

  useEffect(() => {
    if (!isAdmin && registrarTab !== 'apartado') {
      setRegistrarTab('apartado');
    }
  }, [isAdmin, registrarTab]);

  useEffect(() => {
    setRegistrarTab(defaultRegistrarVentaTabFromFullName(currentUserFullName, isAdmin));
  }, [formResetGeneration, currentUserFullName, isAdmin]);

  useEffect(() => {
    if (editingVentaId) {
      setPersonaClienteFiltro('');
      return;
    }
    setPersonaClienteFiltro(defaultVentaClientePersonaFromFullName(currentUserFullName));
  }, [formResetGeneration, editingVentaId, currentUserFullName]);

  const clientesFiltrados = useMemo(() => {
    const all = data.clientes || [];
    const q = personaClienteFiltro.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => (c.nombre || '').toLowerCase().includes(q));
  }, [data.clientes, personaClienteFiltro]);

  const clientesParaSelect = useMemo(() => {
    const selId = form.venta.cliente_id != null && form.venta.cliente_id !== '' ? String(form.venta.cliente_id) : '';
    if (!selId) return clientesFiltrados;
    const inList = clientesFiltrados.some((c) => String(c.id) === selId);
    if (inList) return clientesFiltrados;
    const selected = (data.clientes || []).find((c) => String(c.id) === selId);
    if (!selected) return clientesFiltrados;
    return [selected, ...clientesFiltrados];
  }, [clientesFiltrados, data.clientes, form.venta.cliente_id]);

  useEffect(() => {
    if (editingVentaId) {
      prevFormResetGenRef.current = formResetGeneration;
      return;
    }
    const genBumped =
      prevFormResetGenRef.current !== null && prevFormResetGenRef.current !== formResetGeneration;
    prevFormResetGenRef.current = formResetGeneration;

    if (genBumped) setLoteVentaManual(false);
    if (!genBumped && loteVentaManual) return;

    setForm((prev) => {
      const next = loteVentaPorDefecto;
      const cur = prev.venta.lote_id != null && prev.venta.lote_id !== '' ? String(prev.venta.lote_id) : '';
      if (cur === next) return prev;
      return { ...prev, venta: { ...prev.venta, lote_id: next } };
    });
  }, [formResetGeneration, editingVentaId, loteVentaManual, loteVentaPorDefecto, setForm]);

  const pesoStrForm = normalizeDecimalString(form.venta.peso_total);
  const esApartado =
    pesoStrForm !== '' && Number.isFinite(Number(pesoStrForm)) && Number(pesoStrForm) === 0;

  const totalMostrar =
    form.venta.total_redondeado !== '' && form.venta.total_redondeado != null
      ? Number(form.venta.total_redondeado)
      : null;

  const requiereMetodoPago =
    !esApartado &&
    !isEditing &&
    (form.venta.pagoCompleto || (form.venta.primerAbono !== '' && parseDecimalNumber(form.venta.primerAbono) > 0));

  const fechaField = (
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
  );

  const clienteBlock = (
    <div className="form-field-stack venta-cliente-field-group">
      <p className="form-field-label form-field-label--section">Cliente</p>
      <label className="form-field-label form-field-label--nested" htmlFor="venta-cliente-persona-filtro">
        Filtrar por persona
      </label>
      <select
        id="venta-cliente-persona-filtro"
        className="venta-cliente-persona-filter"
        value={personaClienteFiltro}
        aria-label="Filtrar clientes por persona"
        onChange={(e) => setPersonaClienteFiltro(e.target.value)}
      >
        <option value="">Todos los clientes</option>
        {VENTA_FILTRO_PERSONA_OPCIONES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <label className="form-field-label form-field-label--nested" htmlFor="venta-cliente">
        Elegir cliente
      </label>
      <select
        id="venta-cliente"
        className={inputClass('venta.cliente_id')}
        value={form.venta.cliente_id}
        onChange={(e) => {
          setForm({ ...form, venta: { ...form.venta, cliente_id: e.target.value } });
          setFieldErrors((prev) => ({ ...prev, 'venta.cliente_id': '' }));
        }}
      >
        <option value="">Seleccionar…</option>
        {clientesParaSelect.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </option>
        ))}
      </select>
      {personaClienteFiltro.trim() && (
        <p className="lists-hint" style={{ marginTop: 4 }}>
          {clientesFiltrados.length === 0
            ? form.venta.cliente_id
              ? 'Sin coincidencias con el filtro; el cliente ya elegido sigue en la lista.'
              : 'Sin coincidencias con el filtro.'
            : `${clientesFiltrados.length} cliente(s) que coinciden`}
        </p>
      )}
      {fieldErrors['venta.cliente_id'] && <p className="field-error">{fieldErrors['venta.cliente_id']}</p>}
    </div>
  );

  const loteField = (
    <div className="form-field-stack">
      <label className="form-field-label" htmlFor="venta-lote">
        Lote
      </label>
      <select
        id="venta-lote"
        className={inputClass('venta.lote_id')}
        value={form.venta.lote_id === '' || form.venta.lote_id == null ? '' : String(form.venta.lote_id)}
        disabled={lockLote}
        onChange={(e) => {
          setLoteVentaManual(true);
          setForm({ ...form, venta: { ...form.venta, lote_id: e.target.value } });
          setFieldErrors((prev) => ({ ...prev, 'venta.lote_id': '' }));
        }}
      >
        <option value="">Seleccionar…</option>
        {lotesOrdenados.map((lote) => (
          <option key={lote.id} value={String(lote.id)}>
            Lote {lote.numero_lote} — disponibles {lote.disponibles}
          </option>
        ))}
      </select>
      {fieldErrors['venta.lote_id'] && <p className="field-error">{fieldErrors['venta.lote_id']}</p>}
    </div>
  );

  const cantidadField = (
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
  );

  const pesoPrecioTotalYPagos = (
    <>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="venta-peso-total">
          Peso total (kg)
        </label>
        <div
          className={['input-affix', fieldErrors['venta.peso_total'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}
        >
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
          Precio por kilogramo{esApartado ? ' (opcional)' : ''}
        </label>
        <div
          className={['input-affix', fieldErrors['venta.precio_kg'] ? 'input-affix--error' : ''].filter(Boolean).join(' ')}
        >
          <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
            ₡
          </span>
          <input
            id="venta-precio-kg"
            className={inputClass('venta.precio_kg')}
            inputMode="decimal"
            autoComplete="off"
            readOnly={edicionSoloPeso}
            value={form.venta.precio_kg}
            onChange={(e) => {
              if (edicionSoloPeso) return;
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
              form.venta.cantidad && pesoStrForm !== '' && Number(pesoStrForm) > 0
                ? (Number(pesoStrForm) / Number(form.venta.cantidad)).toFixed(2)
                : esApartado
                  ? '—'
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
          value={totalMostrar != null && Number.isFinite(totalMostrar) ? formatColones(totalMostrar) : ''}
        />
      </div>
      {!isEditing && (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              disabled={esApartado}
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
          {esApartado && (
            <p className="lists-hint" style={{ marginTop: 4 }}>
              En apartado no aplica cobro hasta registrar peso y total.
            </p>
          )}
          {!form.venta.pagoCompleto && (
            <>
              <div className="form-field-stack">
                <label className="form-field-label" htmlFor="venta-primer-abono">
                  Abono inicial (opcional)
                </label>
                <div
                  className={['input-affix', fieldErrors['venta.primerAbono'] ? 'input-affix--error' : ''].filter(Boolean).join(
                    ' ',
                  )}
                >
                  <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
                    ₡
                  </span>
                  <input
                    id="venta-primer-abono"
                    className={inputClass('venta.primerAbono')}
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={esApartado}
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
      {(requiereMetodoPago || (isEditing && isAdmin)) && (
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
    </>
  );

  const clienteNombre = (id) => data.clientes.find((c) => c.id === id)?.nombre || id;
  const loteNumero = (id) => {
    const l = data.lotes.find((x) => x.id === id);
    return l ? l.numero_lote : id;
  };

  const ventaEdicionResumen = edicionSoloPeso ? (
    <div className="venta-edicion-resumen lists-hint">
      <p className="venta-edicion-resumen-title">Datos de la venta (solo lectura)</p>
      <ul className="venta-edicion-resumen-list">
        <li>
          <span>Fecha</span>
          <strong>{form.venta.fecha}</strong>
        </li>
        <li>
          <span>Cliente</span>
          <strong>{clienteNombre(Number(form.venta.cliente_id))}</strong>
        </li>
        <li>
          <span>Lote</span>
          <strong>{loteNumero(Number(form.venta.lote_id))}</strong>
        </li>
        <li>
          <span>Cantidad</span>
          <strong>{form.venta.cantidad} pollo(s)</strong>
        </li>
      </ul>
    </div>
  ) : null;

  return (
    <article className="card">
      <h3>{edicionSoloPeso ? 'Editar peso de venta' : isEditing ? 'Editar venta' : 'Registrar venta'}</h3>

      {!isEditing && isAdmin && (
        <div className="venta-form-subtabs" role="tablist" aria-label="Tipo de registro">
          <button
            type="button"
            role="tab"
            aria-selected={registrarTab === 'venta'}
            className={registrarTab === 'venta' ? 'active' : ''}
            onClick={() => selectRegistrarTab('venta')}
          >
            Venta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={registrarTab === 'apartado'}
            className={registrarTab === 'apartado' ? 'active' : ''}
            onClick={() => selectRegistrarTab('apartado')}
          >
            Apartado
          </button>
        </div>
      )}
      {ventaEdicionResumen}
      {!edicionSoloPeso && fechaField}
      {!edicionSoloPeso && clienteBlock}
      {!edicionSoloPeso && loteField}
      {!edicionSoloPeso && cantidadField}
      {isEditing && pesoPrecioTotalYPagos}
      {!isEditing && registrarTab === 'venta' && pesoPrecioTotalYPagos}
      {!isEditing && (isAdmin ? registrarTab === 'apartado' : true) && (
        <div className="form-actions">
          <button type="button" onClick={() => handleVenta({ apartado: true })}>
            Guardar apartado
          </button>
        </div>
      )}

      {(isEditing || (isAdmin && registrarTab === 'venta')) && (
        <div className="form-actions">
          {isEditing && (
            <button type="button" className="ghost-btn" onClick={onCancelEdit}>
              Cancelar
            </button>
          )}
          {isEditing ? (
            <button type="button" onClick={() => handleVenta({ soloPeso: edicionSoloPeso })}>
              {edicionSoloPeso ? 'Guardar peso' : 'Actualizar venta'}
            </button>
          ) : (
            registrarTab === 'venta' && (
              <button type="button" onClick={() => handleVenta()}>
                Guardar venta
              </button>
            )
          )}
        </div>
      )}
    </article>
  );
}

export default VentaForm;
