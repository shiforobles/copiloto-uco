import { useState } from 'react';
import { useSession } from '../context/session';
import { evaluateTreatment, statusLabels, treatmentTitles, type TherapyAdvice } from '../clinical/therapy';
import { buildFollowUp } from '../clinical/follow-up';
import { Sources } from './ClinicalLibrary';
import { TherapyContextForm } from './TherapyContextForm';
import { DaptReference } from './DaptReference';

export function AdvicePanel({ advice, compact = false }: { advice: TherapyAdvice; compact?: boolean }) {
  return <div className={advice.status === 'blocked' ? 'card-warning' : 'card'}>
    <span className={advice.status === 'consider' ? 'badge-info' : 'badge-warning'}>{statusLabels[advice.status]}</span>
    <p className="text-base font-medium text-slate-100 mt-3 leading-relaxed">{advice.summary}</p>
    {!compact && <>
      {!!advice.reasons.length && <div className="mt-4"><h2 className="text-sm font-semibold text-teal-200">Por qué, en este paciente</h2><ul className="clinical-list mt-2">{advice.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></div>}
      {!!advice.missing.length && <details className="mt-4"><summary className="text-sm font-semibold text-amber-200 cursor-pointer">{advice.missing.length} datos necesarios para orientar la elección</summary><ul className="clinical-list mt-2">{advice.missing.map(item => <li key={item}>{item}</li>)}</ul></details>}
      {!!advice.options.length && <div className="grid gap-3 mt-5">{advice.options.map(option => <div key={option.name} className="dose-reference"><h2 className="font-semibold text-teal-200">{option.name}</h2><p className="mt-2 text-sm leading-relaxed text-slate-200">{option.text}</p></div>)}</div>}
    </>}
    {compact && !!advice.missing.length && <p className="text-xs text-slate-400 mt-2">{advice.missing.length} datos por completar · Abrí la ficha para ver cuáles.</p>}
  </div>;
}

export function FollowUpPanel() {
  const { state } = useSession();
  const items = buildFollowUp(state);
  return <section className="space-y-4" id="follow-up"><div><h2 className="section-title">Laboratorio y continuidad de cuidados</h2><p className="text-sm text-slate-400">Propuestas según hallazgos. Cada control requiere fecha y un profesional que revise el resultado.</p></div>
    {!items.length && <p className="card text-sm text-slate-400">Completá condición, antecedentes y laboratorio para orientar controles e interconsultas. La ausencia de propuestas no confirma que el paciente esté listo para el alta.</p>}
    {(['now', 'before-discharge', 'outpatient'] as const).map(timing => {
      const group = items.filter(i => i.timing === timing);
      if (!group.length) return null;
      return <div key={timing}><h3 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${timing === 'now' ? 'text-amber-300' : 'text-teal-300'}`}>{timing === 'now' ? 'Evaluar ahora en la internación' : timing === 'before-discharge' ? 'Resolver / coordinar antes del alta' : 'Organizar por consultorio'}</h3>
        <div className="grid gap-3 sm:grid-cols-2">{group.map(item => <article className="card" key={item.id}><h4 className="font-semibold text-slate-100">{item.title}</h4><p className="mt-2 text-xs text-teal-200">Motivo: {item.reason}</p><p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.action}</p></article>)}</div>
      </div>;
    })}
    {!!items.length && <Sources ids={[...new Set(items.flatMap(item => item.sourceIds))]} />}
  </section>;
}

export function TreatmentPage({ id }: { id?: string }) {
  const { state } = useSession();
  const [contextOpen, setContextOpen] = useState(() => !!id && evaluateTreatment(id, state).status === 'missing');
  if (!id || !treatmentTitles[id]) return <div className="card"><h1 className="section-title">Ficha no encontrada</h1><a className="back-link" href="#paciente">Volver al paciente →</a></div>;
  const advice = evaluateTreatment(id, state);
  return <article className="space-y-6">
    <a href="#paciente" className="back-link">← Paciente y referencia terapéutica</a>
    <div><span className="eyebrow">Según el paciente actual</span><h1 className="page-title mt-2">{advice.title}</h1><p className="page-subtitle">Referencia para tus indicaciones en papel. Se actualiza al modificar los datos de la sesión.</p></div>
    {id === 'doble-antiagregacion' ? <><span className="badge-warning">Validación local pendiente</span><DaptReference state={state} /></> : <>
      <AdvicePanel advice={advice} />
      <details className="source-details" open={contextOpen} onToggle={e => setContextOpen(e.currentTarget.open)}><summary>Completar o modificar el contexto clínico</summary><div className="mt-5"><TherapyContextForm /></div></details>
    </>}
    {!!advice.checks.length && <section className="card"><h2 className="section-title">Antes de indicar y durante el seguimiento</h2><ul className="clinical-list">{advice.checks.map(check => <li key={check}>{check}</li>)}</ul></section>}
    <Sources ids={advice.sourceIds} />
    <FollowUpPanel />
  </article>;
}
