import type { SessionState, SessionAction } from '../context/session';
import { renalRules } from '../data/renal-rules';

interface MedicationSelectorProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function MedicationSelector({ state, dispatch }: MedicationSelectorProps) {
  const { activeRenalRuleIds, age, sex, weight, creatinine } = state;

  // Only show if we have enough data for ClCr
  const hasRenalData = age !== null && sex !== null && weight !== null && creatinine !== null;

  if (!hasRenalData) return null;

  const toggleRule = (ruleId: string) => {
    if (activeRenalRuleIds.includes(ruleId)) {
      dispatch({ type: 'REMOVE_RENAL_RULE', ruleId });
    } else {
      dispatch({ type: 'ADD_RENAL_RULE', ruleId });
    }
  };

  // Group rules by drug name to avoid duplicate chips
  const drugGroups = new Map<string, { ids: string[]; nombre: string; indicaciones: string[] }>();
  for (const rule of renalRules) {
    const existing = drugGroups.get(rule.droga);
    if (existing) {
      existing.ids.push(rule.id);
      existing.indicaciones.push(rule.indicacion);
    } else {
      drugGroups.set(rule.droga, {
        ids: [rule.id],
        nombre: rule.droga,
        indicaciones: [rule.indicacion],
      });
    }
  }

  const hasAnyActive = activeRenalRuleIds.length > 0;

  return (
    <section id="section-medication-selector">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="section-title mb-0">
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Medicación del paciente
        </h2>
        {hasAnyActive && (
          <span className="badge-info text-xs">
            {activeRenalRuleIds.length} activa{activeRenalRuleIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="card">
        <p className="text-xs text-slate-500 mb-3">
          Seleccioná las drogas que recibe el paciente para evaluar ajuste renal automático:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from(drugGroups.entries()).map(([drugName, group]) => {
            const isActive = group.ids.some((id) => activeRenalRuleIds.includes(id));

            return group.ids.map((ruleId) => {
              const rule = renalRules.find((r) => r.id === ruleId)!;
              const isThisActive = activeRenalRuleIds.includes(ruleId);
              const hasMultiple = group.ids.length > 1;

              return (
                <button
                  key={ruleId}
                  id={`med-${ruleId}`}
                  onClick={() => toggleRule(ruleId)}
                  className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                    transition-all duration-200 active:scale-95
                    ${isThisActive
                      ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300'
                    }
                  `}
                >
                  {isThisActive && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {drugName}
                  {hasMultiple && (
                    <span className="text-slate-600 text-[10px]">
                      ({rule.indicacion.length > 15 ? rule.indicacion.slice(0, 15) + '…' : rule.indicacion})
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>
      </div>
    </section>
  );
}
