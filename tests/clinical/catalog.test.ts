import { describe, expect, it } from 'vitest';
import { drugs } from '../../src/clinical/drugs';
import { pathways } from '../../src/clinical/pathways';
import { clinicalSources } from '../../src/clinical/sources';
import { searchEntries } from '../../src/clinical/search';
import { renalRules } from '../../src/data/renal-rules';
import { initialState, sessionReducer } from '../../src/context/session';
import { dosingBlockReason, renalBlockReason } from '../../src/clinical/patient';

describe('Integridad del catálogo clínico', () => {
  it('no permite fichas huérfanas, referencias rotas ni dosis sin procedencia', () => {
    for (const catalog of [drugs, pathways]) expect(new Set(catalog.map(e => e.id)).size).toBe(catalog.length);
    for (const entry of [...drugs, ...pathways]) {
      expect(entry.sourceIds.length).toBeGreaterThan(0);
      expect(entry.validation).toBe('pending-local-review');
      for (const source of entry.sourceIds) expect(clinicalSources[source]?.url).toMatch(/^https:\/\//);
    }
    for (const pathway of pathways) for (const drug of pathway.drugIds) expect(drugs.some(d => d.id === drug)).toBe(true);
    for (const drug of drugs) {
      for (const dose of drug.doses) {
        expect(drug.sourceIds).toContain(dose.sourceId);
        expect(dose.context.length).toBeGreaterThan(5);
      }
      for (const rule of drug.renalRuleIds ?? []) expect(renalRules.some(r => r.id === rule)).toBe(true);
    }
  });
  it('busca sin acentos, por alias y con prioridad de coincidencia exacta', () => {
    expect(searchEntries(drugs, 'amiodarona')[0].id).toBe('amiodarona');
    expect(searchEntries(drugs, 'HNF')[0].id).toBe('heparina');
    expect(searchEntries(pathways, 'FA')[0].id).toBe('fa');
    expect(searchEntries(pathways, 'edema pulmonar')[0].id).toBe('ic-aguda');
    expect(searchEntries(drugs, 'apixaban')[0].id).toBe('apixaban');
    expect(searchEntries(drugs, 'noradrenalina', 'Electrolitos')).toEqual([]);
    expect(searchEntries(drugs, 'droga inexistente')).toEqual([]);
  });
});

describe('Guardas de sesión clínica', () => {
  const complete = { ...initialState, age: 70, sex: 'male' as const, weight: 80, creatinine: 1, renalStatus: 'stable' as const };
  it('exige estabilidad, datos válidos y edad adulta antes de reglas renales', () => {
    expect(dosingBlockReason(complete)).toBeNull();
    expect(dosingBlockReason({ ...complete, renalStatus: 'unknown' })).toContain('Confirmá');
    for (const patch of [{ weight: null }, { creatinine: 0 }, { age: 10 }, { age: 80.5 }, { height: 1.7 }, { weight: Infinity }]) expect(dosingBlockReason({ ...complete, ...patch })).not.toBeNull();
  });
  it('suspende estimaciones en creatinina cambiante y diálisis', () => {
    expect(renalBlockReason({ ...complete, renalStatus: 'unstable' })).toContain('Creatinina cambiante');
    expect(renalBlockReason({ ...complete, renalStatus: 'dialysis' })).toContain('Diálisis');
  });
  it('mantiene revisión por cuadro y la borra al iniciar nueva sesión', () => {
    const marked = sessionReducer(complete, { type: 'TOGGLE_PATHWAY_CHECK', pathwayId: 'shock', index: 1 });
    expect(marked.pathwayChecks.shock).toEqual([1]);
    const another = sessionReducer(marked, { type: 'TOGGLE_PATHWAY_CHECK', pathwayId: 'paro', index: 0 });
    expect(another.pathwayChecks.shock).toEqual([1]);
    expect(sessionReducer(another, { type: 'RESET_SESSION' })).toEqual(initialState);
  });
});
