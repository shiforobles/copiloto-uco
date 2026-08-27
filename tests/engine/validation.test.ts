import { describe, it, expect } from 'vitest';
import {
  validateWeight,
  validateCreatinine,
  validateAge,
  validateConcentration,
  validateRate,
  validateGamma,
} from '../../src/engine/validation';

describe('validateWeight', () => {
  it('peso 0 → error', () => {
    const result = validateWeight(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('peso negativo → error', () => {
    const result = validateWeight(-5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('mayor a 0');
  });

  it('peso NaN → error', () => {
    const result = validateWeight(NaN);
    expect(result.valid).toBe(false);
  });

  it('peso > 500 → error', () => {
    const result = validateWeight(501);
    expect(result.valid).toBe(false);
  });

  it('peso válido → ok', () => {
    const result = validateWeight(70);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateCreatinine', () => {
  it('Cr 0 → error', () => {
    const result = validateCreatinine(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('Cr negativa → error', () => {
    const result = validateCreatinine(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('mayor a 0');
  });

  it('Cr NaN → error', () => {
    const result = validateCreatinine(NaN);
    expect(result.valid).toBe(false);
  });

  it('Cr > 30 → error', () => {
    const result = validateCreatinine(31);
    expect(result.valid).toBe(false);
  });

  it('Cr válida → ok', () => {
    const result = validateCreatinine(1.2);
    expect(result.valid).toBe(true);
  });
});

describe('validateAge', () => {
  it('edad negativa → error', () => {
    const result = validateAge(-1);
    expect(result.valid).toBe(false);
  });

  it('edad > 120 → error', () => {
    const result = validateAge(121);
    expect(result.valid).toBe(false);
  });

  it('edad decimal → error', () => {
    const result = validateAge(45.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('entero');
  });

  it('edad NaN → error', () => {
    const result = validateAge(NaN);
    expect(result.valid).toBe(false);
  });

  it('edad válida → ok', () => {
    const result = validateAge(65);
    expect(result.valid).toBe(true);
  });

  it('edad 0 → ok (neonato)', () => {
    const result = validateAge(0);
    expect(result.valid).toBe(true);
  });
});

describe('validateConcentration', () => {
  it('concentración 0 → error', () => {
    expect(validateConcentration(0).valid).toBe(false);
  });

  it('concentración válida → ok', () => {
    expect(validateConcentration(80).valid).toBe(true);
  });
});

describe('validateRate', () => {
  it('rate negativo → error', () => {
    expect(validateRate(-1).valid).toBe(false);
  });

  it('rate 0 → ok', () => {
    expect(validateRate(0).valid).toBe(true);
  });

  it('rate válido → ok', () => {
    expect(validateRate(10).valid).toBe(true);
  });
});

describe('validateGamma', () => {
  it('gamma negativo → error', () => {
    expect(validateGamma(-1).valid).toBe(false);
  });

  it('gamma 0 → ok', () => {
    expect(validateGamma(0).valid).toBe(true);
  });

  it('gamma válido → ok', () => {
    expect(validateGamma(0.5).valid).toBe(true);
  });
});
