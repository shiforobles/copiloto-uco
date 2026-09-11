import type {
  CalculationResult,
  MlhToGammaInput,
  GammaToMlhInput,
  MlhToUgMinInput,
  UgMinToMlhInput,
  MlhToUnitsMinInput,
  UnitsMinToMlhInput,
} from './types';

/**
 * Convierte mL/h a γ (µg/kg/min) para drogas dosificadas por peso.
 *
 * Fórmula: γ = (mL/h × concentración µg/mL) / (peso kg × 60)
 *
 * @param input mL/h, concentración en µg/mL, peso en kg
 * @returns γ en µg/kg/min con pasos intermedios
 */
export function mlhToGamma(input: MlhToGammaInput): CalculationResult<number> {
  const { mlPerHour, concentrationUgMl, weightKg } = input;

  const steps = [];

  // Paso 1: µg/h entregados
  const ugPerHour = mlPerHour * concentrationUgMl;
  steps.push({
    label: `µg/h entregados: ${mlPerHour} mL/h × ${concentrationUgMl} µg/mL = ${ugPerHour.toFixed(2)} µg/h`,
    value: ugPerHour,
    formula: 'mL/h × concentración (µg/mL)',
  });

  // Paso 2: µg/min
  const ugPerMin = ugPerHour / 60;
  steps.push({
    label: `µg/min: ${ugPerHour.toFixed(2)} / 60 = ${ugPerMin.toFixed(4)} µg/min`,
    value: ugPerMin,
    formula: 'µg/h ÷ 60',
  });

  // Paso 3: γ (µg/kg/min)
  const gamma = ugPerMin / weightKg;
  steps.push({
    label: `γ: ${ugPerMin.toFixed(4)} / ${weightKg} kg = ${gamma.toFixed(4)} µg/kg/min`,
    value: gamma,
    formula: 'µg/min ÷ peso (kg)',
  });

  return {
    value: gamma,
    unit: 'µg/kg/min',
    steps,
    warnings: [],
  };
}

/**
 * Convierte γ (µg/kg/min) a mL/h para drogas dosificadas por peso.
 *
 * Fórmula: mL/h = (γ × peso kg × 60) / concentración µg/mL
 *
 * @param input γ objetivo, concentración en µg/mL, peso en kg
 * @returns mL/h con pasos intermedios
 */
export function gammaToMlh(input: GammaToMlhInput): CalculationResult<number> {
  const { gamma, concentrationUgMl, weightKg } = input;

  const steps = [];

  // Paso 1: µg/min necesarios
  const ugPerMin = gamma * weightKg;
  steps.push({
    label: `µg/min necesarios: ${gamma} µg/kg/min × ${weightKg} kg = ${ugPerMin.toFixed(4)} µg/min`,
    value: ugPerMin,
    formula: 'γ × peso (kg)',
  });

  // Paso 2: µg/h necesarios
  const ugPerHour = ugPerMin * 60;
  steps.push({
    label: `µg/h necesarios: ${ugPerMin.toFixed(4)} × 60 = ${ugPerHour.toFixed(2)} µg/h`,
    value: ugPerHour,
    formula: 'µg/min × 60',
  });

  // Paso 3: mL/h
  const mlPerHour = ugPerHour / concentrationUgMl;
  steps.push({
    label: `mL/h: ${ugPerHour.toFixed(2)} / ${concentrationUgMl} µg/mL = ${mlPerHour.toFixed(2)} mL/h`,
    value: mlPerHour,
    formula: 'µg/h ÷ concentración (µg/mL)',
  });

  return {
    value: mlPerHour,
    unit: 'mL/h',
    steps,
    warnings: [],
  };
}

/**
 * Convierte mL/h a µg/min para drogas dosificadas sin peso (ej: nitroglicerina).
 *
 * Fórmula: µg/min = (mL/h × concentración µg/mL) / 60
 *
 * @param input mL/h, concentración en µg/mL
 * @returns µg/min con pasos intermedios
 */
