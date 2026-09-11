import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  AFContext,
  ClinicalPhase,
  Dilution,
  MainCondition,
  ScaStrategy,
  ScaSubtype,
} from '../rules/types';
import type { Sex } from '../engine/types';
import type { CurrentMedication, DrugId } from '../data/canonical-drugs';

/** Escenario de FA seleccionado en QuickPathway */
export type AFScenario = AFContext | null;

/** Goteo activo en la sesión */
export interface ActiveDrip {
  id: string;
  dilutionId: string;
  nombre: string;
  /** Dilución actual (puede ser editada respecto a la estándar) */
  currentDilution: {
    cantidad: number;
    unidad: 'mg' | 'U';
    volumenML: number;
    concentracionUgMl?: number;
    /** Concentración en U/mL para drogas en U/min (vasopresina) */
    concentracionUPerMl?: number;
  };
  modoDosis: Dilution['modoDosis'];
  rango: Dilution['rango'];
  notas: string;
  verified: boolean;
  /** Input del usuario: mL/h o gamma, según qué ingresó */
  inputMode: 'mlh' | 'gamma';
  mlPerHour: number | null;
  gamma: number | null;
}

/** Mapa de opción de matriz a ID canónico de fármaco para sincronización transversal */
export const OPTION_TO_DRUG_MAP: Record<string, DrugId> = {
  // SCA
  aas: 'aspirin',
  clopidogrel: 'clopidogrel',
  ticagrelor: 'ticagrelor',
  prasugrel: 'prasugrel',
  atorvastatin: 'atorvastatin',
  rosuvastatin: 'rosuvastatin',
  simvastatin: 'simvastatin',
  bisoprolol: 'bisoprolol',
  carvedilol: 'carvedilol',
  metoprolol: 'metoprolol',
  nebivolol: 'nebivolol',
  atenolol: 'atenolol',
  'enoxaparin-sca': 'enoxaparin',
  ufh: 'unfractionated-heparin',
  'fondaparinux-sca': 'fondaparinux',
  'bivalirudin-sca': 'bivalirudin',
  'nitroglycerin-sca': 'nitroglycerin',
  'morphine-sca': 'morphine',
  enalapril: 'enalapril',
  ramipril: 'ramipril',
  losartan: 'losartan',
  valsartan: 'valsartan',
  spironolactone: 'spironolactone',
  eplerenone: 'eplerenone',
  omeprazole: 'omeprazole',
  pantoprazole: 'pantoprazole',
  esomeprazole: 'esomeprazole',

  // IC
  'furosemide-hf': 'furosemide',
  'bumetanide-hf': 'bumetanide',
  'torsemide-hf': 'torsemide',
  'acetazolamide-hf': 'acetazolamide',
  'metolazone-hf': 'metolazone',
  'hctz-hf': 'hydrochlorothiazide',
  'nitroglycerin-hf': 'nitroglycerin',
  'nitroprusside-hf': 'nitroprusside',
  'norepinephrine-hf': 'norepinephrine',
  'dobutamine-hf': 'dobutamine',
  'milrinone-hf': 'milrinone',
  'epinephrine-hf': 'epinephrine',
  'vasopressin-hf': 'vasopressin',
  'dopamine-hf': 'dopamine',
  'levosimendan-hf': 'levosimendan',
  'sacubitril-valsartan-hf': 'sacubitril-valsartan',
  'enalapril-hf': 'enalapril',
  'ramipril-hf': 'ramipril',
  'lisinopril-hf': 'lisinopril',
  'losartan-hf': 'losartan',
  'valsartan-hf': 'valsartan',
  'carvedilol-hf': 'carvedilol',
  'bisoprolol-hf': 'bisoprolol',
  'metoprolol-succinate-hf': 'metoprolol',
  'spironolactone-hf': 'spironolactone',
  'eplerenone-hf': 'eplerenone',
  'dapagliflozin-hf': 'dapagliflozin',
  'empagliflozin-hf': 'empagliflozin',
  'ivabradine-hf': 'ivabradine',
  'digoxin-hf': 'digoxin',

  // FA
  'metoprolol-iv-af': 'metoprolol',
  'esmolol-iv-af': 'esmolol',
  'diltiazem-iv-af': 'diltiazem',
  'verapamil-iv-af': 'verapamil',
  'digoxin-iv-af': 'digoxin',
  'bisoprolol-af': 'bisoprolol',
  'metoprolol-tartrate-af': 'metoprolol',
  'diltiazem-oral-af': 'diltiazem',
  'verapamil-oral-af': 'verapamil',
  'digoxin-oral-af': 'digoxin',
  'amiodarone-af': 'amiodarone',
  'flecainide-af': 'flecainide',
  'propafenone-af': 'propafenone',
  'apixaban-af': 'apixaban',
  'rivaroxaban-af': 'rivaroxaban',
  'dabigatran-af': 'dabigatran',
  'edoxaban-af': 'edoxaban',
  'warfarin-af': 'warfarin',
  'ufh-af': 'unfractionated-heparin',
  'enoxaparin-af': 'enoxaparin',
};

