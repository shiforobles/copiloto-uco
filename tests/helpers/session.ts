/**
 * Helper de tests: crea un SessionState vacío con todos los campos requeridos.
 * Al agregar campos nuevos a SessionState, actualizá sólo este archivo.
 */
import type { SessionState } from '../../src/context/session';

export function emptySession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    age: null,
    sex: null,
    weight: null,
    height: null,
    creatinine: null,
    potassium: null,
    systolicBP: null,
    heartRate: null,
    condition: null,
    hasAF: false,
    phase: null,
    scaSubtype: 'unknown',
    scaStrategy: 'unknown',
    // Contexto IC — null = dato no registrado
    lvef: null,
    congestion: null,
    hypoperfusion: null,
    onVasopressors: null,
    // Laboratorio adicional
    hemoglobin: null,
    platelets: null,
    magnesium: null,
    qtcMs: null,
    // Antecedentes relevantes — null = dato no registrado (≠ false)
    activeBleed: null,
    dialysis: null,
    aki: null,
    previousStroke: null,
    structuralHeartDisease: null,
    preexcitation: null,
    currentAnticoagulant: null,
    plannedPciOrSurgery: null,
    // FA y cardioversión
    afScenario: null,
    afDuration: null,
    priorTherapeuticAnticoag: null,
    confirmedAdherence: null,
    teeNoThrombus: null,
    mechanicalValve: null,
    rheumaticMitralStenosis: null,
    afGuidelineProfile: 'compare',
    // CHA₂DS₂-VASc / CHA₂DS₂-VA
    hypertension: null,
    diabetes: null,
    vascularDisease: null,
    // Goteos y matrices
    drips: [],
    coveredPillars: [],
    selectedTherapyOptionIds: [],
    currentMedications: [],
    activeRenalRuleIds: [],
    ...overrides,
  };
}
