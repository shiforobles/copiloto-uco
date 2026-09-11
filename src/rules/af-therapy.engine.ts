/**
 * Motor evaluador determinístico para fibrilación auricular y anticoagulación.
 *
 * Detecta:
 * - Inestabilidad hemodinámica → CV eléctrica urgente
 * - FEVI ≤40% → contraindicación diltiazem/verapamilo
 * - Bradicardia → warning en frenadores de FC
 * - Hipotensión → warning/contraindicación según droga
 * - Preexcitación → contraindicación absoluta en frenadores AV
 * - QT prolongado → warning para amiodarona, flecainida, propafenona
 * - Cardiopatía estructural → contraindicación flecainida/propafenona
 * - Duplicación de anticoagulante → warning
 * - Combinación anticoag + antiagregante → warning
 * - FA en contexto SCA/PCI → contexto especial
 * - Función renal → ajuste de ACOD
 *
 * Todas las salidas son borrador (verified: false) hasta validación médica.
 */

import type { SessionState } from '../context/session';
import { getTraceableRenalContext } from '../engine/renal';
import { calcAFRiskScores, calcCHA2DS2VASc } from './cha2ds2vasc';
import type { AFContext, EvaluatedTherapyOption, TherapyOption } from './types';

const unique = (arr: string[]) => [...new Set(arr)];
const fmt = (v: number) => Number(v.toFixed(1)).toLocaleString('es-AR');

// ─── Contexto renal ─────────────────────────────────────────────────────────

interface RenalCtx {
  clcr?: number;
  egfr?: number;
  weightUsed?: number;
  strategy?: string;
  missingData: string[];
}

function getRenalCtx(state: SessionState): RenalCtx {
  const t = getTraceableRenalContext(state);
  return {
    clcr: t.clcrCockcroftGault ?? undefined,
    egfr: t.egfrCkdEpi2021 ?? undefined,
    weightUsed: t.clcrWeightUsed ?? undefined,
    strategy: t.clcrWeightStrategy,
    missingData: t.missingDataForClcr,
  };
}

// ─── Contextos AF activos ───────────────────────────────────────────────────

function deriveAFContexts(state: SessionState): AFContext[] {
  const ctxs: AFContext[] = [];

  if (state.afScenario) ctxs.push(state.afScenario);

  // Si hay hipotensión confirmada o shock, siempre es inestable
  // null no implica inestabilidad; solo true lo hace
  if (
    state.phase === 'shock_inotropicos' ||
    state.hypoperfusion === true ||
    (state.systolicBP !== null && state.systolicBP < 90)
  ) {
    if (!ctxs.includes('unstable')) ctxs.push('unstable');
  }

  // FA + SCA
  if (state.condition === 'sca' && state.hasAF) {
    ctxs.push('af_acs_pci');
  }

  return ctxs;
}

// ─── Helpers de warnings comunes ────────────────────────────────────────────

