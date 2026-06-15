import { useMemo } from 'react';
import { formatColones } from '../../lib/formatCurrency';
import { sortLotesOldestFirst } from '../../lib/business';

function CiclosModule({ data, lotesWithAvailability, cerrarCicloPorId, abrirNuevoCiclo }) {
  const ciclosOrdenados = useMemo(() => {
    return [...(data.ciclos || [])].sort((a, b) => Number(b.numero) - Number(a.numero));
  }, [data.ciclos]);

  const ciclosActivos = useMemo(
    () => (data.ciclos || []).filter((c) => c.estado === 'activo').sort((a, b) => Number(a.numero) - Number(b.numero)),
    [data.ciclos],
  );

  const disponiblesMap = useMemo(() => {
    const m = {};
    lotesWithAvailability.forEach((l) => {
      m[l.id] = l.disponibles;
    });
    return m;
  }, [lotesWithAvailability]);

  const lotesPorCiclo = (cicloId) =>
    sortLotesOldestFirst((data.lotes || []).filter((l) => Number(l.ciclo_id) === Number(cicloId)));

  const ventasPorLote = (loteId) =>
    (data.ventas || []).filter((v) => Number(v.lote_id) === Number(loteId)).reduce((s, v) => s + Number(v.cantidad || 0), 0);

  const mortalidadPorLote = (loteId) =>
    (data.mortalidad || []).filter((m) => Number(m.lote_id) === Number(loteId)).reduce((s, x) => s + Number(x.cantidad || 0), 0);

  return (
    <section className="layout-stack">
      <article className="card card-wide">
        <h3>Ciclos</h3>
        <ul className="cycle-help-list">
          <li>
            <strong>Varios ciclos abiertos:</strong> puedes <strong>abrir un ciclo nuevo</strong> sin cerrar los anteriores. En{' '}
            <strong>Gastos</strong> eliges en qué ciclo registra cada movimiento (ciclo 1, 2, etc.).
          </li>
          <li>
            <strong>Cierre solo manual:</strong> cerrar un ciclo no crea otro automáticamente; si necesitas otro ciclo activo, usa{' '}
            <strong>Abrir nuevo ciclo</strong>.
          </li>
        </ul>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: 12 }}>
          <button type="button" onClick={abrirNuevoCiclo}>
            Abrir nuevo ciclo (activo)
          </button>
        </div>
        {ciclosActivos.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <p className="lists-hint" style={{ marginBottom: 8 }}>
              Ciclos <strong>activos</strong> — cerrar cuando decidas (los datos se conservan):
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ciclosActivos.map((c) => (
                <li key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span>
                    <strong>Ciclo {c.numero}</strong> (desde {c.fecha_inicio})
                  </span>
                  <button type="button" className="ghost-btn" onClick={() => cerrarCicloPorId(c.id)}>
                    Cerrar ciclo {c.numero}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="lists-hint">No hay ciclos activos. Abre uno nuevo o registra un gasto (se creará el primer ciclo si no existe ninguno).</p>
        )}
      </article>

      {ciclosOrdenados.map((ciclo) => {
        const lotes = lotesPorCiclo(ciclo.id);
        return (
          <article key={ciclo.id} className="card card-wide">
            <h3>
              Ciclo {ciclo.numero}{' '}
              <span className={`estado-tag estado-${ciclo.estado === 'activo' ? 'activo' : 'cerrado'}`}>
                {ciclo.estado}
              </span>
            </h3>
            <p className="lists-hint">
              Inicio: {ciclo.fecha_inicio}
              {ciclo.fecha_cierre ? ` · Cierre: ${ciclo.fecha_cierre}` : ''} · Lotes en este ciclo: {lotes.length}
            </p>
            {lotes.length === 0 ? (
              <p className="lists-hint">Sin lotes en este ciclo.</p>
            ) : (
              <div className="table-wrap ciclos-lotes-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lote #</th>
                      <th>Ingreso</th>
                      <th>Comprados</th>
                      <th>Vendidos</th>
                      <th>Mortalidad</th>
                      <th>Disponibles</th>
                      <th>Precio compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map((l) => (
                        <tr key={l.id}>
                          <td data-label="Lote #">{l.numero_lote}</td>
                          <td data-label="Ingreso">{l.fecha_ingreso}</td>
                          <td data-label="Comprados">{l.cantidad_comprada}</td>
                          <td data-label="Vendidos">{ventasPorLote(l.id)}</td>
                          <td data-label="Mortalidad">{mortalidadPorLote(l.id)}</td>
                          <td data-label="Disponibles">{disponiblesMap[l.id] ?? '—'}</td>
                          <td data-label="Precio compra">{formatColones(l.precio_compra)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default CiclosModule;
