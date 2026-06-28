import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { createInitialForm, TABLES } from '../constants/app';
import { REPARTO_BUCKETS_VALIDOS, labelRepartoBucket } from '../constants/sociasReparto';
import { formatColones } from '../lib/formatCurrency';
import {
  calculateAvailableByLote,
  calculateGlobalStats,
  computeCurrentCycle,
  effectivePaidVenta,
  EXPENSE_CATEGORY_PURCHASE,
  nextCicloNumero,
  nextLoteNumber,
  pollosComprometidosPorLote,
  sortLotesOldestFirst,
  VENTA_PAGO_EPS,
} from '../lib/business';
import { parseDecimalNumber } from '../lib/parseDecimalInput';
import { scrollModuleFormIntoView } from '../lib/scrollUi';
import { supabase } from '../lib/supabase';
import {
  closeCiclo,
  createAbono,
  createCiclo,
  createCliente,
  createGasto,
  createLote,
  createLoteRepartoPago,
  createMortalidad,
  createVenta,
  deleteAbono,
  deleteLastLoteRepartoPago,
  deleteCliente,
  deleteGasto,
  deleteLote,
  deleteMortalidad,
  deleteVenta,
  fetchTable,
  recalculateVentaEstado,
  updateCliente,
  updateGasto,
  updateLote,
  updateMortalidad,
  updateVenta,
} from '../services/pollosService';
import {
  validateAbonoForm,
  validateCliente,
  validateGasto,
  validateMortalidad,
  validatePrimerAbono,
  validateVenta,
  validateVentaMetodoPago,
} from '../validators/operacionesValidators';
import { floorTotalVentaColones, roundedVentaTotalAndPrecioKg } from '../lib/ventaPricing';

const COLORS = [
  "#1f77b4", // azul
  "#ff7f0e", // naranja
  "#2ca02c", // verde
  "#d62728", // rojo
  "#9467bd", // morado
  "#8c564b", // café
  "#e377c2", // rosado fuerte
  "#7f7f7f", // gris
  "#bcbd22", // verde oliva
  "#17becf", // celeste
  "#393b79", // azul oscuro
  "#637939", // verde oscuro
  "#8c6d31", // mostaza
  "#843c39", // rojo oscuro
  "#7b4173", // púrpura oscuro
  "#3182bd", // azul vivo
  "#e6550d", // naranja fuerte
  "#31a354", // verde brillante
  "#756bb1", // violeta
  "#636363", // gris oscuro
];

/** Mensajes de éxito/error en header: auto-cierra para no quedar pegados. */
const STATUS_SUCCESS_DISMISS_MS = 5000;
const STATUS_ERROR_DISMISS_MS = 8000;

