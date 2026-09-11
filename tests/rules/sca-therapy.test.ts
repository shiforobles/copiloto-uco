import { describe, expect, it } from 'vitest';
import { scaTherapyGroups } from '../../src/data/sca-therapy-matrix';
import { evaluateScaTherapyOption } from '../../src/rules/sca-therapy.engine';
import { emptySession } from '../helpers/session';

const session = (overrides: Parameters<typeof emptySession>[0] = {}) =>
  emptySession({ condition: 'sca', ...overrides });

function option(id: string) {
  const found = scaTherapyGroups.flatMap((group) => group.options).find((item) => item.id === id);
  if (!found) throw new Error(`Opción inexistente: ${id}`);
  return found;
}

describe('Matriz terapéutica SCA', () => {
  it('mantiene una opción visible y explicita datos faltantes', () => {
    const result = evaluateScaTherapyOption(option('enoxaparin-sca'), session());
    expect(result.missingData).toContain('peso');
    expect(result.missingData).toContain('función renal');
    expect(result.option.name).toBe('Enoxaparina');
  });

  it('calcula el esquema de enoxaparina en fibrinólisis para ≥75 años', () => {
    const result = evaluateScaTherapyOption(
      option('enoxaparin-sca'),
      session({
        age: 80,
        sex: 'male',
        weight: 80,
        creatinine: 1,
        scaStrategy: 'fibrinolysis',
      }),
    );

    expect(result.patientDose).toContain('sin bolo IV');
    expect(result.patientDose).toContain('60 mg SC c/12 h');
  });

  it('limita rosuvastatina cuando el ClCr es menor de 30', () => {
    const result = evaluateScaTherapyOption(
      option('rosuvastatin'),
      session({ age: 80, sex: 'female', weight: 50, creatinine: 2 }),
    );

    expect(result.patientDose).toContain('máximo 10 mg/día');
    expect(result.warnings.some((warning) => warning.includes('ClCr'))).toBe(true);
  });

  it('alerta la combinación clopidogrel + omeprazol', () => {
    const result = evaluateScaTherapyOption(
      option('omeprazole'),
      session({ selectedTherapyOptionIds: ['clopidogrel'] }),
    );

    expect(result.warnings.join(' ')).toMatch(/clopidogrel/i);
  });

  it('alerta betabloqueante en shock, bradicardia e hipotensión', () => {
    const result = evaluateScaTherapyOption(
      option('bisoprolol'),
      session({ phase: 'shock_inotropicos', heartRate: 45, systolicBP: 80 }),
    );

    expect(result.warnings.join(' ')).toMatch(/shock/i);
    expect(result.warnings.join(' ')).toMatch(/bradicardia/i);
    expect(result.warnings.join(' ')).toMatch(/hipotensión/i);
  });
});
