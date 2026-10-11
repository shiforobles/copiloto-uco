import type { SessionState } from '../context/session';
import { getDosingClCr } from '../engine/renal';
import { dosingBlockReason } from './patient';
import { adultPatient } from './therapy';

export type ScaStatus = 'consider' | 'confirm' | 'review' | 'avoid' | 'not-routine';
export const scaStatusLabels: Record<ScaStatus, string> = {
  consider: 'A considerar', confirm: 'Confirmar dato', review: 'Precaución / individualizar',
  avoid: 'Evitar / no iniciar', 'not-routine': 'No de rutina',
};
export interface ScaOption {
  id: string; name: string; reference: string; scenario: string;
  reason: string; status: ScaStatus; avoid: string[]; cautions: string[]; pending: string[];
  contraindications: string; monitoring: string; sourceIds: string[];
  calculation?: string; link?: { href: string; label: string };
}
export function option(id: string, name: string, reference: string, scenario: string, sourceIds: string[]): ScaOption {
  return { id, name, reference, scenario, sourceIds, reason: scenario, status: 'consider', avoid: [], cautions: [], pending: [], contraindications: '', monitoring: '' };
}
export function completeOption(row: ScaOption, state: SessionState): ScaOption {
  if (state.condition !== 'sca') row.pending.push('Confirmar indicación por SCA');
  if (!adultPatient(state)) row.pending.push('Edad adulta válida');
  if (row.id !== 'oxygen') {
    if (state.sca.otherDrugAllergy === 'unknown') row.pending.push('Alergias al fármaco propuesto');
    if (state.sca.otherDrugAllergy === 'yes') row.cautions.push('Alergia medicamentosa declarada: identificar agente y reacción antes de elegir.');
  }
  if (state.age !== null && !adultPatient(state)) row.cautions.push('Referencia exclusiva para adultos; no aplicar a la edad ingresada.');
  row.status = row.avoid.length ? 'avoid' : row.cautions.length ? 'review' : row.status === 'not-routine' ? 'not-routine' : row.pending.length ? 'confirm' : row.status;
  if (row.avoid.length || row.cautions.length || row.status === 'not-routine' || state.condition !== 'sca' || !adultPatient(state)) delete row.calculation;
  return row;
}
export function scaDosingClCr(state: SessionState) {
  if (dosingBlockReason(state) || state.therapy.labsCurrent !== 'yes') return null;
  return getDosingClCr({ age: state.age!, sex: state.sex!, weight: state.weight!, creatinine: state.creatinine!, height: state.height });
}
export const scaNumber = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);