function checkRateControlContraindications(
  option: TherapyOption,
  state: SessionState,
  renal: RenalCtx,
  warnings: string[],
  missingData: string[],
) {
  // FC
  if (state.heartRate === null) missingData.push('FC');
  else if (state.heartRate < 60) {
    warnings.push(`FC ${state.heartRate} lpm: bradicardia — contraindicación relativa para frenadores de FC.`);
  }

  // TAS
  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) {
    warnings.push(`TAS ${state.systolicBP} mmHg: hipotensión — precaución o contraindicación.`);
  }

  // Preexcitación — contraindicación absoluta para diltiazem, verapamilo, digoxina, betabloqueantes en WPW + FA
  if (state.preexcitation) {
    warnings.push('Síndrome de preexcitación (WPW): contraindicados los frenadores del nodo AV (diltiazem, verapamilo, digoxina, adenosina). Riesgo de fibrilación ventricular.');
  }

  // FEVI — diltiazem y verapamilo contraindicados en FEVI ≤40%
  const isCalciumAntagonist = ['diltiazem-iv-af', 'verapamil-iv-af', 'diltiazem-oral-af', 'verapamil-oral-af'].includes(option.id);
  if (isCalciumAntagonist) {
    if (state.lvef === null) missingData.push('FEVI');
    else if (state.lvef <= 40) {
      warnings.push(`FEVI ${state.lvef}%: diltiazem y verapamilo CONTRAINDICADOS en FEVI ≤40% (efecto inotrópico negativo).`);
    }

    if (state.phase === 'shock_inotropicos' || state.hypoperfusion) {
      warnings.push('IC descompensada / shock: calcioantagonistas no dihidropiridínicos contraindicados.');
    }
  }

  // Renal para digoxina oral
  if (option.id === 'digoxin-oral-af' || option.id === 'digoxin-iv-af') {
    if (state.potassium === null) missingData.push('K');
    else if (state.potassium < 3.5) {
      warnings.push(`K ${state.potassium} mEq/L: hipopotasemia potencia toxicidad digitálica.`);
    }
    if (renal.clcr === undefined) missingData.push('función renal');
    else if (renal.clcr < 30) {
      warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: ajuste estricto de digoxina; iniciar 0,0625 mg/día o interdiario.`);
    }
  }
}

function checkRhythmControlContraindications(
  option: TherapyOption,
  state: SessionState,
  renal: RenalCtx,
  warnings: string[],
  missingData: string[],
) {
  const isFlecOrProp = ['flecainide-af', 'propafenone-af'].includes(option.id);

  // QTc prolongado
  if (state.qtcMs !== null && state.qtcMs > 450) {
    warnings.push(`QTc ${state.qtcMs} ms: precaución con amiodarona, flecainida y propafenona (alargan el QT).`);
  }
  if (state.qtcMs === null) missingData.push('QTc');

  // Cardiopatía estructural
  if (isFlecOrProp) {
    if (state.structuralHeartDisease) {
      warnings.push('Cardiopatía estructural: flecainida y propafenona CONTRAINDICADAS. Usar amiodarona.');
    }
    if (state.lvef !== null && state.lvef <= 40) {
      warnings.push(`FEVI ${state.lvef}%: disfunción ventricular — contraindicación para flecainida/propafenona.`);
    } else if (state.lvef === null) {
      missingData.push('FEVI');
    }
    // Renal para flecainida
    if (option.id === 'flecainide-af') {
      if (renal.clcr !== undefined && renal.clcr < 50) {
        warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: ajuste de flecainida necesario (reducir dosis y monitorizar QRS).`);
      }
      if (renal.clcr === undefined) missingData.push('función renal');
    }
  }
}

// ─── Evaluadores de anticoagulación ─────────────────────────────────────────

/** Detecta duplicación o combinación riesgosa de anticoagulantes */
function checkAnticoagDuplication(
  option: TherapyOption,
  state: SessionState,
  warnings: string[],
): void {
  const anticoagIds = ['apixaban-af', 'rivaroxaban-af', 'dabigatran-af', 'edoxaban-af', 'warfarin-af', 'ufh-af', 'enoxaparin-af'];
  const currentlySelected = state.selectedTherapyOptionIds.filter((id) => anticoagIds.includes(id) && id !== option.id);

  if (currentlySelected.length > 0) {
    warnings.push(`Duplicación: ya hay otro anticoagulante marcado (${currentlySelected.join(', ')}). Revisar antes de combinar.`);
  }

  // Combinación anticoagulante + antiagregante
  const antiplateletIds = ['aas', 'clopidogrel', 'ticagrelor', 'prasugrel', 'aspirin-af'];
  const hasAntiplatelet = state.selectedTherapyOptionIds.some((id) => antiplateletIds.includes(id));
  if (hasAntiplatelet) {
    warnings.push('Anticoagulante + antiagregante: combinación de alto riesgo hemorrágico. Evaluar indicación, minimizar duración y proteger con IBP.');
  }

  // Sangrado activo (sólo si está CONFIRMADO true; null = desconocido)
  if (state.activeBleed === true) {
    warnings.push('Sangrado activo: anticoagulación generalmente contraindicada. Evaluar riesgo-beneficio urgentemente.');
  } else if (state.activeBleed === null) {
    warnings.push('Sangrado activo: dato no registrado. Confirmar antes de iniciar anticoagulación.');
  }

  // Procedimiento planificado
  if (state.plannedPciOrSurgery === true) {
    warnings.push('PCI o cirugía planificada en ≤5 días: considerar puente o suspensión según protocolo.');
  } else if (state.plannedPciOrSurgery === null) {
    warnings.push('PCI/cirugía planificada: dato no registrado. Verificar antes de iniciar anticoagulación.');
  }
}

