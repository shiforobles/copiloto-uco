import type {
  CalculationResult,
  CockcroftGaultInput,
  CkdEpi2021Input,
  Sex,
} from './types';

export interface CockcroftGaultDosingInput extends CockcroftGaultInput {
  heightCm?: number;
}

export interface CockcroftGaultDosingContext {
  result: CalculationResult<number>;
  weightUsed: number;
  weightStrategy: 'actual' | 'adjusted';
  idealWeight?: number;
  adjustedWeight?: number;
}

/**
 * Calcula el clearance de creatinina estimado por la fórmula de Cockcroft-Gault.
 *
 * Fórmula: ClCr = ((140 − edad) × peso) / (72 × CrS)
 * Si sexo = female, multiplicar × 0.85
 *
 * @param input Datos del paciente (edad, peso en kg, creatinina en mg/dL, sexo)
 * @returns Resultado en mL/min con pasos intermedios y advertencias
 */
export function cockcroftGault(input: CockcroftGaultInput): CalculationResult<number> {
  const { age, creatinine, sex, adjustedWeight } = input;
  const weight = adjustedWeight ?? input.weight;

  const steps = [];
  const warnings: string[] = [];

  // Paso 1: Numerador
  const numerator = (140 - age) * weight;
  steps.push({
    label: `Numerador: (140 − ${age}) × ${weight} = ${numerator}`,
    value: numerator,
    formula: '(140 − edad) × peso',
  });

  // Paso 2: Denominador
  const denominator = 72 * creatinine;
  steps.push({
    label: `Denominador: 72 × ${creatinine} = ${denominator}`,
    value: denominator,
    formula: '72 × CrS',
  });

  // Paso 3: División
  let result = numerator / denominator;
  steps.push({
    label: `División: ${numerator} / ${denominator} = ${result.toFixed(2)}`,
    value: result,
    formula: 'numerador / denominador',
  });

  // Paso 4: Corrección por sexo
  if (sex === 'female') {
    const prev = result;
    result = result * 0.85;
    steps.push({
      label: `Corrección sexo femenino: ${prev.toFixed(2)} × 0,85 = ${result.toFixed(2)}`,
      value: result,
      formula: 'resultado × 0,85 (mujer)',
    });
  }

  // Warning: ancianos con Cr baja
  if (age >= 80 && creatinine < 0.8) {
    warnings.push(
      'Precaución: en pacientes ≥ 80 años con creatinina < 0,8 mg/dL, ' +
      'Cockcroft-Gault puede sobreestimar el clearance real por baja masa muscular.'
    );
  }

  return {
    value: result,
    unit: 'mL/min',
    steps,
    warnings,
  };
}

/**
 * Devuelve un único Cockcroft-Gault de dosificación para que resultados,
 * alertas y checklist utilicen exactamente el mismo valor.
 *
 * Si hay talla válida y el peso real supera 120% del peso ideal de Devine,
 * utiliza el peso ajustado configurado por el prototipo.
 */
export function cockcroftGaultForDosing(
  input: CockcroftGaultDosingInput,
): CockcroftGaultDosingContext {
  let weightUsed = input.weight;
  let weightStrategy: CockcroftGaultDosingContext['weightStrategy'] = 'actual';
  let idealWeight: number | undefined;
  let adjustedWeight: number | undefined;

  if (input.heightCm !== undefined && input.heightCm > 100) {
    const ideal = devineIdealWeight(input.heightCm, input.sex);
    idealWeight = ideal.value;
    const adjusted = adjustedBodyWeight(input.weight, ideal.value);

    if (adjusted) {
      adjustedWeight = adjusted.value;
      weightUsed = adjusted.value;
      weightStrategy = 'adjusted';
    }
  }

  return {
    result: cockcroftGault({
      age: input.age,
      sex: input.sex,
      weight: input.weight,
      creatinine: input.creatinine,
      adjustedWeight,
    }),
    weightUsed,
    weightStrategy,
    idealWeight,
    adjustedWeight,
  };
}

