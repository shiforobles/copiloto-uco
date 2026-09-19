import type { SessionState } from '../context/session';
import { adultPatient, therapyEgfr } from './therapy';
import { validNumber } from './therapy-context';

export type DaptDrugId = 'aas' | 'ticagrelor' | 'prasugrel' | 'clopidogrel';
export type DaptRowStatus = 'usual' | 'alternative' | 'caution' | 'avoid' | 'confirm';
export const daptStatusLabels: Record<DaptRowStatus, string> = {
  usual: 'Preferida / habitual', alternative: 'Alternativa', caution: 'Precaución',
  avoid: 'Evitar / contraindicada', confirm: 'Confirmar dato',
};
export interface DaptReferenceRow {
  id: DaptDrugId;
  name: string;
  dose: string;
  doseNote: string;
  scenario: string;
  contraindications: string;
  contextualRole: 'usual' | 'alternative';
  reason: string;
  status: DaptRowStatus;
  avoid: string[];
  cautions: string[];
  pending: string[];
  current: boolean;
}
export interface DaptReference {
  contextual: boolean;
  heading: string;
  scenario: string;
  rows: DaptReferenceRow[];
  alerts: string[];
  commonPending: string[];
}

const references = [
  { id: 'aas', name: 'AAS', dose: '75–100 mg VO cada 24 h', doseNote: '', scenario: 'Base de DAPT en SCA.', contraindications: 'Sangrado activo o hipersensibilidad.' },
  { id: 'ticagrelor', name: 'Ticagrelor', dose: '90 mg VO cada 12 h', doseNote: 'Primer año del SCA; individualizar duración. Revisar disnea y bradiarritmia.', scenario: 'SCA con PCI o SCASEST con manejo médico.', contraindications: 'Sangrado activo, HIC previa, hepatopatía grave o inhibidores potentes CYP3A4.' },
  { id: 'prasugrel', name: 'Prasugrel', dose: '10 mg VO cada 24 h; 5 mg si <60 kg', doseNote: 'Referencia en <75 años. A partir de 75 años no es una elección habitual.', scenario: 'SCA tratado con PCI.', contraindications: 'ACV/AIT previo, sangrado activo o hepatopatía grave.' },
  { id: 'clopidogrel', name: 'Clopidogrel', dose: '75 mg VO cada 24 h', doseNote: '', scenario: 'Fibrinólisis; P2Y12 preferido con anticoagulación oral.', contraindications: 'Sangrado activo o hepatopatía grave. Evitar asociación con omeprazol/esomeprazol.' },
] satisfies Pick<DaptReferenceRow, 'id' | 'name' | 'dose' | 'doseNote' | 'scenario' | 'contraindications'>[];

/**
 * Modelo de presentación de las referencias y precauciones ya existentes.
 * No prescribe una combinación ni cambia evaluateDapt: las cuatro referencias
 * sobreviven a datos incompletos, alertas y contraindicaciones. El orden depende
 * del escenario; confirmar un dato no equivale a haberlo descartado.
 */