/** Calcula y agrega dosis individualizada de ACOD según función renal y datos del paciente */
function individualizeACOD(
  option: TherapyOption,
  state: SessionState,
  renal: RenalCtx,
  warnings: string[],
  missingData: string[],
): string | undefined {
  const needsRenal = ['dabigatran-af', 'rivaroxaban-af', 'edoxaban-af', 'apixaban-af', 'enoxaparin-af', 'ufh-af'].includes(option.id);

  if (needsRenal && renal.clcr === undefined) missingData.push('función renal');

  const isDOAC = ['dabigatran-af', 'rivaroxaban-af', 'edoxaban-af', 'apixaban-af'].includes(option.id);
  if (isDOAC) {
    if (state.mechanicalValve === true) {
      warnings.push('Prótesis valvular mecánica: ACOD contraindicados (ensayo RE-ALIGN). Requiere anticoagulación con warfarina / AVK.');
    }
    if (state.rheumaticMitralStenosis === true) {
      warnings.push('Estenosis mitral reumática moderada-grave: ACOD contraindicados o no recomendados (ensayo INVICTUS). Requiere warfarina.');
    }
  }

  switch (option.id) {
    case 'apixaban-af': {
      if (state.age === null) missingData.push('edad');
      if (state.weight === null) missingData.push('peso');
      if (state.creatinine === null) missingData.push('creatinina');

      if (renal.clcr !== undefined && renal.clcr < 15) {
        warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: apixabán contraindicado o no recomendado en ClCr <15 (ficha ANMAT/EMA; datos insuficientes).`);
      }

      if (state.age !== null && state.weight !== null && state.creatinine !== null) {
        const criteriaCount = [
          state.age >= 80 ? 1 : 0,
          state.weight <= 60 ? 1 : 0,
          state.creatinine >= 1.5 ? 1 : 0,
        ].reduce((a, b) => a + b, 0);

        if (criteriaCount >= 2) {
          return `Con edad ${state.age} años, peso ${state.weight} kg, Cr ${state.creatinine} mg/dL: ≥2 criterios de reducción → 2,5 mg c/12 h (dosis FA reducida).`;
        }
        return `Con edad ${state.age} años, peso ${state.weight} kg, Cr ${state.creatinine} mg/dL: dosis estándar → 5 mg c/12 h.`;
      }
      return undefined;
    }

    case 'rivaroxaban-af': {
      if (renal.clcr !== undefined) {
        if (renal.clcr < 15) {
          warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: rivaroxabán contraindicado en ClCr <15.`);
        } else if (renal.clcr < 50) {
          return `ClCr ${fmt(renal.clcr)} mL/min: dosis reducida → 15 mg/día con la cena.`;
        } else {
          return `ClCr ${fmt(renal.clcr)} mL/min: dosis estándar → 20 mg/día con la cena.`;
        }
      }
      return undefined;
    }

    case 'dabigatran-af': {
      if (renal.clcr !== undefined) {
        if (renal.clcr < 30) {
          warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: dabigatrán CONTRAINDICADO (ClCr <30). Usar apixabán o warfarina.`);
        } else {
          const dose =
            (state.age !== null && state.age >= 80) ? '110 mg c/12 h (edad ≥80 años; aprobado por ANMAT y EMA; no disponible en ficha FDA)'
            : renal.clcr < 50 ? '110 mg c/12 h (ClCr 30–49; aprobado por ANMAT y EMA)'
            : '150 mg c/12 h';
          return `ClCr ${fmt(renal.clcr)} mL/min: ${dose}.`;
        }
      }
      return undefined;
    }

    case 'edoxaban-af': {
      if (renal.clcr !== undefined) {
        if (renal.clcr < 15) {
          warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: edoxabán contraindicado.`);
        } else if (renal.clcr > 95) {
          warnings.push(`ClCr ${fmt(renal.clcr)} mL/min: ClCr >95 → considerar alternativa (eficacia reducida en el subgrupo de alto ClCr; ENGAGE AF / advertencia EMA y FDA).`);
        } else if (renal.clcr <= 50 || (state.weight !== null && state.weight <= 60)) {
          const reason = state.weight !== null && state.weight <= 60 && renal.clcr > 50 ? ' (peso ≤60 kg)' : '';
          return `ClCr ${fmt(renal.clcr)} mL/min${reason}: dosis reducida → 30 mg/día.`;
        }
        return `ClCr ${fmt(renal.clcr)} mL/min: dosis estándar → 60 mg/día.`;
      }
      return undefined;
    }

    case 'enoxaparin-af': {
      if (state.weight !== null) {
        const interval = renal.clcr !== undefined && renal.clcr < 30 ? 'c/24 h' : 'c/12 h';
        const dose = state.weight;
        return `Con ${state.weight} kg: ${fmt(dose)} mg SC ${interval} (dosis anticoagulante FA).`;
      }
      if (state.weight === null) missingData.push('peso');
      return undefined;
    }

    case 'ufh-af': {
      if (state.weight !== null) {
        const bolus = Math.min(Math.round(60 * state.weight), 5000);
        const inf = Math.min(Math.round(12 * state.weight), 1000);
        return `Con ${state.weight} kg: bolo ${bolus} UI IV; infusión inicial ${inf} UI/h (titular por aPTT ratio 1,5–2,5).`;
      }
      if (state.weight === null) missingData.push('peso');
      return undefined;
    }

    default:
      return undefined;
  }
}

