import { Fragment, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { effectivePaidVenta } from '../../lib/business';
import { formatColones } from '../../lib/formatCurrency';
import { VENTA_PAYMENT_METHOD_OPTIONS, labelMetodoPago } from '../../constants/payments';
import {
  IconChevronArriba,
  IconEditar,
  IconEliminar,
  IconListaCobros,
  IconRegistrarAbono,
} from '../icons/RowActionIcons';

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
};

function emptyAbono() {
  return { fecha: dayjs().format('YYYY-MM-DD'), monto: '', metodo_pago: '', observaciones: '' };
}

function VentasList({ data, lotesWithAvailability, startEditVenta, confirmDeleteVenta, submitAbono, confirmDeleteAbono, filtroCicloLabel }) {
  const [expandedId, setExpandedId] = useState(null);
  const [abonoDraftByVenta, setAbonoDraftByVenta] = useState({});

  const clienteNombre = (id) => data.clientes.find((c) => c.id === id)?.nombre || id;
  const loteLabel = (id) => {
    const l = data.lotes.find((x) => x.id === id);
    return l ? `Lote ${l.numero_lote}` : id;
  };

  const disponibles = useMemo(() => {
    const m = {};
    lotesWithAvailability.forEach((l) => {
      m[l.id] = l.disponibles;
    });
    return m;
  }, [lotesWithAvailability]);

  const abonosPorVenta = useMemo(() => {
    const acc = {};
    (data.abonos || []).forEach((a) => {
      const k = Number(a.venta_id);
      if (!acc[k]) acc[k] = [];
      acc[k].push(a);
    });
    return acc;
  }, [data.abonos]);

  const toggleAbonos = (ventaId) => {
    setExpandedId((cur) => {
      const next = cur === ventaId ? null : ventaId;
      if (next != null) {
        setAbonoDraftByVenta((d) => ({ ...d, [next]: d[next] || emptyAbono() }));
      }
      return next;
    });
  };

  const setDraft = (ventaId, patch) => {
    setAbonoDraftByVenta((d) => ({
      ...d,
      [ventaId]: { ...(d[ventaId] || emptyAbono()), ...patch },
    }));
  };

  const handleSubmitAbono = async (ventaId) => {
    const draft = abonoDraftByVenta[ventaId] || emptyAbono();
    await submitAbono(ventaId, draft);
    setDraft(ventaId, { monto: '', observaciones: '', metodo_pago: '', fecha: dayjs().format('YYYY-MM-DD') });
  };

  return (
    <section className="card list-panel operaciones-lists">
      <h3>Ventas y cobros</h3>
      <p className="lists-hint">
        {filtroCicloLabel && (
          <>
            Mostrando <strong>{filtroCicloLabel}</strong>. Cambia el ciclo en la cabecera para ver todos.{' '}
          </>
        )}
        Usa el icono de lista para abrir cobros y registrar abonos. El saldo se actualiza solo.
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Lote</th>
              <th>Cant.</th>
              <th>Total</th>
              <th>Cobrado</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Pago</th>
              <th className="col-actions" title="Acciones sobre la venta">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {data.ventas.length === 0 && (
              <tr>
                <td colSpan={10}>Sin ventas aún.</td>
              </tr>
            )}
            {data.ventas.map((v) => {
              const paid = effectivePaidVenta(v, data.abonos);
              const saldo = Number(v.saldo_pendiente ?? Math.max(0, Number(v.total_venta || 0) - paid));
              const list = abonosPorVenta[v.id] || [];
              return (
                <Fragment key={v.id}>
                  <tr>
                    <td>{v.fecha}</td>
                    <td>{clienteNombre(v.cliente_id)}</td>
                    <td>{loteLabel(v.lote_id)}</td>
                    <td>{v.cantidad}</td>
                    <td>{formatColones(v.total_venta)}</td>
                    <td>{formatColones(paid)}</td>
                    <td>{formatColones(saldo)}</td>
                    <td>{ESTADO_LABEL[v.estado_pago] || v.estado_pago}</td>
                    <td>{labelMetodoPago(v.metodo_pago)}</td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="ghost-btn btn-icon"
                          onClick={() => toggleAbonos(v.id)}
                          aria-expanded={expandedId === v.id}
                          aria-label={expandedId === v.id ? 'Ocultar cobros' : 'Ver cobros y abonos'}
                          title={expandedId === v.id ? 'Ocultar cobros' : 'Cobros / abonos'}
                        >
                          {expandedId === v.id ? <IconChevronArriba /> : <IconListaCobros />}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn btn-icon"
                          onClick={() => startEditVenta(v)}
                          aria-label="Editar venta"
                          title="Editar venta"
                        >
                          <IconEditar />
                        </button>
                        <button
                          type="button"
                          className="danger-btn btn-icon"
                          onClick={() => confirmDeleteVenta(v.id)}
                          aria-label="Eliminar venta"
                          title="Eliminar venta"
                        >
                          <IconEliminar />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr className="abonos-row">
                      <td colSpan={10}>
                        <div className="abonos-panel">
                          <p className="lists-hint" style={{ marginTop: 0 }}>
                            Pollos disponibles en este lote (referencia):{' '}
                            {disponibles[v.lote_id] ?? '—'}
                          </p>
                          {list.length === 0 && (
                            <p className="lists-hint">Sin filas de abono; si la venta fue al contado, no se agregan abonos aquí.</p>
                          )}
                          {list.length > 0 && (
                            <div className="table-wrap" style={{ marginBottom: 10 }}>
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Nota</th>
                                    <th className="col-actions" title="Acciones sobre el abono">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {list.map((a) => (
                                    <tr key={a.id}>
                                      <td>{a.fecha}</td>
                                      <td>{formatColones(a.monto)}</td>
                                      <td>{labelMetodoPago(a.metodo_pago)}</td>
                                      <td>{a.observaciones || '—'}</td>
                                      <td className="col-actions">
                                        <button
                                          type="button"
                                          className="danger-btn btn-icon"
                                          onClick={() => confirmDeleteAbono(a.id, v.id)}
                                          aria-label="Eliminar abono"
                                          title="Eliminar abono"
                                        >
                                          <IconEliminar />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="abono-form-grid">
                            <div className="form-field-stack">
                              <label className="form-field-label" htmlFor={`abono-fecha-${v.id}`}>
                                Fecha
                              </label>
                              <input
                                id={`abono-fecha-${v.id}`}
                                type="date"
                                value={(abonoDraftByVenta[v.id] || emptyAbono()).fecha}
                                onChange={(e) => setDraft(v.id, { fecha: e.target.value })}
                              />
                            </div>
                            <div className="form-field-stack">
                              <label className="form-field-label" htmlFor={`abono-monto-${v.id}`}>
                                Monto
                              </label>
                              <div className="input-affix">
                                <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
                                  ₡
                                </span>
                                <input
                                  id={`abono-monto-${v.id}`}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  value={(abonoDraftByVenta[v.id] || emptyAbono()).monto}
                                  onChange={(e) => setDraft(v.id, { monto: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="form-field-stack">
                              <label className="form-field-label" htmlFor={`abono-metodo-${v.id}`}>
                                Forma de pago
                              </label>
                              <select
                                id={`abono-metodo-${v.id}`}
                                value={(abonoDraftByVenta[v.id] || emptyAbono()).metodo_pago}
                                onChange={(e) => setDraft(v.id, { metodo_pago: e.target.value })}
                              >
                                {VENTA_PAYMENT_METHOD_OPTIONS.map((o) => (
                                  <option key={o.value || 'empty'} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-field-stack">
                              <label className="form-field-label" htmlFor={`abono-nota-${v.id}`}>
                                Observaciones (opcional)
                              </label>
                              <input
                                id={`abono-nota-${v.id}`}
                                autoComplete="off"
                                value={(abonoDraftByVenta[v.id] || emptyAbono()).observaciones}
                                onChange={(e) => setDraft(v.id, { observaciones: e.target.value })}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn-icon btn-icon--primary"
                              onClick={() => handleSubmitAbono(v.id)}
                              aria-label="Registrar abono"
                              title="Registrar abono"
                            >
                              <IconRegistrarAbono />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default VentasList;
