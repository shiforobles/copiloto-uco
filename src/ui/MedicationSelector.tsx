import { useMemo, useState } from 'react';
import type { SessionAction, SessionState } from '../context/session';
import { renalRules } from '../data/renal-rules';

interface MedicationSelectorProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function MedicationSelector({ state, dispatch }: MedicationSelectorProps) {
  const [query, setQuery] = useState('');
  const { activeRenalRuleIds } = state;

  const missingRenalData = [
    state.age === null ? 'edad' : null,
    state.sex === null ? 'sexo' : null,
    state.weight === null ? 'peso' : null,
    state.creatinine === null ? 'creatinina' : null,
  ].filter((value): value is string => value !== null);

  const visibleRules = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    return [...renalRules]
      .sort((a, b) => a.droga.localeCompare(b.droga, 'es'))
      .filter((rule) => {
        if (!normalized) return true;
        return `${rule.droga} ${rule.indicacion}`.toLocaleLowerCase('es').includes(normalized);
      });
  }, [query]);

  const toggleRule = (ruleId: string) => {
    dispatch({
      type: activeRenalRuleIds.includes(ruleId) ? 'REMOVE_RENAL_RULE' : 'ADD_RENAL_RULE',
      ruleId,
    });
  };

  return (
    <section id="section-medication-selector" className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="section-title mb-0">Consultar una medicación</h2>
          <p className="mt-1 text-xs text-slate-500">Elegila aunque falten datos del paciente.</p>
        </div>
        {activeRenalRuleIds.length > 0 && (
          <span className="badge-info whitespace-nowrap">{activeRenalRuleIds.length} seleccionada{activeRenalRuleIds.length === 1 ? '' : 's'}</span>
        )}
      </div>

      <div className="card">
        <label htmlFor="medication-search" className="sr-only">Buscar medicación</label>
        <input
          id="medication-search"
          type="search"
          className="input-field"
          placeholder="Buscar droga o indicación…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {missingRenalData.length > 0 && (
          <button
            type="button"
            onClick={() => document.getElementById('section-patient')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="mt-3 w-full rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-left text-xs text-amber-300"
          >
            Podés consultar la dosis de referencia. Para ajustar por función renal falta: {missingRenalData.join(', ')}.
          </button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {visibleRules.map((rule) => {
            const active = activeRenalRuleIds.includes(rule.id);
            return (
              <button
                key={rule.id}
                id={`med-${rule.id}`}
                type="button"
                onClick={() => toggleRule(rule.id)}
                className={`min-h-14 rounded-xl border px-2.5 py-2 text-left transition-colors active:scale-[0.98] ${
                  active
                    ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="block text-xs font-semibold">{active ? '✓ ' : ''}{rule.droga}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">{rule.indicacion}</span>
              </button>
            );
          })}
        </div>

        {visibleRules.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">No hay coincidencias.</p>
        )}
      </div>
    </section>
  );
}