/**
 * Calcula la tasa de filtrado glomerular estimada por CKD-EPI 2021 (sin raza).
 *
 * Fórmula: eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(−1.200) × 0.9938^edad × (1.012 si mujer)
 *
 * Donde:
 * - κ = 0.7 (mujer) / 0.9 (hombre)
 * - α = −0.241 (mujer) / −0.302 (hombre)
 *
 * @param input Datos del paciente (edad, creatinina en mg/dL, sexo)
 * @returns Resultado en mL/min/1.73 m² con pasos intermedios
 */
export function ckdEpi2021(input: CkdEpi2021Input): CalculationResult<number> {
  const { age, creatinine, sex } = input;

  const kappa = sex === 'female' ? 0.7 : 0.9;
  const alpha = sex === 'female' ? -0.241 : -0.302;
  const sexFactor = sex === 'female' ? 1.012 : 1;

  const steps = [];
  const warnings: string[] = [];

  // Paso 1: Scr/κ
  const scrOverKappa = creatinine / kappa;
  steps.push({
    label: `Scr/κ: ${creatinine} / ${kappa} = ${scrOverKappa.toFixed(4)}`,
    value: scrOverKappa,
    formula: `Scr / κ (κ = ${kappa} para ${sex === 'female' ? 'mujer' : 'hombre'})`,
  });

  // Paso 2: min(Scr/κ, 1)^α
  const minTerm = Math.min(scrOverKappa, 1);
  const minPower = Math.pow(minTerm, alpha);
  steps.push({
    label: `min(${scrOverKappa.toFixed(4)}, 1)^${alpha} = ${minTerm.toFixed(4)}^${alpha} = ${minPower.toFixed(4)}`,
    value: minPower,
    formula: `min(Scr/κ, 1)^α (α = ${alpha})`,
  });

  // Paso 3: max(Scr/κ, 1)^(−1.200)
  const maxTerm = Math.max(scrOverKappa, 1);
  const maxPower = Math.pow(maxTerm, -1.200);
  steps.push({
    label: `max(${scrOverKappa.toFixed(4)}, 1)^(−1,200) = ${maxTerm.toFixed(4)}^(−1,200) = ${maxPower.toFixed(4)}`,
    value: maxPower,
    formula: 'max(Scr/κ, 1)^(−1,200)',
  });

  // Paso 4: 0.9938^edad
  const ageFactor = Math.pow(0.9938, age);
  steps.push({
    label: `0,9938^${age} = ${ageFactor.toFixed(4)}`,
    value: ageFactor,
    formula: '0,9938^edad',
  });

  // Paso 5: Resultado final
  let result = 142 * minPower * maxPower * ageFactor * sexFactor;
  const sexLabel = sex === 'female' ? ' × 1,012 (mujer)' : '';
  steps.push({
    label: `eGFR = 142 × ${minPower.toFixed(4)} × ${maxPower.toFixed(4)} × ${ageFactor.toFixed(4)}${sexLabel} = ${result.toFixed(1)}`,
    value: result,
    formula: `142 × min(Scr/κ,1)^α × max(Scr/κ,1)^(−1,200) × 0,9938^edad${sex === 'female' ? ' × 1,012' : ''}`,
  });

  return {
    value: result,
    unit: 'mL/min/1,73 m²',
    steps,
    warnings,
  };
}

/**
 * Calcula el peso ideal por la fórmula de Devine (1974).
 *
 * - Hombre: IBW = 50 + 0.91 × (talla cm − 152.4)
 * - Mujer:  IBW = 45.5 + 0.91 × (talla cm − 152.4)
 *
 * @param heightCm Talla en centímetros
 * @param sex Sexo biológico
 * @returns Peso ideal en kg (CalculationResult con pasos)
 */
export function devineIdealWeight(
  heightCm: number,
  sex: Sex,
): CalculationResult<number> {
  const base = sex === 'female' ? 45.5 : 50;
  const sexLabel = sex === 'female' ? 'mujer' : 'hombre';

  const steps = [];

  const diff = heightCm - 152.4;
  steps.push({
    label: `Diferencia de talla: ${heightCm} − 152,4 = ${diff.toFixed(1)} cm`,
    value: diff,
    formula: 'talla (cm) − 152,4',
  });

  const ibw = base + 0.91 * diff;
  steps.push({
    label: `IBW: ${base} + 0,91 × ${diff.toFixed(1)} = ${ibw.toFixed(1)} kg`,
    value: ibw,
    formula: `${base} + 0,91 × (talla − 152,4) [${sexLabel}]`,
  });

  return {
    value: ibw,
    unit: 'kg',
    steps,
    warnings: [],
  };
}

