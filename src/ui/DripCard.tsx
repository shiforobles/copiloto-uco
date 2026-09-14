import { useState } from 'react';
import type { ActiveDrip, SessionAction } from '../context/session';
import { mlhToGamma, gammaToMlh, mlhToUgMin, ugMinToMlh, mlhToUnitsMin, unitsMinToMlh } from '../engine/drips';
import { formatNumber } from '../engine/units';
import { FormulaDetail } from './FormulaDetail';
import { StepDisplay } from './StepDisplay';
import { getDilutionById } from '../data/dilutions';
import type { CalculationResult } from '../engine/types';

interface DripCardProps {
  drip: ActiveDrip;
  weightKg: number | null;
  dispatch: React.Dispatch<SessionAction>;
  onUpdateDilution: (dripId: string, cantidad: number, volumenML: number, isUnits: boolean) => void;
}

export function DripCard({ drip, weightKg, dispatch, onUpdateDilution }: DripCardProps) {
  const isWeightBased = drip.modoDosis === 'ug_kg_min';
  const isUnitsBased = drip.modoDosis === 'u_min';
  const dilutionMeta = getDilutionById(drip.dilutionId);

  const initialAmount = isUnitsBased
    ? (drip.currentDilution.units ?? 40).toString()
    : (drip.currentDilution.mg ?? 0).toString();

  const [showDilutionEdit, setShowDilutionEdit] = useState(false);
  const [editAmount, setEditAmount] = useState(initialAmount);
  const [editVol, setEditVol] = useState(drip.currentDilution.volumenML.toString());

  const hasWeight = weightKg !== null && weightKg > 0;
  const canCalculate = isWeightBased ? hasWeight : true;

  // Calculate result based on input mode
  let result: CalculationResult<number> | null = null;

  if (canCalculate) {
    if (drip.inputMode === 'mlh' && drip.mlPerHour !== null && drip.mlPerHour >= 0) {
      if (isWeightBased) {
        result = mlhToGamma({
          mlPerHour: drip.mlPerHour,
          concentrationUgMl: drip.currentDilution.concentracionUgMl,
          weightKg: weightKg!,
        });
      } else if (isUnitsBased && drip.currentDilution.concentracionUPerMl) {
        result = mlhToUnitsMin({
          mlPerHour: drip.mlPerHour,
          concentrationUnitsPerMl: drip.currentDilution.concentracionUPerMl,
        });
      } else {
        result = mlhToUgMin({
          mlPerHour: drip.mlPerHour,
          concentrationUgMl: drip.currentDilution.concentracionUgMl,
        });
      }
    } else if (drip.inputMode === 'gamma' && drip.gamma !== null && drip.gamma >= 0) {
      if (isWeightBased) {
        result = gammaToMlh({
          gamma: drip.gamma,
          concentrationUgMl: drip.currentDilution.concentracionUgMl,
          weightKg: weightKg!,
        });
      } else if (isUnitsBased && drip.currentDilution.concentracionUPerMl) {
        result = unitsMinToMlh({
          unitsPerMin: drip.gamma,
          concentrationUnitsPerMl: drip.currentDilution.concentracionUPerMl,
        });
      } else {
        result = ugMinToMlh({
          ugPerMin: drip.gamma,
          concentrationUgMl: drip.currentDilution.concentracionUgMl,
        });
      }
    }
  }

  const handleInputChange = (mode: 'mlh' | 'gamma', raw: string) => {
    const value = raw === '' ? null : parseFloat(raw);
    if (raw !== '' && isNaN(value!)) return;

    dispatch({
      type: 'UPDATE_DRIP',
      id: drip.id,
      updates: {
        inputMode: mode,
        mlPerHour: mode === 'mlh' ? value : (result && drip.inputMode === 'gamma' ? result.value : drip.mlPerHour),
        gamma: mode === 'gamma' ? value : (result && drip.inputMode === 'mlh' ? result.value : drip.gamma),
      },
    });
  };

  const handleSaveDilution = () => {
    const amount = parseFloat(editAmount);
    const vol = parseFloat(editVol);
    if (!isNaN(amount) && !isNaN(vol) && amount > 0 && vol > 0) {
      onUpdateDilution(drip.id, amount, vol, isUnitsBased);
      setShowDilutionEdit(false);
    }
  };

  // Check if value is within therapeutic range
  const currentDoseValue = drip.inputMode === 'mlh' && result ? result.value : drip.gamma;
  const isInRange = currentDoseValue !== null && currentDoseValue !== undefined && currentDoseValue > 0
    ? currentDoseValue >= drip.rango.min && currentDoseValue <= drip.rango.max
    : null;

  const doseUnit = isWeightBased ? 'µg/kg/min' : isUnitsBased ? 'U/min' : 'µg/min';

  // Concentration display
  const concDisplay = isUnitsBased && drip.currentDilution.concentracionUPerMl
    ? `${drip.currentDilution.concentracionUPerMl} U/mL`
    : `${formatNumber(drip.currentDilution.concentracionUgMl, 0)} µg/mL`;

  return (
    <div className="card border-slate-700/60" id={`drip-${drip.id}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-200">{drip.nombre}</h3>
            {dilutionMeta && !dilutionMeta.verified && (
              <span className="badge-unverified text-[10px] px-1.5 py-0.5">
                No verificada
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {isUnitsBased
              ? `${drip.currentDilution.units ?? 40} U / ${drip.currentDilution.volumenML} mL = ${concDisplay}`
              : `${drip.currentDilution.mg} mg / ${drip.currentDilution.volumenML} mL = ${concDisplay}`
            }
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditAmount(isUnitsBased ? (drip.currentDilution.units ?? 40).toString() : (drip.currentDilution.mg ?? 0).toString());
              setEditVol(drip.currentDilution.volumenML.toString());
              setShowDilutionEdit(!showDilutionEdit);
            }}
            className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors p-1.5 rounded hover:bg-slate-800"
            title="Editar dilución"
          >
            ✏️
          </button>
          <button
            id={`btn-remove-drip-${drip.id}`}
            onClick={() => dispatch({ type: 'REMOVE_DRIP', id: drip.id })}
            className="text-xs text-rose-400/80 hover:text-rose-300 transition-colors p-1.5 rounded hover:bg-slate-800"
            title="Quitar goteo"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dilution editor */}
      {showDilutionEdit && (
        <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
          <p className="text-xs text-slate-300 font-medium">Editar dilución de {drip.nombre}:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">
                {isUnitsBased ? 'Unidades (U) totales' : 'mg totales'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                className="input-field text-sm"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Volumen solución (mL)</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                className="input-field text-sm"
                value={editVol}
                onChange={(e) => setEditVol(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveDilution} className="btn-primary text-xs py-1.5 flex-1">
              Guardar dilución
            </button>
            <button onClick={() => setShowDilutionEdit(false)} className="btn-ghost text-xs py-1.5 flex-1">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Interactive Bidirectional Inputs */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">Velocidad (mL/h)</label>
            {drip.inputMode === 'mlh' && (
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Ingresado</span>
            )}
            {drip.inputMode === 'gamma' && (
              <span className="text-[10px] text-slate-500">Calculado</span>
            )}
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            className={`input-field text-sm transition-all ${
              drip.inputMode === 'mlh'
                ? 'border-sky-500/80 bg-slate-900/90 text-slate-100 ring-1 ring-sky-500/30 font-semibold'
                : 'border-slate-700/60 bg-slate-950/70 text-slate-300'
            }`}
            placeholder="0.0"
            value={drip.inputMode === 'mlh' ? (drip.mlPerHour ?? '') : (result ? formatNumber(result.value, 1) : '')}
            onChange={(e) => handleInputChange('mlh', e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">Dosis ({doseUnit})</label>
            {drip.inputMode === 'gamma' && (
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Ingresado</span>
            )}
            {drip.inputMode === 'mlh' && (
              <span className="text-[10px] text-slate-500">Calculado</span>
            )}
          </div>
          <input
            type="number"
            inputMode="decimal"
            step={isUnitsBased ? '0.005' : '0.01'}
            className={`input-field text-sm transition-all ${
              drip.inputMode === 'gamma'
                ? 'border-sky-500/80 bg-slate-900/90 text-slate-100 ring-1 ring-sky-500/30 font-semibold'
                : 'border-slate-700/60 bg-slate-950/70 text-slate-300'
            }`}
            placeholder="0.00"
            value={
              drip.inputMode === 'gamma'
                ? (drip.gamma ?? '')
                : (result ? (isUnitsBased ? formatNumber(result.value, 3) : formatNumber(result.value, 2)) : '')
            }
            onChange={(e) => handleInputChange('gamma', e.target.value)}
          />
        </div>
      </div>

      {/* Missing weight warning */}
      {isWeightBased && !hasWeight && (
        <p className="mt-2 text-xs text-amber-400">
          ⚠️ Completá el peso del paciente para calcular dosis en γ (µg/kg/min).
        </p>
      )}

      {/* Therapeutic range status */}
      {currentDoseValue !== null && currentDoseValue !== undefined && currentDoseValue > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
          <span className={isInRange ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
            {isInRange ? '✓ En rango terapéutico' : '⚠️ Fuera de rango habitual'}
          </span>
          <span className="text-slate-500">
            Rango: {drip.rango.min}–{drip.rango.max} {drip.rango.unidad}
          </span>
        </div>
      )}

      {/* Formula breakdown */}
      {result && result.steps.length > 0 && (
        <FormulaDetail title="Ver cálculo y pasos">
          <StepDisplay steps={result.steps} />
        </FormulaDetail>
      )}

      {/* Clinical note */}
      {drip.notas && (
        <p className="mt-2 text-[11px] text-slate-500 italic">
          💡 {drip.notas}
        </p>
      )}
    </div>
  );
}
