import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ClinicalPhase, MainCondition, Dilution } from '../rules/types';
import type { Sex } from '../engine/types';

/** Goteo activo en la sesión */
export interface ActiveDrip {
  id: string;
  dilutionId: string;
  nombre: string;
  /** Dilución actual (puede ser editada respecto a la estándar) */
  currentDilution: {
    mg: number;
    volumenML: number;
    concentracionUgMl: number;
    /** Concentración en U/mL para drogas en U/min (vasopresina) */
    concentracionUPerMl?: number;
  };
  modoDosis: Dilution['modoDosis'];
  rango: Dilution['rango'];
  notas: string;
  /** Input del usuario: mL/h o gamma, según qué ingresó */
  inputMode: 'mlh' | 'gamma';
  mlPerHour: number | null;
  gamma: number | null;
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

  // Goteos activos
  drips: ActiveDrip[];

  // Checklist: IDs de pilares cubiertos
  coveredPillars: string[];

  // Reglas renales activas (IDs de reglas para evaluar)
  activeRenalRuleIds: string[];
}

const initialState: SessionState = {
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
  drips: [],
  coveredPillars: [],
  activeRenalRuleIds: [],
};

export type SessionAction =
  | { type: 'SET_PATIENT_FIELD'; field: keyof SessionState; value: unknown }
  | { type: 'ADD_DRIP'; drip: ActiveDrip }
  | { type: 'UPDATE_DRIP'; id: string; updates: Partial<ActiveDrip> }
  | { type: 'REMOVE_DRIP'; id: string }
  | { type: 'TOGGLE_PILLAR'; pillarId: string }
  | { type: 'ADD_RENAL_RULE'; ruleId: string }
  | { type: 'REMOVE_RENAL_RULE'; ruleId: string }
  | { type: 'RESET_SESSION' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
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
      return { ...initialState };

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
