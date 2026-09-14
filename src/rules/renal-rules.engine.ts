import type {
  RenalRule,
  RenalRuleResult,
  RenalAdjustment,
  PatientClinicalContext,
} from './types';

/**
 * Evalúa las reglas de ajuste renal para una droga dado un ClCr y contexto del paciente.
 *
 * Algoritmo:
 * 1. Evalúa criterios multi-factoriales (ej: Apixabán en FA: ≥ 2 de 3 entre edad ≥ 80, peso ≤ 60, Cr ≥ 1.5).
 * 2. Filtra ajustes por ClCr que aplican: ClCr <= clcrMax.
 * 3. Si hay un ajuste por ClCr (ej: ClCr <= 15 contraindicado), este prevalece como el más restrictivo.
 * 4. Si no hay ajuste por ClCr pero sí aplica reducción multi-factorial, aplica la dosis reducida.
 * 5. Si nada aplica, devuelve dosis normal.
 *
 * @param ruleId ID de la regla a evaluar
 * @param clcr Clearance de creatinina en mL/min (valor sin redondear)
 * @param rules Array de reglas disponibles
 * @param context Contexto opcional del paciente (edad, peso, creatinina)
 * @returns Resultado con la regla, el ajuste aplicado y la dosis sugerida, o null si no hay regla
 */
export function evaluateRenalRule(
  ruleId: string,
  clcr: number,
  rules: RenalRule[],
  context?: PatientClinicalContext
): RenalRuleResult | null {
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return null;

  return evaluateRenalRuleForRule(rule, clcr, context);
}

/**
 * Evalúa una regla renal directamente (sin buscar por ID).
 */
export function evaluateRenalRuleForRule(
  rule: RenalRule,
  clcr: number,
  context?: PatientClinicalContext
): RenalRuleResult {
  // 1. Evaluar criterios multi-factoriales (ej: Apixabán FA)
  let criteriaApplied: {
    metCriteriaCount: number;
    requiredCount: number;
    details: string[];
  } | null = null;
  let criteriaDose: string | null = null;

  if (rule.criteriaReduction && context) {
    const { minAge, maxWeight, minCreatinine, minCriteriaCount, dosisAjustada } = rule.criteriaReduction;
    const details: string[] = [];
    let metCount = 0;

    if (minAge !== undefined && context.age !== null && context.age !== undefined) {
      if (context.age >= minAge) {
        metCount++;
        details.push(`Edad ≥ ${minAge} (${context.age} años)`);
      }
    }
    if (maxWeight !== undefined && context.weight !== null && context.weight !== undefined) {
      if (context.weight <= maxWeight) {
        metCount++;
        details.push(`Peso ≤ ${maxWeight} kg (${context.weight} kg)`);
      }
    }
    if (minCreatinine !== undefined && context.creatinine !== null && context.creatinine !== undefined) {
      if (context.creatinine >= minCreatinine) {
        metCount++;
        details.push(`Cr sérica ≥ ${minCreatinine} mg/dL (${context.creatinine} mg/dL)`);
      }
    }

    if (metCount >= minCriteriaCount) {
      criteriaApplied = {
        metCriteriaCount: metCount,
        requiredCount: minCriteriaCount,
        details,
      };
      criteriaDose = dosisAjustada;
    }
  }

  // 2. Filtrar ajustes renales por ClCr que aplican: ClCr <= clcrMax
  const applicableAdjustments = rule.ajustes.filter(
    (adj) => clcr <= adj.clcrMax
  );

  let mostRestrictiveAdjustment: RenalAdjustment | null = null;
  if (applicableAdjustments.length > 0) {
    mostRestrictiveAdjustment = applicableAdjustments.reduce<RenalAdjustment>(
      (best, current) => (current.clcrMax < best.clcrMax ? current : best),
      applicableAdjustments[0]
    );
  }

  // Si hay ajuste renal por ClCr (ej: contraindicado por ClCr < 15), prevalece
  if (mostRestrictiveAdjustment !== null) {
    return {
      rule,
      appliedAdjustment: mostRestrictiveAdjustment,
      appliedCriteriaReduction: criteriaApplied,
      suggestedDose: mostRestrictiveAdjustment.dosis,
    };
  }

  // Si no hay ajuste por ClCr pero sí aplica reducción por criterios (ej: 2 de 3 en Apixabán)
  if (criteriaDose !== null) {
    return {
      rule,
      appliedAdjustment: null,
      appliedCriteriaReduction: criteriaApplied,
      suggestedDose: criteriaDose,
    };
  }

  // Dosis normal
  return {
    rule,
    appliedAdjustment: null,
    appliedCriteriaReduction: null,
    suggestedDose: rule.dosisNormal,
  };
}

/**
 * Evalúa todas las reglas renales que aplican para un listado de drogas.
 *
 * @param drugRuleIds IDs de las reglas a evaluar
 * @param clcr ClCr sin redondear
 * @param rules Todas las reglas disponibles
 * @param context Contexto opcional del paciente
 * @returns Array de resultados (incluye drogas con ajuste renal o reducción por criterios)
 */
export function evaluateAllRenalRules(
  drugRuleIds: string[],
  clcr: number,
  rules: RenalRule[],
  context?: PatientClinicalContext
): RenalRuleResult[] {
  const results: RenalRuleResult[] = [];

  for (const ruleId of drugRuleIds) {
    const result = evaluateRenalRule(ruleId, clcr, rules, context);
    if (
      result &&
      (result.appliedAdjustment !== null || result.appliedCriteriaReduction !== null)
    ) {
      results.push(result);
    }
  }

  return results;
}
