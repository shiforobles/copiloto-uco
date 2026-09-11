/**
 * Registro canónico de medicamentos, clases, indicaciones y regímenes.
 *
 * FUENTE ÚNICA de identidad farmacológica para toda la aplicación Copiloto UCO.
 * Desacopla:
 *   - Medicamento canónico (drugId estable, independiente del texto mostrado).
 *   - Clase farmacológica (para detección de duplicación de clase).
 *   - Indicación clínica (dosis separadas según patología/objetivo).
 *   - Régimen de dosificación (carga, mantenimiento, ajustes, fuentes).
 *   - Goteos e inotrópicos (dosis terapéutica vs concentración vs velocidad).
 *
 * BORRADOR CLÍNICO — verified: false hasta validación médica institucional.
 */

import type { SourceId } from './clinical-sources';

// ─── Identificadores Fuertemente Tipados ──────────────────────────────────────

export type DrugId =
  // Antiagregantes plaquetarios
  | 'aspirin'
  | 'clopidogrel'
  | 'ticagrelor'
  | 'prasugrel'
  | 'cangrelor'
  // Estatinas / Hipolipemiantes
  | 'atorvastatin'
  | 'rosuvastatin'
  | 'simvastatin'
  | 'ezetimibe'
  | 'evolocumab'
  | 'alirocumab'
  | 'inclisiran'
  | 'bempedoic-acid'
  // Betabloqueantes
  | 'bisoprolol'
  | 'carvedilol'
  | 'metoprolol'
  | 'nebivolol'
  | 'atenolol'
  | 'esmolol'
  // Anticoagulantes parenterales
  | 'enoxaparin'
  | 'unfractionated-heparin'
  | 'ufh'
  | 'fondaparinux'
  | 'bivalirudin'
  // Anticoagulantes orales de acción directa (ACOD)
  | 'apixaban'
  | 'rivaroxaban'
  | 'dabigatran'
  | 'edoxaban'
  // Antagonistas de la vitamina K
  | 'warfarin'
  // Diuréticos de asa y secuenciales
  | 'furosemide'
  | 'bumetanide'
  | 'torsemide'
  | 'acetazolamide'
  | 'metolazone'
  | 'hydrochlorothiazide'
  // Inhibidores SRAA / ARNI
  | 'sacubitril-valsartan'
  | 'enalapril'
  | 'ramipril'
  | 'lisinopril'
  | 'losartan'
  | 'valsartan'
  // Antagonistas del receptor mineralocorticoide (ARM)
  | 'spironolactone'
  | 'eplerenone'
  // Inhibidores SGLT2 (gliflozinas)
  | 'dapagliflozin'
  | 'empagliflozin'
  // Inotrópicos, vasopresores y vasodilatadores IV
  | 'dobutamine'
  | 'milrinone'
  | 'norepinephrine'
  | 'epinephrine'
  | 'dopamine'
  | 'vasopressin'
  | 'levosimendan'
  | 'nitroglycerin'
  | 'nitroprusside'
  // Antiarrítmicos y control de frecuencia
  | 'amiodarone'
  | 'flecainide'
  | 'propafenone'
  | 'diltiazem'
  | 'verapamil'
  | 'digoxin'
  | 'ivabradine'
  // Inhibidores de bomba de protones (IBP)
  | 'omeprazole'
  | 'pantoprazole'
  | 'esomeprazole'
  // Otros
  | 'hydralazine'
  | 'isosorbide-dinitrate'
  | 'hydralazine-isdn'
  | 'ferric-carboxymaltose'
  | 'iv-iron'
  | 'vericiguat'
  | 'morphine'
  | 'fentanyl';

export type DrugClassId =
  | 'antiplatelet'
  | 'anticoagulant_doac'
  | 'anticoagulant_parenteral'
  | 'anticoagulant_vka'
  | 'statin'
  | 'lipid_lowering_nonstatin'
  | 'betablocker'
  | 'loop_diuretic'
  | 'thiazide_diuretic'
  | 'carbonic_anhydrase_inhibitor'
  | 'mra'
  | 'arni'
  | 'ace_inhibitor'
  | 'arb'
  | 'sglt2i'
  | 'inotrope'
  | 'vasopressor'
  | 'vasodilator'
  | 'sgc_stimulator'
  | 'iron_supplement'
  | 'antiarrhythmic_class1'
  | 'antiarrhythmic_class3'
  | 'calcium_channel_blocker'
  | 'cardiac_glycoside'
  | 'if_channel_inhibitor'
  | 'ppi'
  | 'analgesic_opioid';

