import { Fragment, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { effectivePaidVenta, resumenPendientesVentas, sortLotesOldestFirst, sortVentasPorEstadoPago, ventaConCobroPendiente, ventaEsApartadoSinPesar, ventaPendienteEntrega, VENTA_PAGO_EPS } from '../../lib/business';
import { formatColones } from '../../lib/formatCurrency';
import { parseDecimalNumber } from '../../lib/parseDecimalInput';
import {
  clienteIdPorNombreSocio,
  pendienteBucket,
  sumRepartoPagosLoteBucket,
  sumVentasLotePorClienteId,
  tercioReparto,
  totalPendienteRepartoLote,
} from '../../lib/repartoLote';
import {
  clasificarTamanoPolloPorKg,
  CLIENTE_POLLO_PREFERENCIA_OPTIONS,
  labelPreferenciaPolloCorto,
  pesoPromedioPorPolloVenta,
} from '../../constants/clientePolloPreferencia';
import {
  VENTA_PAYMENT_METHOD_OPTIONS,
  VENTA_PAYMENT_METHOD_VALUES,
  labelMetodoPago,
} from '../../constants/payments';
import {
  REPARTO_BUCKET_GASTOS,
  REPARTO_SOCIO_FILAS,
  SOCIAS_REPARTO_TERCIO_COUNT,
  labelRepartoBucket,
} from '../../constants/sociasReparto';
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

const FILTRO_OPERACION_OPTIONS = [
  { value: '', label: 'Todas las operaciones' },
  { value: 'sin_pesar', label: 'Sin pesar (apartados)' },
  { value: 'sin_entregar', label: 'Sin entregar' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'cobro_pendiente', label: 'Cobro pendiente' },
];

const VENTAS_TABLE_COLS = 13;

function emptyAbono() {
  return { fecha: dayjs().format('YYYY-MM-DD'), monto: '', metodo_pago: '', observaciones: '' };
}

/** Texto para el input de monto a partir del saldo (2 decimales máx.). */
function montoSaldoParaInput(saldo) {
  if (!Number.isFinite(saldo) || saldo <= 0) return '';
  const r = Math.round(saldo * 100) / 100;
  return String(r);
}

/** Peso total guardado en la venta (kg); apartados sin pesar muestran —. */
function formatPesoKg(peso) {
  const n = Number(peso);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const texto = n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return `${texto} kg`;
}

function VentasList({
  data,
  lotesWithAvailability,
  startEditVenta,
  confirmDeleteVenta,
  submitAbono,
  confirmDeleteAbono,
  toggleVentaEntregada,
  filtroCicloLabel,
  guardarRepartoGastosObjetivo,
  liquidarRepartoBucket,
  deshacerUltimoRepartoPago,
  isAdmin,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [abonoDraftByVenta, setAbonoDraftByVenta] = useState({});
  const [filtroLoteId, setFiltroLoteId] = useState('');
  /** Si el usuario cambia el desplegable, deja de sobrescribir con el lote por defecto. */
  const [filtroLoteManual, setFiltroLoteManual] = useState(false);
  const [filtroOperacion, setFiltroOperacion] = useState('');
  const [filtroPreferencia, setFiltroPreferencia] = useState('');
  const [simGastos, setSimGastos] = useState('');

  const clienteNombre = (id) => data.clientes.find((c) => c.id === id)?.nombre || id;
  const clientesMap = useMemo(() => {
    const m = {};
    (data.clientes || []).forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [data.clientes]);
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
    let rows = data.ventas;
    if (filtroLoteId) {
      const lid = Number(filtroLoteId);
      rows = rows.filter((v) => Number(v.lote_id) === lid);
    }
    if (filtroOperacion === 'sin_pesar') {
      rows = rows.filter(ventaEsApartadoSinPesar);
    } else if (filtroOperacion === 'sin_entregar') {
      rows = rows.filter(ventaPendienteEntrega);
    } else if (filtroOperacion === 'entregado') {
      rows = rows.filter((v) => !ventaPendienteEntrega(v));
    } else if (filtroOperacion === 'cobro_pendiente') {
      rows = rows.filter((v) => ventaConCobroPendiente(v, data.abonos));
    }
    if (filtroPreferencia) {
      rows = rows.filter((v) => clientesMap[v.cliente_id]?.preferencia_pollo === filtroPreferencia);
    }
    return sortVentasPorEstadoPago(rows, data.abonos);
  }, [data.ventas, data.abonos, filtroLoteId, filtroOperacion, filtroPreferencia, clientesMap]);

  const pendientesResumen = useMemo(
    () => resumenPendientesVentas(data.ventas, data.abonos),
    [data.ventas, data.abonos],
  );

  const resumenVentas = useMemo(() => {
    const PENDIENTE_KEY = '__pendiente__';
    let total = 0;
    const porMetodo = {};
    for (const v of ventasFiltradas) {
      const t = Number(v.total_venta || 0);
      total += t;
      const paid = effectivePaidVenta(v, data.abonos);
      const abonos = abonosPorVenta[Number(v.id)] || [];

      if (abonos.length > 0) {
        for (const a of abonos) {
          const monto = Number(a.monto || 0);
          if (monto <= 0) continue;
          const key = a.metodo_pago && String(a.metodo_pago).trim() ? String(a.metodo_pago) : '';
          porMetodo[key] = (porMetodo[key] || 0) + monto;
        }
      } else if (paid > VENTA_PAGO_EPS) {
        const key = v.metodo_pago && String(v.metodo_pago).trim() ? String(v.metodo_pago) : '';
        porMetodo[key] = (porMetodo[key] || 0) + paid;
      }

      const saldo = Math.max(0, t - paid);
      if (saldo > VENTA_PAGO_EPS) {
        porMetodo[PENDIENTE_KEY] = (porMetodo[PENDIENTE_KEY] || 0) + saldo;
      }
    }

    const totalCancelado = Object.entries(porMetodo)
      .filter(([k]) => k !== PENDIENTE_KEY)
      .reduce((sum, [, monto]) => sum + monto, 0);

    const filas = [];
    const pendiente = porMetodo[PENDIENTE_KEY] || 0;
    if (pendiente > 0) filas.push({ key: PENDIENTE_KEY, label: 'Pendiente', monto: pendiente });
    for (const met of VENTA_PAYMENT_METHOD_VALUES) {
      const monto = porMetodo[met];
      if (monto > 0) filas.push({ key: met, label: labelMetodoPago(met), monto });
    }
    const otrosKeys = Object.keys(porMetodo).filter(
      (k) => !VENTA_PAYMENT_METHOD_VALUES.includes(k) && k !== PENDIENTE_KEY && k !== '',
    );
    otrosKeys.sort();
    for (const met of otrosKeys) {
      const monto = porMetodo[met];
      if (monto > 0) filas.push({ key: met, label: labelMetodoPago(met), monto });
    }
    const sinMetodo = porMetodo[''] || 0;
    if (sinMetodo > 0) filas.push({ key: '', label: 'Sin método', monto: sinMetodo });
    if (totalCancelado > 0) {
      filas.push({ key: 'Cancelado', label: 'Total cancelado', monto: totalCancelado });
    }
    return { total, totalCancelado, filas };
  }, [ventasFiltradas, abonosPorVenta, data.abonos]);

  const gastosSimulado = useMemo(() => {
    const n = parseDecimalNumber(simGastos);
    return Number.isFinite(n) ? n : 0;
  }, [simGastos]);

  const repartoPorTercio = useMemo(() => {
    const net = resumenVentas.total - gastosSimulado;
    const each = net / SOCIAS_REPARTO_TERCIO_COUNT;
    return { net, each };
  }, [resumenVentas.total, gastosSimulado]);

  const loteSeleccionado = useMemo(() => {
    if (!filtroLoteId) return null;
    return data.lotes.find((l) => String(l.id) === String(filtroLoteId)) || null;
  }, [filtroLoteId, data.lotes]);

  useEffect(() => {
    if (!filtroLoteId) setSimGastos('');
  }, [filtroLoteId]);

  useEffect(() => {
    if (!loteSeleccionado) return;
    const raw = loteSeleccionado.reparto_gastos_objetivo;
    const next =
      raw != null && raw !== '' && Number.isFinite(Number(raw)) ? String(Number(raw)) : '';
    setSimGastos((prev) => {
      const a = parseDecimalNumber(prev);
      const b = parseDecimalNumber(next);
      const na = Number.isFinite(a) ? a : 0;
      const nb = Number.isFinite(b) ? b : 0;
      if (na === nb) return prev;
      return next;
    });
  }, [loteSeleccionado?.id, loteSeleccionado?.reparto_gastos_objetivo]);

  const pagosRepartoLote = useMemo(() => {
    if (!filtroLoteId) return [];
    const lid = Number(filtroLoteId);
    return (data.lote_reparto_pagos || []).filter((p) => Number(p.lote_id) === lid);
  }, [data.lote_reparto_pagos, filtroLoteId]);

  /** Compras del lote registradas como ventas al cliente con el mismo nombre que la socia (rebajan su tercio). */
  const rebajasSocioPorBucket = useMemo(() => {
    const acc = { carmen: 0, cherania: 0, carlos: 0 };
    if (!filtroLoteId) return acc;
    const lid = Number(filtroLoteId);
    for (const row of REPARTO_SOCIO_FILAS) {
      const cid = clienteIdPorNombreSocio(data.clientes, row.nombre);
      acc[row.bucket] =
        cid != null ? sumVentasLotePorClienteId(data.ventas, lid, cid) : 0;
    }
    return acc;
  }, [filtroLoteId, data.clientes, data.ventas]);

  const totalDisponibleReparto = useMemo(() => {
    const totalRepartos = REPARTO_SOCIO_FILAS
      .map(({ bucket }) => sumRepartoPagosLoteBucket(pagosRepartoLote, filtroLoteId, bucket))
      .reduce((sum, item) => sum + item, 0);

    const montoCancelado = resumenVentas.totalCancelado;

    const rebajasSocio = REPARTO_SOCIO_FILAS.map(({ bucket }) => rebajasSocioPorBucket[bucket])
      .reduce((sum, item) => sum + item, 0);

    return montoCancelado - totalRepartos - rebajasSocio;
  }, [resumenVentas.totalCancelado, pagosRepartoLote, rebajasSocioPorBucket, filtroLoteId]);

  const totalPendienteReparto = useMemo(() => {
    if (!filtroLoteId) return null;
    return totalPendienteRepartoLote({
      totalVentasLote: resumenVentas.total,
      gastosObjetivo: gastosSimulado,
      pagos: pagosRepartoLote,
      loteId: filtroLoteId,
      rebajasSocio: rebajasSocioPorBucket,
    });
  }, [filtroLoteId, resumenVentas.total, gastosSimulado, pagosRepartoLote, rebajasSocioPorBucket]);

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
        const venta = data.ventas.find((x) => Number(x.id) === Number(next));
        const paid = venta ? effectivePaidVenta(venta, data.abonos) : 0;
        const saldoVenta = Math.max(0, Number(venta?.total_venta || 0) - paid);
        const sinAbonos = (abonosPorVenta[next] || []).length === 0;
        setAbonoDraftByVenta((d) => {
          const prev = d[next];
          const base = emptyAbono();
          const montoInicial =
            sinAbonos && saldoVenta > VENTA_PAGO_EPS ? montoSaldoParaInput(saldoVenta) : '';
          if (!prev) {
            return {
              ...d,
              [next]: {
                ...base,
                fecha: dayjs().format('YYYY-MM-DD'),
                metodo_pago: venta?.metodo_pago || '',
                monto: montoInicial,
              },
            };
          }
          return {
            ...d,
            [next]: {
              ...base,
              ...prev,
              fecha: prev.fecha || dayjs().format('YYYY-MM-DD'),
              metodo_pago: prev.metodo_pago || venta?.metodo_pago || '',
              monto: prev.monto !== '' ? prev.monto : montoInicial,
            },
          };
        });
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
    setDraft(ventaId, {
      monto: '',
      observaciones: '',
      fecha: dayjs().format('YYYY-MM-DD'),
    });
  };

  return (
    <section className="card list-panel operaciones-lists">
      <h3>Ventas y cobros</h3>
      <p className="lists-hint">
        {filtroCicloLabel && (
          <>
            Mostrando <strong>{filtroCicloLabel}</strong>.
          </>
        )}
        <br />
        Usa el icono de lista para abrir cobros y registrar abonos. El saldo se actualiza solo.
      </p>
      <div className="ventas-pendientes-panel" aria-live="polite">
        <h4 className="ventas-pendientes-title">Pendientes operativos</h4>
        <ul className="ventas-pendientes-grid">
          <li>
            <span className="ventas-pendientes-label">Sin pesar</span>
            <strong>{pendientesResumen.sinPesar}</strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Sin entregar</span>
            <strong>
              {pendientesResumen.sinEntregar}
              {pendientesResumen.pollosSinEntregar > 0 && (
                <span className="ventas-pendientes-sub"> ({pendientesResumen.pollosSinEntregar} pollos)</span>
              )}
            </strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Cobro pendiente</span>
            <strong>{pendientesResumen.cobroPendiente}</strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Entregados</span>
            <strong>{pendientesResumen.entregadas}</strong>
          </li>
        </ul>
      </div>
      <div className="ventas-filtros-grid form-field-stack">
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="ventas-filtro-lote">
            Lote
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
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="ventas-filtro-operacion">
            Estado operativo
          </label>
          <select
            id="ventas-filtro-operacion"
            value={filtroOperacion}
            onChange={(e) => setFiltroOperacion(e.target.value)}
          >
            {FILTRO_OPERACION_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="ventas-filtro-preferencia">
            Preferencia pollo
          </label>
          <select
            id="ventas-filtro-preferencia"
            value={filtroPreferencia}
            onChange={(e) => setFiltroPreferencia(e.target.value)}
          >
            <option value="">Todas</option>
            {CLIENTE_POLLO_PREFERENCIA_OPTIONS.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap ventas-table-wrap table-cards-mobile">
        <table className="data-table ventas-main-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Lote</th>
              <th className="ventas-col-secondary">Pref. Peso</th>
              <th>Cant.</th>
              <th>Peso</th>
              <th>Total</th>
              <th>Cobrado</th>
              <th>Saldo</th>
              <th className="ventas-col-secondary">Estado</th>
              <th className="ventas-col-secondary">Pago</th>
              <th className="ventas-col-entregado">Entregado</th>
              <th className="col-actions" title="Acciones sobre la venta">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {data.ventas.length === 0 && (
              <tr>
                <td colSpan={VENTAS_TABLE_COLS}>Sin ventas aún.</td>
              </tr>
            )}
            {data.ventas.length > 0 && ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan={VENTAS_TABLE_COLS}>Ninguna venta coincide con los filtros.</td>
              </tr>
            )}
            {ventasFiltradas.map((v) => {
              const paid = effectivePaidVenta(v, data.abonos);
              const saldo = Math.max(0, Number(v.total_venta || 0) - paid);
              const list = abonosPorVenta[v.id] || [];
              const cliente = clientesMap[v.cliente_id];
              const pref = cliente?.preferencia_pollo || '';
              const kgProm = pesoPromedioPorPolloVenta(v);
              const tamanoReal = clasificarTamanoPolloPorKg(kgProm);
              const entregado = Boolean(v.entregado);
              return (
                <Fragment key={v.id}>
                  <tr className={['venta-row', entregado ? 'venta-row--entregada' : ''].filter(Boolean).join(' ')}>
                    <td data-label="Fecha">{v.fecha || '—'}</td>
                    <td data-label="Cliente">{clienteNombre(v.cliente_id)}</td>
                    <td data-label="Lote">{loteLabel(v.lote_id)}</td>
                    <td className="ventas-col-secondary" data-label="Pref. Peso">
                      {pref ? (
                        <span className={`preferencia-pollo-tag preferencia-pollo-tag--${pref}`}>
                          {labelPreferenciaPolloCorto(pref)}
                        </span>
                      ) : (
                        '—'
                      )}
                      {tamanoReal && kgProm != null && (
                        <span className="venta-peso-real-hint">
                          {' '}
                          Prom: {kgProm.toLocaleString('es-CR', { maximumFractionDigits: 2 })} kg
                          {pref && tamanoReal !== pref ? (
                            <span className="venta-peso-mismatch"> (distinto a pref.)</span>
                          ) : pref && tamanoReal === pref ? (
                            <span className="venta-peso-match"> ✓</span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td data-label="Cant.">{v.cantidad}</td>
                    <td data-label="Peso">{formatPesoKg(v.peso_total)}</td>
                    <td data-label="Total">{formatColones(v.total_venta)}</td>
                    <td data-label="Cobrado">{formatColones(paid)}</td>
                    <td data-label="Saldo">{formatColones(saldo)}</td>
                    <td className="ventas-col-secondary" data-label="Estado">{ESTADO_LABEL[v.estado_pago] || v.estado_pago}</td>
                    <td className="ventas-col-secondary" data-label="Pago">{labelMetodoPago(v.metodo_pago)}</td>
                    <td className="ventas-col-entregado" data-label="Entregado">
                      <button
                        type="button"
                        className={`reparto-check-btn venta-entrega-btn${entregado ? ' reparto-check-btn--done' : ''}`}
                        title={entregado ? 'Marcar como pendiente de entrega' : 'Marcar como entregado'}
                        aria-label={entregado ? 'Marcar como pendiente de entrega' : 'Marcar como entregado'}
                        onClick={() => toggleVentaEntregada(v.id, !entregado)}
                      >
                        {entregado ? '✓' : ''}
                      </button>
                    </td>
                    <td className="col-actions" data-label="Acciones">
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
                          aria-label={isAdmin ? 'Editar venta' : 'Editar peso'}
                          title={isAdmin ? 'Editar venta' : 'Editar peso'}
                        >
                          <IconEditar />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="danger-btn btn-icon"
                            onClick={() => confirmDeleteVenta(v.id)}
                            aria-label="Eliminar venta"
                            title="Eliminar venta"
                          >
                            <IconEliminar />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr className="abonos-row">
                      <td colSpan={VENTAS_TABLE_COLS}>
                        <div className="abonos-panel">
                          <p className="lists-hint" style={{ marginTop: 0 }}>
                            Pollos disponibles en este lote (referencia):{' '}
                            {disponibles[v.lote_id] ?? '—'}
                            {' · '}
                            Peso registrado: <strong>{formatPesoKg(v.peso_total)}</strong>
                          </p>
                          {list.length === 0 && (
                            <p className="lists-hint">Sin filas de abono; si la venta fue al contado, no se agregan abonos aquí.</p>
                          )}
                          {list.length > 0 && (
                            <ul className="abonos-card-list">
                              {list.map((a) => (
                                <li key={a.id} className="abono-card">
                                  <div className="abono-card-body">
                                    <div className="abono-card-field">
                                      <span className="abono-card-label">Fecha</span>
                                      <span>{a.fecha}</span>
                                    </div>
                                    <div className="abono-card-field">
                                      <span className="abono-card-label">Monto</span>
                                      <strong>{formatColones(a.monto)}</strong>
                                    </div>
                                    <div className="abono-card-field">
                                      <span className="abono-card-label">Método</span>
                                      <span>{labelMetodoPago(a.metodo_pago)}</span>
                                    </div>
                                    {a.observaciones ? (
                                      <div className="abono-card-field abono-card-field--full">
                                        <span className="abono-card-label">Nota</span>
                                        <span>{a.observaciones}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    className="danger-btn btn-icon"
                                    onClick={() => confirmDeleteAbono(a.id, v.id)}
                                    aria-label="Eliminar abono"
                                    title="Eliminar abono"
                                  >
                                    <IconEliminar />
                                  </button>
                                </li>
                              ))}
                            </ul>
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
                              {list.length > 0 && saldo > VENTA_PAGO_EPS && (
                                <button
                                  type="button"
                                  className="ghost-btn"
                                  style={{ marginTop: 6 }}
                                  onClick={() => setDraft(v.id, { monto: montoSaldoParaInput(saldo) })}
                                >
                                  Usar saldo pendiente ({formatColones(saldo)})
                                </button>
                              )}
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
                              className="abono-submit-btn"
                              onClick={() => handleSubmitAbono(v.id)}
                            >
                              <IconRegistrarAbono />
                              <span>Registrar abono</span>
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
          <ul className="ventas-resumen-pagos-list">
            {resumenVentas.filas.map((row, idx) => (
              <li key={row.key ? `${row.key}-${idx}` : `pago-${idx}`} className="ventas-resumen-pagos-row">
                <span>{row.label}</span>
                <strong>{formatColones(row.monto)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lists-hint" style={{ marginTop: 4 }}>
            No hay montos por forma de pago (sin ventas o totales en cero).
          </p>
        )}

        {(!filtroLoteId ||
          Number(lotesOrdenados.find((l) => Number(l.id) === Number(filtroLoteId))?.disponibles) !== 0) && (
            <p className="lists-hint" style={{ marginTop: 10 }}>
              Para <strong>gastos a descontar</strong>, <strong>tercios</strong> y marcar <strong>pagos a socias</strong>,
              elegí un lote en el filtro de arriba <strong>con 0 disponibles</strong>.
            </p>
          )}

        {isAdmin && filtroLoteId && lotesOrdenados.find((l) => Number(l.id) === Number(filtroLoteId))?.disponibles === 0 && (
          <div className="ventas-reparto-panel">
            <h4 className="ventas-reparto-panel-title">Reparto del {filtroLoteLabel || `#${filtroLoteId}`}</h4>
            <div className="ventas-reparto-gastos-row form-field-stack">
              <label className="form-field-label" htmlFor="ventas-sim-gastos">
                Gastos a descontar
              </label>
              <div className="ventas-reparto-gastos-controls">
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
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => guardarRepartoGastosObjetivo(Number(filtroLoteId), simGastos)}
                >
                  Guardar objetivo
                </button>
              </div>
            </div>

            <div className="table-wrap ventas-reparto-table-wrap table-cards-mobile">
              <table className="data-table ventas-reparto-table">
                <thead>
                  <tr>
                    <th>Rubro</th>
                    <th>Objetivo</th>
                    <th>Pagado</th>
                    <th>Pendiente</th>
                    <th className="ventas-reparto-col-hecho">Hecho</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const lid = Number(filtroLoteId);
                    const gObj = gastosSimulado;
                    const pagadoG = sumRepartoPagosLoteBucket(pagosRepartoLote, lid, REPARTO_BUCKET_GASTOS);
                    const pendG = pendienteBucket({ objetivo: gObj, pagado: pagadoG });
                    const tercio = tercioReparto(resumenVentas.total, gObj);
                    const rows = [
                      {
                        bucket: REPARTO_BUCKET_GASTOS,
                        label: labelRepartoBucket(REPARTO_BUCKET_GASTOS),
                        objetivo: gObj,
                        pagado: pagadoG,
                        pendiente: pendG,
                      },
                      ...REPARTO_SOCIO_FILAS.map(({ bucket, nombre }) => {
                        const reb = rebajasSocioPorBucket[bucket] || 0;
                        const pag = sumRepartoPagosLoteBucket(pagosRepartoLote, lid, bucket);
                        const obj = Math.max(0, tercio - reb);
                        return {
                          bucket,
                          label: nombre,
                          rebaja: reb,
                          objetivo: obj,
                          pagado: pag,
                          pendiente: pendienteBucket({ objetivo: obj, pagado: pag }),
                        };
                      }),
                    ];
                    return rows.map((row) => {
                      const liquidado = row.pendiente <= VENTA_PAGO_EPS;
                      return (
                        <tr key={row.bucket}>
                          <td data-label="Rubro">
                            {row.label}
                            {row.rebaja != null && row.rebaja > VENTA_PAGO_EPS && (
                              <span className="ventas-reparto-rebaja-hint">
                                <br />
                                Rebaja compras en lote (ventas a este cliente): {formatColones(row.rebaja)}
                              </span>
                            )}
                          </td>
                          <td data-label="Objetivo">{formatColones(row.objetivo)}</td>
                          <td data-label="Pagado">{formatColones(row.pagado)}</td>
                          <td data-label="Pendiente">{formatColones(row.pendiente)}</td>
                          <td className="ventas-reparto-col-hecho" data-label="Hecho">
                            <button
                              type="button"
                              className={`reparto-check-btn${liquidado ? ' reparto-check-btn--done' : ''}`}
                              disabled={!liquidado && row.pendiente <= VENTA_PAGO_EPS}
                              title={
                                liquidado
                                  ? 'Clic para deshacer el último pago de este rubro'
                                  : 'Registrar pago del pendiente y marcar hecho'
                              }
                              aria-label={
                                liquidado
                                  ? `Deshacer último pago: ${row.label}`
                                  : `Pagar pendiente ${formatColones(row.pendiente)}: ${row.label}`
                              }
                              onClick={() => {
                                if (liquidado) {
                                  void deshacerUltimoRepartoPago(lid, row.bucket);
                                } else if (row.pendiente > VENTA_PAGO_EPS) {
                                  void liquidarRepartoBucket(lid, row.bucket, row.pendiente);
                                }
                              }}
                            >
                              {liquidado ? '✓' : ''}
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <p className="ventas-reparto-neto">
              <strong>Neto a repartir (tercios):</strong> {formatColones(repartoPorTercio.net)}
              <br />
              <strong>Pendiente total reparto:</strong> {formatColones(totalPendienteReparto ?? 0)}
              <br />
              <strong>Total disponible para reparto:</strong> {formatColones(totalDisponibleReparto ?? 0)}
            </p>
          </div>
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
