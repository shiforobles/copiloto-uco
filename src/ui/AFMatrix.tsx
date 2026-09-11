import type { SessionAction, SessionState } from '../context/session';
import { afTherapyGroups, afTherapyOptionCount } from '../data/af-therapy-matrix';
import { evaluateAFTherapyOption } from '../rules/af-therapy.engine';
import type { AFContext } from '../rules/types';
import { TherapyTable } from './shared/TherapyTable';

interface AFMatrixProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const afScenarioLabel: Record<AFContext, string> = {
  unstable: 'Inestable',
  rate_control: 'Control frecuencia',
  rhythm_control: 'Control ritmo',
  cardioversion: 'Cardioversión',
  anticoagulation: 'Anticoagulación',
  af_acs_pci: 'FA + SCA/PCI',
};

function AFContextBadges({ state }: { state: SessionState }) {
  return (
    <>
      {state.afScenario && (
        <span className={
          state.afScenario === 'unstable'
            ? 'badge border border-rose-600/50 bg-rose-950/20 text-rose-300'
            : 'badge border border-sky-500/30 bg-sky-500/15 text-sky-300'
        }>
          {afScenarioLabel[state.afScenario]}
        </span>
      )}
      {state.lvef !== null && (
        <span className={
          state.lvef <= 40
            ? 'badge border border-rose-500/30 bg-rose-500/15 text-rose-300'
            : 'badge-info'
        }>
          FEVI {state.lvef}%
        </span>
      )}
      {state.preexcitation && (
        <span className="badge border border-rose-600/50 bg-rose-950/20 text-rose-300">Preexcitación</span>
      )}
      {state.structuralHeartDisease && (
        <span className="badge-warning">Cardiopatía estructural</span>
      )}
      {state.currentAnticoagulant && (
        <span className="badge border border-amber-500/30 bg-amber-500/15 text-amber-300">
          AC: {state.currentAnticoagulant}
        </span>
      )}
      {state.dialysis && <span className="badge-warning">Diálisis</span>}
    </>
  );
}

export function AFMatrix({ state, dispatch }: AFMatrixProps) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs text-slate-500 mt-1">
          {afTherapyOptionCount} opciones · Matriz FA/anticoagulación
        </p>
      </div>
      <TherapyTable
        groups={afTherapyGroups}
        state={state}
        dispatch={dispatch}
        evaluateOption={evaluateAFTherapyOption}
        matrixTitle="Fibrilación auricular — Alternativas"
        matrixSubtitle="FA · matriz terapéutica"
        contextBadges={<AFContextBadges state={state} />}
      />
    </div>
  );
}
