import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DRUGS,
  areDrugsSameClass,
  type DrugId,
} from '../../src/data/canonical-drugs';
import { CLINICAL_SOURCES } from '../../src/data/clinical-sources';
import { scaTherapyGroups } from '../../src/data/sca-therapy-matrix';
import { hfTherapyGroups } from '../../src/data/hf-therapy-matrix';
import { afTherapyGroups } from '../../src/data/af-therapy-matrix';
import {
  sessionReducer,
  initialState,
  type SessionState,
} from '../../src/context/session';
import { runSafetyAudit } from '../../src/rules/safety-audit.engine';
import { emptySession } from '../helpers/session';

describe('Registro Canónico de Medicamentos y Fuentes Clínicas', () => {
  it('todos los drugId canónicos son únicos y están definidos en el catálogo', () => {
    const drugIds = Object.keys(CANONICAL_DRUGS);
    const uniqueIds = new Set(drugIds);
    expect(drugIds.length).toBe(uniqueIds.size);
    for (const [_id, drug] of Object.entries(CANONICAL_DRUGS)) {
      expect(drug.id).toBeDefined();
      expect(drug.name).toBeDefined();
      expect(drug.classId).toBeDefined();
      expect(drug.className).toBeDefined();
    }
  });

  it('no existen referencias huérfanas en las matrices de SCA, IC y FA', () => {
    const allGroups = [...scaTherapyGroups, ...hfTherapyGroups, ...afTherapyGroups];
    for (const group of allGroups) {
      for (const option of group.options) {
        if (option.kind === 'drug' || option.drugId) {
          expect(option.drugId).toBeDefined();
          expect(CANONICAL_DRUGS[option.drugId as DrugId]).toBeDefined();
        } else if (option.kind === 'procedure' || option.kind === 'strategy') {
          // Opciones no farmacológicas admiten no tener drugId
          expect(option.id).toBeDefined();
        }
      }
    }
  });

  it('la opción de cardioversión eléctrica en FA no tiene drugId obligatorio y es kind procedure', () => {
    const cvOption = afTherapyGroups
      .flatMap((g) => g.options)
      .find((o) => o.id === 'electrical-cv-af');
    expect(cvOption).toBeDefined();
    expect(cvOption?.kind).toBe('procedure');
    expect(cvOption?.drugId).toBeUndefined();
  });

  it('todas las fuentes clínicas canónicas tienen URL oficial y año definidos', () => {
    for (const [sourceId, source] of Object.entries(CLINICAL_SOURCES)) {
      expect(source.sourceId).toBe(sourceId);
      expect(source.organization).toBeDefined();
      expect(source.title).toBeDefined();
      expect(source.year).toBeGreaterThanOrEqual(2000);
      expect(source.url).toMatch(/^https?:\/\//);
      expect(source.jurisdiction).toBeDefined();
    }
  });

  it('toda regla verificada (verified: true) debe tener al menos una fuente clínica válida', () => {
    const allGroups = [...scaTherapyGroups, ...hfTherapyGroups, ...afTherapyGroups];
    for (const group of allGroups) {
      for (const option of group.options) {
        if (option.verified === true) {
          expect(option.sources.length).toBeGreaterThan(0);
          for (const s of option.sources) {
            expect(s.url).toMatch(/^https?:\/\//);
          }
        }
      }
    }
  });

  it('detecta correctamente si dos fármacos pertenecen a la misma clase farmacológica', () => {
    expect(areDrugsSameClass('bisoprolol', 'carvedilol')).toBe(true);
    expect(areDrugsSameClass('enalapril', 'ramipril')).toBe(true);
    expect(areDrugsSameClass('apixaban', 'rivaroxaban')).toBe(true);
    expect(areDrugsSameClass('spironolactone', 'eplerenone')).toBe(true);
    expect(areDrugsSameClass('bisoprolol', 'enalapril')).toBe(false);
    expect(areDrugsSameClass('aspirin', 'furosemide')).toBe(false);
  });
});

describe('Sincronización Transversal de Medicación Actual (SessionState)', () => {
  it('marcar bisoprolol en IC lo sincroniza como recibido en SCA y FA', () => {
    let state: SessionState = { ...initialState };
    // Marcar bisoprolol desde IC
    state = sessionReducer(state, { type: 'TOGGLE_THERAPY_OPTION', optionId: 'bisoprolol-hf' });
    expect(state.selectedTherapyOptionIds).toContain('bisoprolol-hf');
    expect(state.selectedTherapyOptionIds).toContain('bisoprolol'); // SCA
    expect(state.selectedTherapyOptionIds).toContain('bisoprolol-af'); // FA
    expect(state.currentMedications.some((m) => m.drugId === 'bisoprolol')).toBe(true);
  });

  it('desmarcar bisoprolol desde SCA lo desmarca en IC y FA', () => {
    let state: SessionState = { ...initialState };
    state = sessionReducer(state, { type: 'TOGGLE_THERAPY_OPTION', optionId: 'bisoprolol-hf' });
    expect(state.selectedTherapyOptionIds).toContain('bisoprolol');

    // Desmarcar desde SCA
    state = sessionReducer(state, { type: 'TOGGLE_THERAPY_OPTION', optionId: 'bisoprolol' });
    expect(state.selectedTherapyOptionIds).not.toContain('bisoprolol-hf');
    expect(state.selectedTherapyOptionIds).not.toContain('bisoprolol');
    expect(state.selectedTherapyOptionIds).not.toContain('bisoprolol-af');
    expect(state.currentMedications.some((m) => m.drugId === 'bisoprolol')).toBe(false);
  });

  it('distingue entre recibir el medicamento y que la dosis coincida con el régimen evaluado', () => {
    let state: SessionState = { ...initialState };
    state = sessionReducer(state, {
      type: 'ADD_CURRENT_MEDICATION',
      medication: {
        drugId: 'bisoprolol',
        currentDoseText: '2.5 mg/día',
        route: 'oral',
        frequency: 'c/24 h',
        doseMatchesEvaluatedRegimen: false,
      },
    });
    const med = state.currentMedications.find((m) => m.drugId === 'bisoprolol');
    expect(med).toBeDefined();
    expect(med?.currentDoseText).toBe('2.5 mg/día');
    expect(med?.doseMatchesEvaluatedRegimen).toBe(false);
  });

  it('el mismo fármaco conserva el mismo drugId pero tiene dosis e indicaciones separadas (Enoxaparina)', () => {
    const scaEnox = scaTherapyGroups
      .flatMap((g) => g.options)
      .find((o) => o.id === 'enoxaparin-sca');
    const afEnox = afTherapyGroups
      .flatMap((g) => g.options)
      .find((o) => o.id === 'enoxaparin-af');

    expect(scaEnox?.drugId).toBe('enoxaparin');
    expect(afEnox?.drugId).toBe('enoxaparin');
    // Las dosis son diferentes según indicación
    expect(scaEnox?.loadOrStart).toContain('SCASEST');
    expect(afEnox?.loadOrStart).toContain('1 mg/kg c/12 h SC');
    expect(scaEnox?.indicationId).toBe('ind-sca');
    expect(afEnox?.indicationId).toBe('ind-af');
  });

  it('permite asociar indicación si se conoce o mantenerla como desconocida si no fue aportada', () => {
    let state: SessionState = { ...initialState };
    state = sessionReducer(state, {
      type: 'ADD_CURRENT_MEDICATION',
      medication: {
        drugId: 'apixaban',
        currentDoseText: '5 mg c/12 h',
        route: 'oral',
        frequency: 'c/12 h',
        indicationId: undefined, // no aportada
      },
    });
    expect(state.currentMedications[0].indicationId).toBeUndefined();

    // Actualizar asociando indicación
    state = sessionReducer(state, {
      type: 'UPDATE_CURRENT_MEDICATION',
      drugId: 'apixaban',
      updates: {
        indicationId: 'ind-af',
      },
    });
    expect(state.currentMedications[0].indicationId).toBe('ind-af');
  });

  it('RESET_SESSION reinicia completamente el estado sin dejar residuos', () => {
    let state: SessionState = {
      ...initialState,
      age: 75,
      weight: 80,
      selectedTherapyOptionIds: ['bisoprolol', 'aas'],
      currentMedications: [{ drugId: 'bisoprolol', route: 'oral' }],
    };
    state = sessionReducer(state, { type: 'RESET_SESSION' });
    expect(state.age).toBeNull();
    expect(state.weight).toBeNull();
    expect(state.selectedTherapyOptionIds).toEqual([]);
    expect(state.currentMedications).toEqual([]);
  });

  it('detecta duplicación de clase farmacológica en la auditoría de seguridad', () => {
    const state = emptySession({
      selectedTherapyOptionIds: ['bisoprolol', 'carvedilol'],
    });
    const audit = runSafetyAudit(state);
    expect(
      audit.avoid.some(
        (f) => f.category === 'duplication' && /betabloqueantes/i.test(f.message),
      ),
    ).toBe(true);
  });

  it('detecta duplicación de clase ARM (espironolactona + eplerenona)', () => {
    const state = emptySession({
      selectedTherapyOptionIds: ['spironolactone-hf', 'eplerenone-hf'],
    });
    const audit = runSafetyAudit(state);
    expect(
      audit.avoid.some(
        (f) => f.category === 'duplication' && /ARM/i.test(f.message),
      ),
    ).toBe(true);
  });
});
