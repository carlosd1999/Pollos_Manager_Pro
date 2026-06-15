import { Fragment, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { effectivePaidVenta, sortLotesOldestFirst } from '../../lib/business';
import { formatColones } from '../../lib/formatCurrency';
import { parseDecimalNumber } from '../../lib/parseDecimalInput';
import {
  VENTA_PAYMENT_METHOD_OPTIONS,
  VENTA_PAYMENT_METHOD_VALUES,
  labelMetodoPago,
} from '../../constants/payments';
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
  const [filtroLoteId, setFiltroLoteId] = useState('');
  /** Si el usuario cambia el desplegable, deja de sobrescribir con el lote por defecto. */
  const [filtroLoteManual, setFiltroLoteManual] = useState(false);
  const [simGastos, setSimGastos] = useState('50000');

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

  const lotesOrdenados = useMemo(
    () => sortLotesOldestFirst(lotesWithAvailability || []),
    [lotesWithAvailability],
  );

  /** Lote más viejo con al menos un pollo disponible; si ninguno, vacío (= todos). */
  const loteFiltroPorDefecto = useMemo(() => {
    const hit = lotesOrdenados.find((l) => Number(l.disponibles) > 0);
    return hit ? String(hit.id) : '';
  }, [lotesOrdenados]);

  const ventasFiltradas = useMemo(() => {
    if (!filtroLoteId) return data.ventas;
    const lid = Number(filtroLoteId);
    return data.ventas.filter((v) => Number(v.lote_id) === lid);
  }, [data.ventas, filtroLoteId]);

  const resumenVentas = useMemo(() => {
    let total = 0;
    const porMetodo = {};
    for (const v of ventasFiltradas) {
      const t = Number(v.total_venta || 0);
      total += t;
      const key = v.metodo_pago && String(v.metodo_pago).trim() ? String(v.metodo_pago) : '';
      porMetodo[key] = (porMetodo[key] || 0) + t;
    }
    const filas = [];
    const sin = porMetodo[''] || 0;
    if (sin > 0) filas.push({ key: '', label: 'Pendiente', monto: sin });
    for (const met of VENTA_PAYMENT_METHOD_VALUES) {
      const monto = porMetodo[met];
      if (monto > 0) filas.push({ key: met, label: labelMetodoPago(met), monto });
    }
    const otrosKeys = Object.keys(porMetodo).filter((k) => !VENTA_PAYMENT_METHOD_VALUES.includes(k) && k !== '');
    otrosKeys.sort();
    for (const met of otrosKeys) {
      const monto = porMetodo[met];
      if (monto > 0) filas.push({ key: met, label: labelMetodoPago(met), monto });
    }
    filas.push({ key: '', label: 'Total cancelado', monto: filas
      .filter(item => item.key !== "")
      .reduce((sum, item) => sum + item.monto, 0) });
    return { total, filas };
  }, [ventasFiltradas]);

  const gastosSimulado = useMemo(() => {
    const n = parseDecimalNumber(simGastos);
    return Number.isFinite(n) ? n : 0;
  }, [simGastos]);

  const repartoPorTercio = useMemo(() => {
    const net = resumenVentas.total - gastosSimulado;
    const each = net / 3;
    return { net, each };
  }, [resumenVentas.total, gastosSimulado]);

  /** Pollos totales; peso y precio/kg solo sobre ventas ya pesadas (peso_total > 0). */
  const estadisticasVentas = useMemo(() => {
    let pollosVendidos = 0;
    let pollosPesados = 0;
    let kgPesados = 0;
    let totalColonesPesadas = 0;
    for (const v of ventasFiltradas) {
      const c = Number(v.cantidad || 0);
      const kg = Number(v.peso_total || 0);
      const t = Number(v.total_venta || 0);
      if (Number.isFinite(c) && c > 0) pollosVendidos += c;
      if (Number.isFinite(kg) && kg > 0) {
        kgPesados += kg;
        if (Number.isFinite(c) && c > 0) pollosPesados += c;
        if (Number.isFinite(t) && t >= 0) totalColonesPesadas += t;
      }
    }
    const pesoPromedioPorPolloKg = pollosPesados > 0 ? kgPesados / pollosPesados : null;
    const precioPromedioPorKg = kgPesados > 0 ? totalColonesPesadas / kgPesados : null;
    const totalPromedioPorPollo = totalColonesPesadas > 0 ? totalColonesPesadas / pollosPesados : null;
    return { pollosVendidos, pesoPromedioPorPolloKg, precioPromedioPorKg, pollosPesados, totalPromedioPorPollo };
  }, [ventasFiltradas]);

  const filtroLoteLabel = useMemo(() => {
    if (!filtroLoteId) return '';
    const l = lotesOrdenados.find((x) => String(x.id) === String(filtroLoteId));
    return l ? `Lote ${l.numero_lote}` : '';
  }, [filtroLoteId, lotesOrdenados]);

  useEffect(() => {
    if (expandedId != null && !ventasFiltradas.some((v) => v.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, ventasFiltradas]);

  useEffect(() => {
    if (filtroLoteManual) return;
    setFiltroLoteId(loteFiltroPorDefecto);
  }, [loteFiltroPorDefecto, filtroLoteManual]);

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
      <div className="ventas-list-toolbar form-field-stack">
        <label className="form-field-label" htmlFor="ventas-filtro-lote">
          Filtrar por lote
        </label>
        <select
          id="ventas-filtro-lote"
          value={filtroLoteId}
          onChange={(e) => {
            setFiltroLoteManual(true);
            setFiltroLoteId(e.target.value);
          }}
        >
          <option value="">Todos los lotes</option>
          {lotesOrdenados.map((l) => (
            <option key={l.id} value={String(l.id)}>
              Lote {l.numero_lote} — disponibles {l.disponibles}
            </option>
          ))}
        </select>
      </div>
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
            {data.ventas.length > 0 && ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan={10}>Ninguna venta en el lote seleccionado.</td>
              </tr>
            )}
            {ventasFiltradas.map((v) => {
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
      <div className="ventas-resumen-pagos" aria-live="polite">
        <p className="ventas-resumen-total">
          <strong>
            Total ventas{filtroLoteLabel ? ` (${filtroLoteLabel})` : ''}:
          </strong>{' '}
          {formatColones(resumenVentas.total)}
        </p>
        {resumenVentas.filas.length > 0 ? (
          <>
            <ul className="ventas-resumen-pagos-list">
              {resumenVentas.filas.map((row, idx) => (
                <li key={row.key ? `${row.key}-${idx}` : `pago-${idx}`} className="ventas-resumen-pagos-row">
                  <span>{row.label}</span>
                  <strong>{formatColones(row.monto)}</strong>
                </li>
              ))}
              <li className="ventas-resumen-pagos-row ventas-resumen-pagos-row--gastos-input">
                <label className="ventas-reparto-gastos-label" htmlFor="ventas-sim-gastos">
                  Gastos a descontar
                </label>
                <div className="input-affix ventas-reparto-gastos-affix">
                  <span className="input-affix-symbol input-affix-symbol--leading" aria-hidden="true">
                    ₡
                  </span>
                  <input
                    id="ventas-sim-gastos"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={simGastos}
                    onChange={(e) => setSimGastos(e.target.value)}
                    aria-describedby="ventas-reparto-hint"
                  />
                </div>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Carmen</span>
                <strong>{formatColones(repartoPorTercio.each)}</strong>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Cherania</span>
                <strong>{formatColones(repartoPorTercio.each)}</strong>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Chino</span>
                <strong>{formatColones(repartoPorTercio.each)}</strong>
              </li>
            </ul>
          </>
        ) : (
          <p className="lists-hint" style={{ marginTop: 4 }}>
            No hay montos por forma de pago (sin ventas o totales en cero).
          </p>
        )}
        {ventasFiltradas.length > 0 && (
          <div className="ventas-resumen-estadisticas">
            <p className="ventas-resumen-estadisticas-title">Resumen de ventas</p>
            <ul className="ventas-resumen-pagos-list ventas-resumen-estadisticas-list">
              <li className="ventas-resumen-pagos-row">
                <span>Pollos vendidos</span>
                <strong>{estadisticasVentas.pollosVendidos}</strong>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Peso prom. por pollo</span>
                <strong>
                  {estadisticasVentas.pesoPromedioPorPolloKg != null
                    ? `${estadisticasVentas.pesoPromedioPorPolloKg.toLocaleString('es-CR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} kg`
                    : '—'}
                </strong>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Precio prom. por kg</span>
                <strong>
                  {estadisticasVentas.precioPromedioPorKg != null
                    ? `${formatColones(estadisticasVentas.precioPromedioPorKg)}/kg`
                    : '—'}
                </strong>
              </li>
              <li className="ventas-resumen-pagos-row">
                <span>Total prom. por pollo</span>
                <strong>
                  {estadisticasVentas.totalPromedioPorPollo != null
                    ? `${formatColones(estadisticasVentas.totalPromedioPorPollo)}/kg`
                    : '—'}
                </strong>
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default VentasList;
