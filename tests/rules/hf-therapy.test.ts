import { describe, expect, it } from 'vitest';
import { hfTherapyGroups } from '../../src/data/hf-therapy-matrix';
import { evaluateHFTherapyOption } from '../../src/rules/hf-therapy.engine';
import { emptySession } from '../helpers/session';

const session = (overrides: Parameters<typeof emptySession>[0] = {}) =>
  emptySession({ condition: 'ic', ...overrides });

function option(id: string) {
  const found = hfTherapyGroups.flatMap((group) => group.options).find((item) => item.id === id);
  if (!found) throw new Error(`Opción IC inexistente: ${id}`);
  return found;
}

describe('Matriz terapéutica de Insuficiencia Cardíaca (IC)', () => {
  it('mantiene la opción visible y explicita datos faltantes con sesión vacía', () => {
    const res = evaluateHFTherapyOption(option('furosemide-hf'), session());
    expect(res.option.name).toBe('Furosemida');
    expect(res.missingData).toContain('K');
    expect(res.contextNotes).toContain('Situación clínica no definida: se muestra la referencia completa.');
  });

  it('calcula la dosis individualizada de dobutamina por peso a partir de canonical-drugs', () => {
    const res = evaluateHFTherapyOption(
      option('dobutamine-hf'),
      session({ weight: 70, systolicBP: 100 }),
    );
    expect(res.patientDose).toContain('Con 70 kg');
    expect(res.patientDose).toContain('µg/kg/min');
    expect(res.patientDose).toContain('mg/h');
  });

  it('advierte y omite bolo de levosimendán cuando la TAS <90 mmHg', () => {
    const res = evaluateHFTherapyOption(
      option('levosimendan-hf'),
      session({ weight: 70, systolicBP: 85 }),
    );
    expect(res.warnings.some((w) => w.includes('bolo de levosimendán omitido por hipotensión'))).toBe(true);
    expect(res.patientDose).toContain('bolo omitido por TAS <90 mmHg');
  });

  it('incluye opción de bolo de levosimendán si TAS ≥90 mmHg', () => {
    const res = evaluateHFTherapyOption(
      option('levosimendan-hf'),
      session({ weight: 70, systolicBP: 110 }),
    );
    expect(res.patientDose).toContain('bolo opcional 420 µg');
    expect(res.warnings).toHaveLength(0);
  });

  it('advierte sobre dobutamina sin vasopresor cuando TAS <75 mmHg', () => {
    const res = evaluateHFTherapyOption(
      option('dobutamine-hf'),
      session({ weight: 70, systolicBP: 70 }),
    );
    expect(res.warnings.some((w) => w.includes('empeorar la hipotensión'))).toBe(true);
  });

  it('alerta hipopotasemia con furosemida si K <3.5 mEq/L', () => {
    const res = evaluateHFTherapyOption(
      option('furosemide-hf'),
      session({ potassium: 3.1 }),
    );
    expect(res.warnings.some((w) => w.includes('corregir hipopotasemia'))).toBe(true);
  });

  it('alerta requerimiento de mayor dosis de furosemida si ClCr <30 mL/min', () => {
    const res = evaluateHFTherapyOption(
      option('furosemide-hf'),
      session({ age: 75, sex: 'male', weight: 70, creatinine: 2.5 }),
    );
    expect(res.warnings.some((w) => w.includes('puede requerir dosis más altas'))).toBe(true);
  });

  it('genera nota de titular a la baja furosemida si congestión es false', () => {
    const res = evaluateHFTherapyOption(
      option('furosemide-hf'),
      session({ congestion: false, potassium: 4.2 }),
    );
    expect(res.contextNotes.some((n) => n.includes('Sin signos de congestión confirmados'))).toBe(true);
  });

  it('contraindica vasodilatadores (nitroglicerina) si TAS <90 mmHg', () => {
    const res = evaluateHFTherapyOption(
      option('nitroglycerin-hf'),
      session({ systolicBP: 80 }),
    );
    expect(res.warnings.some((w) => w.includes('vasodilatadores contraindicados por hipotensión'))).toBe(true);
  });

  it('advierte evitar vasodilatadores en shock o hipoperfusión activa', () => {
    const res = evaluateHFTherapyOption(
      option('nitroglycerin-hf'),
      session({ systolicBP: 110, hypoperfusion: true }),
    );
    expect(res.warnings.some((w) => w.includes('Evitar vasodilatadores en shock/hipoperfusión activa'))).toBe(true);
  });

  it('bloquea inicio de IECA/ARNI/ARA-II si TAS <90 mmHg o K ≥5.0 mEq/L', () => {
    const resTAS = evaluateHFTherapyOption(
      option('enalapril-hf'),
      session({ systolicBP: 85, potassium: 4.5 }),
    );
    expect(resTAS.warnings.some((w) => w.includes('no iniciar IECA/ARNI/ARA-II'))).toBe(true);

    const resK = evaluateHFTherapyOption(
      option('enalapril-hf'),
      session({ systolicBP: 120, potassium: 5.3 }),
    );
    expect(resK.warnings.some((w) => w.includes('revisar y corregir antes de iniciar'))).toBe(true);
  });

  it('indica período de lavado de 36 h para sacubitril-valsartán tras IECA', () => {
    const res = evaluateHFTherapyOption(
      option('sacubitril-valsartan-hf'),
      session({ systolicBP: 120, potassium: 4.2 }),
    );
    expect(res.contextNotes.some((n) => n.includes('≥36 h después de suspender IECA'))).toBe(true);
  });

  it('distingue indicación de GDMT SRAA en FEVIr vs FEVIp', () => {
    const resHFrEF = evaluateHFTherapyOption(
      option('sacubitril-valsartan-hf'),
      session({ lvef: 30, systolicBP: 115, potassium: 4.1 }),
    );
    expect(resHFrEF.contextNotes.some((n) => n.includes('FEVIr (≤40%): pilar de cuádruple terapia'))).toBe(true);

    const resHFpEF = evaluateHFTherapyOption(
      option('sacubitril-valsartan-hf'),
      session({ lvef: 55, systolicBP: 115, potassium: 4.1 }),
    );
    expect(resHFpEF.contextNotes.some((n) => n.includes('FEVIp'))).toBe(true);
  });

  it('contraindica inicio de betabloqueante en shock o con vasopresores activos', () => {
    const resShock = evaluateHFTherapyOption(
      option('bisoprolol-hf'),
      session({ hypoperfusion: true, heartRate: 85, systolicBP: 110 }),
    );
    expect(resShock.warnings.some((w) => w.includes('NO iniciar betabloqueante en shock'))).toBe(true);

    const resVaso = evaluateHFTherapyOption(
      option('bisoprolol-hf'),
      session({ onVasopressors: true, heartRate: 85, systolicBP: 110 }),
    );
    expect(resVaso.warnings.some((w) => w.includes('Paciente en vasopresores/inotrópicos'))).toBe(true);
  });

  it('advierte sobre betabloqueante ante bradicardia (<55 lpm) o hipotensión (<90 mmHg)', () => {
    const res = evaluateHFTherapyOption(
      option('carvedilol-hf'),
      session({ heartRate: 48, systolicBP: 85 }),
    );
    expect(res.warnings.some((w) => w.includes('bradicardia'))).toBe(true);
    expect(res.warnings.some((w) => w.includes('hipotensión'))).toBe(true);
  });

  it('alerta sobre ARM (espironolactona) con K ≥5.0 mEq/L o eGFR <30', () => {
    const resK = evaluateHFTherapyOption(
      option('spironolactone-hf'),
      session({ potassium: 5.2, age: 60, sex: 'male', weight: 70, creatinine: 1 }),
    );
    expect(resK.warnings.some((w) => w.includes('no iniciar ARM sin corregir hiperpotasemia'))).toBe(true);

    const resGFR = evaluateHFTherapyOption(
      option('spironolactone-hf'),
      session({ potassium: 4.2, age: 80, sex: 'female', weight: 50, creatinine: 2.5 }),
    );
    expect(resGFR.warnings.some((w) => w.includes('evitar inicio de ARM; riesgo de hiperpotasemia grave'))).toBe(true);
  });

  it('contraindica iSGLT2 en diálisis y con eGFR <20', () => {
    const resDialysis = evaluateHFTherapyOption(
      option('empagliflozin-hf'),
      session({ dialysis: true, age: 60, sex: 'male', weight: 70, creatinine: 1 }),
    );
    expect(resDialysis.warnings.some((w) => w.includes('En diálisis: iSGLT2 contraindicados'))).toBe(true);

    const resLowGFR = evaluateHFTherapyOption(
      option('dapagliflozin-hf'),
      session({ age: 85, sex: 'female', weight: 45, creatinine: 3.5 }),
    );
    expect(resLowGFR.warnings.some((w) => w.includes('eGFR <20 → no iniciar iSGLT2'))).toBe(true);
  });

  it('contraindica digoxina en preexcitación (WPW) y alerta en hipopotasemia', () => {
    const resWPW = evaluateHFTherapyOption(
      option('digoxin-hf'),
      session({ preexcitation: true, potassium: 3.2 }),
    );
    expect(resWPW.warnings.some((w) => w.includes('digoxina contraindicada en FA con WPW'))).toBe(true);
    expect(resWPW.warnings.some((w) => w.includes('hipopotasemia potencia toxicidad digitálica'))).toBe(true);
  });

  it('contraindica ivabradina en FA activa y en FC <60 lpm', () => {
    const res = evaluateHFTherapyOption(
      option('ivabradine-hf'),
      session({ hasAF: true, heartRate: 52 }),
    );
    expect(res.warnings.some((w) => w.includes('FA activa: ivabradina contraindicada'))).toBe(true);
    expect(res.warnings.some((w) => w.includes('FC <60 lpm'))).toBe(true);
  });
});
