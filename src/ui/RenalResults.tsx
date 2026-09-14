import type { SessionState } from '../context/session';
import { ckdEpi2021, getDosingClCr } from '../engine/renal';
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

  const dosingResult = canCalculateCG
    ? getDosingClCr({ age: age!, sex: sex!, weight: weight!, creatinine: creatinine!, height })
    : null;

  const epiResult = canCalculateEPI
    ? ckdEpi2021({ age: age!, creatinine: creatinine!, sex: sex! })
    : null;

  return (
    <section id="section-renal" className="space-y-3">
      <h2 className="section-title px-1">
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Función renal
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {/* Cockcroft-Gault (ClCr de dosificación) */}
        {dosingResult && (
          <div className="card border-sky-500/20 bg-gradient-to-b from-slate-900/90 to-slate-900/60">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    Cockcroft-Gault
                  </p>
                  <span className="badge-info text-[10px] px-1.5 py-0.5">
                    ClCr de Dosificación Oficial
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={`result-value ${getClcrColor(dosingResult.value)}`}>
                    {formatNumber(dosingResult.value, 1)}
                  </span>
                  <span className="result-unit">mL/min</span>
                </div>
              </div>
              <span className={`badge shrink-0 ${getClcrBadge(dosingResult.value)}`}>
                {getClcrLabel(dosingResult.value)}
              </span>
            </div>

            {/* Contexto de peso utilizado */}
            <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Peso para dosificar:</span>
                <span className={`font-medium ${dosingResult.isAdjustedWeightUsed ? 'text-amber-400' : 'text-slate-300'}`}>
                  {formatNumber(dosingResult.weightUsed, 1)} kg
                  {dosingResult.isAdjustedWeightUsed ? ' (ABW ajustado)' : ' (Peso real)'}
                </span>
              </div>

              {dosingResult.ibw !== null && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Peso ideal (Devine):</span>
                  <span className="text-slate-400">{formatNumber(dosingResult.ibw, 1)} kg</span>
                </div>
              )}

              {dosingResult.isAdjustedWeightUsed && (
                <p className="text-[11px] text-amber-400/90 pt-1 border-t border-slate-800/40">
                  ⚖️ Paciente obeso (peso real &gt; 1,2 × IBW). Se aplica peso ajustado para evitar sobredosificación.
                </p>
              )}
            </div>

            {/* Warnings */}
            {dosingResult.warnings.map((w, i) => (
              <div key={i} className="mt-2 p-2 bg-amber-950/30 border border-amber-700/30 rounded-lg">
                <p className="text-xs text-amber-400">⚠️ {w}</p>
              </div>
            ))}

            <p className="mt-2 text-xs text-sky-400/80">
              📌 Este valor gobierna automáticamente las alertas de ajuste y precauciones.
            </p>

            <FormulaDetail title="Ver fórmula y pasos completos">
              <p className="font-mono text-slate-500 mb-2 text-xs">
                ClCr = ((140 − edad) × peso) / (72 × CrS){sex === 'female' ? ' × 0,85' : ''}
              </p>
              <StepDisplay steps={dosingResult.steps} />
            </FormulaDetail>
          </div>
        )}

        {/* CKD-EPI 2021 */}
        {epiResult && (
          <div className="card">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  CKD-EPI 2021 <span className="text-slate-600">(sin raza)</span>
                </p>
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
