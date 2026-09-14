/**
 * Tipos para la base de reglas clínicas.
 * Todos los datos con verified: false son borradores que el médico debe validar.
 */

/** Modo de dosificación de goteos */
export type DosingMode = 'ug_kg_min' | 'ug_min' | 'u_min';

/** Fase clínica del paciente */
export type ClinicalPhase = 'shock_inotropicos' | 'compensado' | 'pre_alta';

/** Condición principal del paciente */
export type MainCondition = 'ic' | 'sca' | 'otra';

/** Dilución estándar de una droga vasoactiva/inotrópico */
export interface Dilution {
  id: string;
  nombre: string;
  presentacion: string;
  dilucionEstandar: {
    mg?: number;
    units?: number;
    volumenML: number;
  };
  /** Concentración resultante de la dilución estándar en µg/mL */
  concentracionUgMl: number;
  /** Concentración en U/mL (solo para drogas dosificadas en U/min, ej: vasopresina) */
  concentracionUPerMl?: number;
  modoDosis: DosingMode;
  rango: {
    min: number;
    max: number;
    unidad: string;
  };
  notas: string;
  verified: boolean;
}

/** Un ajuste de dosis por clearance de creatinina */
export interface RenalAdjustment {
  /** ClCr máximo para que aplique este ajuste (aplica si ClCr ≤ clcrMax) */
  clcrMax: number;
  /** Dosis ajustada o indicación */
  dosis: string;
}

/** Criterios multi-factoriales de reducción de dosis (ej: Apixabán en FA) */
export interface DoseReductionCriteria {
  dosisAjustada: string;
  minCriteriaCount: number;
  minAge?: number;
  maxWeight?: number;
  minCreatinine?: number;
  descripcion: string;
}

/** Regla de ajuste renal para una droga */
export interface RenalRule {
  id: string;
  droga: string;
  indicacion: string;
  dosisNormal: string;
  /** Ajustes ordenados por clcrMax descendente (del menos al más restrictivo) */
  ajustes: RenalAdjustment[];
  /** Criterios multi-factoriales de reducción (opcional) */
  criteriaReduction?: DoseReductionCriteria;
  source: string;
  lastReviewed: string;
  verified: boolean;
}

/** Contexto clínico del paciente para evaluación de reglas */
export interface PatientClinicalContext {
  age?: number | null;
  weight?: number | null;
  creatinine?: number | null;
  hasAF?: boolean;
}

/** Precauciones clínicas para un pilar de IC */
export interface ChecklistPrecautions {
  /** Potasio mínimo aceptable (mEq/L) */
  kMin?: number;
  /** Potasio máximo aceptable (mEq/L) */
  kMax?: number;
  /** ClCr mínimo (mL/min) */
  clcrMin?: number;
  /** TAS mínima (mmHg) */
  tasMin?: number;
  /** FC mínima (lpm) */
  fcMin?: number;
}

/** Item del checklist de insuficiencia cardíaca o SCA */
export interface ChecklistItem {
  id: string;
  pilar: string;
  droga: string;
  dosisInicio: string;
  dosisObjetivo: string;
  precauciones: ChecklistPrecautions;
  /** Fases clínicas en las que se puede sugerir este pilar */
  fases: ClinicalPhase[];
  /** Si es true, solo aplica si el paciente tiene FA */
  requireFA?: boolean;
  verified: boolean;
  source: string;
  lastReviewed: string;
}

/** Resultado del evaluador de checklist */
export interface ChecklistResult {
  item: ChecklistItem;
  /** Si tiene precaución activa (ej: K alto, TAS baja) */
  precautionWarnings: string[];
}

/** Resultado del evaluador de reglas renales */
export interface RenalRuleResult {
  rule: RenalRule;
  /** El ajuste que aplica, o null si se usa dosis normal */
  appliedAdjustment: RenalAdjustment | null;
  /** Criterio multi-factorial aplicado (si corresponde) */
  appliedCriteriaReduction?: {
    metCriteriaCount: number;
    requiredCount: number;
    details: string[];
  } | null;
  /** Dosis sugerida (ajustada o normal) */
  suggestedDose: string;
}
