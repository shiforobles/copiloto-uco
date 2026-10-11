import { describe, expect, it } from 'vitest';
import { initialState, sessionReducer, type SessionState } from '../../src/context/session';
import { initialSca } from '../../src/clinical/sca-context';
import { buildScaIntegral } from '../../src/clinical/sca-integral';
import { buildScaAnticoagulation } from '../../src/clinical/sca-anticoagulation';
import { buildDaptReference } from '../../src/clinical/dapt-reference';
import { scaDosingClCr } from '../../src/clinical/sca-common';
import { scaSources } from '../../src/clinical/sca-sources';
import { getDosingClCr } from '../../src/engine/renal';

// Casos sintéticos: verifican ramas de software, no validan práctica clínica.
function patient(fields: Partial<SessionState> = {}, therapy: Partial<SessionState['therapy']> = {}, sca: Partial<SessionState['sca']> = {}): SessionState {
  return { ...initialState, age: 68, weight: 72, sex: 'male', condition: 'sca', phase: 'compensado', renalStatus: 'stable', creatinine: 1,
    systolicBP: 120, heartRate: 70, potassium: 4, lvef: 35, ...fields,
    therapy: { ...initialState.therapy, acsType: 'nstemi', strategy: 'medical', activeBleeding: 'no', oralAnticoagulation: 'no', labsCurrent: 'yes', hemoglobin: 14, platelets: 200, liver: 'none', interactions: 'none', muscleSymptoms: 'no', altMultiple: 1, diabetes: 'no', ...therapy },
    sca: { ...initialSca, moment: 'ward', currentAnticoagulant: 'none', hit: 'no', heparinAllergy: 'no', otherDrugAllergy: 'no', ...sca },
  };
}
const row = (state: SessionState, id: string) => {
  const plan = buildScaIntegral(state);
  return [...plan.anticoagulation, ...plan.groups.flatMap(g => g.rows)].find(r => r.id === id)!;
};
const renalPatient = (clearance: number, therapy: Partial<SessionState['therapy']> = {}) => patient({ creatinine: 72 / clearance }, therapy);

