import type { ChecklistItem } from '../rules/types';

/**
 * Checklist de pilares de insuficiencia cardíaca por fase clínica (seeds).
 *
 * TODOS LOS VALORES SON PLACEHOLDERS (verified: false).
 * El médico debe verificar dosis, precauciones y fases.
 *
 * Lógica clave:
 * - En 'shock_inotropicos' NO se sugiere betabloqueante
 * - En 'compensado' y 'pre_alta' sí se sugiere si falta
 * - Anticoagulación solo se sugiere si el paciente tiene FA
 */
export const checklistIC: ChecklistItem[] = [
  {
    id: 'ieca-araii',
    pilar: 'IECA/ARA II',
    droga: 'Enalapril',
    dosisInicio: '2,5 mg c/12 h',
    dosisObjetivo: '10–20 mg c/12 h',
    precauciones: {
      kMax: 5.5,
      clcrMin: 20,
      tasMin: 90,
    },
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'arni',
    pilar: 'ARNI (reemplazo de IECA)',
    droga: 'Sacubitrilo/Valsartán',
    dosisInicio: '24/26 mg c/12 h',
    dosisObjetivo: '97/103 mg c/12 h',
    precauciones: {
      kMax: 5.5,
      clcrMin: 20,
      tasMin: 100,
    },
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'betabloqueante',
    pilar: 'Betabloqueante',
    droga: 'Carvedilol / Bisoprolol / Metoprolol succinato',
    dosisInicio: 'Carvedilol 3,125 mg c/12 h',
    dosisObjetivo: 'Carvedilol 25 mg c/12 h',
    precauciones: {
      fcMin: 55,
      tasMin: 90,
    },
    // NO incluir 'shock_inotropicos' — regla de seguridad
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'arm',
    pilar: 'Antagonista mineralocorticoide',
    droga: 'Espironolactona / Eplerenona',
    dosisInicio: 'Espironolactona 12,5–25 mg/día',
    dosisObjetivo: 'Espironolactona 25–50 mg/día',
    precauciones: {
      kMax: 5.0,
      clcrMin: 30,
    },
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'isglt2',
    pilar: 'iSGLT2',
    droga: 'Dapagliflozina / Empagliflozina',
    dosisInicio: '10 mg/día',
    dosisObjetivo: '10 mg/día',
    precauciones: {
      clcrMin: 20,
      tasMin: 90,
    },
    // Se puede iniciar incluso en fase de descompensación estabilizada
    fases: ['shock_inotropicos', 'compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'diuretico-asa',
    pilar: 'Diurético de asa',
    droga: 'Furosemida',
    dosisInicio: '20–40 mg/día (ajustar a congestión)',
    dosisObjetivo: 'mínima dosis efectiva',
    precauciones: {
      kMin: 3.5,
    },
    fases: ['shock_inotropicos', 'compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'anticoag-fa',
    pilar: 'Anticoagulación (FA)',
    droga: 'ACOD o warfarina según contexto',
    dosisInicio: 'según droga elegida y función renal',
    dosisObjetivo: 'según droga elegida',
    precauciones: {},
    fases: ['shock_inotropicos', 'compensado', 'pre_alta'],
    requireFA: true,
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
];
