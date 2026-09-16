import type { ValidationResult } from './types';

/**
 * Valida que el peso sea un número positivo y razonable.
 * @param weight Peso en kg
 */
export function validateWeight(weight: number): ValidationResult {
  if (weight === null || weight === undefined || !Number.isFinite(weight)) {
    return { valid: false, error: 'El peso es obligatorio' };
  }
  if (weight <= 0) {
    return { valid: false, error: 'El peso debe ser mayor a 0 kg' };
  }
  if (weight > 500) {
    return { valid: false, error: 'El peso parece excesivo (> 500 kg)' };
  }
  return { valid: true };
}

/**
 * Valida que la creatinina sea un número positivo.
 * @param cr Creatinina sérica en mg/dL
 */
export function validateCreatinine(cr: number): ValidationResult {
  if (cr === null || cr === undefined || !Number.isFinite(cr)) {
    return { valid: false, error: 'La creatinina es obligatoria' };
  }
  if (cr <= 0) {
    return { valid: false, error: 'La creatinina debe ser mayor a 0 mg/dL' };
  }
  if (cr > 30) {
    return { valid: false, error: 'La creatinina parece excesiva (> 30 mg/dL)' };
  }
  return { valid: true };
}

/**
 * Valida que la edad esté en un rango razonable.
 * @param age Edad en años
 */
export function validateAge(age: number): ValidationResult {
  if (age === null || age === undefined || !Number.isFinite(age)) {
    return { valid: false, error: 'La edad es obligatoria' };
  }
  if (age < 0) {
    return { valid: false, error: 'La edad no puede ser negativa' };
  }
  if (age > 120) {
    return { valid: false, error: 'La edad parece excesiva (> 120 años)' };
  }
  if (!Number.isInteger(age)) {
    return { valid: false, error: 'La edad debe ser un número entero' };
  }
  return { valid: true };
}

/**
 * Valida que la concentración sea un número positivo.
 * @param conc Concentración en µg/mL
 */
export function validateConcentration(conc: number): ValidationResult {
  if (conc === null || conc === undefined || !Number.isFinite(conc)) {
    return { valid: false, error: 'La concentración es obligatoria' };
  }
  if (conc <= 0) {
    return { valid: false, error: 'La concentración debe ser mayor a 0 µg/mL' };
  }
  return { valid: true };
}

/**
 * Valida que un flujo en mL/h sea no negativo.
 * @param rate Flujo en mL/h
 */
export function validateRate(rate: number): ValidationResult {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return { valid: false, error: 'El flujo es obligatorio' };
  }
  if (rate < 0) {
    return { valid: false, error: 'El flujo no puede ser negativo' };
  }
  return { valid: true };
}

/**
 * Valida que una dosis gamma sea no negativa.
 * @param gamma Dosis en µg/kg/min o µg/min
 */
export function validateGamma(gamma: number): ValidationResult {
  if (gamma === null || gamma === undefined || !Number.isFinite(gamma)) {
    return { valid: false, error: 'La dosis es obligatoria' };
  }
  if (gamma < 0) {
    return { valid: false, error: 'La dosis no puede ser negativa' };
  }
  return { valid: true };
}
