import {
  REPARTO_SOCIO_FILAS,
  REPARTO_SOCIO_INVERSION_BUCKET,
  labelRepartoBucket,
} from '../constants/sociasReparto';

function sumMontos(rows, field = 'monto') {
  return (rows || []).reduce((s, r) => s + Number(r[field] || 0), 0);
}

/** Montos guardados en `lotes.reparto_gastos_objetivo` (rubro gastos a descontar). */
function valoresGastosObjetivoLotes(lotes) {
  return (lotes || [])
    .map((l) => l.reparto_gastos_objetivo)
    .filter((raw) => raw != null && raw !== '')
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export function promedioGastosObjetivoLotes(lotes) {
  const vals = valoresGastosObjetivoLotes(lotes);
  if (!vals.length) return { promedio: 0, lotesConObjetivo: 0, suma: 0 };
  const suma = vals.reduce((s, n) => s + n, 0);
  return { promedio: suma / vals.length, lotesConObjetivo: vals.length, suma };
}

export function sumaGastosObjetivoLotes(lotes) {
  return valoresGastosObjetivoLotes(lotes).reduce((s, n) => s + n, 0);
}

/** Reparto socias + (promedio gastos a descontar × lotes con objetivo). */
export function totalMovimientosReparto(repartoSocios, promedioGastosObjetivo, lotesConObjetivo) {
  return (
    Number(repartoSocios || 0) +
    Number(promedioGastosObjetivo || 0) * Number(lotesConObjetivo || 0)
  );
}

/**
 * Cuánto falta recuperar la inversión del socio que cubre gastos (Carlos):
 * invertido = gastos registrados; recuperado = reparto a Carlos + suma gastos a descontar por lote.
 */
export function recuperacionInversionScope({ gastos, lotes, lote_reparto_pagos, cicloId = null }) {
  const cid = cicloId != null ? Number(cicloId) : null;
  const gastosScope =
    cid == null ? gastos || [] : (gastos || []).filter((g) => Number(g.ciclo_id) === cid);
  const lotesScope =
    cid == null ? lotes || [] : (lotes || []).filter((l) => Number(l.ciclo_id) === cid);
  const loteIds = new Set(lotesScope.map((l) => l.id));
  const pagosScope = (lote_reparto_pagos || []).filter((p) => loteIds.has(Number(p.lote_id)));

  const totalInvertido = sumMontos(gastosScope);
  const recuperadoRepartoCarlos = pagosScope
    .filter((p) => String(p.bucket) === REPARTO_SOCIO_INVERSION_BUCKET)
    .reduce((s, p) => s + Number(p.monto || 0), 0);
  const recuperadoGastosLotes = sumaGastosObjetivoLotes(lotesScope);
  const totalRecuperado = recuperadoRepartoCarlos + recuperadoGastosLotes;
  const faltaRecuperar = Math.max(0, totalInvertido - totalRecuperado);
  const porcentajeRecuperado =
    totalInvertido > 0 ? Math.min(100, (totalRecuperado / totalInvertido) * 100) : totalRecuperado > 0 ? 100 : 0;

  return {
    totalInvertido,
    recuperadoRepartoCarlos,
    recuperadoGastosLotes,
    totalRecuperado,
    faltaRecuperar,
    porcentajeRecuperado,
    lotesConObjetivoGastos: valoresGastosObjetivoLotes(lotesScope).length,
  };
}

function repartoEnCiclo(cicloId, lotes, loteRepartoPagos) {
  const lotesCiclo = (lotes || []).filter((l) => Number(l.ciclo_id) === Number(cicloId));
  const loteIds = new Set(lotesCiclo.map((l) => l.id));
  const pagos = (loteRepartoPagos || []).filter((p) => loteIds.has(Number(p.lote_id)));
  const porBucket = {};
  for (const p of pagos) {
    const b = String(p.bucket);
    porBucket[b] = (porBucket[b] || 0) + Number(p.monto || 0);
  }
  const repartoSocios = REPARTO_SOCIO_FILAS.reduce((s, { bucket }) => s + (porBucket[bucket] || 0), 0);
  const { promedio: repartoGastos, lotesConObjetivo } = promedioGastosObjetivoLotes(lotesCiclo);
  const repartoTotal = totalMovimientosReparto(repartoSocios, repartoGastos, lotesConObjetivo);
  const repartoPorSocia = REPARTO_SOCIO_FILAS.map(({ bucket, nombre }) => ({
    bucket,
    nombre,
    monto: porBucket[bucket] || 0,
  }));
  return { repartoSocios, repartoGastos, lotesConObjetivoGastos: lotesConObjetivo, repartoTotal, repartoPorSocia };
}

/**
 * Resumen financiero histórico: gastos, ventas, ganancia y repartos por ciclo y totales.
 */
export function resumenFinancieroReportes({ ciclos, gastos, ventas, lotes, lote_reparto_pagos }) {
  const porCiclo = [...(ciclos || [])]
    .sort((a, b) => Number(b.numero) - Number(a.numero))
    .map((ciclo) => {
      const cid = Number(ciclo.id);
      const totalGastos = sumMontos((gastos || []).filter((g) => Number(g.ciclo_id) === cid));
      const totalVentas = sumMontos(
        (ventas || []).filter((v) => Number(v.ciclo_id) === cid),
        'total_venta',
      );
      const ganancia = totalVentas - totalGastos;
      const reparto = repartoEnCiclo(cid, lotes, lote_reparto_pagos);
      return {
        cicloId: cid,
        numero: ciclo.numero,
        estado: ciclo.estado,
        totalGastos,
        totalVentas,
        ganancia,
        ...reparto,
      };
    });

  const { promedio: repartoGastosGeneral, lotesConObjetivo: lotesConObjetivoGeneral } =
    promedioGastosObjetivoLotes(lotes);

  const general = porCiclo.reduce(
    (acc, row) => ({
      totalGastos: acc.totalGastos + row.totalGastos,
      totalVentas: acc.totalVentas + row.totalVentas,
      ganancia: acc.ganancia + row.ganancia,
      repartoSocios: acc.repartoSocios + row.repartoSocios,
    }),
    {
      totalGastos: 0,
      totalVentas: 0,
      ganancia: 0,
      repartoSocios: 0,
    },
  );

  general.repartoGastos = repartoGastosGeneral;
  general.lotesConObjetivoGastos = lotesConObjetivoGeneral;
  general.repartoTotal = totalMovimientosReparto(
    general.repartoSocios,
    general.repartoGastos,
    general.lotesConObjetivoGastos,
  );

  const repartoPorSocia = REPARTO_SOCIO_FILAS.map(({ bucket, nombre }) => ({
    bucket,
    nombre,
    label: labelRepartoBucket(bucket),
    monto: porCiclo.reduce(
      (s, c) => s + (c.repartoPorSocia.find((x) => x.bucket === bucket)?.monto || 0),
      0,
    ),
  }));

  const recuperacion = {
    general: recuperacionInversionScope({ gastos, lotes, lote_reparto_pagos }),
    porCiclo: porCiclo.map((row) => ({
      cicloId: row.cicloId,
      numero: row.numero,
      estado: row.estado,
      ...recuperacionInversionScope({
        gastos,
        lotes,
        lote_reparto_pagos,
        cicloId: row.cicloId,
      }),
    })),
  };

  return { porCiclo, general, repartoPorSocia, recuperacion };
}
