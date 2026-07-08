import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatColones } from '../lib/formatCurrency';

function DashboardTab({ stats, utilidadPorCiclo, gastoPorCategoria, filtroCicloLabel, ventasPendientesResumen }) {
  const pend = ventasPendientesResumen || {
    sinPesar: 0,
    sinEntregar: 0,
    pollosSinEntregar: 0,
    cobroPendiente: 0,
    entregadas: 0,
  };

  return (
    <section className="dashboard-grid">
      {filtroCicloLabel && (
        <article className="card card-wide" style={{ gridColumn: '1 / -1' }}>
          <p className="lists-hint" style={{ margin: 0 }}>
            Mostrando métricas solo de <strong>{filtroCicloLabel}</strong>. Cambia el filtro en la parte superior para ver todos los ciclos.
          </p>
        </article>
      )}
      <article className="card kpi">
        <h3>Ganancia total</h3>
        <strong className={stats.totalUtilidad < 0 ? 'kpi-negative' : 'kpi-positive'}>
          {formatColones(stats.totalUtilidad)}
        </strong>
      </article>
      <article className="card kpi">
        <h3>Rentabilidad</h3>
        <strong className={stats.rentabilidad < 0 ? 'kpi-negative' : 'kpi-positive'}>
          {stats.rentabilidad.toFixed(2)}%
        </strong>
      </article>
      <article className="card kpi"><h3>Mortalidad general</h3><strong>{stats.mortalidadGeneral.toFixed(2)}%</strong></article>
      <article className="card kpi kpi--alert">
        <h3>Sin pesar</h3>
        <strong>{pend.sinPesar}</strong>
      </article>
      <article className="card kpi kpi--alert">
        <h3>Sin entregar</h3>
        <strong>
          {pend.sinEntregar}
          {pend.pollosSinEntregar > 0 && (
            <span className="kpi-sub"> ({pend.pollosSinEntregar} pollos)</span>
          )}
        </strong>
      </article>
      <article className="card kpi kpi--alert">
        <h3>Cobro pendiente</h3>
        <strong>{pend.cobroPendiente}</strong>
      </article>
      <article className="card chart">
        <h3>Ganancia por ciclo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={utilidadPorCiclo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatColones(value)} />
            <Line type="monotone" dataKey="utilidad" stroke="var(--pm-chart-primary)" />
          </LineChart>
        </ResponsiveContainer>
      </article>
      <article className="card chart">
        <h3>Gastos por categoria</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gastoPorCategoria}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip formatter={(value) => formatColones(value)} />
            <Bar dataKey="total" fill="var(--pm-chart-secondary)" />
          </BarChart>
        </ResponsiveContainer>
      </article>
      <article className="card chart">
        <h3>Distribucion de gastos</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={gastoPorCategoria} dataKey="total" nameKey="categoria" outerRadius={75} fill="var(--pm-chart-primary)" />
            <Tooltip formatter={(value) => formatColones(value)} />
          </PieChart>
        </ResponsiveContainer>
      </article>
    </section>
  );
}

export default DashboardTab;
