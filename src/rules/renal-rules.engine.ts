import type { RenalRule, RenalRuleResult, RenalAdjustment } from './types';

/**
 * Evalúa las reglas de ajuste renal para una droga dado un ClCr.
 *
 * Algoritmo (corregido — seguridad):
 * 1. Filtra los ajustes cuyo clcrMax >= ClCr del paciente
 *    (es decir, umbrales que el paciente cruza por debajo)
 * 2. Entre los que aplican, elige el de MENOR clcrMax
 *    (el umbral más restrictivo que el paciente todavía cruza)
 * 3. Si ningún ajuste tiene clcrMax >= ClCr, devuelve dosis normal
 *
 * Ejemplo con enoxaparina anticoagulación (ajustes clcrMax:30 y clcrMax:15):
 * - ClCr 26 → aplica solo el de 30 → "1 mg/kg c/24 h"
 * - ClCr 10 → aplican 30 y 15, gana el de 15 → "evitar / considerar HNF"
 * - ClCr 50 → ninguno aplica → dosis normal
 *
 * IMPORTANTE: El ClCr debe ser el valor sin redondear (no el string de display)
 * para evitar que un redondeo de UI cambie el bin.
 *
 * @param ruleId ID de la regla a evaluar
 * @param clcr Clearance de creatinina en mL/min (valor sin redondear)
 * @param rules Array de reglas disponibles
 * @returns Resultado con la regla, el ajuste aplicado y la dosis sugerida, o null si no hay regla
 */
export function evaluateRenalRule(
  ruleId: string,
  clcr: number,
  rules: RenalRule[]
): RenalRuleResult | null {
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return null;

  return evaluateRenalRuleForRule(rule, clcr);
}

/**
 * Evalúa una regla renal directamente (sin buscar por ID).
 */
export function evaluateRenalRuleForRule(
  rule: RenalRule,
  clcr: number
): RenalRuleResult {
  // Filtrar ajustes que aplican: clcrMax >= ClCr del paciente
  const applicableAdjustments = rule.ajustes.filter(
    (adj) => clcr <= adj.clcrMax
  );

  if (applicableAdjustments.length === 0) {
    // Ningún ajuste aplica → dosis normal
    return {
      rule,
      appliedAdjustment: null,
      suggestedDose: rule.dosisNormal,
    };
  }

  // Entre los que aplican, elegir el de MENOR clcrMax (más restrictivo)
  const mostRestrictive = applicableAdjustments.reduce<RenalAdjustment>(
    (best, current) => (current.clcrMax < best.clcrMax ? current : best),
    applicableAdjustments[0]
  );

  return {
    rule,
    appliedAdjustment: mostRestrictive,
    suggestedDose: mostRestrictive.dosis,
  };
}

/**
 * Evalúa todas las reglas renales que aplican para un listado de drogas.
 *
 * @param drugRuleIds IDs de las reglas a evaluar
 * @param clcr ClCr sin redondear
 * @param rules Todas las reglas disponibles
 * @returns Array de resultados (solo incluye drogas con ajuste activo)
 */
export function evaluateAllRenalRules(
  drugRuleIds: string[],
  clcr: number,
  rules: RenalRule[]
): RenalRuleResult[] {
  const results: RenalRuleResult[] = [];

  for (const ruleId of drugRuleIds) {
    const result = evaluateRenalRule(ruleId, clcr, rules);
    if (result && result.appliedAdjustment !== null) {
      results.push(result);
    }
  }

  return results;
}
