import { describe, expect, it } from 'vitest';
import { afTherapyGroups } from '../../src/data/af-therapy-matrix';
import { evaluateAFTherapyOption } from '../../src/rules/af-therapy.engine';
import { calcAFRiskScores } from '../../src/rules/cha2ds2vasc';
import { runSafetyAudit } from '../../src/rules/safety-audit.engine';
import { emptySession } from '../helpers/session';

const session = (overrides: Parameters<typeof emptySession>[0] = {}) =>
  emptySession({ hasAF: true, ...overrides });

function option(id: string) {
  const found = afTherapyGroups.flatMap((group) => group.options).find((item) => item.id === id);
  if (!found) throw new Error(`Opción FA inexistente: ${id}`);
  return found;
}

describe('Manejo de Fibrilación Auricular según Guías (ESC 2024 / ACC/AHA 2023) y Regímenes ACOD', () => {
  // ── 1. Duración de la FA y cardioversión ──
  it('FA <24 h: cardioversión precoz recomendada con anticoagulación peri-procedimiento', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: 'lt24h' }),
    );
    expect(res.contextNotes.some((n) => n.includes('FA <24 h: cardioversión precoz razonable'))).toBe(true);
  });

  it('FA 24–48 h: riesgo intermedio con advertencia según ESC 2024', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: '24_48h' }),
    );
    expect(res.contextNotes.some((n) => n.includes('FA 24–48 h: riesgo embólico intermedio'))).toBe(true);
  });

  it('FA ≥48 h sin anticoagulación previa: requiere ETE o ≥3 semanas de AC', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: 'gte48h', priorTherapeuticAnticoag: false }),
    );
    expect(res.warnings.some((w) => /ETE.*anticoagular ≥3 semanas/i.test(w))).toBe(true);
  });

  it('FA de duración desconocida sin anticoagulación previa: requiere ETE o ≥3 semanas de AC', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({ afDuration: 'unknown', priorTherapeuticAnticoag: false }),
    );
    expect(res.warnings.some((w) => /ETE.*anticoagular ≥3 semanas/i.test(w))).toBe(true);
  });

  it('FA ≥48 h con anticoagulación previa de 3 semanas Y adherencia confirmada: habilita cardioversión', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({
        afDuration: 'gte48h',
        priorTherapeuticAnticoag: true,
        confirmedAdherence: true,
      }),
    );
    expect(res.contextNotes.some((n) => n.includes('adherencia confirmada: cardioversión electiva habilitada'))).toBe(true);
  });

  it('FA ≥48 h con AC previa pero falta de adherencia confirmada: advierte necesidad de ETE', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({
        afDuration: 'gte48h',
        priorTherapeuticAnticoag: true,
        confirmedAdherence: false,
      }),
    );
    expect(res.warnings.some((w) => /falta de adherencia confirmada/i.test(w))).toBe(true);
  });

  it('FA ≥48 h guiada por ETE (sin trombo en orejuela): habilita cardioversión precoz', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({
        afDuration: 'gte48h',
        priorTherapeuticAnticoag: false,
        teeNoThrombus: true,
      }),
    );
    expect(res.contextNotes.some((n) => n.includes('ETE sin trombo auricular demostrado: permite proceder'))).toBe(true);
  });

  it('paciente hemodinámicamente inestable: la cardioversión eléctrica urgente no debe demorarse por duración ni AC previa', () => {
    const res = evaluateAFTherapyOption(
      option('electrical-cv-af'),
      session({
        systolicBP: 75,
        afDuration: 'gte48h',
        priorTherapeuticAnticoag: false,
      }),
    );
    expect(res.contextNotes.some((n) => n.includes('no debe demorarse por duración ni por anticoagulación previa'))).toBe(true);
  });

  // ── 2. Contraindicaciones valvulares en ACOD ──
  it('prótesis valvular mecánica contraindica todos los ACOD (estudio RE-ALIGN)', () => {
    const apixRes = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ mechanicalValve: true, age: 70, weight: 70, creatinine: 1, sex: 'male' }),
    );
    expect(apixRes.warnings.some((w) => /Prótesis valvular mecánica.*CONTRAINDICADOS.*RE-ALIGN/i.test(w))).toBe(true);

    const audit = runSafetyAudit(
      session({ mechanicalValve: true, selectedTherapyOptionIds: ['dabigatran-af'] }),
    );
    expect(audit.avoid.some((f) => /Prótesis valvular mecánica/i.test(f.message))).toBe(true);
  });

  it('estenosis mitral reumática significativa contraindica/desaconseja ACOD (estudio INVICTUS)', () => {
    const rivaRes = evaluateAFTherapyOption(
      option('rivaroxaban-af'),
      session({ rheumaticMitralStenosis: true, age: 70, weight: 70, creatinine: 1, sex: 'male' }),
    );
    expect(rivaRes.warnings.some((w) => /Estenosis mitral reumática.*contraindicados.*INVICTUS/i.test(w))).toBe(true);

    const audit = runSafetyAudit(
      session({ rheumaticMitralStenosis: true, selectedTherapyOptionIds: ['rivaroxaban-af'] }),
    );
    expect(audit.avoid.some((f) => /Estenosis mitral reumática/i.test(f.message))).toBe(true);
  });

  // ── 3. Divergencia de Scores: CHA₂DS₂-VASc vs CHA₂DS₂-VA ──
  it('en mujer sin otros factores de riesgo, CHA₂DS₂-VASc = 1 pero CHA₂DS₂-VA = 0 (ESC 2024)', () => {
    const s = session({
      sex: 'female',
      age: 50,
      hypertension: false,
      diabetes: false,
      previousStroke: false,
      vascularDisease: false,
      congestion: false,
    });
    const scores = calcAFRiskScores(s);
    expect(scores.cha2ds2vasc.score).toBe(1); // 1 pt por sexo femenino
    expect(scores.cha2ds2va.score).toBe(0); // 0 pts según ESC 2024 (sexo no suma)
    expect(scores.cha2ds2va.source).toContain('ESC 2024');
    expect(scores.cha2ds2vasc.source).toContain('ACC/AHA');
  });

  it('muestra perfil de guías ESC 2024 en notas de contexto cuando está configurado', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({
        afGuidelineProfile: 'esc_2024',
        age: 72,
        sex: 'female',
        hypertension: true,
        weight: 65,
        creatinine: 1.0,
      }),
    );
    expect(res.contextNotes.some((n) => n.includes('CHA₂DS₂-VA (ESC 2024)'))).toBe(true);
  });

  // ── 4. Regímenes de ACOD y Jurisdicción Regulatoria ──
  it('dabigatrán 110 mg c/12 h señala aprobación en Argentina (ANMAT) y Europa (EMA) pero ausencia en FDA', () => {
    const res = evaluateAFTherapyOption(
      option('dabigatran-af'),
      session({ age: 82, weight: 70, creatinine: 1.0, sex: 'female' }),
    );
    expect(res.patientDose).toContain('110 mg c/12 h');
    expect(res.patientDose).toContain('ANMAT');
    expect(res.patientDose).toContain('FDA');
  });

  it('apixabán en ClCr <15 señala contraindicación/falta de datos en ficha ANMAT y EMA', () => {
    const res = evaluateAFTherapyOption(
      option('apixaban-af'),
      session({ age: 85, weight: 45, creatinine: 3.5, sex: 'female' }),
    );
    expect(res.warnings.some((w) => /ANMAT\/EMA/i.test(w))).toBe(true);
  });

  it('edoxabán en ClCr >95 señala advertencia de eficacia reducida de EMA y FDA', () => {
    const res = evaluateAFTherapyOption(
      option('edoxaban-af'),
      session({ age: 40, weight: 85, creatinine: 0.7, sex: 'male' }),
    );
    expect(res.warnings.some((w) => /advertencia EMA y FDA/i.test(w))).toBe(true);
  });

  it('la selección incompleta de medicación nunca oculta las alternativas terapéuticas', () => {
    const res = evaluateAFTherapyOption(option('apixaban-af'), session({ age: null, weight: null }));
    expect(res.option.loadOrStart).toBeDefined();
    expect(res.option.maintenance).toBeDefined();
    expect(res.missingData.length).toBeGreaterThan(0);
  });
});
