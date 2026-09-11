import type { SessionState } from '../context/session';
import { renalRules } from '../data/renal-rules';
import { cockcroftGaultForDosing } from '../engine/renal';
import { formatNumber } from '../engine/units';
import { validateAge, validateCreatinine, validateWeight } from '../engine/validation';
import { evaluateRenalRule } from '../rules/renal-rules.engine';

interface RenalAlertsProps {
  state: SessionState;
}

export function RenalAlerts({ state }: RenalAlertsProps) {
  const { age, sex, weight, height, creatinine, activeRenalRuleIds } = state;

  if (activeRenalRuleIds.length === 0) return null;

  const missingFields = [
    age === null ? 'edad' : null,
    sex === null ? 'sexo' : null,
    weight === null ? 'peso' : null,
    creatinine === null ? 'creatinina' : null,
  ].filter((value): value is string => value !== null);

  const canCalculate =
    missingFields.length === 0 &&
    validateAge(age!).valid &&
    validateWeight(weight!).valid &&
    validateCreatinine(creatinine!).valid;

  const dosingContext = canCalculate
    ? cockcroftGaultForDosing({
        age: age!,
        sex: sex!,
        weight: weight!,
        heightCm: height ?? undefined,
        creatinine: creatinine!,
      })
    : null;
  const clcr = dosingContext?.result.value ?? null;

  const selected = activeRenalRuleIds
    .map((ruleId) => {
      const rule = renalRules.find((candidate) => candidate.id === ruleId);
      if (!rule) return null;
      return {
        rule,
        result: clcr === null ? null : evaluateRenalRule(ruleId, clcr, renalRules),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <section id="section-medication-results" className="scroll-mt-20 space-y-3">
      <div className="px-1">
        <h2 className="section-title mb-0">Dosis y ajuste</h2>
        <p className="mt-1 text-xs text-slate-500">
          {clcr === null
            ? 'Referencia general hasta completar los datos necesarios.'
            : `Individualizado con ClCr ${formatNumber(clcr, 1)} mL/min (${dosingContext?.weightStrategy === 'adjusted' ? 'peso ajustado' : 'peso real'}).`}
        </p>
      </div>

      {clcr === null && (
        <button
          type="button"
          onClick={() => document.getElementById('section-patient')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="w-full rounded-xl border border-amber-700/40 bg-amber-950/25 px-3 py-2.5 text-left text-xs text-amber-300"
        >
          Falta {missingFields.length > 0 ? missingFields.join(', ') : 'corregir datos inválidos'} para calcular el ajuste renal. La información general sigue visible.
        </button>
      )}

      {selected.map(({ rule, result }) => {
        const suggestedDose = result?.suggestedDose ?? rule.dosisNormal;
        const severe = /evitar|contraindicad|no recomendado/i.test(suggestedDose);
        const adjusted = result?.appliedAdjustment !== null && result?.appliedAdjustment !== undefined;

        return (
          <article key={rule.id} className={severe ? 'card-danger' : adjusted ? 'card-warning' : 'card'}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{rule.droga}</h3>
              <span className="badge-info">{rule.indicacion}</span>
              {!rule.verified && <span className="badge-unverified">borrador</span>}
            </div>

            <div className="mt-3 rounded-xl bg-slate-950/45 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                {clcr === null ? 'Dosis de referencia sin individualizar' : adjusted ? 'Ajuste sugerido por esta regla' : 'Sin ajuste renal según esta regla'}
              </p>
              <p className={`mt-1 text-base font-semibold ${severe ? 'text-rose-300' : adjusted ? 'text-amber-300' : 'text-sky-300'}`}>
                {suggestedDose}
              </p>
            </div>

            {clcr !== null && result?.appliedAdjustment && (
              <p className="mt-2 text-xs text-slate-500">
                Aplicado por ClCr ≤ {result.appliedAdjustment.clcrMax} mL/min.
              </p>
            )}

            {clcr === null && rule.ajustes.length > 0 && (
              <p className="mt-2 text-xs text-amber-400">
                Esta medicación tiene ajustes renales pendientes de calcular.
              </p>
            )}

            <p className="mt-2 text-[10px] text-slate-700">
              {rule.source} · revisión {rule.lastReviewed}
            </p>
          </article>
        );
      })}
    </section>
  );
}