/** Obtiene todos los IDs de opción que mapean al mismo fármaco canónico */
export function getOptionIdsForDrug(drugId: DrugId): string[] {
  return Object.entries(OPTION_TO_DRUG_MAP)
    .filter(([_, dId]) => dId === drugId)
    .map(([optId]) => optId);
}

/** Estado completo de una sesión */
export interface SessionState {
  // Datos del paciente
  age: number | null;
  sex: Sex | null;
  weight: number | null;
  height: number | null;
  creatinine: number | null;
  potassium: number | null;
  systolicBP: number | null;
  heartRate: number | null;
  condition: MainCondition | null;
  hasAF: boolean;
  phase: ClinicalPhase | null;
  scaSubtype: ScaSubtype;
  scaStrategy: ScaStrategy;

  // Contexto IC (opcionales, desplegables en PatientForm)
  lvef: number | null;                // Fracción de eyección (%)
  /** null = desconocido; true = presente; false = confirmado ausente */
  congestion: boolean | null;         // Signos de congestión activa
  /** null = desconocido; true = presente; false = confirmado ausente */
  hypoperfusion: boolean | null;      // Hipoperfusión / bajo gasto
  /** null = desconocido; true = en curso; false = confirmado ausente */
  onVasopressors: boolean | null;     // Uso actual de vasopresores/inotrópicos

  // Laboratorio adicional
  hemoglobin: number | null;    // g/dL
  platelets: number | null;     // ×10³/µL
  magnesium: number | null;     // mEq/L
  qtcMs: number | null;         // QTc en ms

  // Antecedentes relevantes (null = dato no registrado, ≠ negativo)
  /** null = no registrado; true = presente; false = confirmado ausente */
  activeBleed: boolean | null;
  /** null = no registrado; true = en diálisis; false = confirmado que no */
  dialysis: boolean | null;
  /** null = no registrado; true = AKI activo; false = confirmado que no */
  aki: boolean | null;
  /** null = no registrado; true = antecedente; false = confirmado que no */
  previousStroke: boolean | null;
  /** null = no registrado; true = presente; false = confirmado que no */
  structuralHeartDisease: boolean | null;
  /** null = no registrado; true = WPW u otro; false = confirmado que no */
  preexcitation: boolean | null;
  /** 'apixaban' | 'rivaroxaban' | 'dabigatran' | 'edoxaban' | 'warfarin' | 'ufh' | 'lmwh' | null */
  currentAnticoagulant: string | null;
  /** null = no registrado; true = en ≤5 días; false = confirmado que no */
  plannedPciOrSurgery: boolean | null;

  // Escenario FA y cardioversión
  afScenario: AFScenario;
  /** Duración de la FA: <24h, 24–48h, ≥48h, o desconocida (compatible con lt48h/gte48h) */
  afDuration: 'lt24h' | '24_48h' | 'gte48h' | 'unknown' | 'lt48h' | null;
  /** ≥3 semanas de anticoagulación terapéutica continua previa a cardioversión */
  priorTherapeuticAnticoag: boolean | null;
  /** Adherencia confirmada a la anticoagulación terapéutica previa */
  confirmedAdherence: boolean | null;
  /** ETE realizado con confirmación de ausencia de trombo en aurícula/orejuela */
  teeNoThrombus: boolean | null;
  /** Prótesis valvular mecánica */
  mechanicalValve: boolean | null;
  /** Estenosis mitral reumática moderada o severa */
  rheumaticMitralStenosis: boolean | null;
  /** Perfil de guía clínica seleccionado para FA */
  afGuidelineProfile: 'esc_2024' | 'acc_aha_2023' | 'compare' | 'institutional';

