import { describe, it, expect } from 'vitest';
import {
  getTraceableRenalContext,
  devineIdealWeight,
  cockcroftGault,
} from '../../src/engine/renal';
import { emptySession } from '../helpers/session';
import type { SessionState } from '../../src/context/session';

function session(overrides: Partial<SessionState> = {}): SessionState {
  return emptySession(overrides);
}

describe('Traceable Renal Context and Calculations', () => {
  it('distingue estrictamente ClCr (Cockcroft-Gault) de eGFR (CKD-EPI 2021) sin intercambiarlos', () => {
    // Paciente masculino, 65 años, 80 kg, 175 cm, Cr 1.2 mg/dL
    const s = session({
      age: 65,
      sex: 'male',
      weight: 80,
      height: 175,
      creatinine: 1.2,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.clcrCockcroftGault).not.toBeNull();
    expect(ctx.egfrCkdEpi2021).not.toBeNull();
    // ClCr en mL/min (absoluto) y eGFR en mL/min/1.73m² no son idénticos numéricamente
    expect(ctx.clcrCockcroftGault).toBeCloseTo(69.4, 1);
    expect(ctx.egfrCkdEpi2021).toBeCloseTo(67.1, 1);
    expect(ctx.clcrCockcroftGault).not.toEqual(ctx.egfrCkdEpi2021);
    expect(ctx.missingDataForClcr).toHaveLength(0);
    expect(ctx.missingDataForEgfr).toHaveLength(0);
  });

  it('calcula el peso ideal por Devine diferenciado por sexo', () => {
    // Altura 175 cm = 68.9 pulgadas -> 8.9 pulgadas sobre 5 pies (60 pulgadas)
    // Hombre: 50 + 2.3 * 8.8976 = ~70.57 kg
    // Mujer: 45.5 + 2.3 * 8.8976 = ~66.07 kg
    const maleIBW = devineIdealWeight(175, 'male');
    const femaleIBW = devineIdealWeight(175, 'female');

    expect(maleIBW.value).toBeCloseTo(70.6, 1);
    expect(femaleIBW.value).toBeCloseTo(66.1, 1);
    expect(maleIBW.value).toBeGreaterThan(femaleIBW.value);
  });

  it('utiliza peso ajustado (ABW) en Cockcroft-Gault para pacientes con obesidad (IMC >= 30)', () => {
    // Hombre 60 años, Cr 1.0 mg/dL, 170 cm, 115 kg (IMC = 39.8 -> obeso)
    // IBW Devine (170 cm) = 50 + 2.3 * 6.93 = ~65.9 kg
    // ABW = 65.9 + 0.4 * (115 - 65.9) = ~85.5 kg
    const s = session({
      age: 60,
      sex: 'male',
      height: 170,
      weight: 115,
      creatinine: 1.0,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.isObese).toBe(true);
    expect(ctx.bmi).toBeGreaterThanOrEqual(30);
    expect(ctx.clcrWeightStrategy).toBe('adjusted');
    expect(ctx.clcrWeightUsed).toBeLessThan(115);
    expect(ctx.clcrWeightUsed).toBeGreaterThan(ctx.idealWeightDevine!);
    expect(ctx.methodApplied).toContain('peso ajustado (ABW)');
  });

  it('utiliza peso actual cuando no hay obesidad ni exceso > 120% del peso ideal', () => {
    // Mujer 50 años, Cr 0.9 mg/dL, 165 cm, 60 kg (IMC = 22.0 -> normopeso)
    const s = session({
      age: 50,
      sex: 'female',
      height: 165,
      weight: 60,
      creatinine: 0.9,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.isObese).toBe(false);
    expect(ctx.clcrWeightStrategy).toBe('actual');
    expect(ctx.clcrWeightUsed).toBe(60);
    expect(ctx.methodApplied).toContain('peso real');
  });

  it('reporta explícitamente qué datos faltan para Cockcroft-Gault y no emite valor falso', () => {
    // Falta creatinina y sexo
    const s = session({
      age: 68,
      weight: 75,
      creatinine: null,
      sex: null,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.clcrCockcroftGault).toBeNull();
    expect(ctx.clcrWeightUsed).toBeNull();
    expect(ctx.clcrWeightStrategy).toBe('none');
    expect(ctx.missingDataForClcr).toContain('sexo');
    expect(ctx.missingDataForClcr).toContain('creatinina');
    expect(ctx.methodApplied).toBe('Datos insuficientes para Cockcroft-Gault');
  });

  it('reporta faltantes para eGFR CKD-EPI 2021 cuando falta creatinina o edad o sexo', () => {
    const s = session({
      age: null,
      sex: 'female',
      creatinine: 1.1,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.egfrCkdEpi2021).toBeNull();
    expect(ctx.missingDataForEgfr).toContain('edad');
  });

  it('genera alerta extrema cuando la creatinina es mayor a 10 mg/dL', () => {
    const s = session({
      age: 60,
      sex: 'male',
      weight: 70,
      creatinine: 11.2,
    });
    const ctx = getTraceableRenalContext(s);

    expect(ctx.extremeAlerts.some((a) => a.includes('Creatinina extrema'))).toBe(true);
    expect(ctx.extremeAlerts.some((a) => a.includes('anuria o diálisis'))).toBe(true);
  });

  it('genera alerta extrema para pesos por fuera del rango antropométrico seguro (<30 kg o >200 kg)', () => {
    const lowWeightSession = session({
      age: 50,
      sex: 'female',
      weight: 27,
      creatinine: 0.9,
    });
    const ctxLow = getTraceableRenalContext(lowWeightSession);
    expect(ctxLow.extremeAlerts.some((a) => a.includes('Peso extremo (27 kg)'))).toBe(true);

    const highWeightSession = session({
      age: 45,
      sex: 'male',
      weight: 220,
      creatinine: 1.1,
    });
    const ctxHigh = getTraceableRenalContext(highWeightSession);
    expect(ctxHigh.extremeAlerts.some((a) => a.includes('Peso extremo (220 kg)'))).toBe(true);
  });

  it('genera advertencia en paciente centenario (edad >= 100 años)', () => {
    const centenarian = session({
      age: 102,
      sex: 'female',
      weight: 55,
      creatinine: 0.8,
    });
    const ctx = getTraceableRenalContext(centenarian);
    expect(ctx.extremeAlerts.some((a) => a.includes('Edad centenaria (102 años)'))).toBe(true);
  });

  it('alerta sobre sobreestimación de clearance en octogenarios con creatinina baja', () => {
    const s = session({
      age: 85,
      sex: 'female',
      weight: 48,
      creatinine: 0.6,
    });
    const ctx = getTraceableRenalContext(s);
    expect(ctx.extremeAlerts.some((a) => a.includes('Cockcroft-Gault sobreestima el clearance'))).toBe(true);
  });

  it('aplica factor de corrección femenino (0.85) en Cockcroft-Gault', () => {
    const maleRes = cockcroftGault({ age: 60, weight: 70, creatinine: 1.0, sex: 'male' });
    const femaleRes = cockcroftGault({ age: 60, weight: 70, creatinine: 1.0, sex: 'female' });

    expect(femaleRes.value).toBeCloseTo(maleRes.value * 0.85, 4);
  });
});
