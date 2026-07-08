function ReportesTab({ data, exportPDF, exportExcel, ventasPendientesResumen }) {
  const pend = ventasPendientesResumen || {
    sinPesar: 0,
    sinEntregar: 0,
    pollosSinEntregar: 0,
    cobroPendiente: 0,
    entregadas: 0,
  };

  return (
    <section className="reportes-grid">
      <article className="card">
        <h3>Exportaciones PRO</h3>
        <p>Descarga resumen financiero y dataset historico.</p>
        <button onClick={exportPDF}>Exportar PDF</button>
        <button onClick={exportExcel}>Exportar Excel</button>
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
      <article className="card">
        <h3>Vista ciclos</h3>
        <ul className="list">
          {(data.ciclos || []).map((ciclo) => (
            <li key={ciclo.id}>
              <strong>Ciclo {ciclo.numero}</strong> - {ciclo.estado}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default ReportesTab;