export type IndicationId =
  | 'sca_dapt'
  | 'sca_anticoagulation'
  | 'sca_lipid'
  | 'sca_antiischemic'
  | 'af_stroke_prevention'
  | 'af_rate_control'
  | 'af_rhythm_control'
  | 'af_cardioversion_anticoag'
  | 'hf_congestion'
  | 'hf_gdmt'
  | 'hf_shock_inotropic'
  | 'hf_shock_vasopressor'
  | 'vte_prophylaxis'
  | 'vte_treatment'
  | 'gi_protection'
  | 'general'
  | 'ind-sca'
  | 'ind-af'
  | 'ind-hf';

export type RegimenId = string;

// ─── Estructuras de Datos Canónicas ──────────────────────────────────────────

export interface CanonicalDrug {
  id: DrugId;
  name: string;
  classId: DrugClassId;
  className: string;
  synonyms?: string[];
  routes: ('oral' | 'iv' | 'sc' | 'sublingual' | 'transdermal')[];
  atcCode?: string;
  description?: string;
}

export interface TherapyRegimen {
  id: RegimenId;
  drugId: DrugId;
  indicationId: IndicationId;
  name: string;
  route: 'oral' | 'iv' | 'sc' | 'sublingual';
  loadOrStart?: string;
  maintenance: string;
  maximum?: string;
  when?: string;
  avoid?: string[];
  monitoring?: string[];
  renalAdjustments?: {
    parameter: 'clcr' | 'egfr';
    threshold: number;
    action: 'caution' | 'reduce' | 'contraindicated' | 'avoid';
    instruction: string;
  }[];
  weightAdjustments?: {
    thresholdKg: number;
    action: 'reduce' | 'adjust';
    instruction: string;
  };
  sourceId: SourceId | string;
  jurisdiction?: 'AR-ANMAT' | 'EU-EMA' | 'US-FDA' | 'global';
  verified: boolean;
}

export interface CurrentMedication {
  drugId: DrugId;
  regimenId?: RegimenId;
  indicationId?: IndicationId | 'unknown';
  currentDoseText?: string;
  route?: 'oral' | 'iv' | 'sc' | 'sublingual';
  frequency?: string;
  doseMatchesEvaluatedRegimen?: boolean;
  notes?: string;
}

// ─── Catálogo Canónico de Fármacos ───────────────────────────────────────────

