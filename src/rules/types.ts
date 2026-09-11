/**
 * Tipos para la base de reglas clínicas.
 * Todos los datos con verified: false son borradores que el médico debe validar.
 */

/** Modo de dosificación de goteos */
export type DosingMode = 'ug_kg_min' | 'ug_min' | 'u_min';

/** Fase clínica del paciente */
export type ClinicalPhase = 'shock_inotropicos' | 'compensado' | 'pre_alta';

/** Condición principal del paciente */
export type MainCondition = 'ic' | 'sca' | 'fa' | 'otra';

/** Subtipo de síndrome coronario agudo. `unknown` mantiene visibles todas las opciones. */
export type ScaSubtype = 'unknown' | 'stemi' | 'nstemi';

/** Estrategia inicial del SCA. `unknown` mantiene visibles todas las opciones. */
export type ScaStrategy = 'unknown' | 'pci' | 'fibrinolysis' | 'medical';

/** Función de una alternativa dentro de la matriz terapéutica. */
export type TherapyRole = 'base' | 'preferred' | 'alternative' | 'add_on' | 'rescue';

export interface ClinicalSource {
  label: string;
  url: string;
}

/**
 * Contexto hemodinámico/clínico de IC.
 * Una opción puede corresponder a uno o más contextos.
 * Si no se especifica hfContexts, la opción aplica en todos.
 */
export type HFContext =
  | 'shock'              // hipoperfusión / necesidad de vasopresores
  | 'congestion_no_shock' // congestión sin bajo gasto
  | 'stabilization'      // postaguada, estabilizando
  | 'optimization'       // GDMT pre-alta / ajuste
  | 'fevi_reduced'       // FEVI ≤40%
  | 'fevi_mid'           // FEVI 41–49%
  | 'fevi_preserved';    // FEVI ≥50%

/**
 * Contexto de FA.
 * Indica en qué escenario de FA es relevante la opción.
 */
export type AFContext =
  | 'unstable'            // inestable → cardioversión eléctrica urgente
  | 'rate_control'        // control de frecuencia
  | 'rhythm_control'      // control de ritmo
  | 'cardioversion'       // cardioversión farmacológica o eléctrica
  | 'anticoagulation'     // anticoagulación crónica FA
  | 'af_acs_pci';         // FA en el contexto de SCA/PCI

/** Una droga exacta, con dosis y contexto, dentro de una matriz terapéutica. */
export interface TherapyOption {
  id: string;
  name: string;
  /** Tipo de alternativa: fármaco (por defecto) o procedimiento/estrategia no farmacológica */
  kind?: 'drug' | 'procedure' | 'strategy';
  /** ID canónico estable del fármaco para identidad transversal */
  drugId?: string;
  /** ID del régimen de dosificación específico */
  regimenId?: string;
  /** ID de la indicación clínica evaluada */
  indicationId?: string;
  role: TherapyRole;
  loadOrStart: string;
  maintenance: string;
  maximum?: string;
  when: string;
  avoid: string[];
  monitoring: string[];
  phases: ClinicalPhase[];
  subtypes?: Array<Exclude<ScaSubtype, 'unknown'>>;
  strategies?: Array<Exclude<ScaStrategy, 'unknown'>>;
  /** Contextos IC en los que corresponde esta opción (opcional; sin este campo = aplica en todos) */
  hfContexts?: HFContext[];
  /** Contextos FA en los que corresponde esta opción (opcional; sin este campo = aplica en todos) */
  afContexts?: AFContext[];
  sources: ClinicalSource[];
  verified: boolean;
}

/** Grupo de alternativas. La UI nunca oculta opciones por falta de datos. */
export interface TherapyGroup {
  id: string;
  title: string;
  subtitle: string;
  selectionMode: 'one' | 'one_or_more' | 'conditional';
  defaultOpen?: boolean;
  options: TherapyOption[];
}

export interface EvaluatedTherapyOption {
  option: TherapyOption;
  patientDose?: string;
  warnings: string[];
  missingData: string[];
  contextNotes: string[];
}

/** Dilución estándar de una droga vasoactiva/inotrópico */
export interface Dilution {
  id: string;
  nombre: string;
  presentacion: string;
  dilucionEstandar: {
    cantidad: number;
    unidad: 'mg' | 'U';
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

/** Regla de ajuste renal para una droga */
export interface RenalRule {
  id: string;
  droga: string;
  indicacion: string;
  dosisNormal: string;
  /** Ajustes ordenados por clcrMax descendente (del menos al más restrictivo) */
  ajustes: RenalAdjustment[];
  source: string;
  lastReviewed: string;
  verified: boolean;
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

/** Item del checklist de insuficiencia cardíaca */
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
  /** Datos que faltan para individualizar la recomendación */
  missingData: string[];
}

/** Resultado del evaluador de reglas renales */
export interface RenalRuleResult {
  rule: RenalRule;
  /** El ajuste que aplica, o null si se usa dosis normal */
  appliedAdjustment: RenalAdjustment | null;
  /** Dosis sugerida (ajustada o normal) */
  suggestedDose: string;
}

// ─── Auditoría de seguridad transversal ───────────────────────────────────────

/** Severidad de un hallazgo de auditoría */
export type SafetySeverity = 'info' | 'caution' | 'avoid' | 'contraindicated';

/** Un hallazgo individual de la auditoría diaria */
export interface SafetyFinding {
  id: string;
  /** Texto legible del hallazgo */
  message: string;
  severity: SafetySeverity;
  /** Categoría clínica del hallazgo */
  category:
    | 'tev_prophylaxis'
    | 'gi_protection'
    | 'electrolytes'
    | 'bleeding'
    | 'renal'
    | 'cardiac'
    | 'anticoagulation'
    | 'interaction'
    | 'duplication'
    | 'labvalue';
}

/**
 * Resultado de la auditoría de seguridad transversal.
 * Los 4 bloques se muestran siempre; pueden estar vacíos.
 */
export interface SafetyAuditResult {
  /** Medicamentos activos relevantes que el paciente ya recibe */
  receives: SafetyFinding[];
  /** Tratamientos o medidas que deberían considerarse y no están marcadas */
  missing: SafetyFinding[];
  /** Precauciones activas (interacciones, límites de laboratorio) */
  caution: SafetyFinding[];
  /** Combinaciones o fármacos a evitar/contraindicados según los datos cargados */
  avoid: SafetyFinding[];
}
