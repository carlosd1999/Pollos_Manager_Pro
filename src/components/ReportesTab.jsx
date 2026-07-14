import { useMemo } from 'react';
import { REPARTO_SOCIO_INVERSION_NOMBRE } from '../constants/sociasReparto';
import { resumenPendientesVentas } from '../lib/business';
import { formatColones } from '../lib/formatCurrency';
import { formatDiasEnGalera, formatGananciaDiaria, formatKg, formatPollos, formatPrecioKg } from '../lib/formatPeso';
import { labelNivelRendimiento, REFERENCIA_PESO_KG, REFERENCIA_SACRIFICIO_DIAS } from '../lib/rendimientoAvicola';
import { resumenEstadisticasVentas } from '../lib/reportesEstadisticasVentas';
import { resumenFinancieroReportes } from '../lib/reportesFinancieros';

function KpiRow({ label, value, variant }) {
  return (
    <li className={['reportes-kpi-row', variant ? `reportes-kpi-row--${variant}` : ''].filter(Boolean).join(' ')}>
      <span className="reportes-kpi-label">{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function ReportesTab({ data, exportPDF, exportExcel }) {
  const pend = useMemo(
    () => resumenPendientesVentas(data.ventas, data.abonos),
    [data.ventas, data.abonos],
  );

  const fin = useMemo(
    () =>
      resumenFinancieroReportes({
        ciclos: data.ciclos,
        gastos: data.gastos,
        ventas: data.ventas,
        lotes: data.lotes,
        lote_reparto_pagos: data.lote_reparto_pagos,
      }),
    [data.ciclos, data.gastos, data.ventas, data.lotes, data.lote_reparto_pagos],
  );

  const ventasStats = useMemo(
    () =>
      resumenEstadisticasVentas({
        ventas: data.ventas,
        lotes: data.lotes,
        ciclos: data.ciclos,
        mortalidad: data.mortalidad,
      }),
    [data.ventas, data.lotes, data.ciclos, data.mortalidad],
  );

  const { general: g, porCiclo, repartoPorSocia, recuperacion } = fin;
  const inv = recuperacion.general;
  const vs = ventasStats.general;

  return (
    <section className="reportes-grid">
      <article className="card">
        <h3>Exportaciones</h3>
        <p>Descarga resumen financiero y dataset histórico.</p>
        <div className="reportes-export-actions">
          <button type="button" onClick={exportPDF}>
            Exportar PDF
          </button>
          <button type="button" onClick={exportExcel}>
            Exportar Excel
          </button>
        </div>
      </article>

      <article className="card card-wide reportes-recuperacion-panel">
        <h3>Recuperación de inversión ({REPARTO_SOCIO_INVERSION_NOMBRE})</h3>
        <p className="lists-hint">
          Asume que {REPARTO_SOCIO_INVERSION_NOMBRE} cubre todos los gastos del negocio. La recuperación suma
          los pagos marcados en su reparto y los montos «gastos a descontar» guardados por lote.
        </p>
        <ul className="reportes-kpi-grid">
          <KpiRow label="Total invertido (gastos)" value={formatColones(inv.totalInvertido)} />
          <KpiRow label="Recuperado – reparto Carlos" value={formatColones(inv.recuperadoRepartoCarlos)} />
          <KpiRow
            label={`Recuperado – gastos por lote (${inv.lotesConObjetivoGastos} lote${inv.lotesConObjetivoGastos === 1 ? '' : 's'})`}
            value={formatColones(inv.recuperadoGastosLotes)}
          />
          <KpiRow label="Total recuperado" value={formatColones(inv.totalRecuperado)} variant="positive" />
          <KpiRow
            label="Falta recuperar"
            value={formatColones(inv.faltaRecuperar)}
            variant={inv.faltaRecuperar > 0 ? 'negative' : 'positive'}
          />
          <KpiRow label="% recuperado" value={`${inv.porcentajeRecuperado.toFixed(1)}%`} />
        </ul>
        <div className="reportes-recuperacion-bar" aria-hidden="true">
          <div
            className="reportes-recuperacion-bar-fill"
            style={{ width: `${Math.min(100, inv.porcentajeRecuperado)}%` }}
          />
        </div>
        {recuperacion.porCiclo.length > 0 && (
          <>
            <h4 className="reportes-subtitle">Por ciclo</h4>
            <div className="table-wrap table-cards-mobile reportes-ciclos-table-wrap">
              <table className="data-table reportes-recuperacion-table">
                <thead>
                  <tr>
                    <th>Ciclo</th>
                    <th>Invertido</th>
                    <th>Reparto Carlos</th>
                    <th>Gastos lote</th>
                    <th>Recuperado</th>
                    <th>Falta</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {recuperacion.porCiclo.map((row) => (
                    <tr key={row.cicloId}>
                      <td data-label="Ciclo">
                        <strong>Ciclo {row.numero}</strong>
                      </td>
                      <td data-label="Invertido">{formatColones(row.totalInvertido)}</td>
                      <td data-label="Reparto Carlos">{formatColones(row.recuperadoRepartoCarlos)}</td>
                      <td data-label="Gastos lote">{formatColones(row.recuperadoGastosLotes)}</td>
                      <td data-label="Recuperado">{formatColones(row.totalRecuperado)}</td>
                      <td
                        data-label="Falta"
                        className={row.faltaRecuperar > 0 ? 'reportes-cell-negative' : 'reportes-cell-positive'}
                      >
                        {formatColones(row.faltaRecuperar)}
                      </td>
                      <td data-label="%">{row.porcentajeRecuperado.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="reportes-ciclos-total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td data-label="Invertido">
                      <strong>{formatColones(inv.totalInvertido)}</strong>
                    </td>
                    <td data-label="Reparto Carlos">
                      <strong>{formatColones(inv.recuperadoRepartoCarlos)}</strong>
                    </td>
                    <td data-label="Gastos lote">
                      <strong>{formatColones(inv.recuperadoGastosLotes)}</strong>
                    </td>
                    <td data-label="Recuperado">
                      <strong>{formatColones(inv.totalRecuperado)}</strong>
                    </td>
                    <td data-label="Falta" className={inv.faltaRecuperar > 0 ? 'reportes-cell-negative' : 'reportes-cell-positive'}>
                      <strong>{formatColones(inv.faltaRecuperar)}</strong>
                    </td>
                    <td data-label="%">
                      <strong>{inv.porcentajeRecuperado.toFixed(1)}%</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </article>

      <article className="card card-wide">
        <h3>Estadísticas de venta</h3>
        <p className="lists-hint">
          Solo lotes <strong>agotados</strong> (0 pollos disponibles) con <strong>todas las ventas pesadas</strong>.
          Los <strong>días en galera</strong> van desde la <strong>fecha de ingreso del lote</strong> (compra) hasta la{' '}
          <strong>fecha de venta</strong> (sacrificio/entrega), ponderados por pollos vendidos.
        </p>
        {ventasStats.lotesElegiblesTotal === 0 ? (
          <p className="lists-hint">
            Aún no hay lotes cerrados que cumplan ambas condiciones. Cuando vendas todo el lote y peses cada
            venta, aparecerán aquí.
          </p>
        ) : (
          <>
        <ul className="reportes-kpi-grid">
          <KpiRow label="Lotes incluidos" value={String(vs.lotesElegibles)} />
          <KpiRow label="Peso prom. por pollo" value={formatKg(vs.pesoPromedioPorPolloKg)} />
          <KpiRow label="Peso total vendido" value={formatKg(vs.kgPesados)} />
          <KpiRow label="Precio prom. por kg" value={formatPrecioKg(vs.precioPromedioPorKg)} />
          <KpiRow
            label={`Prom. pollos vendidos por lote (${vs.lotesElegibles} lote${vs.lotesElegibles === 1 ? '' : 's'})`}
            value={formatPollos(vs.promPollosPorLote)}
          />
          <KpiRow label="Pollos vendidos (total)" value={formatPollos(vs.pollosVendidos, { decimals: 0 })} />
          <KpiRow label="Días prom. compra → sacrificio" value={formatDiasEnGalera(vs.diasPromedioEnGalera)} />
          <KpiRow
            label="Ganancia prom. de peso"
            value={formatGananciaDiaria(vs.evaluacionRendimiento?.gananciaDiariaG)}
          />
          {vs.evaluacionRendimiento && (
            <KpiRow
              label="Rendimiento vs edad"
              value={labelNivelRendimiento(vs.evaluacionRendimiento.nivel)}
              variant={
                vs.evaluacionRendimiento.nivel === 'bueno'
                  ? 'positive'
                  : vs.evaluacionRendimiento.nivel === 'bajo'
                    ? 'negative'
                    : undefined
              }
            />
          )}
        </ul>
        {vs.evaluacionRendimiento && (
          <p className="lists-hint reportes-rendimiento-nota">{vs.evaluacionRendimiento.nota}</p>
        )}
        <p className="lists-hint reportes-referencia-avicola">
          Referencia orientativa (inicio + desarrollo, sacrificio ~{REFERENCIA_SACRIFICIO_DIAS.tipico} días): peso
          ~{REFERENCIA_PESO_KG.semana7.normal} kg y ganancia ~{REFERENCIA_PESO_KG.gananciaDiariaG.normal} g/día.
        </p>

        {ventasStats.porCiclo.length > 0 && (
          <>
            <h4 className="reportes-subtitle">Por ciclo</h4>
            <div className="table-wrap table-cards-mobile reportes-ciclos-table-wrap">
              <table className="data-table reportes-ventas-stats-table">
                <thead>
                  <tr>
                    <th>Ciclo</th>
                    <th>Pollos vend.</th>
                    <th>Peso total</th>
                    <th>Peso prom/pollo</th>
                    <th>₡/kg</th>
                    <th>Días</th>
                    <th>g/día</th>
                    <th>Prom. pollos/lote</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasStats.porCiclo
                    .filter((row) => row.lotesElegibles > 0)
                    .map((row) => (
                    <tr key={row.cicloId}>
                      <td data-label="Ciclo">
                        <strong>Ciclo {row.numero}</strong>
                      </td>
                      <td data-label="Pollos vend.">{formatPollos(row.pollosVendidos, { decimals: 0 })}</td>
                      <td data-label="Peso total">{formatKg(row.kgPesados)}</td>
                      <td data-label="Peso prom/pollo">{formatKg(row.pesoPromedioPorPolloKg)}</td>
                      <td data-label="₡/kg">{formatPrecioKg(row.precioPromedioPorKg)}</td>
                      <td data-label="Días">{formatDiasEnGalera(row.diasPromedioEnGalera)}</td>
                      <td data-label="g/día">
                        {formatGananciaDiaria(row.evaluacionRendimiento?.gananciaDiariaG)}
                      </td>
                      <td data-label="Prom. pollos/lote">
                        {formatPollos(row.promPollosPorLote)}
                        {row.lotesElegibles > 0 && (
                          <span className="reportes-prom-hint">
                            {' '}
                            ({row.lotesElegibles} lote{row.lotesElegibles === 1 ? '' : 's'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {ventasStats.porLote.length > 0 && (
          <>
            <h4 className="reportes-subtitle">Por lote (cerrados y pesados)</h4>
            <div className="table-wrap table-cards-mobile reportes-ciclos-table-wrap">
              <table className="data-table reportes-ventas-lote-table">
                <thead>
                  <tr>
                    <th>Ciclo</th>
                    <th>Lote</th>
                    <th>Pollos vend.</th>
                    <th>Peso total</th>
                    <th>Peso prom/pollo</th>
                    <th>₡/kg</th>
                    <th>Días</th>
                    <th>g/día</th>
                    <th>Rendimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasStats.porLote.map((row) => {
                      const ciclo = (data.ciclos || []).find((c) => Number(c.id) === row.cicloId);
                      return (
                        <tr key={row.loteId}>
                          <td data-label="Ciclo">{ciclo ? `Ciclo ${ciclo.numero}` : row.cicloId}</td>
                          <td data-label="Lote">
                            <strong>Lote {row.numeroLote}</strong>
                          </td>
                          <td data-label="Pollos vend.">{formatPollos(row.pollosVendidos, { decimals: 0 })}</td>
                          <td data-label="Peso total">{formatKg(row.kgPesados)}</td>
                          <td data-label="Peso prom/pollo">{formatKg(row.pesoPromedioPorPolloKg)}</td>
                          <td data-label="₡/kg">{formatPrecioKg(row.precioPromedioPorKg)}</td>
                          <td data-label="Días">{formatDiasEnGalera(row.diasPromedio)}</td>
                          <td data-label="g/día">
                            {formatGananciaDiaria(row.evaluacionRendimiento?.gananciaDiariaG)}
                          </td>
                          <td data-label="Rendimiento">
                            {row.evaluacionRendimiento ? (
                              <span
                                className={`rendimiento-tag rendimiento-tag--${row.evaluacionRendimiento.nivel}`}
                                title={row.evaluacionRendimiento.nota}
                              >
                                {labelNivelRendimiento(row.evaluacionRendimiento.nivel)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}
          </>
        )}
      </article>

      <article className="card card-wide reportes-resumen-general">
        <h3>Resumen general (todos los ciclos)</h3>
        <ul className="reportes-kpi-grid">
          <KpiRow label="Total gastado" value={formatColones(g.totalGastos)} />
          <KpiRow label="Total vendido" value={formatColones(g.totalVentas)} />
          <KpiRow
            label="Ganancia (ventas − gastos)"
            value={formatColones(g.ganancia)}
            variant={g.ganancia < 0 ? 'negative' : 'positive'}
          />
          <KpiRow label="Repartido a socias" value={formatColones(g.repartoSocios)} />
          <KpiRow
            label={`Prom. gastos a descontar (${g.lotesConObjetivoGastos} lote${g.lotesConObjetivoGastos === 1 ? '' : 's'})`}
            value={formatColones(g.repartoGastos)}
          />
          <KpiRow label="Total movimientos reparto" value={formatColones(g.repartoTotal)} />
        </ul>
        <p className="lists-hint reportes-formula-hint">
          Total movimientos = reparto a socias + (prom. gastos a descontar × lotes con objetivo).
        </p>
        {repartoPorSocia.some((s) => s.monto > 0) && (
          <>
            <h4 className="reportes-subtitle">Reparto por socia (histórico)</h4>
            <ul className="reportes-socias-grid">
              {repartoPorSocia.map((s) => (
                <li key={s.bucket}>
                  <span>{s.nombre}</span>
                  <strong>{formatColones(s.monto)}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <article className="card card-wide">
        <h3>Por ciclo</h3>
        <p className="lists-hint">
          Gastos y ventas del ciclo. Reparto socias = pagos marcados. Reparto gastos = promedio de objetivos
          «gastos a descontar» por lote.
        </p>
        {porCiclo.length === 0 ? (
          <p className="lists-hint">Sin ciclos registrados.</p>
        ) : (
          <div className="table-wrap table-cards-mobile reportes-ciclos-table-wrap">
            <table className="data-table reportes-ciclos-table">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Estado</th>
                  <th>Gastos</th>
                  <th>Ventas</th>
                  <th>Ganancia</th>
                  <th>Reparto socias</th>
                  <th>Prom. gastos desc.</th>
                </tr>
              </thead>
              <tbody>
                {porCiclo.map((row) => (
                  <tr key={row.cicloId}>
                    <td data-label="Ciclo">
                      <strong>Ciclo {row.numero}</strong>
                    </td>
                    <td data-label="Estado">{row.estado}</td>
                    <td data-label="Gastos">{formatColones(row.totalGastos)}</td>
                    <td data-label="Ventas">{formatColones(row.totalVentas)}</td>
                    <td
                      data-label="Ganancia"
                      className={row.ganancia < 0 ? 'reportes-cell-negative' : 'reportes-cell-positive'}
                    >
                      {formatColones(row.ganancia)}
                    </td>
                    <td data-label="Reparto socias">{formatColones(row.repartoSocios)}</td>
                    <td data-label="Prom. gastos desc.">
                      {formatColones(row.repartoGastos)}
                      {row.lotesConObjetivoGastos > 0 && (
                        <span className="reportes-prom-hint">
                          {' '}
                          ({row.lotesConObjetivoGastos} lote{row.lotesConObjetivoGastos === 1 ? '' : 's'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="reportes-ciclos-total-row">
                  <td colSpan={2}>
                    <strong>Total general</strong>
                  </td>
                  <td data-label="Gastos">
                    <strong>{formatColones(g.totalGastos)}</strong>
                  </td>
                  <td data-label="Ventas">
                    <strong>{formatColones(g.totalVentas)}</strong>
                  </td>
                  <td data-label="Ganancia" className={g.ganancia < 0 ? 'reportes-cell-negative' : 'reportes-cell-positive'}>
                    <strong>{formatColones(g.ganancia)}</strong>
                  </td>
                  <td data-label="Reparto socias">
                    <strong>{formatColones(g.repartoSocios)}</strong>
                  </td>
                  <td data-label="Prom. gastos desc.">
                    <strong>{formatColones(g.repartoGastos)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </article>

      <article className="card">
        <h3>Pendientes operativos</h3>
        <ul className="ventas-pendientes-grid reportes-pendientes-grid">
          <li>
            <span className="ventas-pendientes-label">Sin pesar</span>
            <strong>{pend.sinPesar}</strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Sin entregar</span>
            <strong>
              {pend.sinEntregar}
              {pend.pollosSinEntregar > 0 && (
                <span className="ventas-pendientes-sub"> ({pend.pollosSinEntregar} pollos)</span>
              )}
            </strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Cobro pendiente</span>
            <strong>{pend.cobroPendiente}</strong>
          </li>
          <li>
            <span className="ventas-pendientes-label">Entregadas</span>
            <strong>{pend.entregadas}</strong>
            </li>
        </ul>
      </article>
    </section>
  );
}

export default ReportesTab;
