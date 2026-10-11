import { useSession } from '../context/session';
import './sca-integral.css';
import { DaptReference } from './DaptReference';
import { ScaContextForm, ScaMoment } from './ScaContextForm';
import { buildScaIntegral } from '../clinical/sca-integral';
import { scaStatusLabels, scaNumber, type ScaOption } from '../clinical/sca-common';
import { scaSources } from '../clinical/sca-sources';

function SourceLinks({ ids }: { ids: string[] }) {
  return <div className="sca-source-links">{[...new Set(ids)].map(id => <a key={id} href={scaSources[id].url} target="_blank" rel="noreferrer">{scaSources[id].title} ↗</a>)}</div>;
}
function ReferenceRows({ rows }: { rows: ScaOption[] }) {
  return <div className="sca-options">{rows.map(row => <article className={`sca-option sca-option-${row.status}`} key={row.id} aria-labelledby={`sca-drug-${row.id}`}>
    <div className="sca-option-top"><h3 id={`sca-drug-${row.id}`}>{row.name}</h3><span className={`sca-status sca-status-${row.status}`}>{scaStatusLabels[row.status]}</span></div>
    <p className="sca-dose"><span>Referencia · </span>{row.reference}</p>
    {row.calculation && <p className="sca-calculation"><strong>Cálculo condicional, no orden: </strong>{row.calculation}</p>}
    <p className="sca-reason">{row.reason}</p>
    {!!row.avoid.length && <p className="sca-avoid">{row.avoid.join(' ')}</p>}
    {!!row.cautions.length && <p className="sca-caution">{row.cautions.join(' ')}</p>}
    {!!row.pending.length && <p className="sca-pending"><strong>Confirmar antes de indicar: </strong>{row.pending.join(' · ')}.</p>}
    <details className="sca-details"><summary>Contraindicaciones, controles y fuente</summary><p><strong>Precauciones: </strong>{row.contraindications}</p><p><strong>Control: </strong>{row.monitoring}</p><SourceLinks ids={row.sourceIds} /></details>
    {row.link && <a className="back-link" href={row.link.href}>{row.link.label} →</a>}
  </article>)}</div>;
}
function jump(id: string) { const section = document.getElementById(id); section?.scrollIntoView({ behavior: 'smooth', block: 'start' }); section?.focus({ preventScroll: true }); }

