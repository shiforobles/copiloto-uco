import { describe, it, expect } from 'vitest';
import { cockcroftGault, ckdEpi2021, devineIdealWeight, adjustedBodyWeight } from '../../src/engine/renal';

describe('Cockcroft-Gault', () => {
  it('hombre 87 años, 70 kg, Cr 2.0 → ≈ 25.8 mL/min', () => {
    const result = cockcroftGault({
      age: 87,
      weight: 70,
      creatinine: 2.0,
      sex: 'male',
    });
    // (140 - 87) * 70 / (72 * 2.0) = 53 * 70 / 144 = 3710 / 144 = 25.763...
    expect(result.value).toBeCloseTo(25.76, 0);
    expect(result.unit).toBe('mL/min');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(0); // Cr 2.0 >= 0.8, no warning
  });

  it('mujer 87 años, 70 kg, Cr 2.0 → ≈ 21.9 mL/min', () => {
    const result = cockcroftGault({
      age: 87,
      weight: 70,
      creatinine: 2.0,
      sex: 'female',
    });
    // 25.763... * 0.85 = 21.899...
    expect(result.value).toBeCloseTo(21.9, 0);
    expect(result.unit).toBe('mL/min');
    // Debe tener paso de corrección por sexo
    expect(result.steps.some((s) => s.formula?.includes('mujer'))).toBe(true);
  });

  it('warning: edad ≥ 80 y Cr < 0.8', () => {
    const result = cockcroftGault({
      age: 85,
      weight: 60,
      creatinine: 0.6,
      sex: 'male',
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('sobreestimar');
  });

  it('no warning cuando edad ≥ 80 pero Cr ≥ 0.8', () => {
    const result = cockcroftGault({
      age: 85,
      weight: 60,
      creatinine: 1.0,
      sex: 'male',
    });
    expect(result.warnings).toHaveLength(0);
  });

  it('no warning cuando Cr < 0.8 pero edad < 80', () => {
    const result = cockcroftGault({
      age: 50,
      weight: 70,
      creatinine: 0.6,
      sex: 'female',
    });
    expect(result.warnings).toHaveLength(0);
  });

  it('usa adjustedWeight si se proporciona', () => {
    const withReal = cockcroftGault({
      age: 60,
      weight: 100,
      creatinine: 1.0,
      sex: 'male',
    });
    const withAdjusted = cockcroftGault({
      age: 60,
      weight: 100,
      creatinine: 1.0,
      sex: 'male',
      adjustedWeight: 70,
    });
    // Con peso ajustado 70 debería dar menos que con peso real 100
    expect(withAdjusted.value).toBeLessThan(withReal.value);
  });
});

describe('CKD-EPI 2021', () => {
  it('hombre 60 años, Cr 1.0 → ≈ 86 mL/min/1.73m²', () => {
    const result = ckdEpi2021({
      age: 60,
      creatinine: 1.0,
      sex: 'male',
    });
    // Esperado ≈ 85-87 mL/min/1.73m²
    expect(result.value).toBeCloseTo(86, 0);
    expect(result.unit).toBe('mL/min/1,73 m²');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('mujer tiene factor 1.012', () => {
    const male = ckdEpi2021({
      age: 60,
      creatinine: 1.0,
      sex: 'male',
    });
    const female = ckdEpi2021({
      age: 60,
      creatinine: 1.0,
      sex: 'female',
    });
    // Mujer usa κ=0.7 y α=-0.241 y factor 1.012
    // Los valores serán diferentes por los coeficientes
    expect(female.value).not.toBe(male.value);
  });

  it('Cr alta reduce eGFR', () => {
    const normal = ckdEpi2021({
      age: 50,
      creatinine: 1.0,
      sex: 'male',
    });
    const high = ckdEpi2021({
      age: 50,
      creatinine: 3.0,
      sex: 'male',
    });
    expect(high.value).toBeLessThan(normal.value);
  });

  it('edad alta reduce eGFR', () => {
    const young = ckdEpi2021({
      age: 30,
      creatinine: 1.0,
      sex: 'male',
    });
    const old = ckdEpi2021({
      age: 80,
      creatinine: 1.0,
      sex: 'male',
    });
    expect(old.value).toBeLessThan(young.value);
  });
});

describe('Devine — Peso ideal', () => {
  it('hombre 180 cm → 75.1 kg', () => {
    const result = devineIdealWeight(180, 'male');
    // 50 + 0.91 × (180 − 152.4) = 50 + 0.91 × 27.6 = 50 + 25.116 = 75.116
    expect(result.value).toBeCloseTo(75.1, 1);
    expect(result.unit).toBe('kg');
  });

  it('mujer 165 cm → 56.97 kg', () => {
    const result = devineIdealWeight(165, 'female');
    // 45.5 + 0.91 × (165 − 152.4) = 45.5 + 0.91 × 12.6 = 45.5 + 11.466 = 56.966
    expect(result.value).toBeCloseTo(56.97, 1);
    expect(result.unit).toBe('kg');
  });

  it('hombre bajo 155 cm → ≈ 52.4 kg', () => {
    const result = devineIdealWeight(155, 'male');
    // 50 + 0.91 × (155 − 152.4) = 50 + 0.91 × 2.6 = 50 + 2.366 = 52.366
    expect(result.value).toBeCloseTo(52.4, 1);
  });
});

describe('Peso ajustado (ABW)', () => {
  it('120 kg actual, IBW 75 → ABW 93 kg', () => {
    const result = adjustedBodyWeight(120, 75);
    expect(result).not.toBeNull();
    // IBW + 0.4 × (120 − 75) = 75 + 0.4 × 45 = 75 + 18 = 93
    expect(result!.value).toBeCloseTo(93, 1);
    expect(result!.warnings.length).toBeGreaterThan(0);
  });

  it('70 kg actual, IBW 75 → null (no obeso)', () => {
    const result = adjustedBodyWeight(70, 75);
    expect(result).toBeNull();
  });

  it('90 kg actual, IBW 75 → null (90 ≤ 90 = 1.2 × 75)', () => {
    const result = adjustedBodyWeight(90, 75);
    expect(result).toBeNull();
  });

  it('91 kg actual, IBW 75 → ABW (91 > 90)', () => {
    const result = adjustedBodyWeight(91, 75);
    expect(result).not.toBeNull();
    // 75 + 0.4 × (91 − 75) = 75 + 6.4 = 81.4
    expect(result!.value).toBeCloseTo(81.4, 1);
  });

  it('CG con ABW vs sin ABW: valores distintos', () => {
    const normal = cockcroftGault({
      age: 60, weight: 120, creatinine: 1.0, sex: 'male',
    });
    const withAbw = cockcroftGault({
      age: 60, weight: 120, creatinine: 1.0, sex: 'male',
      adjustedWeight: 93,
    });
    expect(normal.value).toBeGreaterThan(withAbw.value);
  });
});
