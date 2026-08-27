import type {
  ChecklistItem,
  ChecklistResult,
  ClinicalPhase,
  MainCondition,
} from './types';

/**
 * Evalúa el checklist de IC y devuelve los pilares faltantes según fase,
 * condición, presencia de FA, y medicación actual.
 *
 * @param phase Fase clínica actual del paciente
 * @param condition Condición principal (ic, sca, otra)
 * @param hasAF Si el paciente tiene fibrilación auricular
 * @param currentMedications IDs de los items del checklist ya cubiertos
 * @param allItems Todos los items del checklist
 * @param vitals Signos vitales opcionales para evaluar precauciones
 * @returns Items faltantes con sus warnings de precaución
 */
export function evaluateChecklist(
  phase: ClinicalPhase,
  condition: MainCondition,
  hasAF: boolean,
  currentMedications: string[],
  allItems: ChecklistItem[],
  vitals?: {
    potassium?: number;
    clcr?: number;
    systolicBP?: number;
    heartRate?: number;
  }
): ChecklistResult[] {
  // Solo evaluar checklist para IC o SCA
  if (condition !== 'ic' && condition !== 'sca') {
    // Para otras condiciones, solo evaluar anticoagulación si FA
    if (hasAF) {
      const anticoagItem = allItems.find((item) => item.requireFA);
      if (anticoagItem && !currentMedications.includes(anticoagItem.id)) {
        if (anticoagItem.fases.includes(phase)) {
          return [{
            item: anticoagItem,
            precautionWarnings: evaluatePrecautions(anticoagItem, vitals),
          }];
        }
      }
    }
    return [];
  }

  const results: ChecklistResult[] = [];

  for (const item of allItems) {
    // Saltar items que ya están cubiertos
    if (currentMedications.includes(item.id)) continue;

    // Saltar items que requieren FA y el paciente no tiene
    if (item.requireFA && !hasAF) continue;

    // Saltar items que no aplican en esta fase
    if (!item.fases.includes(phase)) continue;

    // El item falta y aplica → incluir con warnings de precaución
    results.push({
      item,
      precautionWarnings: evaluatePrecautions(item, vitals),
    });
  }

  return results;
}

/**
 * Evalúa las precauciones de un item contra los signos vitales actuales.
 */
function evaluatePrecautions(
  item: ChecklistItem,
  vitals?: {
    potassium?: number;
    clcr?: number;
    systolicBP?: number;
    heartRate?: number;
  }
): string[] {
  if (!vitals) return [];

  const warnings: string[] = [];
  const prec = item.precauciones;

  if (prec.kMin !== undefined && vitals.potassium !== undefined) {
    if (vitals.potassium < prec.kMin) {
      warnings.push(`K ${vitals.potassium} < ${prec.kMin} mEq/L — corregir antes de iniciar`);
    }
  }

  if (prec.kMax !== undefined && vitals.potassium !== undefined) {
    if (vitals.potassium > prec.kMax) {
      warnings.push(`K ${vitals.potassium} > ${prec.kMax} mEq/L — precaución`);
    }
  }

  if (prec.clcrMin !== undefined && vitals.clcr !== undefined) {
    if (vitals.clcr < prec.clcrMin) {
      warnings.push(`ClCr ${vitals.clcr.toFixed(1)} < ${prec.clcrMin} mL/min — precaución renal`);
    }
  }

  if (prec.tasMin !== undefined && vitals.systolicBP !== undefined) {
    if (vitals.systolicBP < prec.tasMin) {
      warnings.push(`TAS ${vitals.systolicBP} < ${prec.tasMin} mmHg — riesgo de hipotensión`);
    }
  }

  if (prec.fcMin !== undefined && vitals.heartRate !== undefined) {
    if (vitals.heartRate < prec.fcMin) {
      warnings.push(`FC ${vitals.heartRate} < ${prec.fcMin} lpm — riesgo de bradicardia`);
    }
  }

  return warnings;
}
