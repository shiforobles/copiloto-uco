import type { Answer } from './therapy-context';

/** Solo datos nuevos de SCA. Edad, hemodinamia, función renal y DAPT siguen compartidos. */
export interface ScaContext {
  moment: 'unknown' | 'acute' | 'ward' | 'discharge' | 'followup';
  infarction: Answer;
  hfSigns: Answer;
  acuteHf: Answer;
  hit: Answer;
  heparinAllergy: Answer;
  avBlock: Answer;
  bronchospasm: Answer;
  angioedema: Answer;
  aceIntolerance: Answer;
  giRisk: Answer;
  otherDrugAllergy: Answer;
  nitrateIndication: Answer;
  pde5: Answer;
  rvInfarction: Answer;
  spo2: number | null;
  currentAnticoagulant: 'unknown' | 'none' | 'ufh' | 'enoxaparin' | 'fondaparinux' | 'oral' | 'other';
  lipidTherapy: 'unknown' | 'none' | 'not-maximal' | 'max-tolerated' | 'intolerant';
  currentRas: 'unknown' | 'none' | 'acei' | 'arb' | 'arni';
}

export const initialSca: ScaContext = {
  moment: 'unknown', infarction: 'unknown', hfSigns: 'unknown', acuteHf: 'unknown',
  hit: 'unknown', heparinAllergy: 'unknown', avBlock: 'unknown', bronchospasm: 'unknown',
  angioedema: 'unknown', aceIntolerance: 'unknown', giRisk: 'unknown', otherDrugAllergy: 'unknown', nitrateIndication: 'unknown', pde5: 'unknown',
  rvInfarction: 'unknown', spo2: null, currentAnticoagulant: 'unknown', lipidTherapy: 'unknown', currentRas: 'unknown',
};
