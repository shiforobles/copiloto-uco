import { describe, expect, it } from 'vitest';
import { runSafetyAudit } from '../../src/rules/safety-audit.engine';
import { emptySession } from '../helpers/session';

describe('Auditoría de seguridad transversal', () => {
  it('identifica datos ausentes y no asume normalidad ante sesión vacía', () => {
    const res = runSafetyAudit(emptySession());
    expect(res.missing.length).toBeGreaterThan(0);
    expect(res.missing.some((f) => f.category === 'electrolytes')).toBe(true);
    expect(res.missing.some((f) => f.category === 'labvalue')).toBe(true);
    expect(res.missing.some((f) => f.category === 'tev_prophylaxis')).toBe(true);
    expect(res.missing.some((f) => f.category === 'renal')).toBe(true);
  });

  it('reconoce profilaxis TEV cubierta si hay anticoagulación terapéutica marcada', () => {
    const res = runSafetyAudit(
      emptySession({
        selectedTherapyOptionIds: ['apixaban-af'],
      }),
    );
    expect(res.receives.some((f) => f.category === 'tev_prophylaxis')).toBe(true);
    expect(res.receives.some((f) => /cubre profilaxis TEV/i.test(f.message))).toBe(true);
  });

  it('desaconseja profilaxis TEV farmacológica y sugiere mecánica ante sangrado activo confirmado', () => {
    const res = runSafetyAudit(
      emptySession({
        activeBleed: true,
      }),
    );
    expect(res.caution.some((f) => /medidas mecánicas/i.test(f.message))).toBe(true);
  });

  it('identifica IBP recibido y alerta interacción clopidogrel + omeprazol', () => {
    const res = runSafetyAudit(
      emptySession({
        selectedTherapyOptionIds: ['clopidogrel', 'omeprazole'],
      }),
    );
    expect(res.receives.some((f) => f.category === 'gi_protection')).toBe(true);
    expect(res.caution.some((f) => /CYP2C19/i.test(f.message))).toBe(true);
  });

  it('sugiere gastroprotección cuando hay ≥2 factores de riesgo GI', () => {
    const res = runSafetyAudit(
      emptySession({
        age: 72,
        selectedTherapyOptionIds: ['aas', 'apixaban-af'],
      }),
    );
    expect(res.missing.some((f) => f.category === 'gi_protection' && /considerar IBP/i.test(f.message))).toBe(true);
  });

  it('coloca hiperpotasemia grave (K ≥5.5 mEq/L) en bloque evitar', () => {
    const res = runSafetyAudit(
      emptySession({
        potassium: 5.8,
      }),
    );
    expect(res.avoid.some((f) => f.category === 'electrolytes' && /hiperpotasemia grave/i.test(f.message))).toBe(true);
  });

  it('alerta hiperpotasemia moderada (K 5.0–5.4 mEq/L) en bloque precaución', () => {
    const res = runSafetyAudit(
      emptySession({
        potassium: 5.2,
      }),
    );
    expect(res.caution.some((f) => f.category === 'electrolytes' && /hiperpotasemia moderada/i.test(f.message))).toBe(true);
  });

  it('alerta hipopotasemia (K <3.5 mEq/L) e hipomagnesemia (Mg <1.7 mEq/L)', () => {
    const res = runSafetyAudit(
      emptySession({
        potassium: 3.2,
        magnesium: 1.5,
      }),
    );
    expect(res.caution.some((f) => /hipopotasemia/i.test(f.message))).toBe(true);
    expect(res.caution.some((f) => /hipomagnesemia/i.test(f.message))).toBe(true);
  });

  it('coloca QTc >500 ms en bloque evitar por riesgo de arritmias ventriculares', () => {
    const res = runSafetyAudit(
      emptySession({
        qtcMs: 520,
      }),
    );
    expect(res.avoid.some((f) => f.category === 'cardiac' && />500 ms/i.test(f.message))).toBe(true);
  });

  it('alerta anemia grave (Hb <7 g/dL) en bloque evitar', () => {
    const res = runSafetyAudit(
      emptySession({
        hemoglobin: 6.5,
      }),
    );
    expect(res.avoid.some((f) => f.category === 'bleeding' && /anemia grave/i.test(f.message))).toBe(true);
  });

  it('alerta trombocitopenia grave (plaquetas <50k) en bloque evitar', () => {
    const res = runSafetyAudit(
      emptySession({
        platelets: 35,
      }),
    );
    expect(res.avoid.some((f) => f.category === 'bleeding' && /trombocitopenia grave/i.test(f.message))).toBe(true);
  });

  it('alerta contraindicación crítica si hay anticoagulante marcado y sangrado activo confirmado', () => {
    const res = runSafetyAudit(
      emptySession({
        activeBleed: true,
        selectedTherapyOptionIds: ['enoxaparin-sca'],
      }),
    );
    expect(res.avoid.some((f) => /Anticoagulante marcado \+ sangrado activo/i.test(f.message))).toBe(true);
  });

  it('alerta sobre AKI en curso y precaución con nefrotóxicos', () => {
    const res = runSafetyAudit(
      emptySession({
        aki: true,
        age: 65,
        sex: 'male',
        weight: 70,
        creatinine: 2.2,
      }),
    );
    expect(res.caution.some((f) => /AKI en curso/i.test(f.message))).toBe(true);
  });

  it('detecta duplicación de anticoagulantes en bloque evitar', () => {
    const res = runSafetyAudit(
      emptySession({
        selectedTherapyOptionIds: ['apixaban-af', 'warfarin-af'],
      }),
    );
    expect(res.avoid.some((f) => f.category === 'duplication' && /dos anticoagulantes simultáneos/i.test(f.message))).toBe(true);
  });

  it('detecta triple terapia antitrombótica con alerta de alto riesgo de sangrado', () => {
    const res = runSafetyAudit(
      emptySession({
        selectedTherapyOptionIds: ['aas', 'clopidogrel', 'apixaban-af'],
      }),
    );
    expect(res.avoid.some((f) => f.category === 'duplication' && /Triple terapia/i.test(f.message))).toBe(true);
  });

  it('detecta doble bloqueo del SRAA (IECA + ARA-II)', () => {
    const res = runSafetyAudit(
      emptySession({
        selectedTherapyOptionIds: ['enalapril-hf', 'losartan-hf'],
      }),
    );
    expect(res.avoid.some((f) => f.category === 'duplication' && /IECA \+ ARA-II/i.test(f.message))).toBe(true);
  });
});