export const CANONICAL_DRUGS: Record<DrugId, CanonicalDrug> = {
  // Antiagregantes
  aspirin: {
    id: 'aspirin',
    name: 'Ácido acetilsalicílico (AAS)',
    classId: 'antiplatelet',
    className: 'Antiagregante plaquetario',
    synonyms: ['AAS', 'Aspirina'],
    routes: ['oral', 'iv'],
    atcCode: 'B01AC06',
  },
  clopidogrel: {
    id: 'clopidogrel',
    name: 'Clopidogrel',
    classId: 'antiplatelet',
    className: 'Antiagregante plaquetario (inhibidor P2Y12)',
    synonyms: ['Plavix'],
    routes: ['oral'],
    atcCode: 'B01AC04',
  },
  ticagrelor: {
    id: 'ticagrelor',
    name: 'Ticagrelor',
    classId: 'antiplatelet',
    className: 'Antiagregante plaquetario (inhibidor P2Y12)',
    synonyms: ['Brilinta'],
    routes: ['oral'],
    atcCode: 'B01AC24',
  },
  prasugrel: {
    id: 'prasugrel',
    name: 'Prasugrel',
    classId: 'antiplatelet',
    className: 'Antiagregante plaquetario (inhibidor P2Y12)',
    synonyms: ['Effient'],
    routes: ['oral'],
    atcCode: 'B01AC22',
  },

  // Estatinas
  atorvastatin: {
    id: 'atorvastatin',
    name: 'Atorvastatina',
    classId: 'statin',
    className: 'Inhibidor de HMG-CoA reductasa',
    synonyms: ['Lipitor', 'Zarator'],
    routes: ['oral'],
    atcCode: 'C10AA05',
  },
  rosuvastatin: {
    id: 'rosuvastatin',
    name: 'Rosuvastatina',
    classId: 'statin',
    className: 'Inhibidor de HMG-CoA reductasa',
    synonyms: ['Crestor'],
    routes: ['oral'],
    atcCode: 'C10AA07',
  },
  simvastatin: {
    id: 'simvastatin',
    name: 'Simvastatina',
    classId: 'statin',
    className: 'Inhibidor de HMG-CoA reductasa',
    synonyms: ['Zocor'],
    routes: ['oral'],
    atcCode: 'C10AA01',
  },

  // Betabloqueantes
  bisoprolol: {
    id: 'bisoprolol',
    name: 'Bisoprolol',
    classId: 'betablocker',
    className: 'Betabloqueante cardioselectivo (β1)',
    synonyms: ['Concor'],
    routes: ['oral'],
    atcCode: 'C07AB07',
  },
  carvedilol: {
    id: 'carvedilol',
    name: 'Carvedilol',
    classId: 'betablocker',
    className: 'Betabloqueante no selectivo con bloqueo α1 vasodilatador',
    synonyms: ['Dilatrend'],
    routes: ['oral'],
    atcCode: 'C07AG02',
  },
  metoprolol: {
    id: 'metoprolol',
    name: 'Metoprolol',
    classId: 'betablocker',
    className: 'Betabloqueante cardioselectivo (β1)',
    synonyms: ['Beloc', 'Lopresor'],
    routes: ['oral', 'iv'],
    atcCode: 'C07AB02',
  },
  nebivolol: {
    id: 'nebivolol',
    name: 'Nebivolol',
    classId: 'betablocker',
    className: 'Betabloqueante cardioselectivo (β1) con liberación de óxido nítrico',
    synonyms: ['Nebilet'],
    routes: ['oral'],
    atcCode: 'C07AB12',
  },
  atenolol: {
    id: 'atenolol',
    name: 'Atenolol',
    classId: 'betablocker',
    className: 'Betabloqueante cardioselectivo (β1)',
    routes: ['oral'],
    atcCode: 'C07AB03',
  },
  esmolol: {
    id: 'esmolol',
    name: 'Esmolol',
    classId: 'betablocker',
    className: 'Betabloqueante cardioselectivo ultra corto IV',
    synonyms: ['Brevibloc'],
    routes: ['iv'],
    atcCode: 'C07AB09',
  },

  // Anticoagulantes parenterales
  enoxaparin: {
    id: 'enoxaparin',
    name: 'Enoxaparina',
    classId: 'anticoagulant_parenteral',
    className: 'Heparina de bajo peso molecular (HBPM)',
    synonyms: ['Clexane'],
    routes: ['sc', 'iv'],
    atcCode: 'B01AB05',
  },
  'unfractionated-heparin': {
    id: 'unfractionated-heparin',
    name: 'Heparina no fraccionada (HNF)',
    classId: 'anticoagulant_parenteral',
    className: 'Heparina no fraccionada',
    synonyms: ['HNF', 'Heparina sódica'],
    routes: ['iv', 'sc'],
    atcCode: 'B01AB01',
  },
  fondaparinux: {
    id: 'fondaparinux',
    name: 'Fondaparinux',
    classId: 'anticoagulant_parenteral',
    className: 'Inhibidor sintético selectivo del factor Xa',
    synonyms: ['Arixtra'],
    routes: ['sc'],
    atcCode: 'B01AX05',
  },
  bivalirudin: {
    id: 'bivalirudin',
    name: 'Bivalirudina',
    classId: 'anticoagulant_parenteral',
    className: 'Inhibidor directo de la trombina IV',
    synonyms: ['Angiomax'],
    routes: ['iv'],
    atcCode: 'B01AE06',
  },

  // Anticoagulantes orales (ACOD)
  apixaban: {
    id: 'apixaban',
    name: 'Apixabán',
    classId: 'anticoagulant_doac',
    className: 'Anticoagulante oral directo (inhibidor factor Xa)',
    synonyms: ['Eliquis'],
    routes: ['oral'],
    atcCode: 'B01AF02',
  },
  rivaroxaban: {
    id: 'rivaroxaban',
    name: 'Rivaroxabán',
    classId: 'anticoagulant_doac',
    className: 'Anticoagulante oral directo (inhibidor factor Xa)',
    synonyms: ['Xarelto'],
    routes: ['oral'],
    atcCode: 'B01AF01',
  },
  dabigatran: {
    id: 'dabigatran',
    name: 'Dabigatrán',
    classId: 'anticoagulant_doac',
    className: 'Anticoagulante oral directo (inhibidor directo trombina)',
    synonyms: ['Pradaxa'],
    routes: ['oral'],
    atcCode: 'B01AE07',
  },
  edoxaban: {
    id: 'edoxaban',
    name: 'Edoxabán',
    classId: 'anticoagulant_doac',
    className: 'Anticoagulante oral directo (inhibidor factor Xa)',
    synonyms: ['Lixiana', 'Savaysa'],
    routes: ['oral'],
    atcCode: 'B01AF03',
  },
  warfarin: {
    id: 'warfarin',
    name: 'Warfarina',
    classId: 'anticoagulant_vka',
    className: 'Antagonista de la vitamina K',
    synonyms: ['Coumadin', 'Aldocumar'],
    routes: ['oral'],
    atcCode: 'B01AA03',
  },

  // Diuréticos
  furosemide: {
    id: 'furosemide',
    name: 'Furosemida',
    classId: 'loop_diuretic',
    className: 'Diurético de asa',
    synonyms: ['Lasix'],
    routes: ['iv', 'oral'],
    atcCode: 'C03CA01',
  },
  bumetanide: {
    id: 'bumetanide',
    name: 'Bumetanida',
    classId: 'loop_diuretic',
    className: 'Diurético de asa',
    routes: ['iv', 'oral'],
    atcCode: 'C03CA02',
  },
  torsemide: {
    id: 'torsemide',
    name: 'Torsemida',
    classId: 'loop_diuretic',
    className: 'Diurético de asa',
    routes: ['oral', 'iv'],
    atcCode: 'C03CA04',
  },
  acetazolamide: {
    id: 'acetazolamide',
    name: 'Acetazolamida',
    classId: 'carbonic_anhydrase_inhibitor',
    className: 'Inhibidor de la anhidrasa carbónica',
    synonyms: ['Diamox'],
    routes: ['iv', 'oral'],
    atcCode: 'S01EC01',
  },
  metolazone: {
    id: 'metolazone',
    name: 'Metolazona',
    classId: 'thiazide_diuretic',
    className: 'Diurético tiazídico-like',
    synonyms: ['Zaroxolyn'],
    routes: ['oral'],
    atcCode: 'C03BA08',
  },
  hydrochlorothiazide: {
    id: 'hydrochlorothiazide',
    name: 'Hidroclorotiazida',
    classId: 'thiazide_diuretic',
    className: 'Diurético tiazídico',
    synonyms: ['HCTZ'],
    routes: ['oral'],
    atcCode: 'C03AA03',
  },

  // SRAA / ARNI
  'sacubitril-valsartan': {
    id: 'sacubitril-valsartan',
    name: 'Sacubitrilo / Valsartán (ARNI)',
    classId: 'arni',
    className: 'Inhibidor de neprilisina y receptor de angiotensina (ARNI)',
    synonyms: ['Entresto'],
    routes: ['oral'],
    atcCode: 'C09DX04',
  },
  enalapril: {
    id: 'enalapril',
    name: 'Enalapril',
    classId: 'ace_inhibitor',
    className: 'Inhibidor de la enzima convertidora de angiotensina (IECA)',
    synonyms: ['Renitec'],
    routes: ['oral', 'iv'],
    atcCode: 'C09AA02',
  },
  ramipril: {
    id: 'ramipril',
    name: 'Ramipril',
    classId: 'ace_inhibitor',
    className: 'Inhibidor de la enzima convertidora de angiotensina (IECA)',
    synonyms: ['Tritace'],
    routes: ['oral'],
    atcCode: 'C09AA05',
  },
  lisinopril: {
    id: 'lisinopril',
    name: 'Lisinopril',
    classId: 'ace_inhibitor',
    className: 'Inhibidor de la enzima convertidora de angiotensina (IECA)',
    synonyms: ['Zestril'],
    routes: ['oral'],
    atcCode: 'C09AA03',
  },
  losartan: {
    id: 'losartan',
    name: 'Losartán',
    classId: 'arb',
    className: 'Antagonista de receptores de angiotensina II (ARA-II)',
    synonyms: ['Cozaar'],
    routes: ['oral'],
    atcCode: 'C09CA01',
  },
  valsartan: {
    id: 'valsartan',
    name: 'Valsartán',
    classId: 'arb',
    className: 'Antagonista de receptores de angiotensina II (ARA-II)',
    synonyms: ['Diovan'],
    routes: ['oral'],
    atcCode: 'C09CA03',
  },

  // ARM
  spironolactone: {
    id: 'spironolactone',
    name: 'Espironolactona',
    classId: 'mra',
    className: 'Antagonista del receptor mineralocorticoide (ARM)',
    synonyms: ['Aldactone'],
    routes: ['oral'],
    atcCode: 'C03DA01',
  },
  eplerenone: {
    id: 'eplerenone',
    name: 'Eplerenona',
    classId: 'mra',
    className: 'Antagonista selectivo del receptor mineralocorticoide (ARM)',
    synonyms: ['Inspra'],
    routes: ['oral'],
    atcCode: 'C03DA04',
  },

  // iSGLT2
  dapagliflozin: {
    id: 'dapagliflozin',
    name: 'Dapagliflozina',
    classId: 'sglt2i',
    className: 'Inhibidor del cotransportador sodio-glucosa 2 (iSGLT2)',
    synonyms: ['Forxiga'],
    routes: ['oral'],
    atcCode: 'A10BK01',
  },
  empagliflozin: {
    id: 'empagliflozin',
    name: 'Empagliflozina',
    classId: 'sglt2i',
    className: 'Inhibidor del cotransportador sodio-glucosa 2 (iSGLT2)',
    synonyms: ['Jardiance'],
    routes: ['oral'],
    atcCode: 'A10BK03',
  },

  // Inotrópicos y vasopresores
  dobutamine: {
    id: 'dobutamine',
    name: 'Dobutamina',
    classId: 'inotrope',
    className: 'Agonista adrenérgico inotrópico (β1 > β2)',
    routes: ['iv'],
    atcCode: 'C01CA07',
  },
  milrinone: {
    id: 'milrinone',
    name: 'Milrinona',
    classId: 'inotrope',
    className: 'Inhibidor de fosfodiesterasa 3 (inodilatador)',
    routes: ['iv'],
    atcCode: 'C01CE02',
  },
  norepinephrine: {
    id: 'norepinephrine',
    name: 'Noradrenalina',
    classId: 'vasopressor',
    className: 'Agonista adrenérgico vasopresor (α1 >> β1)',
    synonyms: ['Norepinefrina'],
    routes: ['iv'],
    atcCode: 'C01CA03',
  },
  epinephrine: {
    id: 'epinephrine',
    name: 'Adrenalina',
    classId: 'vasopressor',
    className: 'Agonista adrenérgico inotrópico y vasopresor (α y β)',
    synonyms: ['Epinefrina'],
    routes: ['iv', 'sc'],
    atcCode: 'C01CA24',
  },
  dopamine: {
    id: 'dopamine',
    name: 'Dopamina',
    classId: 'inotrope',
    className: 'Agonista dopaminérgico y adrenérgico dependiente de dosis',
    routes: ['iv'],
    atcCode: 'C01CA04',
  },
  vasopressin: {
    id: 'vasopressin',
    name: 'Vasopresina',
    classId: 'vasopressor',
    className: 'Agonista de receptores V1 vasopresor no catecolaminérgico',
    routes: ['iv'],
    atcCode: 'H01BA01',
  },
  levosimendan: {
    id: 'levosimendan',
    name: 'Levosimendán',
    classId: 'inotrope',
    className: 'Sensibilizador de calcio miofibrilar y vasodilatador',
    synonyms: ['Simdax'],
    routes: ['iv'],
    atcCode: 'C01CX08',
  },

  // Vasodilatadores
  nitroglycerin: {
    id: 'nitroglycerin',
    name: 'Nitroglicerina',
    classId: 'vasodilator',
    className: 'Nitrato vasodilatador venoso y coronario',
    synonyms: ['NTG'],
    routes: ['iv', 'sublingual', 'transdermal'],
    atcCode: 'C01DA02',
  },
  nitroprusside: {
    id: 'nitroprusside',
    name: 'Nitroprusiato de sodio',
    classId: 'vasodilator',
    className: 'Vasodilatador mixto venoso y arteriolar potente',
    routes: ['iv'],
    atcCode: 'C02DD01',
  },

  // Antiarrítmicos
  amiodarone: {
    id: 'amiodarone',
    name: 'Amiodarona',
    classId: 'antiarrhythmic_class3',
    className: 'Antiarrítmico clase III (bloqueador canales de potasio y múltiples)',
    synonyms: ['Atlansil', 'Cordarone'],
    routes: ['iv', 'oral'],
    atcCode: 'C01BD01',
  },
  flecainide: {
    id: 'flecainide',
    name: 'Flecainida',
    classId: 'antiarrhythmic_class1',
    className: 'Antiarrítmico clase IC (bloqueador potente canal de sodio)',
    synonyms: ['Tambocor'],
    routes: ['oral', 'iv'],
    atcCode: 'C01BC04',
  },
  propafenone: {
    id: 'propafenone',
    name: 'Propafenona',
    classId: 'antiarrhythmic_class1',
    className: 'Antiarrítmico clase IC (bloqueador canal de sodio con leve efecto β)',
    synonyms: ['Rytmonorm'],
    routes: ['oral'],
    atcCode: 'C01BC03',
  },
  diltiazem: {
    id: 'diltiazem',
    name: 'Diltiazem',
    classId: 'calcium_channel_blocker',
    className: 'Calcioantagonista no dihidropiridínico (benzotiazepina)',
    routes: ['iv', 'oral'],
    atcCode: 'C08DB01',
  },
  verapamil: {
    id: 'verapamil',
    name: 'Verapamilo',
    classId: 'calcium_channel_blocker',
    className: 'Calcioantagonista no dihidropiridínico (fenilalquilamina)',
    routes: ['iv', 'oral'],
    atcCode: 'C08DA01',
  },
  digoxin: {
    id: 'digoxin',
    name: 'Digoxina',
    classId: 'cardiac_glycoside',
    className: 'Glucósido cardíaco inotrópico y frenador del nodo AV',
    synonyms: ['Lanoxin'],
    routes: ['oral', 'iv'],
    atcCode: 'C01AA05',
  },
  ivabradine: {
    id: 'ivabradine',
    name: 'Ivabradina',
    classId: 'if_channel_inhibitor',
    className: 'Inhibidor selectivo de corriente If sinusal',
    synonyms: ['Procoralan'],
    routes: ['oral'],
    atcCode: 'C01EB17',
  },

  // IBP
  omeprazole: {
    id: 'omeprazole',
    name: 'Omeprazol',
    classId: 'ppi',
    className: 'Inhibidor de la bomba de protones (inhibidor CYP2C19)',
    routes: ['oral', 'iv'],
    atcCode: 'A02BC01',
  },
  pantoprazole: {
    id: 'pantoprazole',
    name: 'Pantoprazol',
    classId: 'ppi',
    className: 'Inhibidor de la bomba de protones (menor interacción CYP2C19)',
    routes: ['oral', 'iv'],
    atcCode: 'A02BC02',
  },
  esomeprazole: {
    id: 'esomeprazole',
    name: 'Esomeprazol',
    classId: 'ppi',
    className: 'Inhibidor de la bomba de protones (inhibidor CYP2C19)',
    routes: ['oral', 'iv'],
    atcCode: 'A02BC05',
  },

  // Otros
  hydralazine: {
    id: 'hydralazine',
    name: 'Hidralazina',
    classId: 'vasodilator',
    className: 'Vasodilatador arteriolar directo',
    routes: ['oral', 'iv'],
    atcCode: 'C02DB02',
  },
  'isosorbide-dinitrate': {
    id: 'isosorbide-dinitrate',
    name: 'Dinitrato de isosorbida (ISDN)',
    classId: 'vasodilator',
    className: 'Nitrato vasodilatador venoso y coronario',
    routes: ['oral', 'sublingual'],
    atcCode: 'C01DA08',
  },
  'ferric-carboxymaltose': {
    id: 'ferric-carboxymaltose',
    name: 'Hierro carboximaltosa IV',
    classId: 'analgesic_opioid', // Grupo terapéutico complementario
    className: 'Complejo de hierro parenteral',
    routes: ['iv'],
    atcCode: 'B03AC',
  },
  morphine: {
    id: 'morphine',
    name: 'Morfina',
    classId: 'analgesic_opioid',
    className: 'Analgésico opioide mayor',
    routes: ['iv', 'sc'],
    atcCode: 'N02AA01',
  },
  fentanyl: {
    id: 'fentanyl',
    name: 'Fentanilo',
    classId: 'analgesic_opioid',
    className: 'Analgésico opioide sintético potente',
    routes: ['iv', 'transdermal'],
    atcCode: 'N01AH01',
  },
  cangrelor: {
    id: 'cangrelor',
    name: 'Cangrelor IV',
    classId: 'antiplatelet',
    className: 'Inhibidor P2Y12 intravenoso reversible',
    routes: ['iv'],
    atcCode: 'B01AC25',
  },
  ezetimibe: {
    id: 'ezetimibe',
    name: 'Ezetimibe',
    classId: 'lipid_lowering_nonstatin',
    className: 'Inhibidor de absorción intestinal de colesterol (NPC1L1)',
    routes: ['oral'],
    atcCode: 'C10AX09',
  },
  evolocumab: {
    id: 'evolocumab',
    name: 'Evolocumab',
    classId: 'lipid_lowering_nonstatin',
    className: 'Inhibidor de PCSK9 (anticuerpo monoclonal)',
    routes: ['sc'],
    atcCode: 'C10AX13',
  },
  alirocumab: {
    id: 'alirocumab',
    name: 'Alirocumab',
    classId: 'lipid_lowering_nonstatin',
    className: 'Inhibidor de PCSK9 (anticuerpo monoclonal)',
    routes: ['sc'],
    atcCode: 'C10AX14',
  },
  inclisiran: {
    id: 'inclisiran',
    name: 'Inclisirán',
    classId: 'lipid_lowering_nonstatin',
    className: 'ARN de interferencia pequeño (siRNA) anti-PCSK9',
    routes: ['sc'],
    atcCode: 'C10AX16',
  },
  'bempedoic-acid': {
    id: 'bempedoic-acid',
    name: 'Ácido bempedoico',
    classId: 'lipid_lowering_nonstatin',
    className: 'Inhibidor de ATP-citrato liasa',
    routes: ['oral'],
    atcCode: 'C10AX15',
  },
  ufh: {
    id: 'unfractionated-heparin',
    name: 'Heparina no fraccionada (HNF)',
    classId: 'anticoagulant_parenteral',
    className: 'Heparina no fraccionada',
    synonyms: ['HNF', 'Heparina sódica'],
    routes: ['iv', 'sc'],
    atcCode: 'B01AB01',
  },
  'hydralazine-isdn': {
    id: 'hydralazine-isdn',
    name: 'Hidralazina / Dinitrato de isosorbida',
    classId: 'vasodilator',
    className: 'Combinación vasodilatadora arterial y venosa',
    routes: ['oral'],
  },
  'iv-iron': {
    id: 'iv-iron',
    name: 'Hierro parenteral (carboximaltosa/isomaltósido)',
    classId: 'iron_supplement',
    className: 'Complejo de hierro para infusión intravenosa',
    routes: ['iv'],
    atcCode: 'B03AC',
  },
  vericiguat: {
    id: 'vericiguat',
    name: 'Vericiguat',
    classId: 'sgc_stimulator',
    className: 'Estimulador soluble de guanilato ciclasa (sGC)',
    routes: ['oral'],
    atcCode: 'C01DX22',
  },
};

