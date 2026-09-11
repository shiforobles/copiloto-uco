import { describe, expect, it } from 'vitest';
import { afTherapyGroups } from '../../src/data/af-therapy-matrix';
import { evaluateAFTherapyOption } from '../../src/rules/af-therapy.engine';
import { emptySession } from '../helpers/session';

const session = (overrides: Parameters<typeof emptySession>[0] = {}) =>
  emptySession({ hasAF: true, ...overrides });

function option(id: string) {
  const found = afTherapyGroups.flatMap((group) => group.options).find((item) => item.id === id);
  if (!found) throw new Error(`Opción FA inexistente: ${id}`);
  return found;
}

describe('Matriz terapéutica de Fibrilación Auricular (FA)', () => {
  it('mantiene apixabán visible y reporta datos faltantes con sesión vacía', () => {
    const res = evaluateAFTherapyOption(option('apixaban-af'), session());
    expect(res.option.name).toBe('Apixabán');
    expect(res.missingData).toContain('función renal');
    expect(res.missingData).toContain('peso');
  });

  it('ajusta apixabán a 2.5 mg c/12 h cuando cumple ≥2 criterios de reducción (edad ≥80, peso ≤60, Cr ≥1.5)', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ age: 82, weight: 55, creatinine: 1.0, sex: 'female' }),
    );
    expect(res.patientDose).toContain('2,5 mg c/12 h');
    expect(res.patientDose).toContain('≥2 criterios de reducción');
  });

  it('mantiene apixabán en dosis estándar 5 mg c/12 h si sólo cumple 1 criterio de reducción', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ age: 82, weight: 75, creatinine: 1.0, sex: 'male' }),
    );
    expect(res.patientDose).toContain('5 mg c/12 h');
    expect(res.patientDose).toContain('dosis estándar');
  });

  it('advierte sobre apixabán cuando ClCr <15 mL/min', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ age: 85, weight: 45, creatinine: 3.5, sex: 'female' }),
    );
    expect(res.warnings.some((w) => /ClCr <15/i.test(w))).toBe(true);
  });

  it('ajusta rivaroxabán a 15 mg/día con la cena si ClCr está entre 15 y 49 mL/min', () => {
    const res = evaluateAFTherapyOption(
      option('rivaroxaban-af'),
      session({ age: 75, weight: 70, creatinine: 1.8, sex: 'male' }),
    );
    expect(res.patientDose).toContain('15 mg/día');
    expect(res.patientDose).toContain('con la cena');
  });

  it('contraindica rivaroxabán si ClCr <15 mL/min', () => {
    const res = evaluateAFTherapyOption(
      option('rivaroxaban-af'),
      session({ age: 85, weight: 50, creatinine: 4.0, sex: 'male' }),
    );
    expect(res.warnings.some((w) => /contraindicado/i.test(w))).toBe(true);
  });

  it('contraindica dabigatrán si ClCr <30 mL/min', () => {
    const res = evaluateAFTherapyOption(
      option('dabigatran-af'),
      session({ age: 78, weight: 60, creatinine: 2.5, sex: 'female' }),
    );
    expect(res.warnings.some((w) => /contraindicado/i.test(w))).toBe(true);
  });

  it('ajusta dabigatrán a 110 mg c/12 h en pacientes con edad ≥80 o ClCr 30–50 mL/min', () => {
    const resAge = evaluateAFTherapyOption(
      option('dabigatran-af'),
      session({ age: 81, weight: 75, creatinine: 1.0, sex: 'male' }),
    );
    expect(resAge.patientDose).toContain('110 mg c/12 h');
  });

  it('ajusta edoxabán a 30 mg/día si peso ≤60 kg o ClCr 15–50 mL/min', () => {
    const resWeight = evaluateAFTherapyOption(
      option('edoxaban-af'),
      session({ age: 60, weight: 55, creatinine: 0.9, sex: 'female' }),
    );
    expect(resWeight.patientDose).toContain('30 mg/día');
  });

  it('advierte sobre edoxabán con ClCr supranormal (>95 mL/min) por eficacia reducida', () => {
    const resHighClCr = evaluateAFTherapyOption(
      option('edoxaban-af'),
      session({ age: 40, weight: 85, creatinine: 0.7, sex: 'male' }),
    );
    expect(resHighClCr.warnings.some((w) => /ClCr >95|eficacia reducida/i.test(w))).toBe(true);
  });

  it('contraindica flecainida y propafenona en presencia de cardiopatía estructural o FEVI ≤40%', () => {
    const resFlec = evaluateAFTherapyOption(
      option('flecainide-af'),
      session({ structuralHeartDisease: true }),
    );
    expect(resFlec.warnings.some((w) => /cardiopatía estructural/i.test(w))).toBe(true);

    const resProp = evaluateAFTherapyOption(
      option('propafenone-af'),
      session({ lvef: 35 }),
    );
    expect(resProp.warnings.some((w) => /disfunción ventricular/i.test(w))).toBe(true);
  });

  it('alerta amiodarona cuando el QTc está prolongado (>450 ms)', () => {
    const res = evaluateAFTherapyOption(
      option('amiodarone-af'),
      session({ qtcMs: 510 }),
    );
    expect(res.warnings.some((w) => /QTc/i.test(w))).toBe(true);
  });

  it('desaconseja diltiazem y verapamilo cuando la FEVI es ≤40%', () => {
    const resDilt = evaluateAFTherapyOption(
      option('diltiazem-iv-af'),
      session({ lvef: 30 }),
    );
    expect(resDilt.warnings.some((w) => /FEVI ≤40%/i.test(w))).toBe(true);

    const resVera = evaluateAFTherapyOption(
      option('verapamil-iv-af'),
      session({ lvef: 30 }),
    );
    expect(resVera.warnings.some((w) => /FEVI ≤40%/i.test(w))).toBe(true);
  });

  it('alerta contraindicación de anticoagulación ante sangrado activo confirmado', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ activeBleed: true, age: 70, weight: 70, creatinine: 1, sex: 'male' }),
    );
    expect(res.warnings.some((w) => /Sangrado activo/i.test(w))).toBe(true);
  });

  it('alerta si se seleccionan múltiples anticoagulantes simultáneos', () => {
    const res = evaluateAFTherapyOption(
      option('rivaroxaban-af'),
      session({
        selectedTherapyOptionIds: ['apixaban-af'],
        age: 70, weight: 70, creatinine: 1, sex: 'male',
      }),
    );
    expect(res.warnings.some((w) => /Duplicación/i.test(w))).toBe(true);
  });

  it('exige duración de FA para evaluar cardioversión eléctrica', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: null }),
    );
    expect(res.missingData.some((m) => m.includes('duración de la FA'))).toBe(true);
  });

  it('advierte sobre necesidad de ETE o anticoagulación previa de 3 semanas en FA ≥48 h sin AC previa', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: 'gte48h', priorTherapeuticAnticoag: false }),
    );
    expect(res.warnings.some((w) => /ETE.*anticoagular ≥3 semanas/i.test(w))).toBe(true);
  });

  it('confirma seguridad de cardioversión sin 3 semanas previas si la duración de FA es <48 h', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: 'lt48h' }),
    );
    expect(res.contextNotes.some((n) => n.includes('FA <48 h: cardioversión habitualmente segura'))).toBe(true);
  });

  it('incorpora el score CHA₂DS₂-VASc en la evaluación de anticoagulación', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({
        age: 78,
        sex: 'female',
        hypertension: true,
        diabetes: true,
        previousStroke: false,
        vascularDisease: false,
        weight: 65,
        creatinine: 1.1,
      }),
    );
    expect(res.contextNotes.some((n) => n.includes('CHA₂DS₂-VASc'))).toBe(true);
  });

  it('contraindica digoxina en preexcitación y alerta por hipopotasemia en FA', () => {
    const res = evaluateAFTherapyOption(
      option('digoxin-iv-af'),
      session({ preexcitation: true, potassium: 3.1 }),
    );
    expect(res.warnings.some((w) => /preexcitación/i.test(w))).toBe(true);
    expect(res.warnings.some((w) => /hipopotasemia/i.test(w))).toBe(true);
  });
});
