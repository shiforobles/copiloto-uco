import type { SessionState } from '../context/session';
import { ckdEpi2021, cockcroftGaultForDosing } from '../engine/renal';
import { validateAge, validateCreatinine, validateWeight } from '../engine/validation';
import type { EvaluatedTherapyOption, TherapyOption } from './types';

interface RenalContext {
  clcr?: number;
  egfr?: number;
}

const unique = (values: string[]) => [...new Set(values)];
const formatDose = (value: number) => Number(value.toFixed(1)).toLocaleString('es-AR');

function calculateRenalContext(state: SessionState): RenalContext {
  const ageValid = state.age !== null && validateAge(state.age).valid;
  const creatinineValid = state.creatinine !== null && validateCreatinine(state.creatinine).valid;
  const weightValid = state.weight !== null && validateWeight(state.weight).valid;

  if (!ageValid || !creatinineValid || state.sex === null) return {};

  const egfr = ckdEpi2021({
    age: state.age!,
    creatinine: state.creatinine!,
    sex: state.sex,
  }).value;

  if (!weightValid) return { egfr };

  const clcr = cockcroftGaultForDosing({
    age: state.age!,
    sex: state.sex,
    weight: state.weight!,
    heightCm: state.height ?? undefined,
    creatinine: state.creatinine!,
  }).result.value;

  return { clcr, egfr };
}

function addHemodynamicWarnings(
  state: SessionState,
  warnings: string[],
  missingData: string[],
) {
  if (state.phase === 'shock_inotropicos') {
    warnings.push('No iniciar/titular de rutina durante shock, hipoperfusión o necesidad de inotrópicos.');
  }

  if (state.heartRate === null) missingData.push('FC');
  else if (state.heartRate < 55) warnings.push(`FC ${state.heartRate} lpm: riesgo de bradicardia.`);

  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) warnings.push(`TAS ${state.systolicBP} mmHg: riesgo de hipotensión/hipoperfusión.`);
}

