function ReportesTab({ data, exportPDF, exportExcel }) {
  return (
    <section className="reportes-grid">
      <article className="card">
        <h3>Exportaciones PRO</h3>
        <p>Descarga resumen financiero y dataset historico.</p>
        <button onClick={exportPDF}>Exportar PDF</button>
        <button onClick={exportExcel}>Exportar Excel</button>
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
