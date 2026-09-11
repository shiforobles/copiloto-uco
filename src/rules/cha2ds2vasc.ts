/**
 * CHA₂DS₂-VASc — score de riesgo tromboembólico en fibrilación auricular.
 *
 * Función pura. Muestra cada componente individualmente.
 * NO automatiza la decisión de anticoagulación:
 *   - Score ≥ 2 en hombres y ≥ 3 en mujeres → AC típicamente recomendada.
 *   - Score 1 en hombres (0 en mujeres sin otros factores) → AC individualizada.
 *
 * Reglas no negociables:
 *  - Datos ausentes (null) generan missingData, no puntuación cero.
 *  - Válvula mecánica y estenosis mitral reumática (FA valvular) = warfarina obligatoria,
 *    ACOD contraindicado — esto se maneja en el motor FA, no en este score.
 *
 * Fuente: AHA/ACC/ACCP/HRS 2023 AF Guideline (DOI: 10.1161/CIR.0000000000001193)
 * verified: false — requiere validación médica.
 */

import type { SessionState } from '../context/session';

export interface CHA2DS2VAScComponent {
  name: string;
  acronymLetter: string;
  points: 0 | 1 | 2;
  /** true = presente/aplica; false = ausente; null = dato no registrado */
  present: boolean | null;
}

export interface CHA2DS2VAScResult {
  /** Puntaje total calculado con los datos disponibles */
  score: number;
  /** Máximo posible puntaje con datos disponibles (≤9) */
  maxPossible: number;
  components: CHA2DS2VAScComponent[];
  /** Campos que faltaron y no pudieron puntuarse */
  missingData: string[];
  /**
   * Recomendación textual — NO reemplaza criterio médico.
   * La app sólo muestra el score, no indica ni contraindica anticoagulación.
   */
  interpretation: string;
  /** Fuente del score (ej. ACC/AHA/ACCP/HRS 2023) */
  source?: string;
}

/**
 * Calcula CHA₂DS₂-VASc a partir del SessionState.
 *
 * Componentes:
 *  C  = Congestive HF / LVEF reducida (1 pt)
 *  H  = Hypertension (1 pt)
 *  A₂ = Age ≥ 75 (2 pts)
 *  D  = Diabetes (1 pt)
 *  S₂ = Stroke/AIT previo (2 pts)
 *  V  = Vascular disease (IAM previo, EAP, placa aórtica) (1 pt)
 *  A  = Age 65–74 (1 pt)
 *  Sc = Sex category female (1 pt)
 */
export function calcCHA2DS2VASc(state: SessionState): CHA2DS2VAScResult {
  const missingData: string[] = [];
  let score = 0;

  function resolveComponent(
    acronymLetter: string,
    name: string,
    points: 0 | 1 | 2,
    present: boolean | null,
    missingLabel?: string,
  ): CHA2DS2VAScComponent {
    if (present === null) {
      missingData.push(missingLabel ?? name);
      return { name, acronymLetter, points: 0, present: null };
    }
    if (present) score += points;
    return { name, acronymLetter, points: present ? points : 0, present };
  }

  // C — IC o FEVI ≤40%
  let hasHF: boolean | null = null;
  if (state.condition === 'ic' || (state.lvef !== null && state.lvef <= 40)) {
    hasHF = true;
  } else if (state.lvef !== null && state.lvef > 40) {
    hasHF = false;
  } else {
    hasHF = null;
  }

  const cComp = resolveComponent(
    'C',
    'IC / FEVI reducida (≤40%)',
    1,
    hasHF,
    'IC o FEVI (para C de CHA₂DS₂-VASc)',
  );

  // H — Hipertensión
  const hComp = resolveComponent('H', 'Hipertensión', 1, state.hypertension, 'hipertensión');

  // A₂ — Edad ≥75
  let ageGte75: boolean | null = null;
  if (state.age !== null) ageGte75 = state.age >= 75;
  else missingData.push('edad (A₂ y Sc de CHA₂DS₂-VASc)');
  const a2Comp: CHA2DS2VAScComponent = {
    name: 'Edad ≥75 años',
    acronymLetter: 'A₂',
    points: ageGte75 === true ? 2 : 0,
    present: ageGte75,
  };
  if (ageGte75 === true) score += 2;

  // D — Diabetes
  const dComp = resolveComponent('D', 'Diabetes mellitus', 1, state.diabetes, 'diabetes');

  // S₂ — ACV / AIT / embolia previa (2 puntos agregados por resolveComponent)
  const s2Comp = resolveComponent('S₂', 'ACV / AIT / embolia sistémica previo', 2, state.previousStroke, 'ACV/AIT/embolia previo');

  // V — Enfermedad vascular
  const vComp = resolveComponent('V', 'Enf. vascular (IAM previo, EAP, placa aórtica)', 1, state.vascularDisease, 'enfermedad vascular');

  // A — Edad 65–74
  let age6574: boolean | null = null;
  if (state.age !== null) age6574 = state.age >= 65 && state.age < 75;
  const aComp: CHA2DS2VAScComponent = {
    name: 'Edad 65–74 años',
    acronymLetter: 'A',
    points: age6574 === true ? 1 : 0,
    present: age6574,
  };
  if (age6574 === true) score += 1;

  // Sc — Sexo femenino
  let isFemale: boolean | null = null;
  if (state.sex !== null) isFemale = state.sex === 'female';
  else missingData.push('sexo biológico (Sc de CHA₂DS₂-VASc)');
  const scComp: CHA2DS2VAScComponent = {
    name: 'Sexo femenino',
    acronymLetter: 'Sc',
    points: isFemale === true ? 1 : 0,
    present: isFemale,
  };
  if (isFemale === true) score += 1;

  // El máximo posible es 9 (sin datos ausentes)
  // Con datos ausentes = calculamos máximo con lo que tenemos
  const components = [cComp, hComp, a2Comp, dComp, s2Comp, vComp, aComp, scComp];
  const maxPossible = components.reduce((acc, c) => {
    if (c.present === null) return acc; // dato ausente: no cuenta en maxPossible
    const maxForComp = c.acronymLetter === 'A₂' ? 2 : c.acronymLetter === 'S₂' ? 2 : 1;
    return acc + maxForComp;
  }, 0);

  // Interpretación textual
  let interpretation: string;
  if (missingData.length > 0) {
    interpretation = `Score mínimo calculable con datos disponibles: ${score}. Faltan: ${missingData.join(', ')}. Completar datos para interpretación definitiva.`;
  } else if (state.sex === 'female') {
    if (score >= 3) interpretation = `Score ${score}: AC generalmente recomendada en mujeres (score ≥3).`;
    else if (score === 2) interpretation = `Score ${score}: AC típicamente recomendada (score ≥3 en mujeres para indicación clara; score 2 = considerar según contexto).`;
    else interpretation = `Score ${score}: riesgo bajo en mujeres (score <2 sin otros factores). Decisión individualizada.`;
  } else {
    if (score >= 2) interpretation = `Score ${score}: AC generalmente recomendada en hombres (score ≥2).`;
    else if (score === 1) interpretation = `Score ${score}: AC a considerar en hombres (score 1). Individualizar.`;
    else interpretation = `Score ${score}: riesgo bajo en hombres (score 0). AC no indicada de rutina.`;
  }

  return {
    score,
    maxPossible,
    components,
    missingData,
    interpretation,
    source: 'ACC/AHA/ACCP/HRS 2023 / Consensos clásicos (CHA₂DS₂-VASc)',
  };
}

