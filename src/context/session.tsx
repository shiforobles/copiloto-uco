import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ClinicalPhase, MainCondition, Dilution } from '../rules/types';
import type { Sex } from '../engine/types';
import { initialTherapy, type TherapyContext } from '../clinical/therapy-context';

/** Goteo activo en la sesión */
export interface ActiveDrip {
  id: string;
  dilutionId: string;
  nombre: string;
  /** Dilución actual (puede ser editada respecto a la estándar) */
  currentDilution: {
    mg?: number;
    units?: number;
    volumenML: number;
    concentracionUgMl: number;
    /** Concentración en U/mL para drogas en U/min (vasopresina) */
    concentracionUPerMl?: number;
  };
  modoDosis: Dilution['modoDosis'];
  rango: Dilution['rango'];
  notas: string;
  /** Input del usuario: mL/h o gamma/dosis, según qué ingresó */
  inputMode: 'mlh' | 'gamma';
  mlPerHour: number | null;
  gamma: number | null;
  dilutionConfirmed: boolean;
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
  renalStatus: 'unknown' | 'stable' | 'unstable' | 'dialysis';
  lvef: number | null;
  therapy: TherapyContext;

  // Goteos activos
  drips: ActiveDrip[];

  // Checklist: IDs de pilares cubiertos
  coveredPillars: string[];
  pathwayChecks: Record<string, number[]>;

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
  renalStatus: 'unknown',
  lvef: null,
  therapy: { ...initialTherapy },
  drips: [],
  coveredPillars: [],
  pathwayChecks: {},
  activeRenalRuleIds: [],
};

export type SessionAction =
  | { type: 'SET_THERAPY_FIELD'; field: keyof TherapyContext; value: TherapyContext[keyof TherapyContext] }
  | { type: 'SET_PATIENT_FIELD'; field: keyof SessionState; value: unknown }
  | { type: 'ADD_DRIP'; drip: ActiveDrip }
  | { type: 'UPDATE_DRIP'; id: string; updates: Partial<ActiveDrip> }
  | { type: 'REMOVE_DRIP'; id: string }
  | { type: 'TOGGLE_PILLAR'; pillarId: string }
  | { type: 'TOGGLE_PATHWAY_CHECK'; pathwayId: string; index: number }
  | { type: 'ADD_RENAL_RULE'; ruleId: string }
  | { type: 'REMOVE_RENAL_RULE'; ruleId: string }
  | { type: 'RESET_SESSION' };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_THERAPY_FIELD':
      return { ...state, therapy: { ...state.therapy, [action.field]: action.value } };
    case 'TOGGLE_PATHWAY_CHECK': {
      const checked = state.pathwayChecks[action.pathwayId] ?? [];
      return { ...state, pathwayChecks: { ...state.pathwayChecks, [action.pathwayId]: checked.includes(action.index) ? checked.filter(i => i !== action.index) : [...checked, action.index] } };
    }
    case 'SET_PATIENT_FIELD':
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
      return { ...initialState, therapy: { ...initialTherapy } };

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
