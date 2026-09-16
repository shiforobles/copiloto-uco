import type { SessionState } from '../context/session';
import { validateAge, validateWeight, validateCreatinine } from '../engine/validation';

export function renalBlockReason(state: SessionState): string | null {
  if (state.age !== null && state.age < 18) return 'Las herramientas de esta app son para adultos de 18 años o más.';
  if (state.renalStatus === 'dialysis') return 'Diálisis / reemplazo renal: se requiere un esquema específico para la modalidad. No se aplican las reglas automáticas por ClCr.';
  if (state.renalStatus === 'unstable') return 'Creatinina cambiante / lesión renal aguda: estas ecuaciones no representan de forma fiable la función renal actual. No se aplican reglas automáticas de dosis.';
  return null;
}

export function hasRenalInputs(state: SessionState): boolean {
  return state.age !== null && state.age >= 18 && validateAge(state.age).valid && state.sex !== null &&
    state.weight !== null && validateWeight(state.weight).valid && state.creatinine !== null && validateCreatinine(state.creatinine).valid &&
    (state.height === null || (Number.isFinite(state.height) && state.height >= 100 && state.height <= 250));
}

export function dosingBlockReason(state: SessionState): string | null {
  return renalBlockReason(state) ?? (state.renalStatus !== 'stable' ? 'Confirmá estabilidad de creatinina en Paciente antes de evaluar ajustes renales.' :
    !hasRenalInputs(state) ? 'Completá edad adulta, sexo, peso y creatinina válidos; revisá la talla si está informada.' : null);
}