// ─── Evaluador principal ─────────────────────────────────────────────────────

/**
 * Evalúa una opción terapéutica FA contra el estado clínico del paciente.
 * Nunca oculta alternativas — agrega contextNotes cuando no corresponde.
 */
export function evaluateAFTherapyOption(
  option: TherapyOption,
  state: SessionState,
): EvaluatedTherapyOption {
  const warnings: string[] = [];
  const missingData: string[] = [];
  const contextNotes: string[] = [];
  const renal = getRenalCtx(state);
  let patientDose: string | undefined;

  // ── Contexto FA activo ─────────────────────────────────────────────────
  if (option.afContexts && option.afContexts.length > 0) {
    const activeCtxs = deriveAFContexts(state);
    if (activeCtxs.length === 0 && !state.afScenario) {
      contextNotes.push('Escenario de FA no seleccionado: se muestra la referencia completa.');
    } else {
      const overlaps = option.afContexts.filter((ctx) => activeCtxs.includes(ctx));
      if (overlaps.length === 0 && activeCtxs.length > 0) {
        contextNotes.push('Esta opción no corresponde al escenario FA seleccionado; puede ser relevante en otro contexto.');
      }
    }
  }

  // ── FA inestable → CV eléctrica es la prioridad ─────────────────────────────────────────────
  const isHemodynamicallyUnstable =
    (state.systolicBP !== null && state.systolicBP < 90) ||
    state.phase === 'shock_inotropicos' ||
    state.hypoperfusion === true; // null no implica inestabilidad

  if (isHemodynamicallyUnstable && option.id !== 'electrical-cv-af') {
    warnings.push('Paciente inestable: la cardioversión eléctrica urgente es la prioridad. Farmacología solo como complemento.');
  }

  // ── Evaluación por grupo ────────────────────────────────────────────────
  const rateControlIds = [
    'metoprolol-iv-af', 'esmolol-iv-af', 'diltiazem-iv-af', 'verapamil-iv-af', 'digoxin-iv-af',
    'bisoprolol-af', 'metoprolol-tartrate-af', 'diltiazem-oral-af', 'verapamil-oral-af', 'digoxin-oral-af',
  ];
  const rhythmControlIds = ['amiodarone-af', 'flecainide-af', 'propafenone-af', 'electrical-cv-af'];
  const anticoagIds = ['apixaban-af', 'rivaroxaban-af', 'dabigatran-af', 'edoxaban-af', 'warfarin-af', 'ufh-af', 'enoxaparin-af'];

  if (rateControlIds.includes(option.id)) {
    checkRateControlContraindications(option, state, renal, warnings, missingData);

    // Esmolol: calcular dosis por peso
    if (option.id === 'esmolol-iv-af' && state.weight !== null) {
      const bolus = Math.round(500 * state.weight / 1000);
      patientDose = `Con ${state.weight} kg: bolo ${bolus} mg IV en 1 min; infusión 50–200 µg/kg/min.`;
    } else if (option.id === 'esmolol-iv-af') {
      missingData.push('peso');
    }
  } else if (rhythmControlIds.includes(option.id)) {
    checkRhythmControlContraindications(option, state, renal, warnings, missingData);

    // Amiodarona: calcular bolo IV por peso
    if (option.id === 'amiodarone-af' && state.weight !== null) {
      const bolus = Math.round(5 * state.weight);
      patientDose = `Con ${state.weight} kg: bolo ${bolus} mg IV en 20–60 min; luego infusión.`;
    } else if (option.id === 'amiodarone-af') {
      missingData.push('peso');
    }

    // Cardioversión eléctrica
    if (option.id === 'electrical-cv-af') {
      if (isHemodynamicallyUnstable) {
        contextNotes.push('Prioridad absoluta: cardioversión eléctrica urgente en FA inestable.');
      } else {
        contextNotes.push('FA estable: asegurar anticoagulación adecuada antes de cardioversión electiva (≥3 semanas o ETE sin trombo).');
      }
    }
  } else if (anticoagIds.includes(option.id)) {
    checkAnticoagDuplication(option, state, warnings);
    patientDose = individualizeACOD(option, state, renal, warnings, missingData);

    // CHA₂DS₂-VASc y CHA₂DS₂-VA — mostrar scores e interpretación
    const cha = calcCHA2DS2VASc(state);
    if (cha.missingData.length > 0) {
      contextNotes.push(`CHA₂DS₂-VASc mínimo con datos disponibles: ${cha.score} (faltan: ${cha.missingData.join(', ')}).`);
    } else {
      contextNotes.push(`CHA₂DS₂-VASc: ${cha.score}/9. ${cha.interpretation}`);
    }

    const afScores = calcAFRiskScores(state);
    if (state.afGuidelineProfile === 'esc_2024' || state.afGuidelineProfile === 'compare') {
      contextNotes.push(`CHA₂DS₂-VA (ESC 2024): ${afScores.cha2ds2va.score}/8. ${afScores.cha2ds2va.interpretation} (factor de sexo no computado según ESC 2024).`);
    }

    // ACV previo — sólo si está confirmado
    if (state.previousStroke === true) {
      contextNotes.push('ACV/AIT/embolia previo (S₂=2 pts): anticoagulación generalmente indicada salvo contraindicación de sangrado.');
    } else if (state.previousStroke === null) {
      missingData.push('ACV/AIT previo (componente S₂ del CHA₂DS₂-VASc)');
    }

    // Diálisis
    if (state.dialysis === true) {
      if (option.id === 'dabigatran-af') {
        warnings.push('En diálisis: dabigatrán contraindicado.');
      } else if (option.id !== 'warfarin-af' && option.id !== 'ufh-af') {
        warnings.push('En diálisis: los ACOD tienen datos limitados. Warfarina o heparina son opciones más establecidas.');
      }
    } else if (state.dialysis === null) {
      missingData.push('estado de diálisis');
    }
  }

  // ── Cardioversión: verificar anticoagulación previa y duración ────────────────────────
  if (
    option.id === 'electrical-cv-af' ||
    state.afScenario === 'cardioversion'
  ) {
    if (isHemodynamicallyUnstable) {
      contextNotes.push('Paciente inestable: la cardioversión eléctrica urgente no debe demorarse por duración ni por anticoagulación previa.');
    } else {
      if (state.afDuration === null) {
        missingData.push('duración de la FA (decisivo para manejo anticoagulante previo a cardioversión)');
      } else if (state.afDuration === 'lt24h') {
        contextNotes.push('FA <24 h: cardioversión precoz razonable con anticoagulación peri-procedimiento; continuar AC post-CV según CHA₂DS₂-VASc.');
      } else if (state.afDuration === '24_48h') {
        contextNotes.push('FA 24–48 h: riesgo embólico intermedio. Guía ESC 2024 enfatiza considerar ETE antes de cardioversión o diferir con anticoagulación.');
      } else if (state.afDuration === 'lt48h') {
        contextNotes.push('FA <48 h: cardioversión habitualmente segura sin AC previa ≥3 semanas, aunque se recomienda heparina peri-cardioversión y AC crónica post-CV según CHA₂DS₂-VASc.');
      } else if (state.afDuration === 'gte48h' || state.afDuration === 'unknown') {
        if (state.teeNoThrombus === true) {
          contextNotes.push('ETE sin trombo auricular demostrado: permite proceder a cardioversión con heparina peri-procedimiento y anticoagulación posterior.');
        } else if (state.priorTherapeuticAnticoag === true) {
          if (state.confirmedAdherence === true) {
            contextNotes.push('Anticoagulación previa ≥3 semanas con adherencia confirmada: cardioversión electiva habilitada con AC continua.');
          } else if (state.confirmedAdherence === false) {
            warnings.push('FA ≥48 h o desconocida sin anticoagulación previa adecuada: se requiere ETE para descartar trombo O anticoagular ≥3 semanas antes de cardioversión electiva (falta de adherencia confirmada).');
          } else {
            missingData.push('adherencia confirmada a anticoagulación de 3 semanas');
          }
        } else if (state.priorTherapeuticAnticoag === false) {
          warnings.push('FA ≥48 h o desconocida sin anticoagulación previa adecuada: se requiere ETE para descartar trombo O anticoagular ≥3 semanas antes de cardioversión electiva.');
        } else {
          missingData.push('anticoagulación terapéutica previa ≥3 semanas (necesaria para cardioversión electiva en FA ≥48 h)');
        }
      }
    }
  }

  // ── Planificación de anticoagulación + SCA/PCI ──────────────────────────
  if (state.condition === 'sca' && anticoagIds.includes(option.id)) {
    contextNotes.push('FA + SCA/PCI: la estrategia antitrombótica combinada (anticoagulante + antiagregante) requiere evaluación individualizada del riesgo isquémico vs. hemorrágico.');
  }

  return {
    option,
    patientDose,
    warnings: unique(warnings),
    missingData: unique(missingData),
    contextNotes: unique(contextNotes),
  };
}
