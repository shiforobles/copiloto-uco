import type { SessionState } from '../context/session';
import { evaluateTreatment, treatmentIds } from '../clinical/therapy';
import { AdvicePanel } from './TreatmentPage';

/** Referencia de lectura: ningún elemento se marca como administrado/cubierto. */
export function Checklist({ state }: { state: SessionState }) {
  const ids = treatmentIds(state);
  return <section id="section-checklist" className="space-y-4">
    <div><h2 className="section-title">Referencia terapéutica</h2><p className="text-sm text-slate-400">Abrí cada opción para ver el motivo, las precauciones y los controles en este paciente. No necesitás marcar nada.</p></div>
    {!ids.length && <p className="card text-sm text-slate-400">Elegí SCA o insuficiencia cardíaca en los datos del paciente para ver las fichas disponibles. Para otros cuadros, consultá la biblioteca.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{ids.map(id => {
      const advice = evaluateTreatment(id, state);
      return <a key={id} href={`#tratamiento/${id}`} className="therapy-card" aria-label={`Abrir ${advice.title}`}><div className="flex gap-3 justify-between mb-3"><h3 className="font-semibold text-lg text-slate-100">{advice.title}</h3><span className="text-teal-300" aria-hidden="true">↗</span></div><AdvicePanel advice={advice} compact /><span className="block mt-3 text-sm text-teal-300">Ver indicación, precauciones y controles →</span></a>;
    })}</div>
    <p className="text-xs text-slate-500">Estas fichas no concilian toda la medicación ni garantizan un tratamiento completo. Validación clínica local pendiente.</p>
  </section>;
}