describe('SCA integral · referencias y continuidad', () => {
  it('con sesión vacía mantiene todos los grupos y controles generales, sin asumir negativos', () => {
    const result = buildScaIntegral(initialState);
    expect(result.anticoagulation).toHaveLength(4);
    expect(result.groups.map(g => g.id)).toEqual(['symptoms', 'lipids', 'beta', 'ras', 'arm', 'gastro']);
    for (const r of [...result.anticoagulation, ...result.groups.flatMap(g => g.rows)]) {
      expect(r.reference.length).toBeGreaterThan(10); expect(r.status).toBe('confirm'); expect(r.pending).toContain('Edad adulta válida');
      expect(r.calculation).toBeUndefined();
    }
    expect(result.followUp.map(i => i.id)).toEqual(expect.arrayContaining(['cardiology', 'lipids', 'sca-renal-check']));
    expect(result.validation).toBe('pending-local-review');
    expect(result.alerts.join(' ')).toContain('Confirmar SCA');
  });

  it('con solo SCA muestra el plan y reutiliza exactamente la referencia DAPT aprobada', () => {
    const state = { ...initialState, condition: 'sca' as const };
    const result = buildScaIntegral(state);
    expect(result.dapt).toEqual(buildDaptReference(state));
    expect(result.dapt.rows).toHaveLength(4);
    expect(result.anticoagulation).toHaveLength(4);
    expect(result.groups.every(g => g.rows.every(r => r.reference.length > 0))).toBe(true);
  });

  it.each(['acute', 'ward', 'discharge', 'followup'] as const)('el momento %s nunca oculta grupos', moment => {
    const result = buildScaIntegral(patient({}, {}, { moment }));
    expect(result.groups).toHaveLength(6); expect(result.anticoagulation).toHaveLength(4); expect(result.dapt.rows).toHaveLength(4);
    if (moment === 'discharge' || moment === 'followup') for (const r of result.anticoagulation) { expect(r.status).toBe('not-routine'); expect(r.calculation).toBeUndefined(); }
  });

  it('desconocido no equivale a ausencia de bloqueo ni de angioedema', () => {
    const unknown = patient();
    expect(row(unknown, 'carvedilol').pending).toContain('Bloqueo AV / ECG');
    expect(row(unknown, 'ramipril').pending).toContain('Antecedente de angioedema');
    const positive = patient({}, {}, { avBlock: 'yes', angioedema: 'yes' });
    expect(row(positive, 'carvedilol').status).toBe('avoid');
    expect(row(positive, 'ramipril').status).toBe('avoid');
    expect(row(positive, 'valsartan').status).toBe('review');
    const negative = patient({}, {}, { avBlock: 'no', angioedema: 'no' });
    expect(row(negative, 'carvedilol').pending).not.toContain('Bloqueo AV / ECG');
    expect(row(negative, 'ramipril').pending).not.toContain('Antecedente de angioedema');
  });

  it.each([{ phase: 'shock_inotropicos' as const }, { systolicBP: 89 }, { heartRate: 54 }])('respeta límites hemodinámicos (%j) aun con datos incompletos', fields => {
    const state = { ...initialState, condition: 'sca' as const, ...fields };
    expect(row(state, 'carvedilol').status).toBe('avoid');
    expect(row(state, 'metoprolol').status).toBe('avoid');
    if (fields.heartRate === undefined) { expect(row(state, 'ramipril').status).toBe('avoid'); expect(row(state, 'eplerenone').status).toBe('avoid'); }
  });

  it('ALT alta bloquea estatinas sin esperar edad ni fase; no bloquea todas las clases', () => {
    const state = { ...initialState, condition: 'sca' as const, therapy: { ...initialState.therapy, labsCurrent: 'yes' as const, altMultiple: 3 } };
    expect(row(state, 'atorvastatin').status).toBe('avoid');
    expect(row(state, 'rosuvastatin').status).toBe('avoid');
    expect(row(state, 'pantoprazole').status).toBe('confirm');
  });

  it('rosuvastatina respeta ClCr <30 y advertencia de 40 mg bajo 60; atorvastatina no hereda ese bloqueo', () => {
    const severe = renalPatient(29.9);
    expect(row(severe, 'rosuvastatin').status).toBe('avoid');
    expect(row(severe, 'atorvastatin').status).not.toBe('avoid');
    expect(row(renalPatient(59.9), 'rosuvastatin').cautions.join(' ')).toContain('40 mg contraindicado');
    expect(row(renalPatient(60), 'rosuvastatin').cautions.join(' ')).not.toContain('40 mg contraindicado');
  });

  it('ezetimiba diferencia LDL con tratamiento desconocido de máxima estatina tolerada', () => {
    expect(row(patient({}, { ldl: 90 }), 'ezetimibe').reason).toContain('no añadir solo');
    expect(row(patient({}, { ldl: 90 }, { lipidTherapy: 'max-tolerated' }), 'ezetimibe').reason).toContain('considerar añadir');
    expect(row(patient({}, { ldl: 90, labsCurrent: 'no' }, { lipidTherapy: 'max-tolerated' }), 'ezetimibe').reason).toContain('no añadir solo');
  });

  it('ARM requiere IAM, FEVI reducida e IC o diabetes; no asume que todo SCA es infarto', () => {
    expect(row(patient(), 'eplerenone').pending).toContain('IAM confirmado (SCASEST no equivale siempre a infarto)');
    expect(row(patient({}, {}, { infarction: 'no' }), 'eplerenone').status).toBe('not-routine');
    expect(row(patient({ lvef: 41 }, {}, { infarction: 'yes', hfSigns: 'yes' }), 'eplerenone').status).toBe('not-routine');
    expect(row(patient({}, {}, { infarction: 'yes', hfSigns: 'no' }), 'eplerenone').status).toBe('not-routine');
    expect(row(patient({}, { diabetes: 'type2' }, { infarction: 'yes', hfSigns: 'no' }), 'eplerenone').status).toBe('consider');
    expect(row(patient({}, { diabetes: 'unknown' }, { infarction: 'yes', hfSigns: 'no' }), 'eplerenone').pending).toContain('Diabetes para establecer indicación');
    expect(row(patient({ systolicBP: null }, {}, { infarction: 'yes', hfSigns: 'yes' }), 'eplerenone').pending).toContain('TAS');
  });

  it.each([[4.99, false], [5, true]])('ARM discrimina K=%s', (potassium, blocked) => {
    expect(row(patient({ potassium }, {}, { infarction: 'yes', hfSigns: 'yes' }), 'eplerenone').status === 'avoid').toBe(blocked);
  });

  it('ARM conserva la referencia renal reducida, pero bloquea insuficiencia avanzada', () => {
    expect(row(renalPatient(40), 'eplerenone').reference).toContain('días alternos');
    expect(row(renalPatient(20), 'eplerenone').status).toBe('avoid');
    expect(row(patient({}, { interactions: 'cyp3a' }), 'eplerenone').status).toBe('avoid');
  });

  it('nitratos y oxígeno responden a indicación, saturación y contraindicaciones propias', () => {
    expect(row(patient({}, {}, { spo2: 89 }), 'oxygen').reason).toContain('hipoxemia');
    expect(row(patient({}, {}, { spo2: 90 }), 'oxygen').status).toBe('not-routine');
    expect(row(patient({}, {}, { spo2: NaN }), 'oxygen').pending).toContain('SpO₂ válida');
    expect(row(patient({}, {}, { pde5: 'yes' }), 'nitroglycerin').status).toBe('avoid');
    expect(row(patient({}, {}, { nitrateIndication: 'no' }), 'nitroglycerin').status).toBe('not-routine');
  });

  it('gastroprotección distingue riesgo desconocido, positivo y negativo sin PPI universal', () => {
    expect(row(patient(), 'pantoprazole').pending).toContain('Úlcera/sangrado digestivo previo y riesgo gastrointestinal');
    expect(row(patient({}, {}, { giRisk: 'no' }), 'pantoprazole').status).toBe('not-routine');
    expect(row(patient({}, {}, { giRisk: 'yes' }), 'pantoprazole').status).toBe('consider');
    expect(row(patient({}, { currentP2y12: 'clopidogrel', interactions: 'omeprazole' }, { giRisk: 'yes' }), 'pantoprazole').monitoring).toContain('evitar omeprazol/esomeprazol');
  });

  it('reutiliza interconsultas por hallazgos, diferenciando internación y consultorio', () => {
    const state = patient({ renalStatus: 'unstable' }, { activeBleeding: 'yes', platelets: 20, liver: 'abnormal', diabetes: 'new', diabetesTherapyChanged: 'yes' });
    const items = buildScaIntegral(state).followUp;
    expect(items.find(i => i.id === 'bleeding')?.timing).toBe('now');
    expect(items.find(i => i.id === 'hematology')?.timing).toBe('now');
    expect(items.find(i => i.id === 'nephrology-acute')?.timing).toBe('now');
    expect(items.find(i => i.id === 'hepatology')?.timing).toBe('before-discharge');
    expect(items.find(i => i.id === 'endocrinology')?.action).toContain('1–2 semanas');
    expect(items.filter(i => i.id === 'cardiology')).toHaveLength(1);
  });

  it('todas las referencias y controles tienen fuentes trazables y mantienen validación pendiente', () => {
    const result = buildScaIntegral(patient());
    const sources = [...result.groups.flatMap(g => g.rows), ...result.anticoagulation, ...result.followUp].flatMap(i => i.sourceIds);
    expect(sources.length).toBeGreaterThan(15);
    for (const id of sources) expect(scaSources[id]?.url).toMatch(/^https:\/\//);
    expect(result.reviewedAt).toBe('2026-09-27'); expect(result.validation).toBe('pending-local-review');
  });

  it('actualiza y reinicia el nuevo contexto sin cambiar datos DAPT', () => {
    const original = patient();
    const changed = sessionReducer(original, { type: 'SET_SCA_FIELD', field: 'hit', value: 'yes' });
    expect(changed.sca.hit).toBe('yes'); expect(changed.therapy).toEqual(original.therapy);
    expect(original.sca.hit).toBe('no');
    expect(sessionReducer(changed, { type: 'RESET_SESSION' })).toEqual(initialState);
  });
});

describe('SCA · anticoagulación por escenario y límites', () => {
  it('HNF aplica topes de inicio, separados de PCI', () => {
    const state = patient({ weight: 100 });
    expect(row(state, 'ufh').calculation).toContain('4.000 U IV');
    expect(row(state, 'ufh').calculation).toContain('1.000 U/h');
    const pci = row(patient({ weight: 100 }, { strategy: 'pci' }), 'ufh');
    expect(pci.calculation).toBeUndefined(); expect(pci.reference).toContain('70–100 U/kg');
  });

  it.each([[30, '12'], [29.9, '24']])('enoxaparina SCASEST discrimina ClCr=%s sin usar TFGe', (clearance, interval) => {
    expect(row(renalPatient(clearance), 'enoxaparin').calculation).toBe(`Con 72 kg: 72 mg SC cada ${interval} h.`);
  });

  it.each([[74, 'Bolo inicial 30 mg IV', '120', '100'], [75, 'Sin bolo IV', '90', '75']])('enoxaparina fibrinólisis edad %s con límite de primeras dos SC', (age, bolus, dose, cap) => {
    const r = row(patient({ age: Number(age), weight: 120 }, { acsType: 'stemi', strategy: 'fibrinolysis' }), 'enoxaparin');
    expect(r.calculation).toContain(bolus); expect(r.calculation).toContain(`${dose} mg SC cada 12 h`);
    expect(r.calculation).toContain(`las dos primeras SC: ${cap} mg cada una`);
  });

  it('enoxaparina ≥75 con ClCr <30 cambia a 1 mg/kg cada 24 h, sin bolo', () => {
    const r = row(patient({ age: 75, weight: 72, creatinine: 3 }, { acsType: 'stemi', strategy: 'fibrinolysis' }), 'enoxaparin');
    expect(r.calculation).toContain('Sin bolo IV; 72 mg SC cada 24 h');
    expect(r.calculation).not.toContain('54 mg');
  });

  it.each(['unknown', 'unstable', 'dialysis'] as const)('no calcula ajuste individual con función renal %s', renalStatus => {
    const state = patient({ renalStatus }); expect(scaDosingClCr(state)).toBeNull();
    for (const id of ['enoxaparin', 'bivalirudin']) expect(row(state, id).calculation).toBeUndefined();
    expect(buildScaAnticoagulation(state)).toHaveLength(4);
  });

  it('laboratorio desactualizado o entradas inválidas nunca habilitan el cálculo renal', () => {
    const cases = [patient({}, { labsCurrent: 'no' }), patient({ age: 17 }), patient({ weight: -1 }), patient({ creatinine: 0 }), patient({ creatinine: NaN }), patient({ height: 10 })];
    for (const state of cases) { expect(scaDosingClCr(state)).toBeNull(); expect(row(state, 'enoxaparin').calculation).toBeUndefined(); }
  });

  it('reutiliza el motor de ClCr, pero enoxaparina se expresa por peso real, no ajustado', () => {
    const state = patient({ weight: 120, height: 160 });
    const renal = scaDosingClCr(state)!;
    expect(renal).toEqual(getDosingClCr({ age: 68, weight: 120, height: 160, sex: 'male', creatinine: 1 }));
    expect(renal.isAdjustedWeightUsed).toBe(true);
    expect(row(state, 'enoxaparin').calculation).toContain('120 mg SC');
  });

  it('sangrado activo evita todos los parenterales, manteniendo las referencias', () => {
    const result = buildScaAnticoagulation(patient({}, { activeBleeding: 'yes' }));
    expect(result).toHaveLength(4);
    for (const r of result) { expect(r.status).toBe('avoid'); expect(r.reference).toBeTruthy(); expect(r.calculation).toBeUndefined(); }
  });

  it('HIT afecta heparinas pero no se transforma en contraindicación universal de todas las alternativas', () => {
    const state = patient({}, { strategy: 'pci' }, { hit: 'yes' });
    expect(row(state, 'ufh').status).toBe('avoid'); expect(row(state, 'enoxaparin').status).toBe('avoid');
    expect(row(state, 'bivalirudin').status).not.toBe('avoid');
    expect(row(state, 'bivalirudin').scenario).toContain('HIT');
  });

  it('ACO o exposición previa impiden un nuevo cálculo de carga', () => {
    for (const state of [patient({}, { oralAnticoagulation: 'yes' }), patient({}, {}, { currentAnticoagulant: 'enoxaparin' }), patient({}, {}, { currentAnticoagulant: 'unknown' })]) {
      for (const r of buildScaAnticoagulation(state)) expect(r.calculation).toBeUndefined();
      expect(buildScaAnticoagulation(state)).toHaveLength(4);
    }
  });

  it('fondaparinux respeta corte AEMPS 20, cautela 20–29 y nunca es único agente de PCI', () => {
    expect(row(renalPatient(19.9), 'fondaparinux').status).toBe('avoid');
    expect(row(renalPatient(20), 'fondaparinux').status).toBe('review');
    expect(row(renalPatient(30), 'fondaparinux').status).toBe('consider');
    expect(row(patient({}, { strategy: 'pci' }), 'fondaparinux').avoid.join(' ')).toContain('único anticoagulante');
  });

  it('bivalirudina modifica la infusión con ClCr <30, conservando el bolo', () => {
    const normal = row(renalPatient(30, { strategy: 'pci' }), 'bivalirudin');
    const reduced = row(renalPatient(29.9, { strategy: 'pci' }), 'bivalirudin');
    expect(normal.calculation).toContain('bolo 54 mg'); expect(normal.calculation).toContain('126 mg/h');
    expect(reduced.calculation).toContain('bolo 54 mg'); expect(reduced.calculation).toContain('72 mg/h');
  });

  it('SCASEST con fibrinólisis no obtiene dosis calculadas de SCACEST', () => {
    const result = buildScaAnticoagulation(patient({}, { strategy: 'fibrinolysis' }));
    for (const r of result) { expect(r.calculation).toBeUndefined(); expect(r.cautions.join(' ')).toContain('discordante'); }
  });
});
