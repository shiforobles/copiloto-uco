/**
 * Motor evaluador determinístico para insuficiencia cardíaca.
 *
 * Toma SessionState y retorna EvaluatedTherapyOption[] por grupo.
 * - Nunca oculta una opción por falta de datos.
 * - Agrega warnings, missingData y contextNotes.
 * - Calcula patientDose individualizada cuando hay datos suficientes.
 *
 * Toda salida permanece como borrador (verified: false) hasta validación médica.
 */

import type { SessionState } from '../context/session';
import { getTraceableRenalContext } from '../engine/renal';
import { calcInotropePatientDoseText, CANONICAL_DRUG_RANGES } from '../data/canonical-drugs';
import type { EvaluatedTherapyOption, HFContext, TherapyOption } from './types';

const unique = (arr: string[]) => [...new Set(arr)];

// ─── Contexto renal ─────────────────────────────────────────────────────────

interface RenalContext {
  clcr?: number;
  egfr?: number;
}

function getRenalContext(state: SessionState): RenalContext {
  const t = getTraceableRenalContext(state);
  return {
    clcr: t.clcrCockcroftGault ?? undefined,
    egfr: t.egfrCkdEpi2021 ?? undefined,
  };
}

// ─── Contexto clínico de IC inferido ────────────────────────────────────────

/**
 * Deriva el conjunto de contextos HF activos a partir del SessionState.
 * null = dato desconocido; nunca se interpreta como ausencia o normalidad.
 */
function deriveHFContexts(state: SessionState): HFContext[] {
  const contexts: HFContext[] = [];

  // Shock / hipoperfusión — solo si dato es TRUE (no asumir de null)
  if (
    state.phase === 'shock_inotropicos' ||
    state.hypoperfusion === true ||
    state.onVasopressors === true
  ) {
    contexts.push('shock');
  }

  // Congestión sin shock
  if (state.congestion === true && !contexts.includes('shock')) {
    contexts.push('congestion_no_shock');
  }

  // Estabilización
  if (state.phase === 'compensado') contexts.push('stabilization');

  // Optimización / prealta
  if (state.phase === 'pre_alta') contexts.push('optimization');

  // FEVI — solo si el dato está registrado
  if (state.lvef !== null) {
    if (state.lvef <= 40) contexts.push('fevi_reduced');
    else if (state.lvef <= 49) contexts.push('fevi_mid');
    else contexts.push('fevi_preserved');
  }

  return contexts;
}

// ─── Evaluadores por droga ───────────────────────────────────────────────────

