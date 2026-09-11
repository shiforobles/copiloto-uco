import { useState } from 'react';
import type { ActiveDrip, SessionAction } from '../context/session';
import { mlhToGamma, gammaToMlh, mlhToUgMin, ugMinToMlh, mlhToUnitsMin, unitsMinToMlh } from '../engine/drips';
import { formatNumber } from '../engine/units';
import { FormulaDetail } from './FormulaDetail';
import { StepDisplay } from './StepDisplay';
import type { CalculationResult } from '../engine/types';

interface DripCardProps {
  drip: ActiveDrip;
  weightKg: number | null;
  dispatch: React.Dispatch<SessionAction>;
  onUpdateDilution: (dripId: string, cantidad: number, volumenML: number, unidad: 'mg' | 'U') => void;
}

export function DripCard({ drip, weightKg, dispatch, onUpdateDilution }: DripCardProps) {
  const [showDilutionEdit, setShowDilutionEdit] = useState(false);
  const [editAmount, setEditAmount] = useState(drip.currentDilution.cantidad.toString());
  const [editVol, setEditVol] = useState(drip.currentDilution.volumenML.toString());

  const isWeightBased = drip.modoDosis === 'ug_kg_min';
  const isUnitsBased = drip.modoDosis === 'u_min';
  const hasWeight = weightKg !== null && weightKg > 0;
  const hasConcentration = isUnitsBased
    ? (drip.currentDilution.concentracionUPerMl ?? 0) > 0
    : (drip.currentDilution.concentracionUgMl ?? 0) > 0;
  const canCalculate = (isWeightBased ? hasWeight : true) && hasConcentration;

  // Calculate result based on input mode
  let result: CalculationResult<number> | null = null;

  if (canCalculate) {
    if (drip.inputMode === 'mlh' && drip.mlPerHour !== null && drip.mlPerHour >= 0) {
      if (isWeightBased) {
        result = mlhToGamma({
          mlPerHour: drip.mlPerHour,
          concentrationUgMl: drip.currentDilution.concentracionUgMl!,
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
          concentrationUgMl: drip.currentDilution.concentracionUgMl!,
        });
      }
    } else if (drip.inputMode === 'gamma' && drip.gamma !== null && drip.gamma >= 0) {
      if (isWeightBased) {
        result = gammaToMlh({
          gamma: drip.gamma,
          concentrationUgMl: drip.currentDilution.concentracionUgMl!,
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
          concentrationUgMl: drip.currentDilution.concentracionUgMl!,
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
        mlPerHour: mode === 'mlh' ? value : drip.mlPerHour,
        gamma: mode === 'gamma' ? value : drip.gamma,
      },
    });
  };

  const handleSaveDilution = () => {
    const amount = parseFloat(editAmount);
    const vol = parseFloat(editVol);
    if (!isNaN(amount) && !isNaN(vol) && amount > 0 && vol > 0) {
      onUpdateDilution(drip.id, amount, vol, drip.currentDilution.unidad);
      setShowDilutionEdit(false);
    }
  };

  // Check if value is within therapeutic range
  const gammaValue = drip.inputMode === 'mlh' && result ? result.value : drip.gamma;
  const isInRange = gammaValue !== null && gammaValue !== undefined
    ? gammaValue >= drip.rango.min && gammaValue <= drip.rango.max
    : null;

  const doseUnit = isWeightBased ? 'µg/kg/min' : isUnitsBased ? 'U/min' : 'µg/min';

  // Concentration display
  const concDisplay = isUnitsBased && drip.currentDilution.concentracionUPerMl
    ? `${drip.currentDilution.concentracionUPerMl} U/mL`
    : `${formatNumber(drip.currentDilution.concentracionUgMl ?? 0, 0)} µg/mL`;

  return (
    <div className="card" id={`drip-${drip.id}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-200">{drip.nombre}</h3>
            {!drip.verified && <span className="badge-unverified">borrador</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {drip.currentDilution.cantidad} {drip.currentDilution.unidad} / {drip.currentDilution.volumenML} mL = {concDisplay}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDilutionEdit(!showDilutionEdit)}
            className="text-xs text-sky-400/70 hover:text-sky-400 transition-colors px-2 py-1"
            title="Editar dilución"
          >
            ✏️
          </button>
          <button
            id={`btn-remove-drip-${drip.id}`}
            onClick={() => dispatch({ type: 'REMOVE_DRIP', id: drip.id })}
            className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors px-2 py-1"
            title="Quitar goteo"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dilution editor */}
      {showDilutionEdit && (
        <div className="mt-3 p-3 bg-slate-900/60 rounded-xl space-y-2">
          <p className="text-xs text-slate-400 font-medium">Editar dilución actual:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">{drip.currentDilution.unidad} totales</label>
              <input
                type="number"
                inputMode="decimal"
                className="input-field text-sm"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Volumen (mL)</label>
              <input
                type="number"
                inputMode="decimal"
                className="input-field text-sm"
                value={editVol}
                onChange={(e) => setEditVol(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveDilution} className="btn-primary text-xs py-1.5 flex-1">
              Guardar
            </button>
            <button onClick={() => setShowDilutionEdit(false)} className="btn-ghost text-xs py-1.5 flex-1">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input fields */}
      <p className="mt-3 text-[11px] text-slate-500">Ingresá cualquiera de los dos valores; el otro se calcula automáticamente.</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500">mL/h</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            className={`input-field text-sm ${drip.inputMode === 'mlh' ? 'ring-1 ring-sky-500/30' : ''}`}
            placeholder="0"
            value={drip.inputMode === 'mlh' ? (drip.mlPerHour ?? '') : (result ? formatNumber(result.value, 1) : '')}
            onChange={(e) => handleInputChange('mlh', e.target.value)}
            aria-label={`${drip.nombre} en mL por hora`}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">{doseUnit}</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className={`input-field text-sm ${drip.inputMode === 'gamma' ? 'ring-1 ring-sky-500/30' : ''}`}
            placeholder="0"
            value={drip.inputMode === 'gamma' ? (drip.gamma ?? '') : (result ? formatNumber(result.value, 3) : '')}
            onChange={(e) => handleInputChange('gamma', e.target.value)}
            aria-label={`${drip.nombre} en ${doseUnit}`}
          />
        </div>
      </div>

      {/* Missing weight warning */}
      {isWeightBased && !hasWeight && (
        <p className="mt-2 text-xs text-amber-400">
          ⚠️ Completá el peso del paciente para calcular γ.
        </p>
      )}

      {/* Therapeutic range */}
      {gammaValue !== null && gammaValue !== undefined && gammaValue > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs ${isInRange ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isInRange ? '✓' : '⚠️'} Rango: {drip.rango.min}–{drip.rango.max} {drip.rango.unidad}
          </span>
        </div>
      )}

      {/* Notes */}
      {drip.notas && (
        <p className="mt-1 text-xs text-slate-600 italic">{drip.notas}</p>
      )}

      {/* Steps */}
      {result && (
        <FormulaDetail title="Ver pasos del cálculo">
          <StepDisplay steps={result.steps} />
        </FormulaDetail>
      )}
    </div>
  );
}
