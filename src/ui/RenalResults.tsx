import type { SessionState } from '../context/session';
import { cockcroftGault, ckdEpi2021, devineIdealWeight, adjustedBodyWeight } from '../engine/renal';
import { validateAge, validateWeight, validateCreatinine } from '../engine/validation';
import { formatNumber } from '../engine/units';
import { FormulaDetail } from './FormulaDetail';
import { StepDisplay } from './StepDisplay';

interface RenalResultsProps {
  state: SessionState;
}

export function RenalResults({ state }: RenalResultsProps) {
  const { age, sex, weight, height, creatinine } = state;

  // Validar que tenemos los datos mínimos
  const canCalculateCG =
    age !== null &&
    sex !== null &&
    weight !== null &&
    creatinine !== null &&
    validateAge(age).valid &&
    validateWeight(weight).valid &&
    validateCreatinine(creatinine).valid;

  const canCalculateEPI =
    age !== null &&
    sex !== null &&
    creatinine !== null &&
    validateAge(age).valid &&
    validateCreatinine(creatinine).valid;

  if (!canCalculateCG && !canCalculateEPI) {
    return (
      <section className="card opacity-60" id="section-renal">
        <h2 className="section-title">
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Función renal
        </h2>
        <p className="text-sm text-slate-500">
          Completá edad, sexo, peso y creatinina para calcular.
        </p>
      </section>
    );
  }

  const cgResult = canCalculateCG
    ? cockcroftGault({ age: age!, weight: weight!, creatinine: creatinine!, sex: sex! })
    : null;

  const epiResult = canCalculateEPI
    ? ckdEpi2021({ age: age!, creatinine: creatinine!, sex: sex! })
    : null;

  // Calculate IBW/ABW if height is available
  let ibwResult = null;
  let abwResult = null;
  let cgWithAbw = null;

  if (canCalculateCG && height !== null && height > 100 && sex !== null) {
    ibwResult = devineIdealWeight(height, sex);
    abwResult = adjustedBodyWeight(weight!, ibwResult.value);

    if (abwResult) {
      cgWithAbw = cockcroftGault({
        age: age!, weight: weight!, creatinine: creatinine!, sex: sex!,
        adjustedWeight: abwResult.value,
      });
    }
  }

  return (
    <section id="section-renal" className="space-y-3">
      <h2 className="section-title px-1">
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Función renal
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {/* Cockcroft-Gault */}
        {cgResult && (
          <div className="card">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cockcroft-Gault</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`result-value ${getClcrColor(cgResult.value)}`}>
                    {formatNumber(cgResult.value, 1)}
                  </span>
                  <span className="result-unit">mL/min</span>
                </div>
              </div>
              <span className={`badge ${getClcrBadge(cgResult.value)}`}>
                {getClcrLabel(cgResult.value)}
              </span>
            </div>

            {/* IBW/ABW section */}
            {ibwResult && (
              <div className="mt-3 p-2.5 bg-slate-900/60 rounded-xl">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">IBW (Devine):</span>
                  <span className="text-slate-300 font-medium">{formatNumber(ibwResult.value, 1)} kg</span>
                </div>
                {abwResult && cgWithAbw && (
                  <>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="text-slate-500">Peso ajustado:</span>
                      <span className="text-amber-400 font-medium">{formatNumber(abwResult.value, 1)} kg</span>
                      <span className="text-slate-600">(obeso: peso {'>'} 1,2 × IBW)</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700/30">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-amber-400/80">CG con ABW:</span>
                          <span className={`text-lg font-bold ${getClcrColor(cgWithAbw.value)}`}>
                            {formatNumber(cgWithAbw.value, 1)}
                          </span>
                          <span className="text-xs text-slate-500">mL/min</span>
                        </div>
                        <span className={`badge ${getClcrBadge(cgWithAbw.value)}`}>
                          {getClcrLabel(cgWithAbw.value)}
                        </span>
                      </div>
                    </div>
                    <FormulaDetail title="Ver pasos IBW/ABW">
                      <StepDisplay steps={[...ibwResult.steps, ...abwResult.steps, ...cgWithAbw.steps]} />
                    </FormulaDetail>
                  </>
                )}
                {!abwResult && (
                  <p className="text-xs text-slate-600 mt-1">
                    Peso normal (≤ 1,2 × IBW) — no requiere ajuste.
                  </p>
                )}
              </div>
            )}

            {/* Warnings */}
            {cgResult.warnings.map((w, i) => (
              <div key={i} className="mt-2 p-2 bg-amber-950/30 border border-amber-700/30 rounded-lg">
                <p className="text-xs text-amber-400">⚠️ {w}</p>
              </div>
            ))}

            <p className="mt-2 text-xs text-sky-400/70">
              📌 Para ajuste de dosis de drogas, usar este valor (Cockcroft-Gault).
            </p>

            <FormulaDetail title="Ver fórmula y pasos">
              <p className="font-mono text-slate-500 mb-2">
                ClCr = ((140 − edad) × peso) / (72 × CrS){sex === 'female' ? ' × 0,85' : ''}
              </p>
              <StepDisplay steps={cgResult.steps} />
            </FormulaDetail>
          </div>
        )}

        {/* CKD-EPI 2021 */}
        {epiResult && (
          <div className="card">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CKD-EPI 2021 <span className="text-slate-600">(sin raza)</span></p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`result-value ${getClcrColor(epiResult.value)}`}>
                    {formatNumber(epiResult.value, 0)}
                  </span>
                  <span className="result-unit">mL/min/1,73 m²</span>
                </div>
              </div>
              <span className={`badge ${getClcrBadge(epiResult.value)}`}>
                {getClcrLabel(epiResult.value)}
              </span>
            </div>

            <FormulaDetail title="Ver fórmula y pasos">
              <p className="font-mono text-slate-500 mb-2 text-xs leading-relaxed">
                eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(−1,200) × 0,9938^edad
                {sex === 'female' ? ' × 1,012' : ''}
              </p>
              <StepDisplay steps={epiResult.steps} />
            </FormulaDetail>
          </div>
        )}
      </div>
    </section>
  );
}

function getClcrColor(value: number): string {
  if (value >= 60) return 'text-emerald-400';
  if (value >= 30) return 'text-amber-400';
  if (value >= 15) return 'text-orange-400';
  return 'text-rose-400';
}

function getClcrBadge(value: number): string {
  if (value >= 60) return 'badge-info';
  if (value >= 30) return 'badge-warning';
  return 'badge-danger';
}

function getClcrLabel(value: number): string {
  if (value >= 90) return 'Normal';
  if (value >= 60) return 'Leve ↓';
  if (value >= 30) return 'Moderada ↓';
  if (value >= 15) return 'Severa ↓';
  return 'Fallo renal';
}
