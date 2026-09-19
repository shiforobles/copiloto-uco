import { describe, expect, it } from 'vitest';
import { buildDaptReference, type DaptDrugId, type DaptReference } from '../../src/clinical/dapt-reference';
import { initialState, type SessionState } from '../../src/context/session';
import type { TherapyContext } from '../../src/clinical/therapy-context';

function patient(therapy: Partial<TherapyContext> = {}, fields: Partial<SessionState> = {}): SessionState {
  return { ...initialState, condition: 'sca', ...fields, therapy: { ...initialState.therapy, ...therapy } };
}
const pci = { acsType: 'stemi', strategy: 'pci' } as const;
const row = (reference: DaptReference, id: DaptDrugId) => reference.rows.find(r => r.id === id)!;
function allFour(reference: DaptReference) {
  expect(reference.rows.map(r => r.id).sort()).toEqual(['aas', 'clopidogrel', 'prasugrel', 'ticagrelor']);
  expect(reference.rows.every(r => r.dose.includes('mg VO cada'))).toBe(true);
}

describe('Referencia DAPT con revelado progresivo', () => {
  it('muestra las cuatro referencias incluso con la sesión totalmente vacía', () => {
    const result = buildDaptReference(initialState);
    allFour(result);
    expect(result.heading).toBe('Referencia general — faltan datos para personalizar');
    expect(result.contextual).toBe(false);
    expect(result.commonPending).toContain('Indicación por SCA');
    expect(result.alerts.join(' ')).toContain('Confirmar indicación');
  });

  it('con solo SCA conserva dosis, contraindicaciones y desconocidos sin bloquear', () => {
    const state = patient();
    const result = buildDaptReference(state);
    allFour(result);
    expect(result.rows.every(r => r.status === 'confirm')).toBe(true);
    expect(row(result, 'aas').dose).toBe('75–100 mg VO cada 24 h');
    expect(row(result, 'ticagrelor').dose).toBe('90 mg VO cada 12 h');
    expect(row(result, 'prasugrel').dose).toContain('5 mg si <60 kg');
    expect(row(result, 'clopidogrel').dose).toBe('75 mg VO cada 24 h');
    expect(result.commonPending).toEqual(expect.arrayContaining(['Tipo de SCA', 'Estrategia', 'Sangrado activo', 'Indicación de anticoagulación oral']));
    expect(row(result, 'prasugrel').pending).toContain('ACV/AIT previo');
    expect(result.rows.every(r => r.contraindications.length > 0 && r.avoid.length === 0)).toBe(true);
    expect(state.therapy.activeBleeding).toBe('unknown');
  });

  it('SCACEST + PCI contextualiza sin edad, fase, laboratorio ni antecedentes', () => {
    const result = buildDaptReference(patient(pci));
    allFour(result);
    expect(result.contextual).toBe(true);
    expect(result.heading).toContain('Orientación contextual');
    expect(result.rows.map(r => r.id)).toEqual(['aas', 'ticagrelor', 'prasugrel', 'clopidogrel']);
    expect(row(result, 'ticagrelor').contextualRole).toBe('usual');
    expect(row(result, 'ticagrelor').status).toBe('confirm');
    expect(row(result, 'ticagrelor').pending).toContain('Hemorragia intracraneal previa');
    expect(row(result, 'prasugrel').pending).toEqual(expect.arrayContaining(['Edad', 'Peso', 'ACV/AIT previo']));
  });

  it('desconocido, negativo y positivo de ACV tienen consecuencias distintas', () => {
    const unknown = buildDaptReference(patient(pci));
    const negative = buildDaptReference(patient({ ...pci, priorStroke: 'no' }));
    const positive = buildDaptReference(patient({ ...pci, priorStroke: 'yes' }));
    expect(row(unknown, 'prasugrel').pending).toContain('ACV/AIT previo');
    expect(row(negative, 'prasugrel').pending).not.toContain('ACV/AIT previo');
    expect(row(negative, 'prasugrel').avoid).toEqual([]);
    expect(row(positive, 'prasugrel').status).toBe('avoid');
    expect(positive.rows.filter(r => r.status === 'avoid').map(r => r.id)).toEqual(['prasugrel']);
    allFour(positive);
  });

  it.each([
    ['aspirinAllergy', 'yes', ['aas']],
    ['priorIch', 'yes', ['prasugrel', 'ticagrelor']],
    ['liver', 'severe', ['clopidogrel', 'prasugrel', 'ticagrelor']],
    ['interactions', 'cyp3a', ['ticagrelor']],
    ['interactions', 'omeprazole', ['clopidogrel']],
  ] as const)('aplica %s=%s solamente a las alternativas afectadas', (field, value, affected) => {
    const result = buildDaptReference(patient({ ...pci, [field]: value }));
    allFour(result);
    expect(result.rows.filter(r => r.status === 'avoid').map(r => r.id).sort()).toEqual(affected);
    if (field === 'aspirinAllergy') expect(result.alerts.join(' ')).toContain('no proponer la combinación estándar');
  });

  it('una alergia a P2Y12 sin agente identificado exige aclarar, sin atribuirla a los tres', () => {
    const result = buildDaptReference(patient({ ...pci, p2y12Allergy: 'yes' }));
    allFour(result);
    for (const id of ['ticagrelor', 'prasugrel', 'clopidogrel'] as const) {
      expect(row(result, id).status).toBe('caution');
      expect(row(result, id).cautions.join(' ')).toContain('identificar agente');
      expect(row(result, id).avoid).toEqual([]);
    }
  });

  it('con anticoagulación oral coloca clopidogrel primero entre P2Y12, conservando AAS y alertas', () => {
    const result = buildDaptReference(patient({ ...pci, oralAnticoagulation: 'yes' }));
    allFour(result);
    expect(result.rows[1].id).toBe('clopidogrel');
    expect(row(result, 'clopidogrel').contextualRole).toBe('usual');
    expect(row(result, 'aas').status).toBe('caution');
    expect(row(result, 'ticagrelor').status).toBe('caution');
    expect(result.alerts.join(' ')).toContain('1 y 4 semanas');
    expect(result.commonPending).not.toContain('Indicación de anticoagulación oral');
  });

  it('sangrado activo marca las cuatro como evitar sin ocultar las dosis de referencia', () => {
    const result = buildDaptReference(patient({ ...pci, activeBleeding: 'yes' }));
    allFour(result);
    expect(result.rows.every(r => r.status === 'avoid')).toBe(true);
    expect(result.alerts.join(' ')).toContain('resolver en la internación');
  });

  it.each([[59, '5'], [60, '10']])('adapta prasugrel al límite de peso: %s kg', (weight, dose) => {
    const result = buildDaptReference(patient(pci, { age: 74, weight }));
    expect(row(result, 'prasugrel').dose).toBe(`${dose} mg VO cada 24 h`);
    expect(row(result, 'prasugrel').pending).not.toContain('Peso');
    // Personalizar el peso no implica haber descartado ACV ni otras contraindicaciones.
    expect(row(result, 'prasugrel').status).toBe('confirm');
    expect(row(result, 'prasugrel').pending).toContain('ACV/AIT previo');
  });

  it('a los 75 años conserva referencia y precaución; no afirma dosis personalizada de 10 mg', () => {
    const result = buildDaptReference(patient(pci, { age: 75, weight: 80 }));
    allFour(result);
    expect(row(result, 'prasugrel').status).toBe('caution');
    expect(row(result, 'prasugrel').cautions.join(' ')).toContain('Edad ≥75 años');
    expect(row(result, 'prasugrel').doseNote).not.toContain('para 80 kg');
  });

  it('con fibrinólisis ordena clopidogrel como habitual sin extrapolar ticagrelor o prasugrel', () => {
    const result = buildDaptReference(patient({ acsType: 'stemi', strategy: 'fibrinolysis' }));
    allFour(result);
    expect(result.rows[1].id).toBe('clopidogrel');
    expect(row(result, 'clopidogrel').contextualRole).toBe('usual');
    expect(row(result, 'ticagrelor').status).toBe('caution');
    expect(row(result, 'prasugrel').status).toBe('caution');
  });

  it('mantiene la advertencia de fibrinólisis discordante con SCASEST', () => {
    const result = buildDaptReference(patient({ acsType: 'nstemi', strategy: 'fibrinolysis' }));
    allFour(result);
    expect(result.alerts.join(' ')).toContain('Contexto discordante');
    expect(result.rows.every(r => r.status === 'caution')).toBe(true);
  });

  it('no exige fase ni estabilidad renal y conserva advertencias cuando están alteradas', () => {
    const incomplete = buildDaptReference(patient(pci));
    const unstable = buildDaptReference(patient(pci, { phase: 'shock_inotropicos', renalStatus: 'unstable' }));
    allFour(incomplete); allFour(unstable);
    expect(unstable.contextual).toBe(true);
    expect(unstable.alerts.join(' ')).toContain('Shock');
    expect(unstable.alerts.join(' ')).toContain('lesión renal aguda');
  });

  it('laboratorio desconocido no equivale a normal; uno vigente alterado conserva su alerta', () => {
    const unknown = buildDaptReference(patient({ ...pci, hemoglobin: 7, platelets: 80 }));
    const current = buildDaptReference(patient({ ...pci, labsCurrent: 'yes', hemoglobin: 7, platelets: 80 }));
    allFour(current);
    expect(unknown.commonPending).toContain('Vigencia del laboratorio');
    expect(unknown.alerts.join(' ')).not.toContain('anemia marcada');
    expect(current.alerts.join(' ')).toContain('anemia marcada');
    expect(current.alerts.join(' ')).toContain('Plaquetas 80');
    expect(current.rows.every(r => r.status === 'caution')).toBe(true);
  });

  it('identifica el P2Y12 actual y mantiene advertencia de no recargar ni cambiar automáticamente', () => {
    const result = buildDaptReference(patient({ ...pci, currentP2y12: 'clopidogrel' }));
    expect(row(result, 'clopidogrel').current).toBe(true);
    expect(row(result, 'ticagrelor').current).toBe(false);
    expect(result.alerts.join(' ')).toContain('no repetir carga ni cambiar automáticamente');
  });
});