  // Factores de riesgo para CHA₂DS₂-VASc / CHA₂DS₂-VA
  /** null = no registrado; true = presente; false = confirmado ausente */
  hypertension: boolean | null;
  /** null = no registrado; true = presente; false = confirmado ausente */
  diabetes: boolean | null;
  /** Enf. vascular (IAM previo, enfermedad arterial periférica, placa aórtica) */
  vascularDisease: boolean | null;

  // Goteos activos
  drips: ActiveDrip[];

  // Checklist: IDs de pilares cubiertos
  coveredPillars: string[];

  // Matriz SCA / IC / FA: IDs de drogas marcadas como medicación actual (sincronizadas)
  selectedTherapyOptionIds: string[];

  // Medicación actual normalizada transversalmente
  currentMedications: CurrentMedication[];

  // Reglas renales activas (IDs de reglas para evaluar)
  activeRenalRuleIds: string[];
}

export const initialState: SessionState = {
  age: null,
  sex: null,
  weight: null,
  height: null,
  creatinine: null,
  potassium: null,
  systolicBP: null,
  heartRate: null,
  condition: null,
  hasAF: false,
  phase: null,
  scaSubtype: 'unknown',
  scaStrategy: 'unknown',
  // Contexto IC
  lvef: null,
  congestion: null,
  hypoperfusion: null,
  onVasopressors: null,
  // Laboratorio adicional
  hemoglobin: null,
  platelets: null,
  magnesium: null,
  qtcMs: null,
  // Antecedentes relevantes — null = dato no registrado
  activeBleed: null,
  dialysis: null,
  aki: null,
  previousStroke: null,
  structuralHeartDisease: null,
  preexcitation: null,
  currentAnticoagulant: null,
  plannedPciOrSurgery: null,
  // FA
  afScenario: null,
  afDuration: null,
  priorTherapeuticAnticoag: null,
  confirmedAdherence: null,
  teeNoThrombus: null,
  mechanicalValve: null,
  rheumaticMitralStenosis: null,
  afGuidelineProfile: 'compare',
  // CHA₂DS₂-VASc / riesgo
  hypertension: null,
  diabetes: null,
  vascularDisease: null,
  // Goteos y matrices
  drips: [],
  coveredPillars: [],
  selectedTherapyOptionIds: [],
  currentMedications: [],
  activeRenalRuleIds: [],
};