function evalLoopDiuretic(
  option: TherapyOption,
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.potassium !== null && state.potassium < 3.5) {
    warnings.push(`K ${state.potassium} mEq/L: corregir hipopotasemia antes de aumentar dosis.`);
  }
  if (state.potassium === null) missingData.push('K');

  if (renal.clcr !== undefined && renal.clcr < 30) {
    warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: puede requerir dosis más altas de furosemida para efecto diurético adecuado.`);
  }

  if (option.id === 'furosemide-hf' && state.weight !== null && state.phase === 'shock_inotropicos') {
    contextNotes.push('En shock cardiogénico, optimizar hemodinamia antes de descongestionar agresivamente.');
  }

  if (state.congestion === false) {
    contextNotes.push('Sin signos de congestión confirmados: titular dosis de diurético a la baja según respuesta o evaluar suspensión.');
  } else if (state.congestion === null && state.phase === null) {
    missingData.push('estado de congestión');
  }

  return undefined;
}

function evalVasodilator(
  _option: TherapyOption,
  state: SessionState,
  _renal: RenalContext,
  warnings: string[],
  missingData: string[],
  _contextNotes: string[],
): string | undefined {
  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) {
    warnings.push(`TAS ${state.systolicBP} mmHg: vasodilatadores contraindicados por hipotensión.`);
  }

  if (state.phase === 'shock_inotropicos' || state.hypoperfusion === true) {
    warnings.push('Evitar vasodilatadores en shock/hipoperfusión activa.');
  } else if (state.hypoperfusion === null && state.phase === null) {
    missingData.push('estado hemodinámico');
  }

  return undefined;
}

function evalVasopresor(
  option: TherapyOption,
  state: SessionState,
  _renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  let patientDose: string | undefined;

  // Indicación fuera de shock/hipoperfusión — advertir si datos disponibles lo indican
  const knownNotShock =
    state.phase !== 'shock_inotropicos' &&
    state.hypoperfusion === false &&
    state.onVasopressors === false;

  if (knownNotShock) {
    contextNotes.push('Estos agentes son para shock/hipoperfusión. Si no hay hipoperfusión confirmada, revisar indicación.');
  } else if (state.hypoperfusion === null && state.onVasopressors === null && state.phase !== 'shock_inotropicos') {
    missingData.push('estado hemodinámico (congestión/hipoperfusión)');
  }

  if (state.weight === null) missingData.push('peso');
  if (state.systolicBP === null) missingData.push('TAS');

  // Dosis de referencia individualizada por peso — fuente: canonical-drugs.ts
  if (state.weight !== null) {
    const w = state.weight;

    // Mapeo ID de opción en matriz IC → ID canónico en canonical-drugs.ts
    const canonicalIdMap: Record<string, string> = {
      'dobutamine-hf': 'dobutamine',
      'milrinone-hf': 'milrinone',
      'norepinephrine-hf': 'norepinephrine',
      'epinephrine-hf': 'epinephrine',
      'dopamine-hf': 'dopamine',
      'vasopressin-hf': 'vasopressin',
      'levosimendan-hf': 'levosimendan',
    };

    const canonicalId = canonicalIdMap[option.id];

    if (canonicalId === 'levosimendan') {
      // Levosimendán: bolo opcional según TAS + infusión por peso
      const boloUg = (w * 6).toFixed(0);
      const startMgH = ((0.05 * w * 60) / 1000).toFixed(2);
      const maxMgH = ((0.2 * w * 60) / 1000).toFixed(2);
      if (state.systolicBP !== null && state.systolicBP < 90) {
        warnings.push(`TAS ${state.systolicBP} mmHg: bolo de levosimendán omitido por hipotensión; iniciar directamente infusión.`);
        patientDose = `Con ${w} kg: bolo omitido por TAS <90 mmHg. Infusión continua 0.05–0.2 µg/kg/min → ${startMgH}–${maxMgH} mg/h × 24 h.`;
      } else {
        patientDose = `Con ${w} kg: bolo opcional ${boloUg} µg (6 µg/kg en 10 min), luego infusión 0.05–0.2 µg/kg/min → ${startMgH}–${maxMgH} mg/h × 24 h.`;
      }
    } else if (canonicalId) {
      if (option.id === 'dobutamine-hf' && state.systolicBP !== null && state.systolicBP < 75) {
        warnings.push(`TAS ${state.systolicBP} mmHg: dobutamina como monoterapia puede empeorar la hipotensión; asociar noradrenalina.`);
      }
      const canonicalText = calcInotropePatientDoseText(canonicalId, w);
      if (canonicalText) patientDose = canonicalText;
    }

    // Si no tiene dosis por kg/min (ej. vasopresina fija), agregar nota de rango
    if (canonicalId && CANONICAL_DRUG_RANGES[canonicalId]) {
      const r = CANONICAL_DRUG_RANGES[canonicalId];
      if (r.dosingMode !== 'ug_kg_min' && !patientDose) {
        patientDose = `Con ${w} kg: rango ${r.startMin}–${r.max} ${r.unit}. ${r.notes}`;
      }
    }
  }

  return patientDose;
}

function evalRaas(
  option: TherapyOption,
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.phase === 'shock_inotropicos') {
    warnings.push('Diferir inicio/titulación de IECA/ARNI/ARA-II hasta estabilidad hemodinámica.');
  }

  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) {
    warnings.push(`TAS ${state.systolicBP} mmHg: no iniciar IECA/ARNI/ARA-II.`);
  }

  if (state.potassium === null) missingData.push('K');
  else if (state.potassium >= 5) {
    warnings.push(`K ${state.potassium} mEq/L: revisar y corregir antes de iniciar.`);
  }

  if (renal.clcr === undefined) missingData.push('función renal');
  else if (renal.clcr < 20) {
    warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: uso con cautela; monitorizar Cr estrecha.`);
  }

  // Diferenciación explícita FEVIr vs FEVIm vs FEVIp
  if (state.lvef === null) {
    missingData.push('FEVI');
  } else if (state.lvef <= 40) {
    contextNotes.push('FEVIr (≤40%): pilar de cuádruple terapia con indicación clase I para reducir morbimortalidad.');
  } else if (state.lvef >= 50) {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIp): beneficio pronóstico clase I de inhibidores SRAA demostrado principalmente en FEVIr (≤40%). En FEVIp su indicación principal es control de HTA y comorbilidades.`);
  } else {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIm): indicación clase IIb/IIa según guías (beneficio extrapolado de FEVIr).`);
  }

  if (option.id === 'sacubitril-valsartan-hf') {
    contextNotes.push('Esperar ≥36 h después de suspender IECA antes de iniciar ARNI.');
    if (state.lvef !== null && state.lvef > 40) {
      contextNotes.push(`FEVI ${state.lvef}%: evidencia principal de ARNI es en FEVIr (≤40%). En FEVIm o FEVIp, la indicación es menos robusta.`);
    }
  }

  return undefined;
}