export function usePollosManager(user, rowOwnerId, { isAdmin = false } = {}) {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({
    ciclos: [],
    lotes: [],
    mortalidad: [],
    gastos: [],
    ventas: [],
    clientes: [],
    abonos: [],
    lote_reparto_pagos: [],
  });
  const [form, setForm] = useState(createInitialForm);
  /** Se incrementa en cada resetForm() para que VentaForm vuelva a aplicar el lote sugerido. */
  const [formResetGeneration, setFormResetGeneration] = useState(0);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const statusDismissTimerRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingGastoId, setEditingGastoId] = useState(null);
  const [editingVentaId, setEditingVentaId] = useState(null);
  const [editingMortalidadId, setEditingMortalidadId] = useState(null);
  const [editingClienteId, setEditingClienteId] = useState(null);
  /** Al cargar datos, vista = ciclo más antiguo (menor `numero`); el usuario puede cambiar a «Todos». */
  const [vistaCicloId, setVistaCicloId] = useState('');
  const vistaCicloDefaultApplied = useRef(false);

  const clearEditing = () => {
    setEditingGastoId(null);
    setEditingVentaId(null);
    setEditingMortalidadId(null);
    setEditingClienteId(null);
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setFieldErrors({});
    setFormResetGeneration((g) => g + 1);
  };

  const clearStatusDismissTimer = () => {
    if (statusDismissTimerRef.current != null) {
      clearTimeout(statusDismissTimerRef.current);
      statusDismissTimerRef.current = null;
    }
  };

  const dismissStatus = useCallback(() => {
    clearStatusDismissTimer();
    setStatus('');
  }, []);

  const scheduleStatusAutoDismiss = (ms) => {
    clearStatusDismissTimer();
    statusDismissTimerRef.current = window.setTimeout(() => {
      statusDismissTimerRef.current = null;
      setStatus('');
    }, ms);
  };

  const setErrorStatus = (message) => {
    setStatus(message);
    setStatusType('error');
    scheduleStatusAutoDismiss(STATUS_ERROR_DISMISS_MS);
  };

  const setSuccessStatus = (message) => {
    setStatus(message);
    setStatusType('success');
    scheduleStatusAutoDismiss(STATUS_SUCCESS_DISMISS_MS);
  };

  useEffect(
    () => () => {
      if (statusDismissTimerRef.current != null) {
        clearTimeout(statusDismissTimerRef.current);
        statusDismissTimerRef.current = null;
      }
    },
    [],
  );

  const inputClass = (fieldKey) => (fieldErrors[fieldKey] ? 'input-error' : '');

  const readAll = async () => {
    if (!supabase || !user || rowOwnerId == null) return;
    const results = await Promise.all(TABLES.map((table) => fetchTable(table)));
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      setErrorStatus(`Error cargando datos: ${firstError.message}`);
      return;
    }
    const next = {};
    TABLES.forEach((table, index) => {
      next[table] = results[index].data || [];
    });
    setData(next);
  };

  useEffect(() => {
    vistaCicloDefaultApplied.current = false;
    setVistaCicloId('');
    readAll();
    if (!supabase || !user || rowOwnerId == null) return;
    const channel = supabase.channel('pollos-realtime');
    TABLES.forEach((table) => channel.on('postgres_changes', { event: '*', schema: 'public', table }, readAll));
    channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [user?.id, rowOwnerId]);

  useEffect(() => {
    if (vistaCicloDefaultApplied.current) return;
    if (!data.ciclos?.length) return;
    const oldest = [...data.ciclos].sort((a, b) => {
      const n = Number(a.numero) - Number(b.numero);
      if (n !== 0) return n;
      return String(a.fecha_inicio || '').localeCompare(String(b.fecha_inicio || ''));
    })[0];
    if (!oldest?.id) return;
    setVistaCicloId(String(oldest.id));
    vistaCicloDefaultApplied.current = true;
  }, [data.ciclos]);

  useEffect(() => {
    if (editingGastoId) return;
    if (form.gasto.ciclo_id) return;
    const activos = (data.ciclos || []).filter((c) => c.estado === 'activo');
    if (activos.length !== 1) return;
    setForm((p) => ({ ...p, gasto: { ...p.gasto, ciclo_id: String(activos[0].id) } }));
  }, [data.ciclos, editingGastoId, form.gasto.ciclo_id]);

  const lotesWithAvailability = useMemo(
    () => calculateAvailableByLote(data.lotes, data.mortalidad, data.ventas),
    [data.lotes, data.mortalidad, data.ventas],
  );
  const stats = useMemo(() => calculateGlobalStats(data), [data]);

  const dataVista = useMemo(() => {
    if (!vistaCicloId) return data;
    const cid = Number(vistaCicloId);
    const ventas = data.ventas.filter((v) => Number(v.ciclo_id) === cid);
    const ventaIds = new Set(ventas.map((v) => v.id));
    const lotes = sortLotesOldestFirst(data.lotes.filter((l) => Number(l.ciclo_id) === cid));
    const loteIds = new Set(lotes.map((l) => l.id));
    return {
      ...data,
      ciclos: data.ciclos.filter((c) => Number(c.id) === cid),
      gastos: data.gastos.filter((g) => Number(g.ciclo_id) === cid),
      ventas,
      abonos: data.abonos.filter((a) => ventaIds.has(Number(a.venta_id))),
      lotes,
      mortalidad: data.mortalidad.filter((m) => loteIds.has(Number(m.lote_id))),
      lote_reparto_pagos: (data.lote_reparto_pagos || []).filter((p) => loteIds.has(Number(p.lote_id))),
    };
  }, [data, vistaCicloId]);

  const lotesWithAvailabilityVista = useMemo(() => {
    if (!vistaCicloId) return lotesWithAvailability;
    const cid = Number(vistaCicloId);
    return sortLotesOldestFirst(lotesWithAvailability.filter((l) => Number(l.ciclo_id) === cid));
  }, [lotesWithAvailability, vistaCicloId]);

  /** Lotes en formularios de venta/mortalidad: respeta filtro de vista e incluye el lote al editar aunque no coincida */
  const lotesWithAvailabilityOperaciones = useMemo(() => {
    if (!vistaCicloId) return lotesWithAvailability;
    const cid = Number(vistaCicloId);
    let list = lotesWithAvailability.filter((l) => Number(l.ciclo_id) === cid);
    if (editingVentaId) {
      const v = data.ventas.find((x) => x.id === editingVentaId);
      if (v && !list.some((l) => l.id === v.lote_id)) {
        const extra = lotesWithAvailability.find((l) => l.id === v.lote_id);
        if (extra) list = [extra, ...list];
      }
    }
    if (editingMortalidadId) {
      const m = data.mortalidad.find((x) => x.id === editingMortalidadId);
      if (m && !list.some((l) => l.id === m.lote_id)) {
        const extra = lotesWithAvailability.find((l) => l.id === m.lote_id);
        if (extra) list = [extra, ...list];
      }
    }
    return sortLotesOldestFirst(list);
  }, [
    vistaCicloId,
    lotesWithAvailability,
    editingVentaId,
    editingMortalidadId,
    data.ventas,
    data.mortalidad,
  ]);

  const statsVista = useMemo(() => {
    if (!vistaCicloId) return stats;
    const cid = Number(vistaCicloId);
    const ciclos = data.ciclos.filter((c) => Number(c.id) === cid);
    const lotes = sortLotesOldestFirst(data.lotes.filter((l) => Number(l.ciclo_id) === cid));
    const gastos = data.gastos.filter((g) => Number(g.ciclo_id) === cid);
    const ventas = data.ventas.filter((v) => Number(v.ciclo_id) === cid);
    const loteIds = new Set(lotes.map((l) => l.id));
    const mortalidad = data.mortalidad.filter((m) => loteIds.has(Number(m.lote_id)));
    return calculateGlobalStats({ ciclos, lotes, gastos, ventas, mortalidad });
  }, [vistaCicloId, data, stats]);

  const gastoPorCategoria = useMemo(
    () =>
      Object.values(
        data.gastos.reduce((acc, item, index) => {
          const key = item.categoria || 'Otros';
          acc[key] = {
            categoria: key,
            total: (acc[key]?.total || 0) + Number(item.monto || 0),
            fill: COLORS[index % COLORS.length],
          };
          return acc;
        }, {}),
      ),
    [data.gastos],
  );

  const gastoPorCategoriaVista = useMemo(() => {
    const gastos = vistaCicloId
      ? data.gastos.filter((g) => Number(g.ciclo_id) === Number(vistaCicloId))
      : data.gastos;
    return Object.values(
      gastos.reduce((acc, item, index) => {
        const key = item.categoria || 'Otros';
        acc[key] = {
          categoria: key,
          total: (acc[key]?.total || 0) + Number(item.monto || 0),
          fill: COLORS[index % COLORS.length],
        };
        return acc;
      }, {}),
    );
  }, [data.gastos, vistaCicloId]);

  const utilidadPorCiclo = useMemo(
    () =>
      data.ciclos.map((ciclo) => {
        const ventas = data.ventas
          .filter((v) => data.lotes.some((l) => l.id === v.lote_id && l.ciclo_id === ciclo.id))
          .reduce((sum, v) => sum + Number(v.total_venta || 0), 0);
        const gastos = data.gastos.filter((g) => g.ciclo_id === ciclo.id).reduce((sum, g) => sum + Number(g.monto || 0), 0);
        return { name: `Ciclo ${ciclo.numero}`, utilidad: ventas - gastos };
      }),
    [data],
  );

  const utilidadPorCicloVista = useMemo(() => {
    if (!vistaCicloId) return utilidadPorCiclo;
    const c = data.ciclos.find((x) => Number(x.id) === Number(vistaCicloId));
    if (!c) return [];
    const row = utilidadPorCiclo.find((u) => u.name === `Ciclo ${c.numero}`);
    return row ? [row] : [];
  }, [vistaCicloId, utilidadPorCiclo, data.ciclos]);

  const vistaCicloLabel = useMemo(() => {
    if (!vistaCicloId) return null;
    const c = data.ciclos.find((x) => Number(x.id) === Number(vistaCicloId));
    return c ? `Ciclo ${c.numero}` : null;
  }, [vistaCicloId, data.ciclos]);

  const createCycleIfNeeded = async () => {
    const current = computeCurrentCycle(data.ciclos);
    if (!current) {
      const { data: inserted, error } = await createCiclo({
        user_id: rowOwnerId,
        numero: nextCicloNumero(data.ciclos),
        fecha_inicio: dayjs().format('YYYY-MM-DD'),
        estado: 'activo',
      });
      if (error) throw new Error(error.message);
      return inserted;
    }
    return current;
  };

  const handleGasto = async () => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    try {
      if (editingGastoId) {
        const existing = data.gastos.find((g) => g.id === editingGastoId);
        if (!existing) return setErrorStatus('Gasto no encontrado');
        const gastoForm = {
          ...form.gasto,
          categoria: existing.lote_id ? EXPENSE_CATEGORY_PURCHASE : form.gasto.categoria,
          ciclo_id: existing.ciclo_id != null ? String(existing.ciclo_id) : '',
        };
        const { errors, parsedAmount } = validateGasto(gastoForm);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return setErrorStatus('Corrige los campos en rojo');
        }
        if (existing.lote_id) {
          const nuevaCantidad = Number(gastoForm.cantidad_pollos);
          const minima = pollosComprometidosPorLote(existing.lote_id, data.ventas, data.mortalidad);
          if (nuevaCantidad < minima) {
            setFieldErrors({
              'gasto.cantidad_pollos': `No puede ser menor a ${minima} (ventas y mortalidad ya registradas en este lote).`,
            });
            return setErrorStatus('La cantidad comprada no puede quedar por debajo de lo ya vendido o dado de baja.');
          }
        }
        setFieldErrors({});
        const { error: gastoError } = await updateGasto(editingGastoId, {
          fecha: gastoForm.fecha,
          monto: parsedAmount,
          categoria: gastoForm.categoria,
          detalle: gastoForm.detalle?.trim() || null,
          ciclo_id: existing.ciclo_id,
          lote_id: existing.lote_id,
        });
        if (gastoError) throw new Error(gastoError.message);
        if (existing.lote_id) {
          const cantidadComprada = Number(gastoForm.cantidad_pollos);
          const { error: loteError } = await updateLote(existing.lote_id, {
            fecha_ingreso: gastoForm.fecha,
            cantidad_comprada: cantidadComprada,
            precio_compra: parsedAmount,
            precio_unitario: cantidadComprada ? parsedAmount / cantidadComprada : 0,
          });
          if (loteError) throw new Error(loteError.message);
        }
        await readAll();
        resetForm();
        clearEditing();
        setSuccessStatus('Gasto actualizado correctamente');
        return;
      }
      const { errors, parsedAmount } = validateGasto(form.gasto, { skipCiclo: data.ciclos.length === 0 });
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return setErrorStatus('Corrige los campos en rojo');
      }
      setFieldErrors({});

      let cycleId;
      if (data.ciclos.length === 0) {
        const inserted = await createCycleIfNeeded();
        cycleId = inserted.id;
      } else {
        cycleId = Number(form.gasto.ciclo_id);
        if (!Number.isFinite(cycleId) || cycleId <= 0) {
          setFieldErrors({ 'gasto.ciclo_id': 'Selecciona un ciclo' });
          return setErrorStatus('Selecciona el ciclo donde registrar este gasto.');
        }
        if (!data.ciclos.some((c) => Number(c.id) === cycleId)) {
          return setErrorStatus('El ciclo seleccionado no existe. Recarga los datos.');
        }
      }

      const expensePayload = { ...form.gasto, monto: parsedAmount, ciclo_id: cycleId, user_id: rowOwnerId };

      if (form.gasto.categoria === EXPENSE_CATEGORY_PURCHASE) {
        const loteNumero = nextLoteNumber(data.lotes, cycleId);
        const cantidadComprada = Number(form.gasto.cantidad_pollos);
        const { data: lote, error: loteError } = await createLote({
          user_id: rowOwnerId,
          ciclo_id: cycleId,
          numero_lote: loteNumero,
          fecha_ingreso: form.gasto.fecha,
          cantidad_comprada: cantidadComprada,
          precio_compra: parsedAmount,
          precio_unitario: cantidadComprada ? parsedAmount / cantidadComprada : 0,
          semana_ciclo: loteNumero,
          estado: 'activo',
        });
        if (loteError) throw new Error(loteError.message);
        expensePayload.lote_id = lote.id;
      }

      delete expensePayload.cantidad_pollos;
      const { error: gastoError } = await createGasto(expensePayload);
      if (gastoError) throw new Error(gastoError.message);
      await readAll();
      resetForm();
      setSuccessStatus('Gasto registrado correctamente');
    } catch (error) {
      setErrorStatus(`No se pudo guardar el gasto: ${error.message}`);
    }
  };

  const handleVenta = async (opts = {}) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (opts.apartado && editingVentaId) {
      return setErrorStatus('Los apartados solo se registran como venta nueva.');
    }
    if (!isAdmin && !opts.apartado && !editingVentaId) {
      return setErrorStatus('Solo puedes registrar apartados. Ingresa el peso editando la venta después.');
    }
    try {
      const venta = opts.apartado
        ? {
            ...form.venta,
            peso_total: '0',
            precio_kg: String(form.venta.precio_kg ?? '').trim() === '' ? '0' : form.venta.precio_kg,
            total_redondeado: '',
            pagoCompleto: false,
            primerAbono: '',
            metodo_pago: '',
          }
        : form.venta;
      const editingVenta = editingVentaId ? data.ventas.find((v) => v.id === editingVentaId) : null;
      const loteIdParaValidar =
        editingVentaId && opts.soloPeso && editingVenta
          ? editingVenta.lote_id
          : venta.lote_id;
      const lote = lotesWithAvailability.find((item) => item.id === Number(loteIdParaValidar));
      let ventaParaValidar = venta;
      if (editingVentaId && opts.soloPeso && editingVenta) {
        ventaParaValidar = {
          ...venta,
          fecha: editingVenta.fecha,
          cliente_id: String(editingVenta.cliente_id ?? ''),
          lote_id: String(editingVenta.lote_id ?? ''),
          cantidad: String(editingVenta.cantidad ?? ''),
          metodo_pago: editingVenta.metodo_pago || '',
          precio_kg:
            String(venta.precio_kg ?? '').trim() !== ''
              ? venta.precio_kg
              : String(editingVenta.precio_kg ?? ''),
        };
      }
      const { errors, cantidad, pesoTotal, precioKg, isApartado } = validateVenta(ventaParaValidar, lote, {
        editingVenta,
        disallowApartado: !opts.apartado && !editingVentaId,
      });
      const apartadoPagoErrors = {};
      if (isApartado && (venta.pagoCompleto || (venta.primerAbono !== '' && parseDecimalNumber(venta.primerAbono) > 0))) {
        apartadoPagoErrors['venta.peso_total'] =
          'Apartado sin peso: desactiva pago al contado y deja sin abono inicial hasta registrar peso y total.';
      }

      let totalVenta;
      let precioKgDb;
      if (isApartado) {
        totalVenta = 0;
        precioKgDb = Number(Number(precioKg).toFixed(8)) || 0;
      } else {
        const totalFromForm =
          venta.total_redondeado !== '' &&
          venta.total_redondeado != null &&
          Number.isFinite(Number(venta.total_redondeado))
            ? floorTotalVentaColones(Number(venta.total_redondeado))
            : null;
        const recomputed = roundedVentaTotalAndPrecioKg(pesoTotal, precioKg);
        totalVenta =
          totalFromForm != null && totalFromForm > 0 ? totalFromForm : recomputed.totalVenta;
        precioKgDb =
          totalFromForm != null && totalFromForm > 0
            ? Number(Number(precioKg).toFixed(8))
            : Number(Number(recomputed.precioKg).toFixed(8));
      }

      if (!isApartado && totalVenta < 25) {
        setFieldErrors({
          ...errors,
          ...apartadoPagoErrors,
          'venta.precio_kg': 'El total redondeado debe ser al menos ₡25; aumenta peso o precio por kg.',
        });
        return setErrorStatus('El total de la venta redondeado es demasiado bajo.');
      }
      const { errors: pe, primer } = validatePrimerAbono(venta.primerAbono, totalVenta, venta.pagoCompleto);
      const { errors: me } = validateVentaMetodoPago(venta, primer);
      const merged = { ...errors, ...apartadoPagoErrors, ...pe, ...me };
      if (Object.keys(merged).length > 0) {
        setFieldErrors(merged);
        return setErrorStatus('Corrige los campos en rojo');
      }
      setFieldErrors({});
      const pesoPromedio = cantidad > 0 && pesoTotal > 0 ? pesoTotal / cantidad : 0;

      if (editingVentaId) {
        const existing = data.ventas.find((v) => v.id === editingVentaId);
        if (!existing) return setErrorStatus('Venta no encontrada');
        if (!isAdmin && !opts.soloPeso) {
          return setErrorStatus('Solo puedes corregir el peso de la venta.');
        }
        const paid = effectivePaidVenta(existing, data.abonos);
        const abonosDeEsta = (data.abonos || []).filter((a) => Number(a.venta_id) === Number(editingVentaId));
        const onlyLegacyPaid =
          abonosDeEsta.length === 0 && existing.estado_pago === 'pagado';
        const updatePayload = {
          fecha: venta.fecha,
          cliente_id: Number(venta.cliente_id),
          lote_id: Number(venta.lote_id),
          ciclo_id: existing.ciclo_id,
          cantidad,
          peso_total: pesoTotal,
          peso_promedio: pesoPromedio,
          precio_kg: precioKgDb,
          total_venta: totalVenta,
          metodo_pago: venta.metodo_pago || null,
        };
        if (opts.soloPeso) {
          updatePayload.fecha = existing.fecha;
          updatePayload.cliente_id = existing.cliente_id;
          updatePayload.lote_id = existing.lote_id;
          updatePayload.cantidad = Number(existing.cantidad);
          updatePayload.metodo_pago = existing.metodo_pago;
          const precioBase = Number(existing.precio_kg || 0);
          if (precioBase > 0 && pesoTotal > 0) {
            const recomputed = roundedVentaTotalAndPrecioKg(pesoTotal, precioBase);
            updatePayload.precio_kg = Number(Number(precioBase).toFixed(8));
            updatePayload.total_venta = recomputed.totalVenta;
            updatePayload.peso_promedio =
              updatePayload.cantidad > 0 ? pesoTotal / updatePayload.cantidad : 0;
          }
        }
        if (onlyLegacyPaid) {
          updatePayload.monto_cancelado = updatePayload.total_venta;
          updatePayload.saldo_pendiente = 0;
          updatePayload.estado_pago = 'pagado';
        }
        const paidCheckTotal = updatePayload.total_venta;
        if (paidCheckTotal + 1e-6 < paid) {
          return setErrorStatus('El total de la venta no puede ser menor al monto ya cobrado (abonos o pagos registrados).');
        }
        const { error: ventaError } = await updateVenta(editingVentaId, updatePayload);
        if (ventaError) throw new Error(ventaError.message);
        const { error: recErr } = await recalculateVentaEstado(editingVentaId);
        if (recErr) throw new Error(recErr.message);
        await readAll();
        resetForm();
        clearEditing();
        setSuccessStatus(opts.soloPeso ? 'Peso registrado correctamente' : 'Venta actualizada correctamente');
        return;
      }

      const base = {
        user_id: rowOwnerId,
        fecha: venta.fecha,
        lote_id: Number(venta.lote_id),
        cliente_id: Number(venta.cliente_id),
        ciclo_id: lote.ciclo_id,
        cantidad,
        peso_total: pesoTotal,
        peso_promedio: pesoPromedio,
        precio_kg: precioKgDb,
        total_venta: totalVenta,
        metodo_pago: venta.pagoCompleto ? venta.metodo_pago || null : null,
      };

      if (venta.pagoCompleto) {
        base.monto_cancelado = totalVenta;
        base.saldo_pendiente = 0;
        base.estado_pago = 'pagado';
        base.venta_al_contado = true;
      } else {
        base.monto_cancelado = 0;
        base.saldo_pendiente = totalVenta;
        base.venta_al_contado = false;
        base.estado_pago = 'pendiente';
      }

      const { data: inserted, error: ventaError } = await createVenta(base);
      if (ventaError) throw new Error(ventaError.message);
      if (!venta.pagoCompleto && primer > 0) {
        const { error: abErr } = await createAbono({
          user_id: rowOwnerId,
          venta_id: inserted.id,
          fecha: venta.fecha,
          monto: primer,
          metodo_pago: venta.metodo_pago || null,
          observaciones: null,
        });
        if (abErr) throw new Error(abErr.message);
        const { error: recErr } = await recalculateVentaEstado(inserted.id);
        if (recErr) throw new Error(recErr.message);
      }
      await readAll();
      resetForm();
      if (isApartado) {
        setSuccessStatus('Apartado registrado: al entregar, edita la venta y registra peso y total.');
      } else {
        setSuccessStatus(
          venta.pagoCompleto
            ? 'Venta registrada (pago completo)'
            : primer > 0
              ? 'Venta registrada con abono inicial'
              : 'Venta registrada a crédito — registra abonos cuando el cliente pague',
        );
      }
    } catch (error) {
      setErrorStatus(`No se pudo guardar la venta: ${error.message}`);
    }
  };

  const handleMortalidad = async () => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    try {
      if (editingMortalidadId) {
        const existing = data.mortalidad.find((m) => m.id === editingMortalidadId);
        if (!existing) return setErrorStatus('Registro de mortalidad no encontrado');
        const { errors, cantidad } = validateMortalidad(form.mortalidad);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return setErrorStatus('Corrige los campos en rojo');
        }
        setFieldErrors({});
        const { error } = await updateMortalidad(editingMortalidadId, {
          fecha: form.mortalidad.fecha,
          lote_id: existing.lote_id,
          cantidad,
          motivo: form.mortalidad.motivo?.trim() || null,
        });
        if (error) throw new Error(error.message);
        await readAll();
        resetForm();
        clearEditing();
        setSuccessStatus('Mortalidad actualizada correctamente');
        return;
      }
      const { errors, cantidad } = validateMortalidad(form.mortalidad);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return setErrorStatus('Corrige los campos en rojo');
      }
      setFieldErrors({});
      const { error } = await createMortalidad({
        ...form.mortalidad,
        user_id: rowOwnerId,
        lote_id: Number(form.mortalidad.lote_id),
        cantidad,
      });
      if (error) throw new Error(error.message);
      await readAll();
      resetForm();
      setSuccessStatus('Mortalidad registrada correctamente');
    } catch (error) {
      setErrorStatus(`No se pudo guardar la mortalidad: ${error.message}`);
    }
  };

  const handleCliente = async () => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    const { errors } = validateCliente(form.cliente);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return setErrorStatus('Corrige los campos en rojo');
    }
    try {
      setFieldErrors({});
      if (editingClienteId) {
        const { error } = await updateCliente(editingClienteId, {
          nombre: form.cliente.nombre.trim(),
          telefono: form.cliente.telefono.trim(),
          direccion: form.cliente.direccion.trim(),
        });
        if (error) throw new Error(error.message);
        await readAll();
        resetForm();
        clearEditing();
        setSuccessStatus('Cliente actualizado correctamente');
        return;
      }
      const { error } = await createCliente({
        user_id: rowOwnerId,
        nombre: form.cliente.nombre.trim(),
        telefono: form.cliente.telefono.trim(),
        direccion: form.cliente.direccion.trim(),
      });
      if (error) throw new Error(error.message);
      await readAll();
      resetForm();
      setSuccessStatus('Cliente registrado correctamente');
    } catch (error) {
      setErrorStatus(`No se pudo guardar el cliente: ${error.message}`);
    }
  };

  const startEditGasto = (g) => {
    const lote = data.lotes.find((l) => l.id === g.lote_id);
    setForm({
      ...createInitialForm(),
      gasto: {
        fecha: g.fecha,
        monto: String(g.monto),
        categoria: g.categoria,
        detalle: g.detalle || '',
        cantidad_pollos:
          g.categoria === EXPENSE_CATEGORY_PURCHASE && lote ? String(lote.cantidad_comprada) : '',
        ciclo_id: g.ciclo_id != null ? String(g.ciclo_id) : '',
      },
    });
    clearEditing();
    setEditingGastoId(g.id);
    setFieldErrors({});
    dismissStatus();
    scrollModuleFormIntoView();
  };

  const startEditVenta = (v) => {
    setForm({
      ...createInitialForm(),
      venta: {
        fecha: v.fecha,
        cliente_id: v.cliente_id != null ? String(v.cliente_id) : '',
        lote_id: v.lote_id != null ? String(v.lote_id) : '',
        cantidad: String(v.cantidad),
        peso_total: v.peso_total != null ? String(v.peso_total) : '',
        precio_kg: v.precio_kg != null ? String(v.precio_kg) : '2500',
        total_redondeado: v.total_venta != null ? Number(v.total_venta) : '',
        metodo_pago: v.metodo_pago || '',
        pagoCompleto: false,
        primerAbono: '',
      },
    });
    clearEditing();
    setEditingVentaId(v.id);
    setFieldErrors({});
    dismissStatus();
    scrollModuleFormIntoView();
  };

  const startEditMortalidad = (m) => {
    setForm({
      ...createInitialForm(),
      mortalidad: {
        fecha: m.fecha,
        lote_id: m.lote_id != null ? String(m.lote_id) : '',
        cantidad: String(m.cantidad),
        motivo: m.motivo || '',
      },
    });
    clearEditing();
    setEditingMortalidadId(m.id);
    setFieldErrors({});
    dismissStatus();
    scrollModuleFormIntoView();
  };

  const startEditCliente = (c) => {
    setForm({
      ...createInitialForm(),
      cliente: {
        nombre: c.nombre || '',
        telefono: c.telefono || '',
        direccion: c.direccion || '',
      },
    });
    clearEditing();
    setEditingClienteId(c.id);
    setFieldErrors({});
    dismissStatus();
    scrollModuleFormIntoView();
  };

  const cancelOperacionesEdit = () => {
    resetForm();
    clearEditing();
    dismissStatus();
  };

  const confirmDeleteGasto = async (id) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    const gasto = data.gastos.find((g) => g.id === id);
    let msg = '¿Eliminar este gasto? Esta acción no se puede deshacer.';
    if (gasto?.categoria === EXPENSE_CATEGORY_PURCHASE && gasto?.lote_id) {
      const ventasEnLote = data.ventas.filter((v) => Number(v.lote_id) === Number(gasto.lote_id)).length;
      msg =
        ventasEnLote > 0
          ? '¿Eliminar este gasto? El lote de esa compra tiene ventas registradas: el gasto se borrará, pero el lote seguirá existiendo hasta que elimines esas ventas.'
          : '¿Eliminar este gasto y el lote de compra asociado? Esta acción no se puede deshacer.';
    }
    if (!window.confirm(msg)) return;
    try {
      const { error } = await deleteGasto(id);
      if (error) throw new Error(error.message);
      if (editingGastoId === id) {
        resetForm();
        clearEditing();
      }
      if (gasto?.categoria === EXPENSE_CATEGORY_PURCHASE && gasto?.lote_id) {
        const { error: loteError } = await deleteLote(gasto.lote_id);
        if (loteError) {
          await readAll();
          setErrorStatus(
            `Gasto eliminado. No se pudo eliminar el lote: ${loteError.message}. Si hay ventas o registros que lo usan, elimínalos primero.`,
          );
          return;
        }
      }
      await readAll();
      setSuccessStatus(
        gasto?.categoria === EXPENSE_CATEGORY_PURCHASE && gasto?.lote_id
          ? 'Gasto y lote eliminados correctamente'
          : 'Gasto eliminado',
      );
    } catch (error) {
      setErrorStatus(`No se pudo eliminar: ${error.message}`);
    }
  };

  const confirmDeleteVenta = async (id) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (!window.confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await deleteVenta(id);
      if (error) throw new Error(error.message);
      if (editingVentaId === id) {
        resetForm();
        clearEditing();
      }
      await readAll();
      setSuccessStatus('Venta eliminada');
    } catch (error) {
      setErrorStatus(`No se pudo eliminar: ${error.message}`);
    }
  };

  const confirmDeleteMortalidad = async (id) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (!window.confirm('¿Eliminar este registro de mortalidad? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await deleteMortalidad(id);
      if (error) throw new Error(error.message);
      if (editingMortalidadId === id) {
        resetForm();
        clearEditing();
      }
      await readAll();
      setSuccessStatus('Mortalidad eliminada');
    } catch (error) {
      setErrorStatus(`No se pudo eliminar: ${error.message}`);
    }
  };

  const confirmDeleteCliente = async (id) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (!window.confirm('¿Eliminar este cliente? No podrá eliminarse si tiene ventas asociadas.')) return;
    try {
      const { error } = await deleteCliente(id);
      if (error) throw new Error(error.message);
      if (editingClienteId === id) {
        resetForm();
        clearEditing();
      }
      await readAll();
      setSuccessStatus('Cliente eliminado');
    } catch (error) {
      setErrorStatus(`No se pudo eliminar: ${error.message}`);
    }
  };

  const submitAbono = async (ventaId, payload) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    try {
      const { errors, monto } = validateAbonoForm(payload);
      if (Object.keys(errors).length > 0) {
        setErrorStatus(Object.values(errors)[0] || 'Revisa el formulario del abono.');
        return;
      }
      const venta = data.ventas.find((x) => x.id === ventaId);
      if (!venta) return setErrorStatus('Venta no encontrada');
      const abonosDeVenta = data.abonos.filter((a) => Number(a.venta_id) === Number(ventaId));
      const total = Number(venta.total_venta || 0);
      const paid = effectivePaidVenta(venta, data.abonos);
      const saldoRest = Math.max(0, total - paid);
      if (abonosDeVenta.length === 0 && paid >= total - VENTA_PAGO_EPS && total > 0) {
        return setErrorStatus(
          'Esta venta figura como pagada al contado. Para llevar abonos, la venta debe estar a crédito sin ese pago único.',
        );
      }
      if (monto > saldoRest + VENTA_PAGO_EPS) {
        return setErrorStatus('El abono no puede ser mayor al saldo pendiente.');
      }
      if (paid + monto > total + VENTA_PAGO_EPS) {
        return setErrorStatus('El abono supera el saldo pendiente de la venta.');
      }
      const { error } = await createAbono({
        user_id: rowOwnerId,
        venta_id: ventaId,
        fecha: payload.fecha,
        monto,
        metodo_pago: payload.metodo_pago || null,
        observaciones: payload.observaciones?.trim() || null,
      });
      if (error) throw new Error(error.message);
      const { error: re } = await recalculateVentaEstado(ventaId);
      if (re) throw new Error(re.message);
      await readAll();
      setSuccessStatus('Abono registrado');
    } catch (error) {
      setErrorStatus(error.message);
    }
  };

  const confirmDeleteAbono = async (abonoId, ventaId) => {
    if (!window.confirm('¿Eliminar este abono?')) return;
    try {
      const { error } = await deleteAbono(abonoId);
      if (error) throw new Error(error.message);
      const { error: re } = await recalculateVentaEstado(ventaId);
      if (re) throw new Error(re.message);
      await readAll();
      setSuccessStatus('Abono eliminado');
    } catch (error) {
      setErrorStatus(error.message);
    }
  };

  const guardarRepartoGastosObjetivo = async (loteId, montoStr) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    try {
      const m = parseDecimalNumber(montoStr);
      if (!Number.isFinite(m) || m < 0) {
        return setErrorStatus('Ingresá un monto de gastos válido (cero o más).');
      }
      const { error } = await updateLote(loteId, { reparto_gastos_objetivo: m });
      if (error) throw new Error(error.message);
      await readAll();
      setSuccessStatus('Objetivo de gastos del lote guardado');
    } catch (error) {
      setErrorStatus(error.message);
    }
  };

  const liquidarRepartoBucket = async (loteId, bucket, monto) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (!REPARTO_BUCKETS_VALIDOS.includes(bucket)) return setErrorStatus('Rubro de reparto inválido.');
    const amt = Number(monto);
    if (!Number.isFinite(amt) || amt <= VENTA_PAGO_EPS) return;
    if (!window.confirm(`¿Registrar pago de ${formatColones(amt)} (${labelRepartoBucket(bucket)})?`)) return;
    try {
      const { error } = await createLoteRepartoPago({
        user_id: rowOwnerId,
        lote_id: Number(loteId),
        bucket,
        monto: amt,
        fecha: dayjs().format('YYYY-MM-DD'),
        observaciones: null,
      });
      if (error) throw new Error(error.message);
      await readAll();
      setSuccessStatus('Pago de reparto registrado');
    } catch (error) {
      setErrorStatus(error.message);
    }
  };

  const deshacerUltimoRepartoPago = async (loteId, bucket) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    if (!REPARTO_BUCKETS_VALIDOS.includes(bucket)) return setErrorStatus('Rubro de reparto inválido.');
    if (!window.confirm(`¿Eliminar el último pago de «${labelRepartoBucket(bucket)}» en este lote?`)) return;
    try {
      const { error } = await deleteLastLoteRepartoPago(Number(loteId), bucket);
      if (error) throw new Error(error.message);
      await readAll();
      setSuccessStatus('Último pago eliminado');
    } catch (error) {
      setErrorStatus(error.message);
    }
  };

  const cerrarCicloPorId = async (cicloId) => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    const ciclo = data.ciclos.find((c) => Number(c.id) === Number(cicloId));
    if (!ciclo) return setErrorStatus('Ciclo no encontrado.');
    if (ciclo.estado !== 'activo') return setErrorStatus('Ese ciclo ya está cerrado.');
    if (
      !window.confirm(
        `¿Cerrar el ciclo ${ciclo.numero}? Podrás seguir viendo sus datos; para registrar gastos nuevos en otro ciclo, usa un ciclo activo o abre uno nuevo.`,
      )
    )
      return;
    try {
      const { error } = await closeCiclo(ciclo.id, {
        estado: 'cerrado',
        fecha_cierre: dayjs().format('YYYY-MM-DD'),
      });
      if (error) throw new Error(error.message);
      await readAll();
      setSuccessStatus(`Ciclo ${ciclo.numero} cerrado.`);
    } catch (error) {
      setErrorStatus(`No se pudo cerrar el ciclo: ${error.message}`);
    }
  };

  const abrirNuevoCiclo = async () => {
    if (!supabase || !user || rowOwnerId == null) return setErrorStatus('Debes iniciar sesion');
    try {
      const { data: inserted, error } = await createCiclo({
        user_id: rowOwnerId,
        numero: nextCicloNumero(data.ciclos),
        fecha_inicio: dayjs().format('YYYY-MM-DD'),
        estado: 'activo',
      });
      if (error) throw new Error(error.message);
      await readAll();
      setSuccessStatus(
        inserted
          ? `Ciclo ${inserted.numero} creado (activo). Elige este ciclo en Gastos si quieres registrar ahí.`
          : 'Nuevo ciclo creado.',
      );
    } catch (error) {
      setErrorStatus(`No se pudo crear el ciclo: ${error.message}`);
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const src = vistaCicloId ? dataVista : data;
    const suffix = vistaCicloId && vistaCicloLabel ? `-${vistaCicloLabel.replace(/\s+/g, '')}` : '';
    TABLES.forEach((table) =>
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(src[table] || []), table),
    );
    XLSX.writeFile(wb, `pollos-reporte${suffix}-${dayjs().format('YYYYMMDD-HHmm')}.xlsx`);
  };

  const exportPDF = () => {
    const s = vistaCicloId ? statsVista : stats;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(
      vistaCicloId ? `Reporte Gestión Avícola (${vistaCicloLabel || 'ciclo'})` : 'Reporte Gestión Avícola',
      10,
      10,
    );
    doc.setFontSize(11);
    doc.text(`Ganancia total: ${formatColones(s.totalUtilidad)}`, 10, 20);
    doc.text(`Mortalidad general: ${s.mortalidadGeneral.toFixed(2)}%`, 10, 27);
    doc.text(`Total pollos comprados: ${s.totalComprados}`, 10, 34);
    doc.save(`pollos-reporte-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
  };

  const siguienteLoteCompra = useMemo(() => {
    const id = Number(form.gasto.ciclo_id);
    if (!Number.isFinite(id) || id <= 0) return null;
    return nextLoteNumber(data.lotes, id);
  }, [form.gasto.ciclo_id, data.lotes]);

  return {
    tab,
    setTab,
    data,
    form,
    setForm,
    status,
    statusType,
    dismissStatus,
    fieldErrors,
    setFieldErrors,
    inputClass,
    stats,
    statsVista,
    lotesWithAvailability,
    lotesWithAvailabilityOperaciones,
    dataVista,
    gastoPorCategoria,
    gastoPorCategoriaVista,
    utilidadPorCiclo,
    utilidadPorCicloVista,
    vistaCicloId,
    setVistaCicloId,
    vistaCicloLabel,
    handleGasto,
    handleCliente,
    handleVenta,
    handleMortalidad,
    exportExcel,
    exportPDF,
    purchaseCategory: EXPENSE_CATEGORY_PURCHASE,
    editingGastoId,
    editingVentaId,
    editingMortalidadId,
    editingClienteId,
    startEditGasto,
    startEditVenta,
    startEditMortalidad,
    startEditCliente,
    cancelOperacionesEdit,
    confirmDeleteGasto,
    confirmDeleteVenta,
    confirmDeleteMortalidad,
    confirmDeleteCliente,
    submitAbono,
    confirmDeleteAbono,
    guardarRepartoGastosObjetivo,
    liquidarRepartoBucket,
    deshacerUltimoRepartoPago,
    cerrarCicloPorId,
    abrirNuevoCiclo,
    siguienteLoteCompra,
    formResetGeneration,
  };
}
