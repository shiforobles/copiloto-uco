import { describe, it, expect } from 'vitest';
import { mlhToGamma, gammaToMlh, mlhToUgMin, ugMinToMlh, mlhToUnitsMin, unitsMinToMlh } from '../../src/engine/drips';

describe('Goteos — por peso (µg/kg/min)', () => {
  it('milrinona 80 µg/mL, 70 kg, 7 mL/h → ≈ 0.133 µg/kg/min', () => {
    const result = mlhToGamma({
      mlPerHour: 7,
      concentrationUgMl: 80,
      weightKg: 70,
    });
    // 7 * 80 = 560 µg/h → 560/60 = 9.333 µg/min → 9.333/70 = 0.1333...
    expect(result.value).toBeCloseTo(0.133, 3);
    expect(result.unit).toBe('µg/kg/min');
    expect(result.steps.length).toBe(3);
  });

  it('dobutamina 2000 µg/mL, 70 kg, objetivo 5 γ → 10.5 mL/h', () => {
    const result = gammaToMlh({
      gamma: 5,
      concentrationUgMl: 2000,
      weightKg: 70,
    });
    // 5 * 70 = 350 µg/min → 350 * 60 = 21000 µg/h → 21000 / 2000 = 10.5
    expect(result.value).toBeCloseTo(10.5, 1);
    expect(result.unit).toBe('mL/h');
    expect(result.steps.length).toBe(3);
  });

  it('ida y vuelta: mL/h → γ → mL/h da el mismo valor', () => {
    const mlh = 15;
    const conc = 64;
    const weight = 80;

    const gamma = mlhToGamma({ mlPerHour: mlh, concentrationUgMl: conc, weightKg: weight });
    const back = gammaToMlh({ gamma: gamma.value, concentrationUgMl: conc, weightKg: weight });

    expect(back.value).toBeCloseTo(mlh, 6);
  });

  it('noradrenalina: dosis habitual 0.1 γ da mL/h razonables', () => {
    // NE 16 mg/250 mL = 64 µg/mL, paciente 70 kg
    const result = gammaToMlh({
      gamma: 0.1,
      concentrationUgMl: 64,
      weightKg: 70,
    });
    // 0.1 * 70 = 7 µg/min → 420 µg/h → 420/64 = 6.5625
    expect(result.value).toBeCloseTo(6.5625, 2);
  });

  it('0 mL/h → 0 γ', () => {
    const result = mlhToGamma({
      mlPerHour: 0,
      concentrationUgMl: 80,
      weightKg: 70,
    });
    expect(result.value).toBe(0);
  });

  it('0 γ → 0 mL/h', () => {
    const result = gammaToMlh({
      gamma: 0,
      concentrationUgMl: 80,
      weightKg: 70,
    });
    expect(result.value).toBe(0);
  });
});

describe('Goteos — sin peso (µg/min)', () => {
  it('nitroglicerina 200 µg/mL, 3 mL/h → 10 µg/min', () => {
    const result = mlhToUgMin({
      mlPerHour: 3,
      concentrationUgMl: 200,
    });
    // 3 * 200 = 600 µg/h → 600/60 = 10
    expect(result.value).toBeCloseTo(10, 2);
    expect(result.unit).toBe('µg/min');
  });

  it('nitroglicerina objetivo 50 µg/min → 15 mL/h', () => {
    const result = ugMinToMlh({
      ugPerMin: 50,
      concentrationUgMl: 200,
    });
    // 50 * 60 = 3000 µg/h → 3000/200 = 15
    expect(result.value).toBeCloseTo(15, 2);
    expect(result.unit).toBe('mL/h');
  });

  it('ida y vuelta: mL/h → µg/min → mL/h da el mismo valor', () => {
    const mlh = 8;
    const conc = 200;

    const ugMin = mlhToUgMin({ mlPerHour: mlh, concentrationUgMl: conc });
    const back = ugMinToMlh({ ugPerMin: ugMin.value, concentrationUgMl: conc });

    expect(back.value).toBeCloseTo(mlh, 6);
  });
});

describe('Goteos — nuevas drogas', () => {
  it('adrenalina 16 µg/mL, 70 kg, 0.1 γ → mL/h razonable', () => {
    const result = gammaToMlh({
      gamma: 0.1,
      concentrationUgMl: 16,
      weightKg: 70,
    });
    // 0.1 × 70 = 7 µg/min → 420 µg/h → 420/16 = 26.25 mL/h
    expect(result.value).toBeCloseTo(26.25, 2);
    expect(result.unit).toBe('mL/h');
  });

  it('levosimendan 50 µg/mL, 70 kg, 0.1 γ → mL/h razonable', () => {
    const result = gammaToMlh({
      gamma: 0.1,
      concentrationUgMl: 50,
      weightKg: 70,
    });
    // 0.1 × 70 = 7 µg/min → 420 µg/h → 420/50 = 8.4 mL/h
    expect(result.value).toBeCloseTo(8.4, 2);
    expect(result.unit).toBe('mL/h');
  });
});

describe('Goteos — U/min (vasopresina)', () => {
  it('vasopresina 0.4 U/mL, 4.5 mL/h → 0.03 U/min', () => {
    const result = mlhToUnitsMin({
      mlPerHour: 4.5,
      concentrationUnitsPerMl: 0.4,
    });
    // 4.5 × 0.4 = 1.8 U/h → 1.8/60 = 0.03 U/min
    expect(result.value).toBeCloseTo(0.03, 4);
    expect(result.unit).toBe('U/min');
    expect(result.steps.length).toBe(2);
  });

  it('vasopresina 0.03 U/min → 4.5 mL/h', () => {
    const result = unitsMinToMlh({
      unitsPerMin: 0.03,
      concentrationUnitsPerMl: 0.4,
    });
    // 0.03 × 60 = 1.8 U/h → 1.8/0.4 = 4.5 mL/h
    expect(result.value).toBeCloseTo(4.5, 2);
    expect(result.unit).toBe('mL/h');
  });

  it('ida y vuelta: mL/h → U/min → mL/h da el mismo valor', () => {
    const mlh = 6;
    const conc = 0.4;

    const uMin = mlhToUnitsMin({ mlPerHour: mlh, concentrationUnitsPerMl: conc });
    const back = unitsMinToMlh({ unitsPerMin: uMin.value, concentrationUnitsPerMl: conc });

    expect(back.value).toBeCloseTo(mlh, 6);
  });

  it('0 mL/h → 0 U/min', () => {
    const result = mlhToUnitsMin({
      mlPerHour: 0,
      concentrationUnitsPerMl: 0.4,
    });
    expect(result.value).toBe(0);
  });
});