/**
 * Calcula el peso ajustado (ABW) para pacientes obesos.
 *
 * ABW = IBW + 0.4 × (peso real − IBW)
 *
 * Solo se usa si peso real > 1.2 × IBW (obeso).
 *
 * @param actualWeight Peso real en kg
 * @param idealWeight Peso ideal (Devine) en kg
 * @returns Peso ajustado en kg, o null si no es obeso
 */
export function adjustedBodyWeight(
  actualWeight: number,
  idealWeight: number,
): CalculationResult<number> | null {
  const threshold = idealWeight * 1.2;

  if (actualWeight <= threshold) {
    return null; // No es obeso, no necesita ajuste
  }

  const steps = [];

  steps.push({
    label: `Peso real (${actualWeight} kg) > 1,2 × IBW (${threshold.toFixed(1)} kg) → obeso`,
    value: actualWeight,
    formula: 'peso real > 1,2 × IBW',
  });

  const abw = idealWeight + 0.4 * (actualWeight - idealWeight);
  steps.push({
    label: `ABW: ${idealWeight.toFixed(1)} + 0,4 × (${actualWeight} − ${idealWeight.toFixed(1)}) = ${abw.toFixed(1)} kg`,
    value: abw,
    formula: 'IBW + 0,4 × (peso real − IBW)',
  });

  return {
    value: abw,
    unit: 'kg',
    steps,
    warnings: ['Usando peso ajustado (ABW) para Cockcroft-Gault por obesidad.'],
  };
}

/**
 * Contexto renal unificado y trazable para todos los módulos clínicos.
 * Expone claramente ClCr (Cockcroft-Gault) separado de eGFR (CKD-EPI 2021)
 * y detalla la estrategia de peso empleada.
 */
export interface TraceableRenalContext {
  age: number | null;
  sex: Sex | null;
  creatinine: number | null;
  actualWeight: number | null;
  heightCm: number | null;
  bmi: number | null;
  idealWeightDevine: number | null;
  adjustedWeight: number | null;
  isObese: boolean;
  clcrCockcroftGault: number | null;
  clcrWeightUsed: number | null;
  clcrWeightStrategy: 'actual' | 'adjusted' | 'none';
  egfrCkdEpi2021: number | null;
  methodApplied: string;
  missingDataForClcr: string[];
  missingDataForEgfr: string[];
  extremeAlerts: string[];
}