export function buildDaptReference(state: SessionState): DaptReference {
  const t = state.therapy;
  const egfr = therapyEgfr(state);
  const contextual = state.condition === 'sca' && t.acsType !== 'unknown' && t.strategy !== 'unknown';
  const strategies = { unknown: 'estrategia pendiente', pci: 'PCI', medical: 'tratamiento médico', fibrinolysis: 'fibrinólisis', cabg: 'cirugía coronaria' };
  const scenario = `${t.acsType === 'stemi' ? 'SCACEST' : t.acsType === 'nstemi' ? 'SCASEST' : 'Tipo de SCA pendiente'} · ${strategies[t.strategy]}`;
  const commonPending: string[] = [];
  const alerts: string[] = [];
  const sharedCautions: string[] = [];
  const caution = (text: string, short = text) => { alerts.push(text); sharedCautions.push(short); };
  const unknown = (condition: boolean, text: string) => { if (condition) commonPending.push(text); };

  unknown(state.condition !== 'sca', 'Indicación por SCA');
  unknown(t.acsType === 'unknown', 'Tipo de SCA');
  unknown(t.strategy === 'unknown', 'Estrategia');
  unknown(!adultPatient(state), 'Edad adulta válida');
  unknown(t.activeBleeding === 'unknown', 'Sangrado activo');
  unknown(t.oralAnticoagulation === 'unknown', 'Indicación de anticoagulación oral');
  unknown(t.currentP2y12 === 'unknown', 'P2Y12 actual y dosis previas');
  unknown(t.priorBleeding === 'unknown', 'Sangrado relevante previo');
  unknown(t.surgeryPlanned === 'unknown', 'Cirugía próxima');
  unknown(t.bleedingRisk === 'unknown', 'Valoración hemorrágica');
  unknown(!validNumber(t.monthsSinceAcs, 0, 240), 'Tiempo desde el SCA para definir duración');
  unknown(t.labsCurrent !== 'yes', 'Vigencia del laboratorio');
  unknown(!validNumber(t.hemoglobin, 0, 25), 'Hemoglobina en g/dL');
  unknown(!validNumber(t.platelets, 0, 2000), 'Plaquetas en ×10⁹/L (180 = 180.000/mm³)');
  unknown(state.renalStatus === 'unknown' || (state.renalStatus === 'stable' && egfr === null), 'Función renal evaluable para el riesgo');
  unknown(state.sex !== 'male' && t.pregnancy === 'unknown', 'Embarazo/lactancia, cuando corresponda');

  if (t.activeBleeding === 'yes') alerts.push('Sangrado activo: resolver en la internación antes de iniciar o intensificar antiagregación. Las dosis permanecen como referencia, no como propuesta de administración.');
  if (t.aspirinAllergy === 'yes') alerts.push('Alergia a AAS: requiere una estrategia específica; no proponer la combinación estándar.');
  if (state.age !== null && !adultPatient(state)) caution('La edad cargada no corresponde a una edad adulta válida: se mantiene solo la referencia para adultos.', 'Referencia adulta; revisar edad.');
  if (state.condition !== 'sca') caution('Confirmar indicación: estar en UCO no implica indicar DAPT. Esta ficha no evalúa PCI electiva ni otras indicaciones.', 'Indicación por SCA sin confirmar.');
  if (t.strategy === 'fibrinolysis' && t.acsType === 'nstemi') caution('Contexto discordante: fibrinólisis con SCA sin elevación del ST. Revisá diagnóstico y estrategia.', 'Revisar discordancia SCASEST/fibrinólisis.');
  if (state.phase === 'shock_inotropicos') caution('Shock: individualizar con hemodinamia; la absorción oral y la estrategia invasiva pueden modificar la elección.', 'Shock: individualizar.');
  if (state.renalStatus === 'dialysis' || state.renalStatus === 'unstable') caution('Diálisis o lesión renal aguda: balance hemorrágico/isquémico individual. No usar una TFGe estable para seleccionar automáticamente.', 'LRA/diálisis: individualizar.');
  if (t.surgeryPlanned === 'yes' || t.strategy === 'cabg') caution('Cirugía coronaria o procedimiento próximo: coordinar interrupción/reinicio según hemostasia.', 'Plan perioperatorio por definir.');
  if (validNumber(t.monthsSinceAcs, 12, 240)) caution('A 12 meses o más del SCA, reevaluar la continuidad; no prolongar automáticamente el esquema del primer año.', 'Reevaluar duración: SCA ≥12 meses.');
  if (t.liver === 'abnormal') caution('Precisar la alteración hepática y su repercusión antes de concretar un esquema.', 'Hepatopatía en estudio.');
  if (t.interactions === 'other') caution('Resolver la interacción identificada antes de concretar una combinación.', 'Interacción por resolver.');
  if (t.pregnancy === 'yes') caution('Embarazo/lactancia: requiere valoración especializada.', 'Requiere valoración especializada.');
  if (state.hasAF) alerts.push('FA presente: DAPT no sustituye la prevención cardioembólica. Revisar por separado la indicación de anticoagulación.');

  const lowHb = t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 0, 25) && t.hemoglobin < 11;
  const borderlineHb = t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 11, 25) && t.hemoglobin < (state.sex === 'female' ? 12 : 13);
  const lowPlt = t.labsCurrent === 'yes' && validNumber(t.platelets, 0, 2000) && t.platelets < 100;
  const combinedSignals = [adultPatient(state) && state.age! >= 75, egfr !== null && egfr >= 30 && egfr < 60, borderlineHb].filter(Boolean).length >= 2;
  if (lowHb && t.hemoglobin! < 8) caution(`Hb ${t.hemoglobin} g/dL: evaluar anemia marcada y estabilidad ahora; no define transfusión ni suspensión automática.`, 'Anemia marcada.');
  if (lowPlt) caution(`Plaquetas ${t.platelets} ×10⁹/L: no concretar un esquema estándar; discutir con Hematología y Cardiología.`, 'Trombocitopenia <100 ×10⁹/L.');
  if (t.bleedingRisk === 'high' || lowHb || t.priorBleeding === 'yes' || t.priorIch === 'yes' || (egfr !== null && egfr < 30) || combinedSignals) caution('Riesgo hemorrágico relevante: individualizar P2Y12 y duración; no asumir DAPT potente por 12 meses.', 'Riesgo hemorrágico relevante.');
  else if (egfr !== null && egfr < 60) alerts.push(`TFGe ${egfr.toFixed(1)} mL/min/1,73 m²: factor de riesgo; no reducir genéricamente todos los antiagregantes.`);
  if (t.oralAnticoagulation === 'yes') alerts.push('Anticoagulación oral: evitar triple terapia prolongada. Tras PCI, definir retirada de AAS habitualmente entre 1 y 4 semanas según riesgo y fecha del procedimiento; no es una orden automática de suspensión.');
  if (t.currentP2y12 !== 'unknown' && t.currentP2y12 !== 'none') alerts.push(`Ya recibe ${t.currentP2y12}: no repetir carga ni cambiar automáticamente. Revisar última dosis y plan de transición.`);

  const rows: DaptReferenceRow[] = references.map(reference => {
    const row: DaptReferenceRow = { ...reference, contextualRole: 'alternative', reason: reference.scenario,
      status: 'confirm', avoid: [], cautions: [...sharedCautions], pending: [], current: t.currentP2y12 === reference.id };
    if (contextual) {
      if (row.id === 'aas') {
        row.contextualRole = 'usual'; row.reason = 'Base habitual de DAPT; se combina con un solo P2Y12.';
      } else if (t.oralAnticoagulation === 'yes' || (t.strategy === 'fibrinolysis' && t.acsType === 'stemi')) {
        if (row.id === 'clopidogrel') { row.contextualRole = 'usual'; row.reason = t.oralAnticoagulation === 'yes' ? 'P2Y12 habitual cuando se requiere anticoagulación oral.' : 'P2Y12 de referencia con fibrinólisis.'; }
        else { row.reason = 'La referencia para este contexto es clopidogrel; no intercambiar esquemas automáticamente.'; row.cautions.push('No es la opción habitual en este escenario.'); }
      } else if (t.strategy === 'pci' || (t.strategy === 'medical' && t.acsType === 'nstemi')) {
        if (row.id === 'ticagrelor') { row.contextualRole = 'usual'; row.reason = 'Opción habitual en este escenario, sujeta a las precauciones y datos pendientes.'; }
        if (row.id === 'prasugrel') row.reason = t.strategy === 'pci' ? 'Alternativa en PCI si edad, peso y antecedentes lo permiten.' : 'Su escenario de referencia es SCA tratado con PCI.';
        if (row.id === 'prasugrel' && t.strategy !== 'pci') row.cautions.push('Referencia para PCI; no extrapolar a manejo médico.');
        if (row.id === 'clopidogrel') row.reason = 'Alternativa si agentes potentes no son adecuados o no están disponibles.';
      } else {
        row.reason = 'Definir el P2Y12 con el equipo según estrategia; no extrapolar automáticamente el esquema pos-PCI.';
        row.cautions.push('Elección individualizada en este escenario.');
      }
    }
    if (t.activeBleeding === 'yes') row.avoid.push('Sangrado activo.');
    if (row.id === 'aas') {
      if (t.aspirinAllergy === 'yes') row.avoid.push('Alergia a AAS.');
      if (t.aspirinAllergy === 'unknown') row.pending.push('Alergia a AAS');
      if (t.liver === 'severe') row.cautions.push('Hepatopatía grave: revisar hemostasia.');
      if (t.oralAnticoagulation === 'yes') row.cautions.push('Definir duración del AAS; evitar triple terapia prolongada.');
    } else {
      if (t.p2y12Allergy === 'yes') row.cautions.push('Alergia a algún P2Y12: identificar agente y reacción antes de elegir.');
      if (t.p2y12Allergy === 'unknown') row.pending.push('Alergia a P2Y12');
      if (t.liver === 'severe') row.avoid.push('Insuficiencia hepática grave.');
      if (t.liver === 'unknown') row.pending.push('Situación hepática');
      if (t.interactions === 'unknown') row.pending.push('Interacciones');
    }
    if (row.id === 'ticagrelor') {
      if (t.priorIch === 'yes') row.avoid.push('Hemorragia intracraneal previa.');
      if (t.priorIch === 'unknown') row.pending.push('Hemorragia intracraneal previa');
      if (t.interactions === 'cyp3a') row.avoid.push('Interacción potente CYP3A: resolver antes de considerar.');
    }
    if (row.id === 'prasugrel') {
      if (t.priorStroke === 'yes' || t.priorIch === 'yes') row.avoid.push('ACV/AIT o hemorragia intracraneal previa.');
      if (t.priorStroke === 'unknown') row.pending.push('ACV/AIT previo');
      if (t.priorIch === 'unknown') row.pending.push('Hemorragia intracraneal previa');
      if (!adultPatient(state)) row.pending.push('Edad');
      if (!validNumber(state.weight, 1, 500)) row.pending.push('Peso');
      if (adultPatient(state) && state.age! >= 75) row.cautions.push('Edad ≥75 años: generalmente no recomendado; individualizar beneficio/riesgo.');
      if (adultPatient(state) && state.age! < 75 && validNumber(state.weight, 1, 500)) {
        row.dose = `${state.weight < 60 ? '5' : '10'} mg VO cada 24 h`;
        row.doseNote = `Referencia de mantenimiento para ${state.weight} kg y ${state.age} años, si se elige y se descartan contraindicaciones.`;
      }
    }
    if (row.id === 'clopidogrel' && t.interactions === 'omeprazole') row.avoid.push('Evitar asociación con omeprazol/esomeprazol; revisar gastroprotección.');
    row.status = row.avoid.length ? 'avoid' : row.cautions.length ? 'caution' : row.pending.length || commonPending.length ? 'confirm' : row.contextualRole === 'usual' ? 'usual' : 'alternative';
    return row;
  });
  // AAS es la base de la combinación, no un cuarto P2Y12. Ordenar los P2Y12 por
  // escenario y luego por alertas; nunca eliminar una fila.
  const rank = (row: DaptReferenceRow) => row.id === 'aas' ? -1 : (row.avoid.length ? 40 : row.cautions.length ? 20 : 0) + (row.contextualRole === 'usual' ? 0 : 1);
  rows.sort((a, b) => rank(a) - rank(b));
  return { contextual, heading: contextual ? 'Orientación contextual — confirmar antes de indicar' : 'Referencia general — faltan datos para personalizar', scenario, rows, alerts, commonPending };
}
