import type { CalculationResult } from './types';

export const doseUnits = ['µg/kg/min', 'µg/min', 'mg/h', 'mg/min', 'mg/kg/h', 'µg/kg/h', 'U/min', 'U/h', 'U/kg/h'] as const;
export type InfusionDoseUnit = typeof doseUnits[number];
export type AmountUnit = 'mg' | 'µg' | 'g' | 'U';
export interface InfusionInput {
  amount: number;
  amountUnit: AmountUnit;
  volume: number;
  doseUnit: InfusionDoseUnit;
  weight: number | null;
  direction: 'dose-to-rate' | 'rate-to-dose';
  value: number;
}

/** Dimensional conversion only. Does not choose a dose, preparation or titration target. */
export function calculateInfusion(input: InfusionInput): CalculationResult<number> {
  const { amount, amountUnit, volume, doseUnit, weight, direction, value } = input;
  if (![amount, volume, value].every(Number.isFinite)) throw new Error('Ingresá valores numéricos finitos.');
  if (amount <= 0 || volume <= 0) throw new Error('La cantidad y el volumen final deben ser mayores que cero.');
  if (value < 0) throw new Error('La dosis o velocidad no puede ser negativa.');
  if (!doseUnits.includes(doseUnit)) throw new Error('Unidad de dosis no reconocida.');
  if (!['mg', 'µg', 'g', 'U'].includes(amountUnit)) throw new Error('Unidad de preparación no reconocida.');
  if ((amountUnit === 'U') !== doseUnit.startsWith('U')) throw new Error('Las unidades biológicas (U) no se convierten a mg ni a µg.');
  const weightBased = doseUnit.includes('/kg/');
  if (weightBased && (weight === null || !Number.isFinite(weight) || weight <= 0 || weight > 500)) {
    throw new Error('Completá un peso válido en kg (mayor que 0 y hasta 500).');
  }
  // Express concentration in the numerator unit of the requested dose.
  const amountInMg = amountUnit === 'g' ? amount * 1000 : amountUnit === 'µg' ? amount / 1000 : amount;
  const normalizedAmount = doseUnit.startsWith('µg') ? amountInMg * 1000 : amountInMg;
  const concentration = normalizedAmount / volume;
  const doseNumerator = doseUnit.split('/')[0];
  const timeFactor = doseUnit.endsWith('/min') ? 60 : 1;
  const weightFactor = weightBased ? weight! : 1;
  const hourlyFactor = timeFactor * weightFactor;
  const result = direction === 'dose-to-rate' ? value * hourlyFactor / concentration : value * concentration / hourlyFactor;
  if (!Number.isFinite(result) || !Number.isFinite(concentration) || concentration <= 0 || (value > 0 && result === 0)) {
    throw new Error('El cálculo excede el rango numérico. Revisá los valores y las unidades.');
  }
  const unit = direction === 'dose-to-rate' ? 'mL/h' : doseUnit;
  return {
    value: result,
    unit,
    steps: [
      { label: `Concentración: ${concentration} ${doseNumerator}/mL (${amount} ${amountUnit} en ${volume} mL finales)`, value: concentration, formula: `${normalizedAmount} ${doseNumerator} / ${volume} mL` },
      ...(weightBased ? [{ label: `Peso utilizado: ${weight} kg`, value: weight! }] : []),
      { label: `Factor de conversión de tiempo a horas: ${timeFactor}`, value: timeFactor },
      { label: `Resultado (${unit})`, value: result, formula: direction === 'dose-to-rate' ? `${value} × ${weightFactor} × ${timeFactor} / ${concentration}` : `${value} × ${concentration} / (${weightFactor} × ${timeFactor})` },
    ],
    warnings: result > 0 && result < 0.001 ? ['Resultado menor que 0,001. Revisá la precisión de la bomba y la preparación.'] : [],
  };
}

export function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
