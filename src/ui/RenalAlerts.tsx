import type { SessionState } from '../context/session';
import { cockcroftGault } from '../engine/renal';
import { validateAge, validateWeight, validateCreatinine } from '../engine/validation';
import { evaluateAllRenalRules } from '../rules/renal-rules.engine';
import { renalRules } from '../data/renal-rules';
import { formatNumber } from '../engine/units';

interface RenalAlertsProps {
  state: SessionState;
}

export function RenalAlerts({ state }: RenalAlertsProps) {
  const { age, sex, weight, creatinine, activeRenalRuleIds } = state;

  // Need ClCr to evaluate
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

  // Use UNROUNDED ClCr for rule evaluation (corrección de seguridad)
  const cgResult = cockcroftGault({ age: age!, weight: weight!, creatinine: creatinine!, sex: sex! });
  const clcrRaw = cgResult.value;

  const alerts = evaluateAllRenalRules(activeRenalRuleIds, clcrRaw, renalRules);

  if (alerts.length === 0) return null;

  return (
    <section id="section-renal-alerts" className="space-y-3">
      <h2 className="section-title px-1">
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Alertas de ajuste renal
      </h2>

      {alerts.map((alert) => {
        const isSevere = alert.suggestedDose.toLowerCase().includes('evitar') ||
          alert.suggestedDose.toLowerCase().includes('contraindicad');

        return (
          <div
            key={alert.rule.id}
            className={isSevere ? 'card-danger' : 'card-warning'}
            id={`alert-${alert.rule.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {alert.rule.droga}
                  </h3>
                  <span className="text-xs text-slate-500">
                    ({alert.rule.indicacion})
                  </span>
                  {!alert.rule.verified && (
                    <span className="badge-unverified">no verificada</span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-600">Dosis normal:</span> {alert.rule.dosisNormal}
                  </p>
                  <p className={`text-sm font-medium ${isSevere ? 'text-rose-400' : 'text-amber-400'}`}>
                    → Con ClCr {formatNumber(clcrRaw, 1)}: {alert.suggestedDose}
                  </p>
                </div>

                {alert.appliedAdjustment && (
                  <p className="mt-1 text-xs text-slate-600">
                    Umbral: ClCr ≤ {alert.appliedAdjustment.clcrMax} mL/min
                  </p>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              📄 {alert.rule.source} · Revisión: {alert.rule.lastReviewed}
            </p>
          </div>
        );
      })}
    </section>
  );
}