function evalBetablocker(
  _option: TherapyOption,
  state: SessionState,
  _renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.phase === 'shock_inotropicos' || state.hypoperfusion === true) {
    warnings.push('NO iniciar betabloqueante en shock o hipoperfusión activa. Diferir hasta estabilización completa.');
  } else if (state.hypoperfusion === null && state.onVasopressors === null && state.phase === null) {
    missingData.push('estado hemodinámico (congestión/hipoperfusión/vasopresores) — necesario para iniciar betabloqueante');
  }

  if (state.onVasopressors === true) {
    warnings.push('Paciente en vasopresores/inotrópicos: diferir betabloqueante.');
  } else if (state.onVasopressors === null) {
    missingData.push('uso de vasopresores/inotrópicos');
  }

  if (state.heartRate === null) missingData.push('FC');
  else if (state.heartRate < 55) {
    warnings.push(`FC ${state.heartRate} lpm: bradicardia contraindicación relativa.`);
  }

  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) {
    warnings.push(`TAS ${state.systolicBP} mmHg: hipotensión; no iniciar betabloqueante.`);
  }

  // Diferenciación FEVI
  if (state.lvef === null) {
    missingData.push('FEVI');
  } else if (state.lvef <= 40) {
    contextNotes.push('FEVIr (≤40%): betabloqueante es pilar fundamental clase I con reducción demostrada de mortalidad.');
  } else if (state.lvef >= 50) {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIp): betabloqueantes no han demostrado reducción de mortalidad en FEVIp pura sin comorbilidad que lo justifique (arritmia, cardiopatía isquémica, HTA).`);
  } else {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIm): indicación clase IIb/IIa según guías.`);
  }

  if (state.phase === 'pre_alta') {
    contextNotes.push('Iniciar antes del alta cuando FC ≥60, TAS ≥90 y sin signos de hipoperfusión.');
  }

  return undefined;
}

