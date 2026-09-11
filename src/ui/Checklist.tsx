import type { SessionAction, SessionState } from '../context/session';
import { cockcroftGaultForDosing } from '../engine/renal';
import { validateAge, validateCreatinine, validateWeight } from '../engine/validation';
import { checklistIC } from '../data/checklist-ic';
import { checklistSCA } from '../data/checklist-sca';
import { evaluateChecklist } from '../rules/checklist.engine';

interface ChecklistProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function Checklist({ state, dispatch }: ChecklistProps) {
  const {
    condition,
    phase,
    hasAF,
    coveredPillars,
    age,
    sex,
    weight,
    height,
    creatinine,
    potassium,
    systolicBP,
    heartRate,
  } = state;

  if (condition === 'otra') return null;

  if (!condition || !phase) {
    return (
      <section className="card border-dashed opacity-80" id="section-checklist">
        <h2 className="section-title mb-1">Tratamiento esperado</h2>
        <p className="text-sm text-slate-500">
          {!condition
            ? 'Elegí SCA o insuficiencia cardíaca arriba para ver la guía terapéutica.'
            : 'Elegí la situación clínica para mostrar recomendaciones sin necesidad de cargar otros datos.'}
        </p>
      </section>
    );
  }

  let clcr: number | undefined;
  const canCalcCG =
    age !== null && sex !== null && weight !== null && creatinine !== null &&
    validateAge(age).valid && validateWeight(weight).valid && validateCreatinine(creatinine).valid;

  if (canCalcCG) {
    clcr = cockcroftGaultForDosing({
      age: age!,
      weight: weight!,
      heightCm: height ?? undefined,
      creatinine: creatinine!,
      sex: sex!,
    }).result.value;
  }

  const vitals = {
    potassium: potassium ?? undefined,
    clcr,
    systolicBP: systolicBP ?? undefined,
    heartRate: heartRate ?? undefined,
  };

  const activeChecklist = condition === 'sca' ? checklistSCA : checklistIC;
  const missing = evaluateChecklist(
    phase,
    condition,
    hasAF,
    coveredPillars,
    activeChecklist,
    vitals,
  );

  const conditionLabel = condition === 'ic' ? 'IC' : 'SCA';
  const phaseLabel =
    phase === 'shock_inotropicos' ? 'Shock' :
    phase === 'compensado' ? 'Estabilizado' : 'Pre-alta';

  return (
    <section id="section-checklist" className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="section-title mb-0">Tratamiento esperado</h2>
          <p className="mt-1 text-xs text-slate-500">{conditionLabel} · {phaseLabel}</p>
        </div>
        <span className="badge-info whitespace-nowrap">{missing.length} pendientes</span>
      </div>

      <div className="mb-3 rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-amber-300/90">
          Se muestran todos los tratamientos esperables aunque no cargues la medicación actual.
          Las dosis son borradores hasta completar la curación clínica.
        </p>
      </div>

      {coveredPillars.length > 0 && (
        <div className="mb-3 rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-3">
          <p className="mb-2 text-xs font-medium text-emerald-400">Marcados como “lo recibe”</p>
          <div className="flex flex-wrap gap-1.5">
            {coveredPillars.map((id) => {
              const item = activeChecklist.find((candidate) => candidate.id === id);
              return item ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE_PILLAR', pillarId: id })}
                  className="badge border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                  title="Tocar para volver a pendiente"
                >
                  ✓ {item.pilar}
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      {missing.length === 0 ? (
        <div className="card-success">
          <p className="text-center text-sm text-emerald-400">
            ✓ Marcaste todos los componentes mostrados para esta fase
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {missing.map(({ item, precautionWarnings, missingData }) => {
            const hasPrecaution = precautionWarnings.length > 0;
            const isIndividualized = item.verified && missingData.length === 0 && !hasPrecaution;

            return (
              <article
                key={item.id}
                className={hasPrecaution ? 'card-warning' : 'card'}
                id={`checklist-${item.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">{item.pilar}</h3>
                      {item.requireFA && <span className="badge-info">FA</span>}
                      {!item.verified && <span className="badge-unverified">borrador</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.droga}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_PILLAR', pillarId: item.id })}
                    className="shrink-0 rounded-lg border border-slate-600/60 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-600/50 hover:text-emerald-400"
                  >
                    Lo recibe
                  </button>
                </div>

                <div className="mt-3 rounded-xl bg-slate-950/45 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    {isIndividualized ? 'Dosis según datos cargados' : 'Dosis de referencia'}
                  </p>
                  <p className="mt-1 text-sm text-sky-300/90">{item.dosisInicio}</p>
                  <p className="mt-1 text-xs text-slate-500">Objetivo: {item.dosisObjetivo}</p>
                </div>

                {missingData.length > 0 && (
                  <p className="mt-2 text-xs text-amber-400">
                    Falta {missingData.join(', ')} para individualizar seguridad y dosis.
                  </p>
                )}

                {precautionWarnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {precautionWarnings.map((warning) => (
                      <p key={warning} className="text-xs font-medium text-amber-300">
                        ⚠️ {warning}
                      </p>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-[10px] text-slate-700">
                  {item.source} · revisión {item.lastReviewed}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
