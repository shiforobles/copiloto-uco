/**
 * Tipos centrales del motor de cálculo.
 *
 * Cada función del engine devuelve un CalculationResult que incluye
 * los pasos intermedios para auditoría completa.
 */

/** Un paso intermedio de un cálculo, para mostrar en la UI */
export interface CalculationStep {
  /** Descripción legible del paso, ej: "Numerador: (140 − 87) × 70 = 3710" */
  label: string;
  /** Valor numérico del paso */
  value: number;
  /** Fórmula genérica del paso, ej: "(140 − edad) × peso" */
  formula?: string;
}

/** Resultado de un cálculo con trazabilidad completa */
export interface CalculationResult<T> {
  /** Valor final del cálculo */
  value: T;
  /** Unidad del resultado, ej: "mL/min", "µg/kg/min" */
  unit: string;
  /** Pasos intermedios del cálculo, en orden */
  steps: CalculationStep[];
  /** Advertencias clínicas (no bloquean el resultado) */
  warnings: string[];
}

/** Resultado de validación de un input */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Sexo biológico para cálculos */
export type Sex = 'male' | 'female';

/** Inputs para Cockcroft-Gault */
export interface CockcroftGaultInput {
  age: number;
  weight: number;
  creatinine: number;
  sex: Sex;
  /** Peso ajustado (opcional — si no se pasa, se usa weight) */
  adjustedWeight?: number;
}

/** Inputs para CKD-EPI 2021 */
export interface CkdEpi2021Input {
  age: number;
  creatinine: number;
  sex: Sex;
}

/** Inputs para el cálculo unificado de ClCr de dosificación */
export interface DosingClCrInput {
  age: number;
  sex: Sex;
  weight: number;
  creatinine: number;
  height?: number | null;
}

/** Resultado del cálculo unificado de ClCr de dosificación */
export interface DosingClCrResult extends CalculationResult<number> {
  isAdjustedWeightUsed: boolean;
  ibw: number | null;
  abw: number | null;
  weightUsed: number;
}

/** Modo de dosificación de una droga en goteo */
export type DosingMode = 'ug_kg_min' | 'ug_min' | 'u_min';

/** Inputs para conversión mL/h → γ (con peso) */
export interface MlhToGammaInput {
  mlPerHour: number;
  concentrationUgMl: number;
  weightKg: number;
}

/** Inputs para conversión γ → mL/h (con peso) */
export interface GammaToMlhInput {
  gamma: number;
  concentrationUgMl: number;
  weightKg: number;
}

/** Inputs para conversión mL/h → µg/min (sin peso) */
export interface MlhToUgMinInput {
  mlPerHour: number;
  concentrationUgMl: number;
}

/** Inputs para conversión µg/min → mL/h (sin peso) */
export interface UgMinToMlhInput {
  ugPerMin: number;
  concentrationUgMl: number;
}

/** Inputs para conversión mL/h → U/min (vasopresina) */
export interface MlhToUnitsMinInput {
  mlPerHour: number;
  /** Concentración en U/mL (ej: 40 U / 100 mL = 0.4 U/mL) */
  concentrationUnitsPerMl: number;
}

/** Inputs para conversión U/min → mL/h (vasopresina) */
export interface UnitsMinToMlhInput {
  unitsPerMin: number;
  concentrationUnitsPerMl: number;
}
