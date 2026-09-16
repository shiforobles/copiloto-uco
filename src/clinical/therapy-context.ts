export type Answer = 'unknown' | 'yes' | 'no';

/** Datos declarados por el médico; desconocido nunca equivale a un negativo. */
export interface TherapyContext {
  acsType: 'unknown' | 'stemi' | 'nstemi';
  strategy: 'unknown' | 'pci' | 'medical' | 'fibrinolysis' | 'cabg';
  monthsSinceAcs: number | null;
  currentP2y12: 'unknown' | 'none' | 'clopidogrel' | 'ticagrelor' | 'prasugrel';
  activeBleeding: Answer;
  priorBleeding: Answer;
  priorStroke: Answer;
  priorIch: Answer;
  oralAnticoagulation: Answer;
  aspirinAllergy: Answer;
  p2y12Allergy: Answer;
  surgeryPlanned: Answer;
  bleedingRisk: 'unknown' | 'not-high' | 'high';
  liver: 'unknown' | 'none' | 'abnormal' | 'severe';
  interactions: 'unknown' | 'none' | 'cyp3a' | 'omeprazole' | 'other';
  labsCurrent: Answer;
  hemoglobin: number | null;
  platelets: number | null;
  altMultiple: number | null;
  ldl: number | null;
  hba1c: number | null;
  diabetes: 'unknown' | 'no' | 'type1' | 'type2' | 'new';
  glycemicEvents: Answer;
  diabetesTherapyChanged: Answer;
  muscleSymptoms: Answer;
  pregnancy: Answer;
}

export const initialTherapy: TherapyContext = {
  acsType: 'unknown', strategy: 'unknown', monthsSinceAcs: null, currentP2y12: 'unknown',
  activeBleeding: 'unknown', priorBleeding: 'unknown', priorStroke: 'unknown', priorIch: 'unknown',
  oralAnticoagulation: 'unknown', aspirinAllergy: 'unknown', p2y12Allergy: 'unknown', surgeryPlanned: 'unknown',
  bleedingRisk: 'unknown', liver: 'unknown', interactions: 'unknown', labsCurrent: 'unknown',
  hemoglobin: null, platelets: null, altMultiple: null, ldl: null, hba1c: null,
  diabetes: 'unknown', glycemicEvents: 'unknown', diabetesTherapyChanged: 'unknown',
  muscleSymptoms: 'unknown', pregnancy: 'unknown',
};

export function validNumber(value: number | null, min: number, max: number): value is number {
  return value !== null && Number.isFinite(value) && value >= min && value <= max;
}