export interface CHA2DS2VAResult {
  score: number;
  maxPossible: number;
  components: CHA2DS2VAScComponent[];
  missingData: string[];
  interpretation: string;
  source: string;
}

/**
 * Calcula CHA₂DS₂-VA según Guías ESC 2024 (sin categoría de sexo).
 * Puntuación máxima: 8 puntos.
 * - Score 0: Bajo riesgo tromboembólico. Anticoagulación no recomendada de rutina.
 * - Score 1: Riesgo intermedio. Anticoagulación oral a considerar (Clase IIa).
 * - Score ≥ 2: Alto riesgo. Anticoagulación oral recomendada (Clase I).
 */
export function calcCHA2DS2VA(state: SessionState): CHA2DS2VAResult {
  const vascRes = calcCHA2DS2VASc(state);
  // Filtrar el componente 'Sc' (sexo femenino)
  const components = vascRes.components.filter((c) => c.acronymLetter !== 'Sc');
  const missingData = vascRes.missingData.filter((m) => !m.toLowerCase().includes('sexo'));

  // El score es la suma de los componentes sin Sc
  const score = components.reduce((acc, c) => acc + c.points, 0);
  const maxPossible = components.reduce((acc, c) => {
    if (c.present === null) return acc;
    const maxForComp = c.acronymLetter === 'A₂' || c.acronymLetter === 'S₂' ? 2 : 1;
    return acc + maxForComp;
  }, 0);

  let interpretation: string;
  if (missingData.length > 0) {
    interpretation = `Score mínimo CHA₂DS₂-VA (ESC 2024): ${score}. Faltan: ${missingData.join(', ')}.`;
  } else if (score >= 2) {
    interpretation = `Score CHA₂DS₂-VA ${score}/8: Anticoagulación oral recomendada (ESC 2024 Clase I).`;
  } else if (score === 1) {
    interpretation = `Score CHA₂DS₂-VA 1/8: Anticoagulación oral a considerar (ESC 2024 Clase IIa). Individualizar.`;
  } else {
    interpretation = `Score CHA₂DS₂-VA 0/8: Bajo riesgo tromboembólico. Anticoagulación no recomendada de rutina.`;
  }

  return {
    score,
    maxPossible,
    components,
    missingData,
    interpretation,
    source: 'ESC 2024 AF Guidelines (CHA₂DS₂-VA, sin categoría de sexo)',
  };
}

export interface AFRiskScoresComparison {
  cha2ds2vasc: CHA2DS2VAScResult;
  cha2ds2va: CHA2DS2VAResult;
  comparisonNote: string;
}

/**
 * Compara las estrategias de estratificación de riesgo según ACC/AHA 2023 vs ESC 2024.
 */
export function calcAFRiskScores(state: SessionState): AFRiskScoresComparison {
  const cha2ds2vasc = calcCHA2DS2VASc(state);
  const cha2ds2va = calcCHA2DS2VA(state);

  let comparisonNote = '';
  if (state.sex === 'female') {
    comparisonNote = `En mujeres, ESC 2024 no puntúa el sexo (CHA₂DS₂-VA=${cha2ds2va.score}/8), mientras que ACC/AHA 2023 asigna 1 punto a Sc (CHA₂DS₂-VASc=${cha2ds2vasc.score}/9). Ambas guías coinciden en no indicar anticoagulación rutinaria si el sexo femenino es el único factor de riesgo presente.`;
  } else {
    comparisonNote = `En hombres, ambas guías coinciden en puntuación numérica (CHA₂DS₂-VASc ${cha2ds2vasc.score} = CHA₂DS₂-VA ${cha2ds2va.score}). Score ≥2: indicación clase I de anticoagulación; score 1: considerar según riesgo hemorrágico.`;
  }

  return {
    cha2ds2vasc,
    cha2ds2va,
    comparisonNote,
  };
}

