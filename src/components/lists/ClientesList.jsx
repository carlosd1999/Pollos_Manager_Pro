import { useMemo, useState } from 'react';
import { labelPreferenciaPolloCorto } from '../../constants/clientePolloPreferencia';
import {
  VENTA_FILTRO_PERSONA_OPCIONES,
  defaultVentaClientePersonaFromFullName,
  filtrarClientes,
} from '../../constants/ventaClientePersonas';
import { IconEditar, IconEliminar } from '../icons/RowActionIcons';

function ClientesList({ data, startEditCliente, confirmDeleteCliente, currentUserFullName = '' }) {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroPersona, setFiltroPersona] = useState(() =>
    defaultVentaClientePersonaFromFullName(currentUserFullName),
  );

  const clientesFiltrados = useMemo(
    () => filtrarClientes(data.clientes, { texto: filtroTexto, persona: filtroPersona }),
    [data.clientes, filtroTexto, filtroPersona],
  );

  const totalClientes = (data.clientes || []).length;
  const hayFiltros = Boolean(filtroTexto.trim() || filtroPersona.trim());

  return (
    <section className="card list-panel operaciones-lists">
      <h3>Clientes</h3>
      <p className="lists-hint clientes-total-hint">
        <strong>{totalClientes}</strong> cliente{totalClientes === 1 ? '' : 's'} en total
        {hayFiltros && clientesFiltrados.length !== totalClientes && (
          <>
            {' '}
            · <strong>{clientesFiltrados.length}</strong> con los filtros actuales
          </>
        )}
      </p>
      <div className="ventas-filtros-grid clientes-filtros-grid form-field-stack">
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="clientes-filtro-texto">
            Buscar por nombre
          </label>
          <input
            id="clientes-filtro-texto"
            type="search"
            autoComplete="off"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className="form-field-stack">
          <label className="form-field-label" htmlFor="clientes-filtro-persona">
            Cliente de
          </label>
          <select
            id="clientes-filtro-persona"
            className="venta-cliente-persona-filter"
            value={filtroPersona}
            onChange={(e) => setFiltroPersona(e.target.value)}
          >
            <option value="">Todas las personas</option>
            {VENTA_FILTRO_PERSONA_OPCIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(filtroTexto.trim() || filtroPersona.trim()) && clientesFiltrados.length === 0 && (
        <p className="lists-hint" style={{ marginTop: 0 }}>
          Ningún cliente coincide con los filtros.
        </p>
      )}
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
            {data.clientes.length > 0 && clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5}>Ningún cliente coincide con los filtros.</td>
              </tr>
            )}
            {clientesFiltrados.map((c) => (
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
