import type {
  CalculationResult,
  CalculationStep,
  CockcroftGaultInput,
  CkdEpi2021Input,
  DosingClCrInput,
  DosingClCrResult,
  Sex,
} from './types';

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

  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  // Paso 1: Numerador
  const numerator = (140 - age) * weight;
  steps.push({
    label: `Numerador: (140 − ${age}) × ${weight.toFixed(1)} = ${numerator.toFixed(1)}`,
    value: numerator,
    formula: '(140 − edad) × peso',
  });

  // Paso 2: Denominador
  const denominator = 72 * creatinine;
  steps.push({
    label: `Denominador: 72 × ${creatinine} = ${denominator.toFixed(1)}`,
    value: denominator,
    formula: '72 × CrS',
  });

  // Paso 3: División
  let result = numerator / denominator;
  steps.push({
    label: `División: ${numerator.toFixed(1)} / ${denominator.toFixed(1)} = ${result.toFixed(2)}`,
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

  const steps: CalculationStep[] = [];
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

  const steps: CalculationStep[] = [];

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

  const steps: CalculationStep[] = [];

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
 * Calcula el ClCr de dosificación unificado para toda la aplicación.
 *
 * Si se dispone de la talla y el paciente es obeso (peso real > 1.2 × IBW),
 * utiliza automáticamente Cockcroft-Gault con Peso Ajustado (ABW).
 * De lo contrario, utiliza el peso real.
 *
 * @param input Datos de dosificación (edad, sexo, peso, creatinina, talla opcional)
 * @returns Resultado trazable con ClCr de dosificación, indicador de ABW y pasos
 */
export function getDosingClCr(input: DosingClCrInput): DosingClCrResult {
  const { age, sex, weight, creatinine, height } = input;
  let ibw: number | null = null;
  let abw: number | null = null;
  let weightUsed = weight;
  let isAdjustedWeightUsed = false;
  const extraSteps: CalculationStep[] = [];
  const warnings: string[] = [];

  if (height !== null && height !== undefined && height > 100) {
    const ibwRes = devineIdealWeight(height, sex);
    ibw = ibwRes.value;
    extraSteps.push(...ibwRes.steps);

    const abwRes = adjustedBodyWeight(weight, ibw);
    if (abwRes !== null) {
      abw = abwRes.value;
      weightUsed = abw;
      isAdjustedWeightUsed = true;
      extraSteps.push(...abwRes.steps);
      warnings.push(...abwRes.warnings);
    } else {
      extraSteps.push({
        label: `Peso real (${weight} kg) ≤ 1,2 × IBW (${(ibw * 1.2).toFixed(1)} kg) → se usa peso real (${weight} kg) para dosificación`,
        value: weight,
      });
    }
  } else {
    extraSteps.push({
      label: `Sin talla registrada → se usa peso real (${weight} kg) para dosificación`,
      value: weight,
    });
  }

  const cg = cockcroftGault({
    age,
    creatinine,
    sex,
    weight,
    adjustedWeight: isAdjustedWeightUsed ? weightUsed : undefined,
  });

  return {
    value: cg.value,
    unit: 'mL/min',
    steps: [...extraSteps, ...cg.steps],
    warnings: [...warnings, ...cg.warnings],
    isAdjustedWeightUsed,
    ibw,
    abw,
    weightUsed,
  };
}
