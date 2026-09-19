import type { SessionState } from '../context/session';
import { buildDaptReference, daptStatusLabels } from '../clinical/dapt-reference';
import { TherapyContextForm } from './TherapyContextForm';

export function DaptReference({ state }: { state: SessionState }) {
  const reference = buildDaptReference(state);
  return <div className="dapt-reference space-y-5">
    <section className="card" aria-labelledby="dapt-quick-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 id="dapt-quick-title" className="font-semibold text-lg">Decisión rápida</h2>
        <a href="#paciente" className="text-xs text-teal-300">Edad {state.age ?? '—'} años · Peso {state.weight ?? '—'} kg · Editar →</a>
      </div>
      <TherapyContextForm antiplateletsOnly daptSection="quick" />
      <p className="text-xs text-slate-400 mt-3">La comparación está disponible sin completar campos. Tipo de SCA y estrategia ordenan las opciones.</p>
    </section>

    <section aria-labelledby="dapt-reference-title">
      <div className="mb-3">
        <h2 id="dapt-reference-title" className="font-semibold text-lg text-teal-200">{reference.heading}</h2>
        <p className="text-sm text-slate-300 mt-1">{reference.contextual ? reference.scenario : 'Dosis de mantenimiento de referencia para adultos.'} AAS es la base; los tres P2Y12 son alternativas entre sí.</p>
      </div>
      {!!reference.alerts.length && <div className="card-warning mb-3" aria-label="Alertas de DAPT"><ul className="clinical-list">{reference.alerts.map(alert => <li key={alert}>{alert}</li>)}</ul></div>}
      <h3 className="text-xs text-slate-400 mb-2">Indicaciones y contraindicaciones generales</h3>
      <div role="table" aria-label="Comparación de antiagregantes" aria-describedby="dapt-dose-note dapt-common-pending" className="dapt-table">
        <div role="rowgroup" className="dapt-table-head"><div role="row" className="dapt-row">
          {['Droga', 'Mantenimiento', 'Estado', 'Motivo y precauciones'].map(label => <div role="columnheader" key={label}>{label}</div>)}
        </div></div>
        <div role="rowgroup">{reference.rows.map(row => <div role="row" aria-label={row.name} key={row.id} className={`dapt-row dapt-row-${row.status}`}>
          <div role="rowheader" className="dapt-drug"><strong>{row.name}</strong>{row.current && <span className="dapt-current">Actual</span>}</div>
          <div role="cell" className="dapt-dose"><strong>{row.dose}</strong>{row.doseNote && <span>{row.doseNote}</span>}</div>
          <div role="cell" className="dapt-state"><span className={`dapt-status dapt-status-${row.status}`}>{daptStatusLabels[row.status]}</span></div>
          <div role="cell" className="dapt-reason">
            <p>{row.reason}</p>
            {!!row.avoid.length && <p className="dapt-avoid">{row.avoid.join(' ')}</p>}
            {!!row.cautions.length && <p className="dapt-caution">{row.cautions.join(' ')}</p>}
            <p className="dapt-contra"><span>Contraindicaciones / precauciones: </span>{row.contraindications}</p>
            {!!row.pending.length && <p className="dapt-pending"><strong>Confirmar antes de indicar: </strong>{row.pending.join(' · ')}.</p>}
          </div>
        </div>)}</div>
      </div>
      <p id="dapt-common-pending" className="text-xs text-amber-100/90 leading-relaxed mt-3"><strong>Datos comunes a las cuatro filas. </strong>{reference.commonPending.length ? <>Confirmar antes de indicar: {reference.commonPending.join(' · ')}.</> : 'Revisar indicación, dosis previas y duración antes de concretar el esquema.'}</p>
      <p id="dapt-dose-note" className="text-xs text-slate-400 mt-2">Son referencias, incluso cuando una fila está contraindicada; no autorizan administración. No repetir cargas ni cambiar el P2Y12 actual automáticamente.</p>
    </section>

    <details className="source-details"><summary>Datos avanzados</summary><div className="mt-5"><TherapyContextForm antiplateletsOnly daptSection="advanced" /></div></details>
    <p className="scope-note">La fase clínica y la función renal aportan advertencias, sin ocultar la comparación. La valoración es parcial: no calcula ARC-HBR ni PRECISE-DAPT completo ni certifica riesgo bajo. En SCASEST no implica pretratamiento rutinario.</p>
  </div>;
}
