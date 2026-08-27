import { describe, it, expect } from 'vitest';
import {
  evaluateRenalRule,
  evaluateAllRenalRules,
} from '../../src/rules/renal-rules.engine';
import { renalRules } from '../../src/data/renal-rules';

describe('Evaluador de reglas renales', () => {
  it('enoxaparina anticoag + ClCr 26 → "1 mg/kg c/24 h"', () => {
    const result = evaluateRenalRule('enoxaparina-anticoag', 26, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).not.toBeNull();
    expect(result!.suggestedDose).toBe('1 mg/kg c/24 h');
  });

  it('enoxaparina anticoag + ClCr 10 → "evitar / considerar HNF" (test discriminante)', () => {
    // ClCr 10: ambos ajustes aplican (clcrMax 30 >= 10, clcrMax 15 >= 10)
    // Debe ganar el de clcrMax 15 (más restrictivo = menor clcrMax)
    const result = evaluateRenalRule('enoxaparina-anticoag', 10, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).not.toBeNull();
    expect(result!.appliedAdjustment!.clcrMax).toBe(15);
    expect(result!.suggestedDose).toBe('evitar / considerar HNF');
  });

  it('enoxaparina anticoag + ClCr 50 → dosis normal', () => {
    const result = evaluateRenalRule('enoxaparina-anticoag', 50, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).toBeNull();
    expect(result!.suggestedDose).toBe('1 mg/kg c/12 h SC');
  });

  it('enoxaparina anticoag + ClCr 30 → "1 mg/kg c/24 h" (exactamente en el borde)', () => {
    // ClCr 30 exacto: clcrMax 30 aplica (30 <= 30), clcrMax 15 no (30 > 15)
    const result = evaluateRenalRule('enoxaparina-anticoag', 30, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).not.toBeNull();
    expect(result!.suggestedDose).toBe('1 mg/kg c/24 h');
  });

  it('enoxaparina anticoag + ClCr 15 → "evitar" (exactamente en el borde)', () => {
    // ClCr 15: ambos aplican, gana el de 15
    const result = evaluateRenalRule('enoxaparina-anticoag', 15, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('evitar / considerar HNF');
  });

  it('enoxaparina profilaxis + ClCr 20 → "20 mg/día SC"', () => {
    const result = evaluateRenalRule('enoxaparina-profilaxis', 20, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('20 mg/día SC');
  });

  it('regla inexistente → null', () => {
    const result = evaluateRenalRule('inexistente', 50, renalRules);
    expect(result).toBeNull();
  });

  it('dabigatrán + ClCr 25 → "contraindicado"', () => {
    const result = evaluateRenalRule('dabigatran', 25, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('contraindicado');
  });

  it('dabigatrán + ClCr 40 → "110 mg c/12 h"', () => {
    const result = evaluateRenalRule('dabigatran', 40, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toContain('110 mg');
  });

  it('dabigatrán + ClCr 60 → dosis normal', () => {
    const result = evaluateRenalRule('dabigatran', 60, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).toBeNull();
  });
});

describe('evaluateAllRenalRules', () => {
  it('devuelve solo drogas con ajuste activo', () => {
    // ClCr 20: enoxaparina-anticoag tiene ajuste, enoxaparina-profilaxis también
    const results = evaluateAllRenalRules(
      ['enoxaparina-anticoag', 'enoxaparina-profilaxis'],
      20,
      renalRules
    );
    expect(results.length).toBe(2);
    expect(results.every((r) => r.appliedAdjustment !== null)).toBe(true);
  });

  it('droga sin ajuste no aparece en resultados', () => {
    // ClCr 100: ninguna debería tener ajuste
    const results = evaluateAllRenalRules(
      ['enoxaparina-anticoag'],
      100,
      renalRules
    );
    expect(results.length).toBe(0);
  });

  it('droga inexistente no rompe', () => {
    const results = evaluateAllRenalRules(
      ['inexistente'],
      20,
      renalRules
    );
    expect(results.length).toBe(0);
  });
});

describe('Reglas renales — nuevas drogas', () => {
  it('colchicina ClCr 25 → "0,25 mg/día"', () => {
    const result = evaluateRenalRule('colchicina', 25, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).not.toBeNull();
    expect(result!.suggestedDose).toBe('0,25 mg/día');
  });

  it('colchicina ClCr 8 → "contraindicada"', () => {
    const result = evaluateRenalRule('colchicina', 8, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('contraindicada');
  });

  it('colchicina ClCr 50 → dosis normal', () => {
    const result = evaluateRenalRule('colchicina', 50, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).toBeNull();
    expect(result!.suggestedDose).toBe('0,5 mg c/12 h');
  });

  it('alopurinol ClCr 45 → "200 mg/día"', () => {
    const result = evaluateRenalRule('alopurinol', 45, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('200 mg/día');
  });

  it('alopurinol ClCr 20 → "100 mg/día"', () => {
    const result = evaluateRenalRule('alopurinol', 20, renalRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedDose).toBe('100 mg/día');
  });

  it('amiodarona ClCr 20 → dosis normal (sin ajuste renal)', () => {
    const result = evaluateRenalRule('amiodarona', 20, renalRules);
    expect(result).not.toBeNull();
    expect(result!.appliedAdjustment).toBeNull();
    expect(result!.suggestedDose).toBe('200 mg/día (mantenimiento)');
  });
});
