import { useMemo } from 'react';
import {
  exportarPlanAlimentacionPDF,
  FASE_PLAN,
  fasePlanFila,
  generarPlanAlimentacion,
  LEVAMISOL_DIA,
  LEVAMISOL_GRAMOS,
  partesRangoDias,
  PLAN_ALIMENTACION_DEFAULT,
  RECORDATORIOS_ENCARGADO,
  REFERENCIA_POLLOS_MEDICACION,
  diasMelazaEnCiclo,
  MELAZA_DESDE_DIA,
  tipoAguaFila,
} from '../lib/planAlimentacion';

const TIPO_AGUA_UI = {
  microvit: { label: 'Vitaminas', mod: 'microvit' },
  levamisol: { label: 'Desparasitar', mod: 'levamisol' },
  'melaza-alternada': { label: 'Melaza alternada', mod: 'melaza' },
  melaza: { label: 'Melaza', mod: 'melaza' },
  limpia: { label: 'Agua limpia', mod: 'limpia' },
  sacrificio: { label: 'Sacrificio', mod: 'sacrificio' },
};

function PeriodoCell({ diaInicio, diaFin }) {
  const { prefijo, diasSemana } = partesRangoDias(diaInicio, diaFin);
  return (
    <>
      {prefijo}
      <strong className="alimentacion-semana">{diasSemana}</strong>
    </>
  );
}

function AguaCell({ row }) {
  const tipo = tipoAguaFila(row);
  const meta = TIPO_AGUA_UI[tipo] || TIPO_AGUA_UI.limpia;

  return (
    <div className="alimentacion-agua-cell">
      <span className={`alimentacion-tag alimentacion-tag--${meta.mod}`}>{meta.label}</span>
      <span className="alimentacion-agua-detalle">{row.agua}</span>
    </div>
  );
}

function AlimentacionTab() {
  const plan = useMemo(() => generarPlanAlimentacion(), []);
  const diasMelaza = useMemo(() => diasMelazaEnCiclo(), []);

  const handlePdf = () => {
    exportarPlanAlimentacionPDF({ plan });
  };

  return (
    <section className="alimentacion-panel">
      <article className="card card-wide alimentacion-hero">
        <div className="alimentacion-hero__content">
          <p className="alimentacion-kicker">Guía de alimentación</p>
          <h2>Dieta — {PLAN_ALIMENTACION_DEFAULT.diasCiclo} días</h2>
          <p className="alimentacion-hero__sub">
            Día <strong>1 = martes</strong> · Sacrificio día{' '}
            <strong>{PLAN_ALIMENTACION_DEFAULT.diasCiclo}</strong> (viernes) · Referencia{' '}
            <strong>{REFERENCIA_POLLOS_MEDICACION} pollos</strong>
          </p>
        </div>
        <button type="button" className="alimentacion-pdf-btn" onClick={handlePdf}>
          Descargar Guía
        </button>
      </article>

      <div className="alimentacion-stats" aria-label="Resumen del ciclo">
        <div className="alimentacion-stat">
          <span className="alimentacion-stat__label">Ingreso</span>
          <strong className="alimentacion-stat__value">Día 1 · Martes</strong>
        </div>
        <div className="alimentacion-stat">
          <span className="alimentacion-stat__label">Sacrificio</span>
          <strong className="alimentacion-stat__value">Día 46 · Viernes</strong>
        </div>
        <div className="alimentacion-stat alimentacion-stat--alert">
          <span className="alimentacion-stat__label">Levamisol</span>
          <strong className="alimentacion-stat__value">
            Día {LEVAMISOL_DIA} · {LEVAMISOL_GRAMOS} g
          </strong>
        </div>
        <div className="alimentacion-stat alimentacion-stat--melaza">
          <span className="alimentacion-stat__label">Melaza</span>
          <strong className="alimentacion-stat__value">Días {diasMelaza.join(', ')}</strong>
        </div>
      </div>

      <article className="card card-wide alimentacion-plan-card">
        <div className="alimentacion-plan-card__head">
          <div>
            <h3>Plan por períodos</h3>
          </div>
          <div className="alimentacion-leyenda" aria-label="Fases del concentrado">
            {Object.entries(FASE_PLAN).map(([key, fase]) => (
              <span key={key} className={`alimentacion-leyenda-item alimentacion-leyenda-item--${key}`}>
                {fase.label}
              </span>
            ))}
          </div>
        </div>

        <div className="table-wrap table-cards-mobile alimentacion-table-wrap">
          <table className="data-table alimentacion-table alimentacion-table--resumen">
            <thead>
              <tr>
                <th className="alimentacion-th-fase" aria-hidden="true" />
                <th>Semana</th>
                <th>Período</th>
                <th>Concentrado</th>
                <th>Agua</th>
              </tr>
            </thead>
            <tbody>
              {plan.filasResumen.map((row) => {
                const fase = fasePlanFila(row);
                return (
                  <tr
                    key={`${row.diaInicio}-${row.diaFin}-${row.concentrado}`}
                    className={`alimentacion-row--${fase}`}
                  >
                    <td className="alimentacion-td-fase" data-label="Fase">
                      <span className={`alimentacion-fase-badge alimentacion-fase-badge--${fase}`}>
                        {FASE_PLAN[fase]?.short}
                      </span>
                    </td>
                    <td data-label="Semana">
                      <strong className="alimentacion-semana">{row.semanasLabel}</strong></td>
                    <td data-label="Período">
                      <PeriodoCell diaInicio={row.diaInicio} diaFin={row.diaFin} />
                    </td>
                    <td data-label="Concentrado">{row.concentrado}</td>
                    <td data-label="Agua">
                      <AguaCell row={row} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      <div className="alimentacion-reglas-grid">
        {RECORDATORIOS_ENCARGADO.map((item) => (
          <article key={item.id} className="card alimentacion-regla-card">
            <h4>{item.titulo}</h4>
            <p>{item.texto}</p>
          </article>
        ))}
        <article className="card alimentacion-regla-card alimentacion-regla-card--melaza">
          <h4>Melaza en agua</h4>
          <p>
            Desde día <strong>{MELAZA_DESDE_DIA}</strong>, día por medio: días{' '}
            <strong>{diasMelaza.join(', ')}</strong>. Los demás días de esa fase, agua limpia.
          </p>
        </article>
      </div>
    </section>
  );
}

export default AlimentacionTab;
