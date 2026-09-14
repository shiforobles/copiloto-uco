import type { RenalRule } from '../rules/types';

/**
 * Reglas de ajuste renal y dosificación clínica por droga (seeds).
 *
 * TODOS LOS VALORES CON verified: false SON BORRADORES QUE DEBEN SER REVISADOS POR EL MÉDICO.
 *
 * Los ajustes están ordenados por clcrMax DESCENDENTE dentro de cada regla.
 * El evaluador selecciona el ajuste con el MENOR clcrMax que sea >= ClCr del paciente.
 */
export const renalRules: RenalRule[] = [
  {
    id: 'enoxaparina-profilaxis',
    droga: 'Enoxaparina',
    indicacion: 'profilaxis TVP',
    dosisNormal: '40 mg/día SC',
    ajustes: [
      { clcrMax: 30, dosis: '20 mg/día SC' },
    ],
    source: 'Ficha técnica Sanofi / Guía ACCP',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'enoxaparina-anticoag',
    droga: 'Enoxaparina',
    indicacion: 'anticoagulación',
    dosisNormal: '1 mg/kg c/12 h SC',
    ajustes: [
      { clcrMax: 30, dosis: '1 mg/kg c/24 h' },
      { clcrMax: 15, dosis: 'evitar / considerar HNF' },
    ],
    source: 'Ficha técnica Sanofi / Guía ESC',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'apixaban-fa',
    droga: 'Apixabán',
    indicacion: 'anticoagulación FA no valvular',
    dosisNormal: '5 mg c/12 h',
    criteriaReduction: {
      minCriteriaCount: 2,
      minAge: 80,
      maxWeight: 60,
      minCreatinine: 1.5,
      dosisAjustada: '2,5 mg c/12 h',
      descripcion: 'Cumple ≥ 2 de 3 criterios ABC: edad ≥ 80 años, peso ≤ 60 kg, creatinina sérica ≥ 1,5 mg/dL',
    },
    ajustes: [
      { clcrMax: 15, dosis: 'no recomendado / contraindicado (datos limitados)' },
    ],
    source: 'Ficha FDA Eliquis 2026 / Guía ESC FA 2024',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'apixaban-tev',
    droga: 'Apixabán',
    indicacion: 'Tratamiento TVP / TEP',
    dosisNormal: '10 mg c/12 h (días 1–7), luego 5 mg c/12 h',
    ajustes: [
      { clcrMax: 15, dosis: 'no recomendado (datos clínicos limitados)' },
    ],
    source: 'Ficha FDA Eliquis 2026 / Guía ESC TEP',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'rivaroxaban',
    droga: 'Rivaroxabán',
    indicacion: 'anticoagulación FA',
    dosisNormal: '20 mg/día con comida',
    ajustes: [
      { clcrMax: 50, dosis: '15 mg/día con comida' },
      { clcrMax: 15, dosis: 'no recomendado' },
    ],
    source: 'Ficha técnica Bayer / Guía ESC FA',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'dabigatran',
    droga: 'Dabigatrán',
    indicacion: 'anticoagulación FA',
    dosisNormal: '150 mg c/12 h',
    ajustes: [
      { clcrMax: 50, dosis: '110 mg c/12 h (evaluar riesgo hemorrágico)' },
      { clcrMax: 30, dosis: 'contraindicado' },
    ],
    source: 'Ficha técnica Boehringer / Guía ESC FA',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'digoxina',
    droga: 'Digoxina',
    indicacion: 'IC / control FC en FA',
    dosisNormal: '0,25 mg/día',
    ajustes: [
      { clcrMax: 50, dosis: '0,125 mg/día' },
      { clcrMax: 30, dosis: '0,125 mg c/48 h o suspender (monitorear digoxinemia)' },
    ],
    source: 'Guía ESC IC 2021 / 2023 Update',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'espironolactona',
    droga: 'Espironolactona',
    indicacion: 'IC (antagonista mineralocorticoide)',
    dosisNormal: '25–50 mg/día',
    ajustes: [
      { clcrMax: 30, dosis: 'reducir a 12,5–25 mg/día o evitar si K > 5,0 mEq/L' },
    ],
    source: 'Guía ESC IC 2021',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'metformina',
    droga: 'Metformina',
    indicacion: 'diabetes mellitus tipo 2',
    dosisNormal: '500–2000 mg/día',
    ajustes: [
      { clcrMax: 45, dosis: 'reducir dosis máxima a 1000 mg/día' },
      { clcrMax: 30, dosis: 'contraindicada (riesgo acidosis láctica)' },
    ],
    source: 'Guía ADA / KDIGO 2023',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'dapagliflozina',
    droga: 'Dapagliflozina',
    indicacion: 'IC / diabetes',
    dosisNormal: '10 mg/día',
    ajustes: [
      { clcrMax: 25, dosis: 'no iniciar (puede continuar si ya la recibe)' },
    ],
    source: 'Ficha AstraZeneca / Guía ESC IC 2023',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'empagliflozina',
    droga: 'Empagliflozina',
    indicacion: 'IC / diabetes',
    dosisNormal: '10 mg/día',
    ajustes: [
      { clcrMax: 20, dosis: 'no iniciar (puede continuar si ya la recibe)' },
    ],
    source: 'Ficha Boehringer / Guía ESC IC 2023',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'sacubitrilo-valsartan',
    droga: 'Sacubitrilo/Valsartán',
    indicacion: 'IC con FEy reducida',
    dosisNormal: '49/51 mg c/12 h (titular a 97/103)',
    ajustes: [
      { clcrMax: 30, dosis: 'iniciar con 24/26 mg c/12 h, titular con precaución' },
    ],
    source: 'Ficha Novartis / Guía ESC IC 2021',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'atenolol',
    droga: 'Atenolol',
    indicacion: 'HTA / arritmias / post-SCA',
    dosisNormal: '50–100 mg/día',
    ajustes: [
      { clcrMax: 35, dosis: '50 mg/día máximo' },
      { clcrMax: 15, dosis: '25 mg/día o c/48 h' },
    ],
    source: 'Ficha técnica Atenolol',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'sotalol',
    droga: 'Sotalol',
    indicacion: 'arritmias ventriculares / FA',
    dosisNormal: '80 mg c/12 h',
    ajustes: [
      { clcrMax: 60, dosis: '80 mg c/24 h' },
      { clcrMax: 40, dosis: 'contraindicado (riesgo de QT prolongado y TdP)' },
    ],
    source: 'Ficha FDA Sotalol',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'amiodarona',
    droga: 'Amiodarona',
    indicacion: 'arritmias ventriculares / FA',
    dosisNormal: '200 mg/día (mantenimiento)',
    ajustes: [],
    source: 'Ficha Sanofi Amiodarona',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'colchicina',
    droga: 'Colchicina',
    indicacion: 'pericarditis / gota',
    dosisNormal: '0,5 mg c/12 h',
    ajustes: [
      { clcrMax: 30, dosis: '0,25 mg/día' },
      { clcrMax: 10, dosis: 'contraindicada' },
    ],
    source: 'Guía ESC Pericarditis 2015 / FDA',
    lastReviewed: '2026-08',
    verified: false,
  },
  {
    id: 'alopurinol',
    droga: 'Alopurinol',
    indicacion: 'hiperuricemia / gota',
    dosisNormal: '300 mg/día',
    ajustes: [
      { clcrMax: 60, dosis: '200 mg/día' },
      { clcrMax: 30, dosis: '100 mg/día' },
    ],
    source: 'Guía ACR Gota 2020 / FDA',
    lastReviewed: '2026-08',
    verified: false,
  },
];

/** Obtiene reglas renales para una droga por su ID */
export function getRenalRuleById(id: string): RenalRule | undefined {
  return renalRules.find((r) => r.id === id);
}

/** Obtiene todas las reglas renales para una droga por nombre */
export function getRenalRulesByDrug(drugName: string): RenalRule[] {
  return renalRules.filter(
    (r) => r.droga.toLowerCase() === drugName.toLowerCase()
  );
}
