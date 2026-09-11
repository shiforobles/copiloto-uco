import type { ChecklistItem } from '../rules/types';

/**
 * Checklist de pilares de Síndrome Coronario Agudo por fase clínica (seeds).
 *
 * TODOS LOS VALORES SON PLACEHOLDERS (verified: false).
 * El médico debe verificar dosis, precauciones y fases.
 *
 * Lógica clave:
 * - Doble antiagregación aplica en todas las fases
 * - Anticoagulación SCA en shock y compensado (no en pre-alta)
 * - Estatina alta potencia a partir de compensado
 * - Betabloqueante e IECA/ARA II a partir de compensado
 */
export const checklistSCA: ChecklistItem[] = [
  {
    id: 'doble-antiagregacion',
    pilar: 'Doble antiagregación',
    droga: 'AAS + Clopidogrel / Ticagrelor / Prasugrel',
    dosisInicio: 'AAS 325 mg carga + P2Y12 según contexto',
    dosisObjetivo: 'AAS 100 mg/día + P2Y12 por 12 meses',
    precauciones: {},
    fases: ['shock_inotropicos', 'compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'anticoag-sca',
    pilar: 'Anticoagulación SCA',
    droga: 'Enoxaparina / HNF',
    dosisInicio: 'Enoxaparina 1 mg/kg c/12 h SC (o HNF según protocolo)',
    dosisObjetivo: 'según duración del evento y estrategia',
    precauciones: {
      clcrMin: 15,
    },
    // No se usa en pre-alta — se suspende antes del alta
    fases: ['shock_inotropicos', 'compensado'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'estatina-sca',
    pilar: 'Estatina alta potencia',
    droga: 'Atorvastatina',
    dosisInicio: '80 mg/día',
    dosisObjetivo: '80 mg/día (alta potencia)',
    precauciones: {},
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'betabloqueante-sca',
    pilar: 'Betabloqueante',
    droga: 'Carvedilol / Bisoprolol / Metoprolol succinato',
    dosisInicio: 'Carvedilol 3,125 mg c/12 h',
    dosisObjetivo: 'Carvedilol 25 mg c/12 h',
    precauciones: {
      fcMin: 55,
      tasMin: 90,
    },
    // NO en shock
    fases: ['compensado', 'pre_alta'],
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
  {
    id: 'ieca-sca',
    pilar: 'IECA/ARA II',
    droga: 'Enalapril / Ramipril',
    dosisInicio: 'Enalapril 2,5 mg c/12 h',
    dosisObjetivo: 'Enalapril 10–20 mg c/12 h',
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
    id: 'anticoag-fa-sca',
    pilar: 'Anticoagulación (FA)',
    droga: 'ACOD o warfarina según contexto + antiagregación',
    dosisInicio: 'según droga elegida, función renal y score de sangrado',
    dosisObjetivo: 'según droga elegida',
    precauciones: {},
    fases: ['shock_inotropicos', 'compensado', 'pre_alta'],
    requireFA: true,
    verified: false,
    source: 'guía + año (completar)',
    lastReviewed: '2026-08',
  },
];
