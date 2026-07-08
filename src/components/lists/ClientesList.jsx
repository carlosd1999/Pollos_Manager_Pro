import { labelPreferenciaPolloCorto } from '../../constants/clientePolloPreferencia';
import { IconEditar, IconEliminar } from '../icons/RowActionIcons';

function ClientesList({ data, startEditCliente, confirmDeleteCliente }) {
  return (
    <section className="card list-panel operaciones-lists">
      <h3>Clientes</h3>
      <p className="lists-hint">Directorio de clientes.</p>
      <div className="table-wrap table-cards-mobile">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Pref. pollo</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.clientes.length === 0 && (
              <tr>
                <td colSpan={5}>Sin clientes aún.</td>
              </tr>
            )}
            {data.clientes.map((c) => (
              <tr key={c.id}>
                <td data-label="Nombre">{c.nombre}</td>
                <td data-label="Teléfono">{c.telefono || '—'}</td>
                <td data-label="Dirección">{c.direccion || '—'}</td>
                <td data-label="Pref. pollo">
                  {c.preferencia_pollo ? (
                    <span className={`preferencia-pollo-tag preferencia-pollo-tag--${c.preferencia_pollo}`}>
                      {labelPreferenciaPolloCorto(c.preferencia_pollo)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="col-actions" data-label="Acciones">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost-btn btn-icon"
                      onClick={() => startEditCliente(c)}
                      aria-label="Editar cliente"
                      title="Editar cliente"
                    >
                      <IconEditar />
                    </button>
                    <button
                      type="button"
                      className="danger-btn btn-icon"
                      onClick={() => confirmDeleteCliente(c.id)}
                      aria-label="Eliminar cliente"
                      title="Eliminar cliente"
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

export default ClientesList;
