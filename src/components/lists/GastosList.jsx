import { formatColones } from '../../lib/formatCurrency';
import { IconEditar, IconEliminar } from '../icons/RowActionIcons';

function GastosList({ data, startEditGasto, confirmDeleteGasto, filtroCicloLabel }) {
  return (
    <section className="card list-panel operaciones-lists">
      <h3>Gastos</h3>
      <p className="lists-hint">
        {filtroCicloLabel ? (
          <>
            Gastos de <strong>{filtroCicloLabel}</strong> · cambia el ciclo arriba para ver otros.
          </>
        ) : (
          <>Listado de gastos del negocio (todos los ciclos).</>
        )}
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.gastos.length === 0 && (
              <tr>
                <td colSpan={4}>Sin gastos aún.</td>
              </tr>
            )}
            {data.gastos.map((g) => (
              <tr key={g.id}>
                <td>{g.fecha}</td>
                <td>{g.categoria}</td>
                <td>{formatColones(g.monto)}</td>
                <td className="col-actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost-btn btn-icon"
                      onClick={() => startEditGasto(g)}
                      aria-label="Editar gasto"
                      title="Editar gasto"
                    >
                      <IconEditar />
                    </button>
                    <button
                      type="button"
                      className="danger-btn btn-icon"
                      onClick={() => confirmDeleteGasto(g.id)}
                      aria-label="Eliminar gasto"
                      title="Eliminar gasto"
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

export default GastosList;