export function ScaIntegralPage() {
  const { state } = useSession();
  const plan = buildScaIntegral(state);
  return <article className="sca-integral space-y-6">
    <a href="#paciente" className="back-link">← Paciente</a>
    <header><span className="eyebrow">Referencia para el paciente actual</span><h1 className="page-title mt-2">SCA — tratamiento integral</h1><p className="page-subtitle">Drogas, alternativas y controles en una sola consulta. Las referencias permanecen visibles aunque falten datos.</p><span className="badge-warning mt-3">Validación local pendiente</span></header>
    <nav className="sca-jumps" aria-label="Secciones de tratamiento integral">{[['sca-acute', 'Fase aguda'], ['sca-dapt', 'Antiagregación'], ['sca-anticoag', 'Anticoagulación'], ['sca-ward', 'Internación'], ['sca-discharge', 'Prealta'], ['sca-followup', 'Seguimiento']].map(([id, label]) => <button key={id} onClick={() => jump(id)}>{label}</button>)}</nav>
    <div className="sca-context-strip"><ScaMoment /><p>El momento organiza la consulta; no confirma estabilidad. Edad, peso, TAS, FC, FEVI y laboratorio se comparten con Paciente.</p></div>
    {!!plan.alerts.length && <section className="card-warning" aria-label="Alertas prioritarias del SCA"><ul className="clinical-list">{plan.alerts.map(alert => <li key={alert}>{alert}</li>)}</ul></section>}
    <ScaContextForm />
    <section id="sca-dapt" tabIndex={-1} className="sca-section"><div className="sca-section-heading"><h2>Doble antiagregación</h2><a className="back-link" href="#tratamiento/doble-antiagregacion">Abrir ficha individual →</a></div><p className="mb-4">AAS más un único P2Y12; no combinar las alternativas entre sí.</p><DaptReference state={state} /></section>
    <section id="sca-acute" tabIndex={-1} className="sca-section"><h2>Fase aguda · prioridades</h2><p>Confirmar ECG, diagnóstico, tiempo de evolución y reperfusión; detectar shock, isquemia persistente y complicaciones. No demorar Hemodinamia por completar la ficha.</p><div className="flex flex-wrap gap-2 my-3"><a className="link-chip" href="#cuadros/sca-cest">SCACEST →</a><a className="link-chip" href="#cuadros/sca-sest">SCASEST →</a><a className="link-chip" href="#cuadros/shock">Shock →</a></div><ReferenceRows rows={plan.groups[0].rows} /></section>
    <section id="sca-anticoag" tabIndex={-1} className="sca-section"><h2>Anticoagulación parenteral</h2><p>Alternativas por estrategia, no una combinación. No repetir bolos, hacer cambios ni indicar continuidad al alta automáticamente.</p>
      <div className="sca-renal-note">{plan.renal ? <><strong>ClCr de dosificación: {scaNumber(plan.renal.value)} mL/min.</strong> Cockcroft–Gault con {scaNumber(plan.renal.weightUsed)} kg{plan.renal.isAdjustedWeightUsed ? ' de peso ajustado según el motor existente' : ' de peso real'}. Dosis de enoxaparina por peso real: {state.weight} kg. {plan.renal.warnings.join(' ')} {state.height === null && 'Sin talla: confirmar el peso apropiado para estimar ClCr.'}</> : 'ClCr no disponible para dosificar: confirmar datos, estabilidad de creatinina y vigencia del laboratorio. Las referencias siguen disponibles.'}{plan.egfr !== null && <> TFGe: {scaNumber(plan.egfr)} mL/min/1,73 m²; no sustituye ClCr para anticoagulantes.</>}</div>
      <ReferenceRows rows={plan.anticoagulation} />
    </section>
    <section id="sca-ward" tabIndex={-1} className="sca-section"><h2>Internación · tratamiento y prevención secundaria</h2><p>Revisar lo que ya recibe antes de iniciar o titular. Los objetivos no son dosis para administrar de entrada.</p>
      {plan.groups.slice(1).map(group => <section className="sca-group" key={group.id} aria-labelledby={`sca-group-${group.id}`}><h2 id={`sca-group-${group.id}`}>{group.title}</h2><p>{group.note}</p><ReferenceRows rows={group.rows} /></section>)}
    </section>
    <section id="sca-discharge" tabIndex={-1} className="sca-section card"><h2>Prealta · revisión integral</h2><ul className="clinical-list">{plan.discharge.map(item => <li key={item}>{item}</li>)}</ul><SourceLinks ids={['acsDischarge', 'scaNice']} /></section>
    <section id="sca-followup" tabIndex={-1} className="sca-section"><h2>Laboratorio, interconsultas y seguimiento</h2><p>Controles generales siempre visibles; propuestas adicionales según hallazgos. Dejar fecha y profesional responsable, sin diferir a consultorio un problema activo.</p>
      {(['now', 'before-discharge', 'outpatient'] as const).map(timing => {
        const items = plan.followUp.filter(item => item.timing === timing);
        return items.length ? <div className="sca-group" key={timing}><h3 className="text-teal-200 font-semibold mb-3">{timing === 'now' ? 'Resolver ahora' : timing === 'before-discharge' ? 'Coordinar antes del alta' : 'Control por consultorio'}</h3><div className="sca-followup-grid">{items.map(item => <article className="card" key={item.id}><h4 className="font-semibold">{item.title}</h4><p className="text-xs text-teal-200 my-2">{item.reason}</p><p className="text-sm text-slate-300">{item.action}</p><SourceLinks ids={item.sourceIds} /></article>)}</div></div> : null;
      })}
    </section>
    <p className="scope-note">SCA — tratamiento integral: fuentes consultadas el {plan.reviewedAt}. Validación local pendiente. Confirmar prospecto autorizado, disponibilidad y protocolo del servicio en Argentina. Esta referencia no concilia toda la medicación ni certifica un tratamiento completo. Reperfusión, fibrinólisis, cambios de antitrombóticos y titulaciones requieren sus protocolos específicos.</p>
  </article>;
}
