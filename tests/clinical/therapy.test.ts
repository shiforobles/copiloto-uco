import { describe, expect, it } from 'vitest';
import { initialState, sessionReducer, type SessionState } from '../../src/context/session';
import { evaluateDapt, evaluateTreatment, therapyEgfr, treatmentIds } from '../../src/clinical/therapy';
import { buildFollowUp } from '../../src/clinical/follow-up';
import { clinicalSources } from '../../src/clinical/sources';

// Escenario sintético; no representa un paciente real ni valida clínicamente las reglas.
export const coronaryPatient: SessionState = {
  ...initialState, age: 62, sex: 'male', weight: 80, height: 175, creatinine: 1,
  renalStatus: 'stable', condition: 'sca', phase: 'pre_alta', systolicBP: 120, heartRate: 70, potassium: 4.3, lvef: 35,
  therapy: { ...initialState.therapy, acsType: 'stemi', strategy: 'pci', monthsSinceAcs: 0,
    activeBleeding: 'no', priorBleeding: 'no', priorStroke: 'no', priorIch: 'no', oralAnticoagulation: 'no',
    aspirinAllergy: 'no', p2y12Allergy: 'no', surgeryPlanned: 'no', bleedingRisk: 'not-high', liver: 'none',
    interactions: 'none', currentP2y12: 'none', labsCurrent: 'yes', hemoglobin: 14, platelets: 200,
    altMultiple: 1, muscleSymptoms: 'no', diabetes: 'no',
  },
};
const context = (patch: Partial<SessionState['therapy']>): SessionState => ({ ...coronaryPatient, therapy: { ...coronaryPatient.therapy, ...patch } });

describe('Antiagregación contextual', () => {
  it('no transforma datos desconocidos en negativos ni propone DAPT sin SCA', () => {
    expect(evaluateDapt(initialState).options).toEqual([]);
    expect(evaluateDapt({ ...coronaryPatient, condition: 'ic' }).options).toEqual([]);
    for (const key of ['priorIch', 'activeBleeding', 'oralAnticoagulation', 'interactions', 'currentP2y12', 'labsCurrent'] as const) {
      const result = evaluateDapt(context({ [key]: 'unknown' }));
      expect(result.status).toBe('missing'); expect(result.options).toEqual([]);
    }
  });
  it('ofrece alternativas separadas tras PCI y limita prasugrel por peso y edad', () => {
    const base = evaluateDapt(coronaryPatient);
    expect(base.status).toBe('consider'); expect(base.options).toHaveLength(2);
    expect(evaluateDapt({ ...coronaryPatient, weight: 59 }).options[1].text).toContain('prasugrel 5 mg');
    expect(evaluateDapt({ ...coronaryPatient, weight: 60 }).options[1].text).toContain('prasugrel 10 mg');
    expect(evaluateDapt({ ...coronaryPatient, age: 75 }).options.some(o => o.name.includes('prasugrel'))).toBe(false);
  });
  it('no indica prasugrel con ACV y no ofrece ticagrelor con HIC', () => {
    expect(evaluateDapt(context({ priorStroke: 'yes' })).options.some(o => o.name.includes('prasugrel'))).toBe(false);
    expect(evaluateDapt(context({ priorIch: 'yes' })).options).toEqual([]);
  });
  it.each([
    { activeBleeding: 'yes' }, { liver: 'severe' }, { aspirinAllergy: 'yes' }, { p2y12Allergy: 'yes' },
    { platelets: 99 }, { platelets: 0 }, { hemoglobin: 7.9 }, { pregnancy: 'yes' },
  ] as Partial<SessionState['therapy']>[])('antepone las contraindicaciones a una propuesta estándar (%j)', patch => {
    const result = evaluateDapt(context(patch)); expect(result.status).toBe('blocked'); expect(result.options).toEqual([]);
  });
  it('sangrado conocido se muestra aun con otros campos desconocidos', () => {
    const result = evaluateDapt({ ...coronaryPatient, therapy: { ...initialState.therapy, activeBleeding: 'yes' } });
    expect(result.status).toBe('blocked'); expect(result.summary).toContain('Sangrado activo');
  });
  it('con OAC propone discutir una estrategia sin triple terapia indefinida', () => {
    const result = evaluateDapt(context({ oralAnticoagulation: 'yes' }));
    expect(result.status).toBe('review'); expect(result.options[0].text).toContain('clopidogrel 75');
    expect(result.options[0].text).toContain('1 y 4 semanas');
    expect(result.options[0].text).not.toContain('ticagrelor 90');
  });
  it('usa el límite correcto de edad para carga con fibrinólisis y no carga en pre-alta', () => {
    const base = { ...context({ strategy: 'fibrinolysis' }), phase: 'compensado' as const };
    expect(evaluateDapt({ ...base, age: 75 }).checks.join(' ')).toContain('carga de clopidogrel 300 mg');
    expect(evaluateDapt({ ...base, age: 76 }).checks.join(' ')).toContain('se inicia sin carga');
    expect(evaluateDapt({ ...base, phase: 'pre_alta' }).checks.join(' ')).not.toContain('300 mg');
    expect(evaluateDapt(context({ strategy: 'fibrinolysis', acsType: 'nstemi' })).status).toBe('blocked');
  });
  it('no prolonga primer año, no copia dosis al shock ni usa TFGe en LRA o diálisis', () => {
    const scenarios: SessionState[] = [context({ monthsSinceAcs: 12 }), { ...coronaryPatient, phase: 'shock_inotropicos' },
      { ...coronaryPatient, renalStatus: 'unstable' }, { ...coronaryPatient, renalStatus: 'dialysis' }];
    for (const state of scenarios) expect(evaluateDapt(state).options).toEqual([]);
    for (const renalStatus of ['unstable', 'dialysis', 'unknown'] as const) expect(therapyEgfr({ ...coronaryPatient, renalStatus })).toBeNull();
  });
  it('detecta riesgo combinado aunque el operador haya marcado sin alto riesgo', () => {
    const result = evaluateDapt({ ...context({ hemoglobin: 12 }), age: 76 });
    expect(result.status).toBe('review'); expect(result.options).toEqual([]);
  });
  it('no calcula con unidades erróneas, valores no finitos o laboratorio desactualizado', () => {
    for (const patch of [{ platelets: 180000 }, { hemoglobin: Infinity }, { hemoglobin: -1 }, { monthsSinceAcs: NaN }, { labsCurrent: 'no' as const }]) expect(evaluateDapt(context(patch)).options).toEqual([]);
    expect(evaluateDapt({ ...coronaryPatient, age: 10 }).options).toEqual([]);
  });
  it('resuelve interacciones antes de ofrecer una combinación y advierte dosis previas', () => {
    for (const interactions of ['cyp3a', 'omeprazole', 'other'] as const) expect(evaluateDapt(context({ interactions })).options).toEqual([]);
    expect(evaluateDapt(context({ currentP2y12: 'ticagrelor' })).reasons.join(' ')).toContain('no repetir carga');
  });
});