function evalMRA(
  option: TherapyOption,
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.potassium === null) missingData.push('K');
  else if (state.potassium >= 5) {
    warnings.push(`K ${state.potassium} mEq/L: no iniciar ARM sin corregir hiperpotasemia.`);
  } else if (state.potassium >= 4.5) {
    contextNotes.push(`K ${state.potassium} mEq/L: controlar estrechamente al iniciar ARM.`);
  }

  if (renal.egfr === undefined) missingData.push('eGFR');
  else if (renal.egfr < 30) {
    warnings.push(`eGFR ${renal.egfr.toFixed(1)}: evitar inicio de ARM; riesgo de hiperpotasemia grave.`);
  } else if (renal.egfr < 45) {
    warnings.push(`eGFR ${renal.egfr.toFixed(1)}: inicio con dosis mínima y control estrecho de K y Cr.`);
  }

  // Diferenciación FEVI
  if (state.lvef === null) {
    missingData.push('FEVI');
  } else if (state.lvef <= 40) {
    contextNotes.push('FEVIr (≤40%): ARM es pilar clase I con reducción probada de mortalidad.');
  } else if (state.lvef >= 50) {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIp): ARM demostraron reducir hospitalizaciones en subgrupos (TOPCAT), pero sin reducción de mortalidad global.`);
  } else {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIm): indicación clase IIb/IIa según guías.`);
  }

  if (option.id === 'eplerenone-hf' && state.creatinine !== null) {
    contextNotes.push('Eplerenona: verificar interacciones con inhibidores CYP3A4 (ketoconazol, itraconazol, claritromicina).');
  }

  return undefined;
}

function evalSGLT2(
  _option: TherapyOption,
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (renal.egfr === undefined) missingData.push('eGFR');
  else if (state.dialysis === true) {
    warnings.push('En diálisis: iSGLT2 contraindicados (sin efecto y sin datos de seguridad).');
  } else if (renal.egfr < 20) {
    warnings.push(`eGFR ${renal.egfr.toFixed(1)}: eGFR <20 → no iniciar iSGLT2.`);
  } else if (renal.egfr < 45) {
    contextNotes.push(`eGFR ${renal.egfr.toFixed(1)}: iSGLT2 puede iniciarse; efecto glucosúrico reducido, pero el efecto cardiorrutal persiste.`);
  }

  // Diferenciación FEVI
  if (state.lvef === null) {
    missingData.push('FEVI');
  } else if (state.lvef >= 50) {
    contextNotes.push(`FEVI ${state.lvef}% (FEVIp): los iSGLT2 tienen indicación clase I con beneficio comprobado en reducción de muerte CV y hospitalizaciones por IC.`);
  } else {
    contextNotes.push('Pilar clase I con reducción demostrada de muerte CV y hospitalizaciones por IC en FEVI reducida y preservada.');
  }

  return undefined;
}

function evalIvabradine(
  _option: TherapyOption,
  state: SessionState,
  _renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.hasAF) {
    warnings.push('FA activa: ivabradina contraindicada (actúa sobre nodo sinusal).');
  }

  if (state.heartRate === null) missingData.push('FC');
  else if (state.heartRate < 60) {
    warnings.push(`FC ${state.heartRate} lpm: ivabradina contraindicada (FC <60 lpm).`);
  } else if (state.heartRate < 70) {
    contextNotes.push(`FC ${state.heartRate} lpm: indicación formal requiere FC ≥70 lpm en ritmo sinusal.`);
  }

  return undefined;
}