export function mlhToUgMin(input: MlhToUgMinInput): CalculationResult<number> {
  const { mlPerHour, concentrationUgMl } = input;

  const steps = [];

  // Paso 1: µg/h entregados
  const ugPerHour = mlPerHour * concentrationUgMl;
  steps.push({
    label: `µg/h entregados: ${mlPerHour} mL/h × ${concentrationUgMl} µg/mL = ${ugPerHour.toFixed(2)} µg/h`,
    value: ugPerHour,
    formula: 'mL/h × concentración (µg/mL)',
  });

  // Paso 2: µg/min
  const ugPerMin = ugPerHour / 60;
  steps.push({
    label: `µg/min: ${ugPerHour.toFixed(2)} / 60 = ${ugPerMin.toFixed(2)} µg/min`,
    value: ugPerMin,
    formula: 'µg/h ÷ 60',
  });

  return {
    value: ugPerMin,
    unit: 'µg/min',
    steps,
    warnings: [],
  };
}

/**
 * Convierte µg/min a mL/h para drogas dosificadas sin peso.
 *
 * Fórmula: mL/h = (µg/min × 60) / concentración µg/mL
 *
 * @param input µg/min, concentración en µg/mL
 * @returns mL/h con pasos intermedios
 */
export function ugMinToMlh(input: UgMinToMlhInput): CalculationResult<number> {
  const { ugPerMin, concentrationUgMl } = input;

  const steps = [];

  // Paso 1: µg/h necesarios
  const ugPerHour = ugPerMin * 60;
  steps.push({
    label: `µg/h necesarios: ${ugPerMin} µg/min × 60 = ${ugPerHour.toFixed(2)} µg/h`,
    value: ugPerHour,
    formula: 'µg/min × 60',
  });

  // Paso 2: mL/h
  const mlPerHour = ugPerHour / concentrationUgMl;
  steps.push({
    label: `mL/h: ${ugPerHour.toFixed(2)} / ${concentrationUgMl} µg/mL = ${mlPerHour.toFixed(2)} mL/h`,
    value: mlPerHour,
    formula: 'µg/h ÷ concentración (µg/mL)',
  });

  return {
    value: mlPerHour,
    unit: 'mL/h',
    steps,
    warnings: [],
  };
}

/**
 * Convierte mL/h a U/min para drogas dosificadas en unidades/min (ej: vasopresina).
 *
 * Fórmula: U/min = (mL/h × concentración U/mL) / 60
 *
 * @param input mL/h, concentración en U/mL
 * @returns U/min con pasos intermedios
 */
export function mlhToUnitsMin(input: MlhToUnitsMinInput): CalculationResult<number> {
  const { mlPerHour, concentrationUnitsPerMl } = input;

  const steps = [];

  // Paso 1: U/h entregadas
  const unitsPerHour = mlPerHour * concentrationUnitsPerMl;
  steps.push({
    label: `U/h entregadas: ${mlPerHour} mL/h × ${concentrationUnitsPerMl} U/mL = ${unitsPerHour.toFixed(4)} U/h`,
    value: unitsPerHour,
    formula: 'mL/h × concentración (U/mL)',
  });

  // Paso 2: U/min
  const unitsPerMin = unitsPerHour / 60;
  steps.push({
    label: `U/min: ${unitsPerHour.toFixed(4)} / 60 = ${unitsPerMin.toFixed(4)} U/min`,
    value: unitsPerMin,
    formula: 'U/h ÷ 60',
  });

  return {
    value: unitsPerMin,
    unit: 'U/min',
    steps,
    warnings: [],
  };
}

/**
 * Convierte U/min a mL/h para drogas dosificadas en unidades/min.
 *
 * Fórmula: mL/h = (U/min × 60) / concentración U/mL
 *
 * @param input U/min, concentración en U/mL
 * @returns mL/h con pasos intermedios
 */
export function unitsMinToMlh(input: UnitsMinToMlhInput): CalculationResult<number> {
  const { unitsPerMin, concentrationUnitsPerMl } = input;

  const steps = [];

  // Paso 1: U/h necesarias
  const unitsPerHour = unitsPerMin * 60;
  steps.push({
    label: `U/h necesarias: ${unitsPerMin} U/min × 60 = ${unitsPerHour.toFixed(4)} U/h`,
    value: unitsPerHour,
    formula: 'U/min × 60',
  });

  // Paso 2: mL/h
  const mlPerHour = unitsPerHour / concentrationUnitsPerMl;
  steps.push({
    label: `mL/h: ${unitsPerHour.toFixed(4)} / ${concentrationUnitsPerMl} U/mL = ${mlPerHour.toFixed(2)} mL/h`,
    value: mlPerHour,
    formula: 'U/h ÷ concentración (U/mL)',
  });

  return {
    value: mlPerHour,
    unit: 'mL/h',
    steps,
    warnings: [],
  };
}
