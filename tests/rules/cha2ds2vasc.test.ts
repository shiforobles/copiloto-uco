import { describe, expect, it } from 'vitest';
import { calcCHA2DS2VASc } from '../../src/rules/cha2ds2vasc';
import { emptySession } from '../helpers/session';

describe('CHA₂DS₂-VASc Score', () => {
  it('identifica datos faltantes cuando el estado está vacío y no asume cero', () => {
    const res = calcCHA2DS2VASc(emptySession());
    expect(res.score).toBe(0);
    expect(res.missingData.length).toBeGreaterThan(0);
    expect(res.missingData.some((m) => m.includes('edad'))).toBe(true);
    expect(res.missingData.some((m) => m.includes('sexo'))).toBe(true);
    expect(res.interpretation).toContain('Score mínimo calculable');
  });

  it('calcula score 0 en hombre joven sin factores de riesgo confirmados', () => {
    const res = calcCHA2DS2VASc(
      emptySession({
        age: 45,
        sex: 'male',
        condition: null,
        lvef: 55,
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(res.score).toBe(0);
    expect(res.missingData).toHaveLength(0);
    expect(res.interpretation).toContain('riesgo bajo en hombres (score 0)');
  });

  it('asigna 1 punto a mujer joven por categoría de sexo sin otros factores', () => {
    const res = calcCHA2DS2VASc(
      emptySession({
        age: 45,
        sex: 'female',
        lvef: 60,
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(res.score).toBe(1);
    const sc = res.components.find((c) => c.acronymLetter === 'Sc');
    expect(sc?.points).toBe(1);
    expect(sc?.present).toBe(true);
    expect(res.interpretation).toContain('riesgo bajo en mujeres');
  });

  it('calcula score máximo 9 en paciente con todos los factores presentes', () => {
    const res = calcCHA2DS2VASc(
      emptySession({
        age: 78,
        sex: 'female',
        condition: 'ic',
        hypertension: true,
        diabetes: true,
        previousStroke: true,
        vascularDisease: true,
      }),
    );
    // C(1) + H(1) + A2(2) + D(1) + S2(2) + V(1) + Sc(1) = 9
    expect(res.score).toBe(9);
    expect(res.interpretation).toContain('AC generalmente recomendada en mujeres');
  });

  it('asigna 2 puntos para edad ≥75 y 1 punto para edad 65–74', () => {
    const res75 = calcCHA2DS2VASc(
      emptySession({
        age: 75,
        sex: 'male',
        lvef: 60,
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(res75.score).toBe(2);
    expect(res75.components.find((c) => c.acronymLetter === 'A₂')?.points).toBe(2);
    expect(res75.components.find((c) => c.acronymLetter === 'A')?.points).toBe(0);

    const res68 = calcCHA2DS2VASc(
      emptySession({
        age: 68,
        sex: 'male',
        lvef: 60,
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(res68.score).toBe(1);
    expect(res68.components.find((c) => c.acronymLetter === 'A₂')?.points).toBe(0);
    expect(res68.components.find((c) => c.acronymLetter === 'A')?.points).toBe(1);
  });

  it('asigna 2 puntos por ACV/AIT previo (S₂)', () => {
    const res = calcCHA2DS2VASc(
      emptySession({
        age: 50,
        sex: 'male',
        lvef: 55,
        previousStroke: true,
        hypertension: false,
        diabetes: false,
        vascularDisease: false,
      }),
    );
    expect(res.score).toBe(2);
    const s2 = res.components.find((c) => c.acronymLetter === 'S₂');
    expect(s2?.points).toBe(2);
  });

  it('puntuá C si condition es IC o si FEVI es ≤40%', () => {
    const resLvef = calcCHA2DS2VASc(
      emptySession({
        age: 50,
        sex: 'male',
        lvef: 35,
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(resLvef.score).toBe(1);
    expect(resLvef.components.find((c) => c.acronymLetter === 'C')?.points).toBe(1);

    const resIC = calcCHA2DS2VASc(
      emptySession({
        age: 50,
        sex: 'male',
        condition: 'ic',
        hypertension: false,
        diabetes: false,
        previousStroke: false,
        vascularDisease: false,
      }),
    );
    expect(resIC.score).toBe(1);
    expect(resIC.components.find((c) => c.acronymLetter === 'C')?.points).toBe(1);
  });
});