function addRaasWarnings(
  state: SessionState,
  renal: RenalContext,
  warnings: string[],
  missingData: string[],
) {
  if (state.phase === 'shock_inotropicos') {
    warnings.push('Diferir inicio/titulación hasta estabilidad hemodinámica.');
  }

  if (state.systolicBP === null) missingData.push('TAS');
  else if (state.systolicBP < 90) warnings.push(`TAS ${state.systolicBP} mmHg: evitar inicio por hipotensión.`);

  if (state.potassium === null) missingData.push('K');
  else if (state.potassium >= 5) warnings.push(`K ${state.potassium} mEq/L: revisar antes de iniciar o titular.`);

  if (renal.clcr === undefined) missingData.push('función renal');
  else if (renal.clcr < 30) warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: requiere selección y vigilancia renal estrechas.`);
}

/**
 * Individualiza una fila sin reemplazar la dosis de referencia ni ocultar alternativas.
 * Toda salida sigue siendo borrador hasta la curación clínica institucional.
 */
export function evaluateScaTherapyOption(
  option: TherapyOption,
  state: SessionState,
): EvaluatedTherapyOption {
  const warnings: string[] = [];
  const missingData: string[] = [];
  const contextNotes: string[] = [];
  const renal = calculateRenalContext(state);
  let patientDose: string | undefined;

  if (state.phase === null) {
    contextNotes.push('Situación clínica no seleccionada: se muestra la referencia completa.');
  } else if (!option.phases.includes(state.phase)) {
    warnings.push(
      state.phase === 'pre_alta'
        ? 'No es una opción de continuación rutinaria al alta.'
        : 'No corresponde de rutina en la situación clínica seleccionada.',
    );
  }

  if (option.subtypes && state.scaSubtype === 'unknown') {
    missingData.push('subtipo de SCA');
  } else if (option.subtypes && !option.subtypes.includes(state.scaSubtype as 'stemi' | 'nstemi')) {
    contextNotes.push('Opción vinculada a otro subtipo de SCA; revisar antes de elegir.');
  }

  if (option.strategies && state.scaStrategy === 'unknown') {
    missingData.push('estrategia');
  } else if (option.strategies && !option.strategies.includes(state.scaStrategy as 'pci' | 'fibrinolysis' | 'medical')) {
    contextNotes.push('No es la alternativa habitual para la estrategia seleccionada.');
  }

  switch (option.id) {
    case 'prasugrel':
      if (state.age === null) missingData.push('edad');
      else if (state.age >= 75) warnings.push(`Edad ${state.age}: prasugrel en general no se recomienda salvo selección excepcional.`);

      if (state.weight === null) missingData.push('peso');
      else if (state.weight < 60) patientDose = 'Mantenimiento a considerar: 5 mg/día por peso <60 kg.';
      else patientDose = 'Mantenimiento de referencia por peso: 10 mg/día.';
      break;

    case 'clopidogrel':
      if (state.scaStrategy === 'fibrinolysis') {
        if (state.age === null) missingData.push('edad');
        else if (state.age >= 75) patientDose = 'Fibrinólisis y ≥75 años: sin carga; 75 mg/día.';
        else patientDose = 'Fibrinólisis y <75 años: carga 300 mg; luego 75 mg/día.';
      }
      break;

    case 'cangrelor':
      if (state.weight === null) missingData.push('peso');
      else patientDose = `Con ${formatDose(state.weight)} kg: bolo ${formatDose(30 * state.weight)} µg; infusión ${formatDose(4 * state.weight)} µg/min.`;
      break;

    case 'ufh':
      if (state.weight === null) missingData.push('peso');
      else {
        const bolus = Math.min(60 * state.weight, 4000);
        const infusion = Math.min(12 * state.weight, 1000);
        patientDose = `Con ${formatDose(state.weight)} kg: bolo ${formatDose(bolus)} UI; infusión inicial ${formatDose(infusion)} UI/h (luego titular por aPTT/anti-Xa).`;
      }
      break;

    case 'enoxaparin-sca': {
      if (state.weight === null) missingData.push('peso');
      if (renal.clcr === undefined) missingData.push('función renal');
      const interval = renal.clcr !== undefined && renal.clcr < 30 ? 'c/24 h' : 'c/12 h';

      if (state.weight !== null) {
        if (state.scaStrategy === 'fibrinolysis') {
          if (state.age === null) missingData.push('edad');
          else if (state.age >= 75) {
            const dose = Math.min(0.75 * state.weight, 75);
            patientDose = `Fibrinólisis, ≥75 años: sin bolo IV; ${formatDose(dose)} mg SC ${interval} (tope 75 mg en las 2 primeras dosis).`;
          } else {
            const dose = Math.min(state.weight, 100);
            patientDose = `Fibrinólisis, <75 años: bolo 30 mg IV + ${formatDose(dose)} mg SC; luego ${formatDose(dose)} mg ${interval} (tope 100 mg en las 2 primeras dosis).`;
          }
        } else {
          patientDose = `Con ${formatDose(state.weight)} kg: ${formatDose(state.weight)} mg SC ${interval}.`;
        }
      }
      break;
    }

    case 'fondaparinux-sca':
      if (renal.clcr === undefined) missingData.push('función renal');
      else if (renal.clcr < 30) warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: evitar fondaparinux.`);
      if (state.scaStrategy === 'pci') warnings.push('No usar como único anticoagulante en PCI: agregar HNF durante el procedimiento según protocolo.');
      break;

    case 'bivalirudin-sca':
      if (state.weight === null) missingData.push('peso');
      if (renal.clcr === undefined) missingData.push('función renal');
      if (state.weight !== null) {
        const rate = renal.clcr !== undefined && renal.clcr < 30 ? 1 : 1.75;
        patientDose = `Con ${formatDose(state.weight)} kg: bolo ${formatDose(0.75 * state.weight)} mg; infusión ${formatDose(rate * state.weight)} mg/h${rate === 1 ? ' por ClCr <30' : ''}.`;
      }
      break;

    case 'rosuvastatin':
      if (renal.clcr === undefined) missingData.push('función renal');
      else if (renal.clcr < 30) {
        warnings.push(`ClCr ${renal.clcr.toFixed(1)} mL/min: si no está en diálisis, iniciar 5 mg y no superar 10 mg/día; no alcanza alta intensidad.`);
        patientDose = 'Referencia renal: 5 mg/día; máximo 10 mg/día si ClCr <30 y no está en diálisis.';
      }
      break;

    case 'simvastatin':
      warnings.push('No es estatina de alta intensidad; no iniciar 80 mg por riesgo de miopatía.');
      break;

    case 'bisoprolol':
    case 'carvedilol':
    case 'metoprolol-succinate':
    case 'metoprolol-tartrate':
    case 'nebivolol':
      addHemodynamicWarnings(state, warnings, missingData);
      if (option.id === 'nebivolol') {
        if (renal.clcr === undefined) missingData.push('función renal');
        else if (renal.clcr < 30) patientDose = 'IR grave: inicio de referencia 2,5 mg/día; titular con cautela.';
      }
      break;

    case 'enalapril':
    case 'ramipril':
    case 'lisinopril':
    case 'losartan':
    case 'valsartan':
      addRaasWarnings(state, renal, warnings, missingData);
      break;

    case 'eplerenone':
    case 'spironolactone':
      if (state.potassium === null) missingData.push('K');
      else if (state.potassium >= 5) warnings.push(`K ${state.potassium} mEq/L: no iniciar sin reevaluar/corregir.`);

      if (renal.egfr === undefined) missingData.push('eGFR');
      else if (renal.egfr <= 30) warnings.push(`eGFR ${renal.egfr.toFixed(1)} mL/min/1,73 m²: evitar inicio.`);

      if (state.systolicBP === null) missingData.push('TAS');
      else if (state.systolicBP < 90) warnings.push(`TAS ${state.systolicBP} mmHg: riesgo de hipotensión.`);
      break;

    case 'omeprazole':
    case 'esomeprazole':
      if (state.selectedTherapyOptionIds.includes('clopidogrel')) {
        warnings.push('Clopidogrel seleccionado: evitar esta combinación; considerar pantoprazol si hay indicación de PPI.');
      }
      break;

    case 'nitroglycerin-sl':
    case 'nitroglycerin-iv':
      if (state.systolicBP === null) missingData.push('TAS');
      else if (state.systolicBP < 90) warnings.push(`TAS ${state.systolicBP} mmHg: contraindica nitratos.`);
      if (state.phase === 'shock_inotropicos') warnings.push('Evitar nitratos durante shock/hipoperfusión.');
      break;

    case 'morphine':
    case 'fentanyl':
      warnings.push('Rescate, no rutina: puede retrasar la absorción y el efecto del P2Y12 oral.');
      break;

    default:
      break;
  }

  return {
    option,
    patientDose,
    warnings: unique(warnings),
    missingData: unique(missingData),
    contextNotes: unique(contextNotes),
  };
}