// ─── Rangos Canónicos de Inotrópicos y Vasopresores ──────────────────────────

export interface CanonicalDrugRange {
  id: string;
  name: string;
  startMin: number;
  max: number;
  unit: string;
  dosingMode: 'ug_kg_min' | 'ug_min' | 'u_min';
  notes: string;
  verified: boolean;
}

export const CANONICAL_DRUG_RANGES: Record<string, CanonicalDrugRange> = {
  dobutamine: {
    id: 'dobutamine',
    name: 'Dobutamina',
    startMin: 2.5,
    max: 20,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Inicio habitual 2.5–5 µg/kg/min; titular según respuesta. Puede aumentar FC en FA.',
    verified: false,
  },
  milrinone: {
    id: 'milrinone',
    name: 'Milrinona',
    startMin: 0.375,
    max: 0.75,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Infusión sin bolo en IC aguda. Reducir rango en IRC (eGFR <30). Vigilar hipotensión.',
    verified: false,
  },
  norepinephrine: {
    id: 'norepinephrine',
    name: 'Noradrenalina',
    startMin: 0.05,
    max: 1.0,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Vasopresor de primera línea en shock cardiogénico. Titular a TAM ≥65 mmHg.',
    verified: false,
  },
  epinephrine: {
    id: 'epinephrine',
    name: 'Adrenalina (epinefrina)',
    startMin: 0.01,
    max: 0.5,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Dosis bajas (<0.05): predominio β. Dosis altas (>0.1): predominio α vasopresor.',
    verified: false,
  },
  dopamine: {
    id: 'dopamine',
    name: 'Dopamina',
    startMin: 2,
    max: 20,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Dosis baja (<3): dopaminérgica. Media (3–10): β1. Alta (>10): α vasopresora.',
    verified: false,
  },
  nitroglycerin: {
    id: 'nitroglycerin',
    name: 'Nitroglicerina',
    startMin: 5,
    max: 200,
    unit: 'µg/min',
    dosingMode: 'ug_min',
    notes: 'Vasodilatador venoso/arterial. Contraindicada con PDE5i. Tolerancia en 24–48 h.',
    verified: false,
  },
  levosimendan: {
    id: 'levosimendan',
    name: 'Levosimendán',
    startMin: 0.05,
    max: 0.2,
    unit: 'µg/kg/min',
    dosingMode: 'ug_kg_min',
    notes: 'Bolo 6 µg/kg en 10 min (omitir si TAS <90), luego infusión 0.1 µg/kg/min × 24 h.',
    verified: false,
  },
  vasopressin: {
    id: 'vasopressin',
    name: 'Vasopresina',
    startMin: 0.01,
    max: 0.04,
    unit: 'U/min',
    dosingMode: 'u_min',
    notes: 'Dosis fija habitual 0.03 U/min. No titular por TA. Asociar a noradrenalina.',
    verified: false,
  },
};