function evalDigoxin(
  _option: TherapyOption,
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
  contextNotes: string[],
): string | undefined {
  if (state.potassium === null) missingData.push('K');
  else if (state.potassium < 3.5) {
    warnings.push(`K ${state.potassium} mEq/L: hipopotasemia potencia toxicidad digitálica.`);
  }

  if (renal.clcr === undefined) missingData.push('función renal');
  else if (renal.clcr < 30) {
    warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: ajuste de dosis necesario; 0,0625 mg/día o interdiario.`);
  }

  if (state.preexcitation === true) {
    warnings.push('Síndrome de preexcitación: digoxina contraindicada en FA con WPW.');
  }

  contextNotes.push('Niveles objetivo 0,5–0,9 ng/mL. Niveles altos no mejoran el efecto y aumentan mortalidad.');

  return undefined;
}

// ─── Evaluador principal ────────────────────────────────────────────────────

/**
 * Evalúa una opción terapéutica IC contra el estado clínico del paciente.
 * - No oculta la opción si el contexto no coincide; agrega contextNote.
 * - No calcula dosis sin los datos necesarios.
 */
export function evaluateHFTherapyOption(
  option: TherapyOption,
  state: SessionState,
): EvaluatedTherapyOption {
  const warnings: string[] = [];
  const missingData: string[] = [];
  const contextNotes: string[] = [];
  const renal = getRenalContext(state);
  let patientDose: string | undefined;

  // ── Verificar contexto HF ────────────────────────────────────────────────
  if (option.hfContexts && option.hfContexts.length > 0) {
    const activeContexts = deriveHFContexts(state);
    if (activeContexts.length === 0) {
      contextNotes.push('Situación clínica no definida: se muestra la referencia completa.');
    } else {
      const overlaps = option.hfContexts.filter((ctx) => activeContexts.includes(ctx));
      if (overlaps.length === 0) {
        contextNotes.push(
          'Esta opción no corresponde habitualmente al contexto seleccionado; revisar indicación antes de elegir.',
        );
      }
    }
  }

  // ── Evaluación específica por droga ─────────────────────────────────────
  const loopDiureticsIds = ['furosemide-hf', 'bumetanide-hf', 'torsemide-hf'];
  const adjDiureticsIds = ['acetazolamide-hf', 'metolazone-hf', 'hctz-hf'];
  const vasodilatorIds = ['nitroglycerin-hf', 'nitroprusside-hf'];
  const vasopresorIds = ['norepinephrine-hf', 'dobutamine-hf', 'milrinone-hf', 'epinephrine-hf', 'vasopressin-hf', 'levosimendan-hf'];
  const raasIds = ['sacubitril-valsartan-hf', 'enalapril-hf', 'ramipril-hf', 'lisinopril-hf', 'losartan-hf', 'valsartan-hf'];
  const betablockerIds = ['carvedilol-hf', 'bisoprolol-hf', 'metoprolol-succinate-hf'];
  const mraIds = ['spironolactone-hf', 'eplerenone-hf'];
  const sglt2Ids = ['dapagliflozin-hf', 'empagliflozin-hf'];

  if (loopDiureticsIds.includes(option.id)) {
    patientDose = evalLoopDiuretic(option, state, renal, warnings, missingData, contextNotes);
  } else if (adjDiureticsIds.includes(option.id)) {
    if (state.potassium !== null && state.potassium < 3.5) {
      warnings.push(`K ${state.potassium} mEq/L: corregir antes de agregar diurético adyuvante.`);
    }
    if (state.potassium === null) missingData.push('K');
  } else if (vasodilatorIds.includes(option.id)) {
    patientDose = evalVasodilator(option, state, renal, warnings, missingData, contextNotes);
  } else if (vasopresorIds.includes(option.id)) {
    patientDose = evalVasopresor(option, state, renal, warnings, missingData, contextNotes);
  } else if (raasIds.includes(option.id)) {
    patientDose = evalRaas(option, state, renal, warnings, missingData, contextNotes);
  } else if (betablockerIds.includes(option.id)) {
    patientDose = evalBetablocker(option, state, renal, warnings, missingData, contextNotes);
  } else if (mraIds.includes(option.id)) {
    patientDose = evalMRA(option, state, renal, warnings, missingData, contextNotes);
  } else if (sglt2Ids.includes(option.id)) {
    patientDose = evalSGLT2(option, state, renal, warnings, missingData, contextNotes);
  } else if (option.id === 'ivabradine-hf') {
    patientDose = evalIvabradine(option, state, renal, warnings, missingData, contextNotes);
  } else if (option.id === 'digoxin-hf') {
    patientDose = evalDigoxin(option, state, renal, warnings, missingData, contextNotes);
  } else if (option.id === 'hydralazine-isdn-hf') {
    if (state.systolicBP !== null && state.systolicBP < 90) {
      warnings.push(`TAS ${state.systolicBP} mmHg: no iniciar hidralazina.`);
    }
    if (state.systolicBP === null) missingData.push('TAS');
  } else if (option.id === 'iv-iron-hf') {
    contextNotes.push('Verificar ferritina y TSAT antes de indicar. Disponibilidad local variable.');
  }

  return {
    option,
    patientDose,
    warnings: unique(warnings),
    missingData: unique(missingData),
    contextNotes: unique(contextNotes),
  };
}
