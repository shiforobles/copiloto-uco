import { describe, it, expect } from 'vitest';
import { evaluateChecklist } from '../../src/rules/checklist.engine';
import { checklistIC } from '../../src/data/checklist-ic';
import { checklistSCA } from '../../src/data/checklist-sca';

describe('Evaluador de checklist IC', () => {
  it('IC + shock_inotropicos → NO sugiere betabloqueante', () => {
    const results = evaluateChecklist(
      'shock_inotropicos',
      'ic',
      false,
      [],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).not.toContain('betabloqueante');
    // Pero sí debe sugerir otros pilares que aplican en shock
    expect(ids).toContain('isglt2');
    expect(ids).toContain('diuretico-asa');
  });

  it('IC + pre_alta → SÍ sugiere betabloqueante si falta', () => {
    const results = evaluateChecklist(
      'pre_alta',
      'ic',
      false,
      [],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).toContain('betabloqueante');
  });

  it('IC + compensado → sugiere todos los pilares principales', () => {
    const results = evaluateChecklist(
      'compensado',
      'ic',
      false,
      [],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).toContain('ieca-araii');
    expect(ids).toContain('betabloqueante');
    expect(ids).toContain('arm');
    expect(ids).toContain('isglt2');
    expect(ids).toContain('diuretico-asa');
    // No anticoag porque no tiene FA
    expect(ids).not.toContain('anticoag-fa');
  });

  it('IC + FA → sugiere anticoagulación', () => {
    const results = evaluateChecklist(
      'compensado',
      'ic',
      true, // tiene FA
      [],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).toContain('anticoag-fa');
  });

  it('IC + sin FA → NO sugiere anticoagulación', () => {
    const results = evaluateChecklist(
      'compensado',
      'ic',
      false,
      [],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).not.toContain('anticoag-fa');
  });

  it('pilar ya cubierto → no aparece en faltantes', () => {
    const results = evaluateChecklist(
      'pre_alta',
      'ic',
      false,
      ['betabloqueante', 'ieca-araii'],
      checklistIC
    );
    const ids = results.map((r) => r.item.id);
    expect(ids).not.toContain('betabloqueante');
    expect(ids).not.toContain('ieca-araii');
    // Pero otros faltantes sí
    expect(ids).toContain('arm');
  });

  it('condición no IC ni SCA, sin FA → checklist vacío', () => {
    const results = evaluateChecklist(
      'compensado',
      'otra',
      false,
      [],
      checklistIC
    );
    expect(results).toHaveLength(0);
  });

  it('condición no IC ni SCA, con FA → solo anticoagulación', () => {
    const results = evaluateChecklist(
      'compensado',
      'otra',
      true,
      [],
      checklistIC
    );
    expect(results).toHaveLength(1);
    expect(results[0].item.id).toBe('anticoag-fa');
  });

  it('misma sesión: cambiar fase actualiza resultados', () => {
    // En shock: no BB
    const shockResults = evaluateChecklist(
      'shock_inotropicos',
      'ic',
      false,
      [],
      checklistIC
    );
    expect(shockResults.map((r) => r.item.id)).not.toContain('betabloqueante');

    // Cambiar a pre_alta: sí BB
    const preAltaResults = evaluateChecklist(
      'pre_alta',
      'ic',
      false,
      [],
      checklistIC
    );
    expect(preAltaResults.map((r) => r.item.id)).toContain('betabloqueante');
  });

  describe('Precauciones con signos vitales', () => {
    it('K alto → warning en ARM', () => {
      const results = evaluateChecklist(
        'compensado',
        'ic',
        false,
        [],
        checklistIC,
        { potassium: 5.8 }
      );
      const arm = results.find((r) => r.item.id === 'arm');
      expect(arm).toBeDefined();
      expect(arm!.precautionWarnings.length).toBeGreaterThan(0);
      expect(arm!.precautionWarnings.some(w => w.includes('K 5.8'))).toBe(true);
    });

    it('TAS baja → warning en IECA', () => {
      const results = evaluateChecklist(
        'compensado',
        'ic',
        false,
        [],
        checklistIC,
        { systolicBP: 85 }
      );
      const ieca = results.find((r) => r.item.id === 'ieca-araii');
      expect(ieca).toBeDefined();
      expect(ieca!.precautionWarnings.some((w) => w.includes('TAS'))).toBe(true);
    });

    it('FC baja → warning en betabloqueante', () => {
      const results = evaluateChecklist(
        'pre_alta',
        'ic',
        false,
        [],
        checklistIC,
        { heartRate: 50 }
      );
      const bb = results.find((r) => r.item.id === 'betabloqueante');
      expect(bb).toBeDefined();
      expect(bb!.precautionWarnings.some((w) => w.includes('FC'))).toBe(true);
    });

    it('sin vitals → informa las precauciones que no se pueden evaluar', () => {
      const results = evaluateChecklist(
        'compensado',
        'ic',
        false,
        [],
        checklistIC
      );
      const arm = results.find(r => r.item.id === 'arm')!;
      expect(arm.precautionWarnings).toContain('Potasio no informado: precaución sin evaluar.');
      expect(arm.precautionWarnings).toContain('Función renal no evaluable: precaución sin evaluar.');
    });
  });
});

describe('Evaluador de checklist SCA', () => {
  it('SCA + shock → doble antiagregación + anticoag SCA, NO estatina ni BB', () => {
    const results = evaluateChecklist(
      'shock_inotropicos',
      'sca',
      false,
      [],
      checklistSCA
    );
    const pilares = results.map((r) => r.item.pilar);
    expect(pilares).toContain('Doble antiagregación');
    expect(pilares).toContain('Anticoagulación SCA');
    expect(pilares).not.toContain('Estatina alta potencia');
    expect(pilares).not.toContain('Betabloqueante');
    expect(pilares).not.toContain('IECA/ARA II');
  });

  it('SCA + pre_alta → antiagregación + estatina + BB + IECA, NO anticoag SCA', () => {
    const results = evaluateChecklist(
      'pre_alta',
      'sca',
      false,
      [],
      checklistSCA
    );
    const pilares = results.map((r) => r.item.pilar);
    expect(pilares).toContain('Doble antiagregación');
    expect(pilares).toContain('Estatina alta potencia');
    expect(pilares).toContain('Betabloqueante');
    expect(pilares).toContain('IECA/ARA II');
    expect(pilares).not.toContain('Anticoagulación SCA');
  });

  it('SCA + FA → incluye anticoagulación por FA', () => {
    const results = evaluateChecklist(
      'compensado',
      'sca',
      true,
      [],
      checklistSCA
    );
    const pilares = results.map((r) => r.item.pilar);
    expect(pilares).toContain('Anticoagulación (FA)');
  });

  it('SCA sin FA → NO incluye anticoagulación por FA', () => {
    const results = evaluateChecklist(
      'compensado',
      'sca',
      false,
      [],
      checklistSCA
    );
    const pilares = results.map((r) => r.item.pilar);
    expect(pilares).not.toContain('Anticoagulación (FA)');
  });

  it('condición "otra" con checklist SCA → vacío', () => {
    const results = evaluateChecklist(
      'compensado',
      'otra',
      false,
      [],
      checklistSCA
    );
    expect(results.length).toBe(0);
  });
});