export function getCanonicalRange(id: string): CanonicalDrugRange | undefined {
  return CANONICAL_DRUG_RANGES[id];
}

export function calcInotropePatientDoseText(
  drugId: string,
  weightKg: number,
): string | null {
  const range = CANONICAL_DRUG_RANGES[drugId];
  if (!range || range.dosingMode !== 'ug_kg_min') return null;

  const toMgH = (ugKgMin: number) => (ugKgMin * weightKg * 60) / 1000;
  const startMgH = toMgH(range.startMin).toFixed(2);
  const maxMgH = toMgH(range.max).toFixed(2);

  return `Con ${weightKg} kg: ${range.startMin}–${range.max} ${range.unit} → ${startMgH}–${maxMgH} mg/h. ${range.notes}`;
}

export function getCanonicalDrug(id: string): CanonicalDrug | undefined {
  return CANONICAL_DRUGS[id as DrugId];
}

/** Retorna true si ambos IDs pertenecen a la misma clase farmacológica */
export function areDrugsSameClass(drugId1: DrugId, drugId2: DrugId): boolean {
  const d1 = CANONICAL_DRUGS[drugId1];
  const d2 = CANONICAL_DRUGS[drugId2];
  if (!d1 || !d2) return false;
  return d1.classId === d2.classId;
}
