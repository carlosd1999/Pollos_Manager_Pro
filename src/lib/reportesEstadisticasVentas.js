import dayjs from 'dayjs';
import {
  VENTA_PAGO_EPS,
  calculateAvailableByLote,
  sortLotesOldestFirst,
  ventaEsApartadoSinPesar,
} from './business';
import { evaluarPesoVsEdad } from './rendimientoAvicola';

/** Solo ventas con peso registrado entran en kg y ₡/kg. */
export function acumularVentasPesadas(ventas) {
  let pollosVendidos = 0;
  let pollosPesados = 0;
  let kgPesados = 0;
  let colonesPesadas = 0;
  for (const v of ventas || []) {
    const c = Number(v.cantidad || 0);
    const kg = Number(v.peso_total || 0);
    const t = Number(v.total_venta || 0);
    if (Number.isFinite(c) && c > 0) pollosVendidos += c;
    if (Number.isFinite(kg) && kg > 0) {
      kgPesados += kg;
      if (Number.isFinite(c) && c > 0) pollosPesados += c;
      if (Number.isFinite(t) && t >= 0) colonesPesadas += t;
    }
  }
  return {
    pollosVendidos,
    pollosPesados,
    kgPesados,
    colonesPesadas,
    pesoPromedioPorPolloKg: pollosPesados > 0 ? kgPesados / pollosPesados : null,
    precioPromedioPorKg: kgPesados > 0 ? colonesPesadas / kgPesados : null,
  };
}

/**
 * Lote listo para estadísticas: 0 disponibles y todas las ventas del lote ya pesadas.
 */
export function loteElegibleEstadisticasVentas(lote, ventas) {
  const disp = Number(lote?.disponibles ?? NaN);
  if (!Number.isFinite(disp) || disp > VENTA_PAGO_EPS) return false;
  const ventasLote = (ventas || []).filter((v) => Number(v.lote_id) === Number(lote.id));
  if (ventasLote.length === 0) return false;
  return ventasLote.every((v) => !ventaEsApartadoSinPesar(v));
}

function promedioPollosVendidosPorLote(filasLote) {
  const conVentas = (filasLote || []).filter((l) => l.pollosVendidos > 0);
  if (!conVentas.length) return { promedio: null, lotesElegibles: 0 };
  const suma = conVentas.reduce((s, l) => s + l.pollosVendidos, 0);
  return { promedio: suma / conVentas.length, lotesElegibles: conVentas.length };
}

/** Días desde ingreso del lote hasta cada venta (ponderado por cantidad de pollos). */
function edadEnGaleraLote(lote, ventasLote) {
  const ingreso = dayjs(lote?.fecha_ingreso);
  if (!ingreso.isValid()) return null;

  let totalPollos = 0;
  let sumaDiasPonderados = 0;
  let fechaUltima = null;

  for (const v of ventasLote || []) {
    const c = Number(v.cantidad || 0);
    const fecha = dayjs(v.fecha);
    if (!fecha.isValid() || c <= 0) continue;
    const dias = Math.max(0, fecha.diff(ingreso, 'day'));
    sumaDiasPonderados += dias * c;
    totalPollos += c;
    if (!fechaUltima || fecha.isAfter(fechaUltima)) fechaUltima = fecha;
  }

  if (totalPollos === 0) return null;

  const diasPromedio = sumaDiasPonderados / totalPollos;
  const diasUltimaVenta = fechaUltima ? Math.max(0, fechaUltima.diff(ingreso, 'day')) : null;

  return {
    fechaIngreso: ingreso.format('YYYY-MM-DD'),
    fechaUltimaVenta: fechaUltima?.format('YYYY-MM-DD') ?? null,
    diasPromedio,
    diasUltimaVenta,
  };
}

function agregarEdadAgregada(filasLote) {
  let pollos = 0;
  let sumaDias = 0;
  for (const row of filasLote || []) {
    if (row.diasPromedio == null) continue;
    const p = Number(row.pollosVendidos || 0);
    if (p <= 0) continue;
    pollos += p;
    sumaDias += row.diasPromedio * p;
  }
  const diasPromedio = pollos > 0 ? sumaDias / pollos : null;
  const peso = filasLote?.length
    ? filasLote.reduce((s, r) => s + (r.kgPesados || 0), 0) /
      Math.max(
        1,
        filasLote.reduce((s, r) => s + (r.pollosPesados || 0), 0),
      )
    : null;
  return {
    diasPromedioEnGalera: diasPromedio,
    evaluacionRendimiento: evaluarPesoVsEdad(peso, diasPromedio),
  };
}

function estadisticasLote(lote, ventas) {
  const lid = Number(lote.id);
  const ventasLote = (ventas || []).filter((v) => Number(v.lote_id) === lid);
  const base = acumularVentasPesadas(ventasLote);
  const edad = edadEnGaleraLote(lote, ventasLote);
  const evaluacionRendimiento = edad
    ? evaluarPesoVsEdad(base.pesoPromedioPorPolloKg, edad.diasPromedio)
    : null;

  return {
    loteId: lote.id,
    numeroLote: lote.numero_lote,
    cicloId: Number(lote.ciclo_id),
    fechaIngreso: lote.fecha_ingreso,
    ...base,
    ...edad,
    evaluacionRendimiento,
  };
}

/**
 * Peso promedio por pollo, peso total por lote, precio/kg y promedio de pollos vendidos por lote.
 * Solo lotes agotados (0 disponibles) con todas las ventas pesadas.
 */
export function resumenEstadisticasVentas({ ventas, lotes, ciclos, mortalidad }) {
  const lotesConDisp = calculateAvailableByLote(lotes, mortalidad, ventas);
  const lotesElegibles = sortLotesOldestFirst(
    lotesConDisp.filter((l) => loteElegibleEstadisticasVentas(l, ventas)),
  );
  const loteIdsElegibles = new Set(lotesElegibles.map((l) => Number(l.id)));

  const ventasElegibles = (ventas || []).filter((v) => loteIdsElegibles.has(Number(v.lote_id)));
  const porLote = lotesElegibles.map((l) => estadisticasLote(l, ventas));

  const generalBase = acumularVentasPesadas(ventasElegibles);
  const { promedio: promPollosPorLote, lotesElegibles: lotesElegiblesCount } =
    promedioPollosVendidosPorLote(porLote);

  const general = {
    ...generalBase,
    promPollosPorLote,
    lotesElegibles: lotesElegiblesCount,
    ...agregarEdadAgregada(porLote),
  };

  const porCiclo = [...(ciclos || [])]
    .sort((a, b) => Number(b.numero) - Number(a.numero))
    .map((ciclo) => {
      const cid = Number(ciclo.id);
      const lotesCiclo = porLote.filter((l) => l.cicloId === cid);
      const ventasCiclo = ventasElegibles.filter((v) => Number(v.ciclo_id) === cid);
      const stats = acumularVentasPesadas(ventasCiclo);
      const promLote = promedioPollosVendidosPorLote(lotesCiclo);
      const edadCiclo = agregarEdadAgregada(lotesCiclo);
      return {
        cicloId: cid,
        numero: ciclo.numero,
        estado: ciclo.estado,
        ...stats,
        promPollosPorLote: promLote.promedio,
        lotesElegibles: promLote.lotesElegibles,
        ...edadCiclo,
      };
    });

  return { general, porLote, porCiclo, lotesElegiblesTotal: lotesElegibles.length };
}
