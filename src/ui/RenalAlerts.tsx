import type { SessionState } from '../context/session';
import { getDosingClCr } from '../engine/renal';
import { validateAge, validateWeight, validateCreatinine } from '../engine/validation';
import { evaluateAllRenalRules } from '../rules/renal-rules.engine';
import { renalRules } from '../data/renal-rules';
import { formatNumber } from '../engine/units';
import { dosingBlockReason } from '../clinical/patient';

interface RenalAlertsProps {
  state: SessionState;
}

export function RenalAlerts({ state }: RenalAlertsProps) {
  const { age, sex, weight, height, creatinine, hasAF, activeRenalRuleIds } = state;
  const blocked = dosingBlockReason(state);
  if (blocked && activeRenalRuleIds.length > 0) return <div className="card-warning" role="status"><p className="text-sm text-amber-200">{blocked}</p></div>;

  // Need ClCr data to evaluate
  const canCalculate =
    age !== null &&
    sex !== null &&
    weight !== null &&
    creatinine !== null &&
    validateAge(age).valid &&
    validateWeight(weight).valid &&
    validateCreatinine(creatinine).valid;

  if (!canCalculate || activeRenalRuleIds.length === 0) {
    return null;
  }

  // Use unified dosing ClCr (con ABW si el paciente es obeso)
  const dosingResult = getDosingClCr({ age: age!, sex: sex!, weight: weight!, creatinine: creatinine!, height });
  const clcrRaw = dosingResult.value;

  const alerts = evaluateAllRenalRules(
    activeRenalRuleIds,
    clcrRaw,
    renalRules,
    { age, weight, creatinine, hasAF }
  );

  if (alerts.length === 0) return null;

  return (
    <section id="section-renal-alerts" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="section-title mb-0">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Alertas de ajuste de dosis
        </h2>
        <span className="text-xs text-slate-500">
          Basado en ClCr: <strong className="text-slate-300">{formatNumber(clcrRaw, 1)} mL/min</strong>
          {dosingResult.isAdjustedWeightUsed && <span className="text-amber-400 text-[10px] ml-1">(ABW)</span>}
        </span>
      </div>

      {alerts.map((alert) => {
        const isSevere = alert.suggestedDose.toLowerCase().includes('evitar') ||
          alert.suggestedDose.toLowerCase().includes('contraindicad') ||
          alert.suggestedDose.toLowerCase().includes('no recomendado');

        return (
          <div
            key={alert.rule.id}
            className={`${isSevere ? 'card-danger' : 'card-warning'} border transition-all`}
            id={`alert-${alert.rule.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {alert.rule.droga}
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({alert.rule.indicacion})
                  </span>
                  {!alert.rule.verified && (
                    <span className="badge-unverified text-[10px] px-1.5 py-0.5">
                      ⚠️ Regla borrador no verificada
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500 font-medium">Dosis habitual:</span> {alert.rule.dosisNormal}
                  </p>
                  <p className={`text-sm font-semibold ${isSevere ? 'text-rose-400' : 'text-amber-300'}`}>
                    → Conducta sugerida: {alert.suggestedDose}
                  </p>
                </div>

                {alert.appliedCriteriaReduction && (
                  <div className="mt-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                    <p className="text-sky-300 font-medium mb-1">
                      Criterios de reducción cumplidos ({alert.appliedCriteriaReduction.metCriteriaCount} de {alert.appliedCriteriaReduction.requiredCount} requeridos):
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                      {alert.appliedCriteriaReduction.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.appliedAdjustment && (
                  <p className="mt-1 text-xs text-slate-500">
                    Umbral renal cruzado: ClCr ≤ {alert.appliedAdjustment.clcrMax} mL/min
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
              <span>📄 Fuente: {alert.rule.source}</span>
              <span>Revisión: {alert.rule.lastReviewed}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
