import type { SessionState, SessionAction } from '../context/session';
import { evaluateChecklist } from '../rules/checklist.engine';
import { checklistIC } from '../data/checklist-ic';
import { checklistSCA } from '../data/checklist-sca';
import { cockcroftGault } from '../engine/renal';
import { validateAge, validateWeight, validateCreatinine } from '../engine/validation';

interface ChecklistProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function Checklist({ state, dispatch }: ChecklistProps) {
  const { condition, phase, hasAF, coveredPillars, age, sex, weight, creatinine, potassium, systolicBP, heartRate } = state;

  if (!condition || !phase) {
    return (
      <section className="card opacity-60" id="section-checklist">
        <h2 className="section-title">
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Checklist terapéutico
        </h2>
        <p className="text-sm text-slate-500">
          Seleccioná condición y fase clínica para ver pilares faltantes.
        </p>
      </section>
    );
  }

  // Calculate ClCr for precautions
  let clcr: number | undefined;
  const canCalcCG =
    age !== null && sex !== null && weight !== null && creatinine !== null &&
    validateAge(age).valid && validateWeight(weight).valid && validateCreatinine(creatinine).valid;
  if (canCalcCG) {
    clcr = cockcroftGault({ age: age!, weight: weight!, creatinine: creatinine!, sex: sex! }).value;
  }

  const vitals = {
    potassium: potassium ?? undefined,
    clcr,
    systolicBP: systolicBP ?? undefined,
    heartRate: heartRate ?? undefined,
  };

  // Select the appropriate checklist based on condition
  const activeChecklist = condition === 'sca' ? checklistSCA : checklistIC;

  const missing = evaluateChecklist(phase, condition, hasAF, coveredPillars, activeChecklist, vitals);

  return (
    <section id="section-checklist">
      <h2 className="section-title px-1">
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Checklist terapéutico
        <span className="text-xs font-normal text-slate-500 ml-1">
          ({condition === 'ic' ? 'IC' : condition === 'sca' ? 'SCA' : 'Otra'} · {
            phase === 'shock_inotropicos' ? 'Shock' :
            phase === 'compensado' ? 'Compensado' : 'Pre-alta'
          })
        </span>
      </h2>

      {/* Covered pillars */}
      {coveredPillars.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {coveredPillars.map((id) => {
            const item = activeChecklist.find((c) => c.id === id);
            return item ? (
              <button
                key={id}
                onClick={() => dispatch({ type: 'TOGGLE_PILLAR', pillarId: id })}
                className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 transition-colors"
              >
                ✓ {item.pilar}
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Missing pillars */}
      {missing.length === 0 ? (
        <div className="card-success">
          <p className="text-sm text-emerald-400 text-center">
            ✓ Todos los pilares cubiertos para esta fase
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {missing.map(({ item, precautionWarnings }) => (
            <div
              key={item.id}
              className="card cursor-pointer hover:border-sky-600/30 transition-colors"
              id={`checklist-${item.id}`}
              onClick={() => dispatch({ type: 'TOGGLE_PILLAR', pillarId: item.id })}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox area */}
                <div className="mt-0.5 w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center shrink-0">
                  {/* Empty checkbox */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-200 text-sm">{item.pilar}</h3>
                    {!item.verified && (
                      <span className="badge-unverified">no verificada</span>
                    )}
                    {item.requireFA && (
                      <span className="badge-info">FA</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.droga}</p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    <p className="text-xs text-slate-400">
                      Inicio: <span className="text-sky-400/80">{item.dosisInicio}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Objetivo: <span className="text-sky-400/80">{item.dosisObjetivo}</span>
                    </p>
                  </div>

                  {/* Precaution warnings */}
                  {precautionWarnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {precautionWarnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-400">
                          ⚠️ {w}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