export function getTraceableRenalContext(state: {
  age: number | null;
  sex: Sex | null;
  creatinine: number | null;
  weight: number | null;
  height?: number | null;
}): TraceableRenalContext {
  const missingDataForClcr: string[] = [];
  const missingDataForEgfr: string[] = [];
  const extremeAlerts: string[] = [];

  if (state.age === null) {
    missingDataForClcr.push('edad');
    missingDataForEgfr.push('edad');
  }
  if (state.sex === null) {
    missingDataForClcr.push('sexo');
    missingDataForEgfr.push('sexo');
  }
  if (state.creatinine === null) {
    missingDataForClcr.push('creatinina');
    missingDataForEgfr.push('creatinina');
  }
  if (state.weight === null) {
    missingDataForClcr.push('peso');
  }

  // IMC y Pesos
  let bmi: number | null = null;
  let idealWeightDevine: number | null = null;
  let adjustedWeight: number | null = null;
  let isObese = false;

  const heightCm = state.height ?? null;
  const actualWeight = state.weight;

  if (actualWeight !== null && heightCm !== null && heightCm > 0) {
    const heightM = heightCm / 100;
    bmi = Number((actualWeight / (heightM * heightM)).toFixed(1));
    if (bmi >= 30) isObese = true;
    else if (bmi < 18.5) {
      extremeAlerts.push(`Bajo peso (IMC ${bmi} kg/m²): masa muscular reducida, valorar creatinina con cautela.`);
    }
  }

  if (heightCm !== null && heightCm > 100 && state.sex !== null) {
    idealWeightDevine = Number(devineIdealWeight(heightCm, state.sex).value.toFixed(1));
    if (actualWeight !== null) {
      const abwRes = adjustedBodyWeight(actualWeight, idealWeightDevine);
      if (abwRes) {
        adjustedWeight = Number(abwRes.value.toFixed(1));
        isObese = true;
      }
    }
  }

  // ClCr (Cockcroft-Gault)
  let clcrCockcroftGault: number | null = null;
  let clcrWeightUsed: number | null = null;
  let clcrWeightStrategy: TraceableRenalContext['clcrWeightStrategy'] = 'none';

  if (missingDataForClcr.length === 0) {
    const cgDosing = cockcroftGaultForDosing({
      age: state.age!,
      sex: state.sex!,
      weight: state.weight!,
      heightCm: heightCm ?? undefined,
      creatinine: state.creatinine!,
    });
    clcrCockcroftGault = Number(cgDosing.result.value.toFixed(1));
    clcrWeightUsed = Number(cgDosing.weightUsed.toFixed(1));
    clcrWeightStrategy = cgDosing.weightStrategy;

    if (clcrCockcroftGault < 15) {
      extremeAlerts.push(`ClCr ${clcrCockcroftGault} mL/min: enfermedad renal estadio 5 o requerimiento de diálisis.`);
    }
  }

  // eGFR (CKD-EPI 2021)
  let egfrCkdEpi2021: number | null = null;
  if (missingDataForEgfr.length === 0) {
    const ckdRes = ckdEpi2021({
      age: state.age!,
      sex: state.sex!,
      creatinine: state.creatinine!,
    });
    egfrCkdEpi2021 = Number(ckdRes.value.toFixed(1));
  }

  // Alertas fisiológicas y límites extremos
  if (state.age !== null && state.age >= 100) {
    extremeAlerts.push(`Edad centenaria (${state.age} años): fórmulas de estimación renal no validadas en mayores de 100 años.`);
  } else if (state.age !== null && state.age >= 80 && state.creatinine !== null && state.creatinine < 0.8) {
    extremeAlerts.push('Paciente ≥80 años con Cr <0.8 mg/dL: Cockcroft-Gault sobreestima el clearance por baja masa muscular.');
  }

  if (state.creatinine !== null && state.creatinine > 10.0) {
    extremeAlerts.push(`Creatinina extrema (${state.creatinine} mg/dL): verificar muestra y probable anuria o diálisis urgente.`);
  } else if (state.creatinine !== null && state.creatinine >= 5.0) {
    extremeAlerts.push(`Creatinina ${state.creatinine} mg/dL: deterioro renal severo.`);
  }

  if (actualWeight !== null && (actualWeight < 30 || actualWeight > 200)) {
    extremeAlerts.push(`Peso extremo (${actualWeight} kg): requiere validación antropométrica y dosificación farmacocinética dirigida.`);
  }

  if (isObese && clcrWeightStrategy === 'adjusted') {
    extremeAlerts.push(`Obesidad: Cockcroft-Gault calculado con peso ajustado (${clcrWeightUsed} kg) para evitar sobredosis.`);
  }

  const methodApplied = clcrCockcroftGault !== null
    ? `Cockcroft-Gault de dosificación con ${clcrWeightStrategy === 'adjusted' ? 'peso ajustado (ABW)' : 'peso real'} (${clcrWeightUsed} kg)`
    : 'Datos insuficientes para Cockcroft-Gault';

  return {
    age: state.age,
    sex: state.sex,
    creatinine: state.creatinine,
    actualWeight,
    heightCm,
    bmi,
    idealWeightDevine,
    adjustedWeight,
    isObese,
    clcrCockcroftGault,
    clcrWeightUsed,
    clcrWeightStrategy,
    egfrCkdEpi2021,
    methodApplied,
    missingDataForClcr,
    missingDataForEgfr,
    extremeAlerts,
  };
}

