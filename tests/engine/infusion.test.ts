import { describe, expect, it } from 'vitest';
import { calculateInfusion, parseDecimal, type InfusionInput } from '../../src/engine/infusion';

const base: InfusionInput = { amount: 16, amountUnit: 'mg', volume: 250, doseUnit: 'µg/kg/min', weight: 80, direction: 'dose-to-rate', value: 0.1 };
describe('Conversión dimensional de infusiones', () => {
  it('convierte 0,1 µg/kg/min, 80 kg y 64 µg/mL a 7,5 mL/h', () => {
    expect(calculateInfusion(base).value).toBeCloseTo(7.5);
  });
  it.each([
    ['µg/min', 'mg', 4, 250, null, 4, 15],
    ['mg/h', 'mg', 100, 100, null, 5, 5],
    ['mg/min', 'mg', 900, 500, null, 1, 100 / 3],
    ['mg/kg/h', 'mg', 500, 50, 80, 2, 16],
    ['µg/kg/h', 'µg', 200, 50, 80, 0.5, 10],
    ['U/min', 'U', 40, 100, null, 0.03, 4.5],
    ['U/h', 'U', 100, 100, null, 5, 5],
    ['U/kg/h', 'U', 25000, 250, 80, 18, 14.4],
    ['mg/h', 'g', 1, 100, null, 50, 5],
  ] as const)('convierte %s y permite la operación inversa', (doseUnit, amountUnit, amount, volume, weight, value, expected) => {
    const input = { doseUnit, amountUnit, amount, volume, weight, value, direction: 'dose-to-rate' } as const;
    const rate = calculateInfusion(input).value;
    expect(rate).toBeCloseTo(expected);
    expect(calculateInfusion({ ...input, direction: 'rate-to-dose', value: rate }).value).toBeCloseTo(value);
  });
  it.each([{ volume: 0 }, { amount: -1 }, { value: -1 }, { weight: null }, { weight: Infinity }, { value: Infinity }, { amount: NaN }, { amountUnit: 'U' as const }])('rechaza entradas peligrosas: %j', (override) => {
    expect(() => calculateInfusion({ ...base, ...override })).toThrow();
  });
  it('acepta una bomba detenida y no requiere peso en dosis independientes', () => {
    expect(calculateInfusion({ ...base, value: 0 }).value).toBe(0);
    expect(calculateInfusion({ ...base, doseUnit: 'µg/min', weight: null }).value).toBeGreaterThan(0);
  });
  it('acepta coma decimal y rechaza texto parcial o notación ambigua', () => {
    expect(parseDecimal('0,03')).toBe(0.03);
    for (const raw of ['', '1abc', '1,2,3', '1e3', 'Infinity', '-2']) expect(parseDecimal(raw)).toBeNull();
  });
});
