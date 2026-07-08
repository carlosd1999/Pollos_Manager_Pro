import { useMemo, useState } from 'react';
import { expenseCategories } from '../../constants/forms';
import { formatColones } from '../../lib/formatCurrency';
import { IconEditar, IconEliminar } from '../icons/RowActionIcons';

function GastosList({ data, startEditGasto, confirmDeleteGasto, filtroCicloLabel }) {
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const categoriaOptions = useMemo(() => {
    const set = new Set(expenseCategories);
    (data.gastos || []).forEach((g) => {
      if (g.categoria) set.add(String(g.categoria));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [data.gastos]);

  const gastosFiltrados = useMemo(() => {
    if (!filtroCategoria) return data.gastos || [];
    return (data.gastos || []).filter((g) => String(g.categoria) === filtroCategoria);
  }, [data.gastos, filtroCategoria]);

  const totalFiltrado = useMemo(
    () => gastosFiltrados.reduce((sum, g) => sum + Number(g.monto || 0), 0),
    [gastosFiltrados],
  );

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
      <div className="ventas-list-toolbar form-field-stack">
        <label className="form-field-label" htmlFor="gastos-filtro-categoria">
          Filtrar por categoría
        </label>
        <select
          id="gastos-filtro-categoria"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categoriaOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap table-cards-mobile">
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
            {data.gastos.length > 0 && gastosFiltrados.length === 0 && (
              <tr>
                <td colSpan={4}>Ningún gasto en la categoría seleccionada.</td>
              </tr>
            )}
            {gastosFiltrados.map((g) => (
              <tr key={g.id}>
                <td data-label="Fecha">{g.fecha}</td>
                <td data-label="Categoría">{g.categoria}</td>
                <td data-label="Monto">{formatColones(g.monto)}</td>
                <td className="col-actions" data-label="Acciones">
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
          {data.gastos.length > 0 && (
            <tfoot>
              <tr className="gastos-list-total-row">
                <td colSpan={3} data-label="Total">
                  <strong>
                    Total
                    {filtroCategoria ? (
                      <>
                        {' '}
                        · <span className="gastos-list-total-cat">{filtroCategoria}</span>
                      </>
                    ) : null}
                  </strong>
                </td>
                <td data-label="Monto total">
                  <strong>{formatColones(totalFiltrado)}</strong>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

export default GastosList;
