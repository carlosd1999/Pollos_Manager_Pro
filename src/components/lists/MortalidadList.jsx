import { IconEditar, IconEliminar } from '../icons/RowActionIcons';

function MortalidadList({ data, startEditMortalidad, confirmDeleteMortalidad, filtroCicloLabel }) {
  const loteLabel = (id) => {
    const l = data.lotes.find((x) => x.id === id);
    return l ? `Lote ${l.numero_lote}` : id;
  };

  return (
    <section className="card list-panel operaciones-lists">
      <h3>Mortalidad</h3>
      <p className="lists-hint">
        {filtroCicloLabel ? (
          <>
            Bajas en lotes de <strong>{filtroCicloLabel}</strong>. Cambia el ciclo arriba para ver otros.
          </>
        ) : (
          <>Registros de bajas por lote (todos los ciclos).</>
        )}
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.mortalidad.length === 0 && (
              <tr>
                <td colSpan={5}>Sin registros de mortalidad.</td>
              </tr>
            )}
            {data.mortalidad.map((m) => (
              <tr key={m.id}>
                <td>{m.fecha}</td>
                <td>{loteLabel(m.lote_id)}</td>
                <td>{m.cantidad}</td>
                <td>{m.motivo || '—'}</td>
                <td className="col-actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost-btn btn-icon"
                      onClick={() => startEditMortalidad(m)}
                      aria-label="Editar mortalidad"
                      title="Editar mortalidad"
                    >
                      <IconEditar />
                    </button>
                    <button
                      type="button"
                      className="danger-btn btn-icon"
                      onClick={() => confirmDeleteMortalidad(m.id)}
                      aria-label="Eliminar mortalidad"
                      title="Eliminar mortalidad"
                    >
                      <IconEliminar />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MortalidadList;