export type SessionAction =
  | { type: 'SET_PATIENT_FIELD'; field: keyof SessionState; value: unknown }
  | { type: 'ADD_DRIP'; drip: ActiveDrip }
  | { type: 'UPDATE_DRIP'; id: string; updates: Partial<ActiveDrip> }
  | { type: 'REMOVE_DRIP'; id: string }
  | { type: 'TOGGLE_PILLAR'; pillarId: string }
  | { type: 'TOGGLE_THERAPY_OPTION'; optionId: string; drugId?: DrugId }
  | { type: 'ADD_CURRENT_MEDICATION'; medication: CurrentMedication }
  | { type: 'REMOVE_CURRENT_MEDICATION'; drugId: DrugId }
  | { type: 'UPDATE_CURRENT_MEDICATION'; drugId: DrugId; updates: Partial<CurrentMedication> }
  | { type: 'ADD_RENAL_RULE'; ruleId: string }
  | { type: 'REMOVE_RENAL_RULE'; ruleId: string }
  | { type: 'RESET_SESSION' };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_PATIENT_FIELD':
      if (action.field === 'condition' && action.value !== state.condition) {
        return {
          ...state,
          condition: action.value as SessionState['condition'],
          coveredPillars: [],
          selectedTherapyOptionIds: [],
          currentMedications: [],
          scaSubtype: 'unknown',
          scaStrategy: 'unknown',
        };
      }
      return { ...state, [action.field]: action.value };

    case 'ADD_DRIP':
      return { ...state, drips: [...state.drips, action.drip] };

    case 'UPDATE_DRIP':
      return {
        ...state,
        drips: state.drips.map((d) =>
          d.id === action.id ? { ...d, ...action.updates } : d
        ),
      };

    case 'REMOVE_DRIP':
      return {
        ...state,
        drips: state.drips.filter((d) => d.id !== action.id),
      };

    case 'TOGGLE_PILLAR':
      return {
        ...state,
        coveredPillars: state.coveredPillars.includes(action.pillarId)
          ? state.coveredPillars.filter((id) => id !== action.pillarId)
          : [...state.coveredPillars, action.pillarId],
      };

    case 'TOGGLE_THERAPY_OPTION': {
      const canonicalDrugId = action.drugId ?? OPTION_TO_DRUG_MAP[action.optionId];
      const currentMeds = state.currentMedications ?? [];
      const selectedIds = state.selectedTherapyOptionIds ?? [];

      if (canonicalDrugId) {
        // Opción con identidad farmacológica canónica → sincronizar transversalmente
        const isAlreadyReceived = currentMeds.some((m) => m.drugId === canonicalDrugId) ||
          selectedIds.includes(action.optionId);

        const allMatchingOptionIds = getOptionIdsForDrug(canonicalDrugId);
        // Asegurar que action.optionId siempre esté incluida aunque no esté en el mapa estático
        if (!allMatchingOptionIds.includes(action.optionId)) {
          allMatchingOptionIds.push(action.optionId);
        }

        if (isAlreadyReceived) {
          // Desmarcar en todas las pantallas
          return {
            ...state,
            currentMedications: currentMeds.filter((m) => m.drugId !== canonicalDrugId),
            selectedTherapyOptionIds: selectedIds.filter(
              (id) => !allMatchingOptionIds.includes(id)
            ),
          };
        } else {
          // Marcar en todas las pantallas
          const newMed: CurrentMedication = {
            drugId: canonicalDrugId,
            doseMatchesEvaluatedRegimen: false,
          };
          const newSelected = [...new Set([...selectedIds, ...allMatchingOptionIds])];
          return {
            ...state,
            currentMedications: [...currentMeds, newMed],
            selectedTherapyOptionIds: newSelected,
          };
        }
      }

      // Opción no farmacológica (procedimiento/estrategia como electrical-cv-af)
      const isSelected = selectedIds.includes(action.optionId);
      return {
        ...state,
        selectedTherapyOptionIds: isSelected
          ? selectedIds.filter((id) => id !== action.optionId)
          : [...selectedIds, action.optionId],
      };
    }

    case 'ADD_CURRENT_MEDICATION': {
      const currentMeds = state.currentMedications ?? [];
      const selectedIds = state.selectedTherapyOptionIds ?? [];
      const existing = currentMeds.find((m) => m.drugId === action.medication.drugId);
      const matchingOptionIds = getOptionIdsForDrug(action.medication.drugId);
      const updatedMeds = existing
        ? currentMeds.map((m) => (m.drugId === action.medication.drugId ? action.medication : m))
        : [...currentMeds, action.medication];
      const updatedSelected = [...new Set([...selectedIds, ...matchingOptionIds])];
      return {
        ...state,
        currentMedications: updatedMeds,
        selectedTherapyOptionIds: updatedSelected,
      };
    }

    case 'REMOVE_CURRENT_MEDICATION': {
      const currentMeds = state.currentMedications ?? [];
      const selectedIds = state.selectedTherapyOptionIds ?? [];
      const matchingOptionIds = getOptionIdsForDrug(action.drugId);
      return {
        ...state,
        currentMedications: currentMeds.filter((m) => m.drugId !== action.drugId),
        selectedTherapyOptionIds: selectedIds.filter(
          (id) => !matchingOptionIds.includes(id)
        ),
      };
    }

    case 'UPDATE_CURRENT_MEDICATION': {
      const currentMeds = state.currentMedications ?? [];
      return {
        ...state,
        currentMedications: currentMeds.map((m) =>
          m.drugId === action.drugId ? { ...m, ...action.updates } : m
        ),
      };
    }

    case 'ADD_RENAL_RULE':
      if (state.activeRenalRuleIds.includes(action.ruleId)) return state;
      return {
        ...state,
        activeRenalRuleIds: [...state.activeRenalRuleIds, action.ruleId],
      };

    case 'REMOVE_RENAL_RULE':
      return {
        ...state,
        activeRenalRuleIds: state.activeRenalRuleIds.filter(
          (id) => id !== action.ruleId
        ),
      };

    case 'RESET_SESSION':
      return {
        ...initialState,
        drips: [],
        coveredPillars: [],
        selectedTherapyOptionIds: [],
        currentMedications: [],
        activeRenalRuleIds: [],
      };

    default:
      return state;
  }
}

// Context
interface SessionContextType {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return context;
}