describe('Referencia terapéutica y continuidad', () => {
  it('reemplaza casilleros por todas las referencias aplicables, sin ocultar tratamientos vistos', () => {
    expect(treatmentIds({ ...coronaryPatient, coveredPillars: ['doble-antiagregacion'] })).toContain('doble-antiagregacion');
    expect(treatmentIds(coronaryPatient)).not.toContain('anticoagulacion');
    expect(treatmentIds({ ...coronaryPatient, hasAF: true })).toContain('anticoagulacion');
  });
  it('estatina depende de situación hepática y datos previos', () => {
    expect(evaluateTreatment('estatina', coronaryPatient).options[0].text).toContain('Atorvastatina');
    expect(evaluateTreatment('estatina', context({ altMultiple: 3 })).status).toBe('blocked');
    expect(evaluateTreatment('estatina', context({ liver: 'unknown' })).options).toEqual([]);
    expect(evaluateTreatment('estatina', context({ muscleSymptoms: 'yes' })).missing.join(' ')).toContain('CK');
  });
  it('ARM respeta K de inicio y bloquea pautas crónicas en shock', () => {
    const ic = { ...coronaryPatient, condition: 'ic' as const };
    expect(evaluateTreatment('arm', { ...ic, potassium: 5 }).status).toBe('blocked');
    expect(evaluateTreatment('arm', { ...ic, potassium: 4.9 }).status).not.toBe('blocked');
    expect(evaluateTreatment('isglt2', { ...ic, phase: 'shock_inotropicos' }).status).toBe('blocked');
    expect(evaluateTreatment('arm', { ...ic, lvef: 60 }).summary).toContain('no extrapolar');
  });
  it('las derivaciones tienen motivo y distinguen urgencia de seguimiento', () => {
    expect(buildFollowUp(coronaryPatient).some(i => ['hematology', 'nephrology', 'hepatology', 'endocrinology'].includes(i.id))).toBe(false);
    const critical = { ...context({ activeBleeding: 'yes', platelets: 20, glycemicEvents: 'yes', diabetesTherapyChanged: 'yes', liver: 'abnormal' }), renalStatus: 'unstable' as const };
    const items = buildFollowUp(critical);
    expect(items.find(i => i.id === 'bleeding')?.timing).toBe('now');
    expect(items.find(i => i.id === 'hematology')?.timing).toBe('now');
    expect(items.find(i => i.id === 'nephrology-acute')?.timing).toBe('now');
    expect(items.find(i => i.id === 'endocrinology')?.action).toContain('1–2 semanas');
    for (const item of items) { expect(item.reason.length).toBeGreaterThan(10); for (const source of item.sourceIds) expect(clinicalSources[source]).toBeTruthy(); }
  });
  it('reiniciar limpia antecedentes y resultados; cambiar un campo preserva el resto', () => {
    const changed = sessionReducer(coronaryPatient, { type: 'SET_THERAPY_FIELD', field: 'hemoglobin', value: 9 });
    expect(changed.therapy.hemoglobin).toBe(9); expect(changed.therapy.strategy).toBe('pci');
    expect(sessionReducer(changed, { type: 'RESET_SESSION' })).toEqual(initialState);
  });
  it('todas las fichas y controles citan fuentes existentes', () => {
    for (const state of [coronaryPatient, { ...coronaryPatient, condition: 'ic' as const, hasAF: true }]) {
      for (const id of treatmentIds(state)) for (const source of evaluateTreatment(id, state).sourceIds) expect(clinicalSources[source]).toBeTruthy();
    }
  });
});
