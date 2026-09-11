import type { SessionAction, SessionState } from '../context/session';
import { hfTherapyGroups, hfTherapyOptionCount } from '../data/hf-therapy-matrix';
import { evaluateHFTherapyOption } from '../rules/hf-therapy.engine';
import { TherapyTable } from './shared/TherapyTable';

interface HFTherapyMatrixProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

function HFContextBadges({ state }: { state: SessionState }) {
  return (
    <>
      {state.phase && (
        <span className="badge-info">
          {state.phase === 'shock_inotropicos' ? 'Shock/inotrópicos' : state.phase === 'compensado' ? 'Estabilizado' : 'Pre-alta'}
        </span>
      )}
      {state.lvef !== null && (
        <span className={
          state.lvef <= 40
            ? 'badge border border-rose-500/30 bg-rose-500/15 text-rose-300'
            : state.lvef <= 49
              ? 'badge border border-amber-500/30 bg-amber-500/15 text-amber-300'
              : 'badge-info'
        }>
          FEVI {state.lvef}%
        </span>
      )}
      {state.congestion === true && <span className="badge-warning">Congestión</span>}
      {state.hypoperfusion === true && <span className="badge border border-rose-600/50 bg-rose-950/20 text-rose-300">Hipoperfusión</span>}
      {state.onVasopressors && <span className="badge border border-amber-500/30 bg-amber-500/15 text-amber-300">Vasopresores activos</span>}
      {state.dialysis && <span className="badge-warning">Diálisis</span>}
    </>
  );
}

export function HFTherapyMatrix({ state, dispatch }: HFTherapyMatrixProps) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs text-slate-500 mt-1">
          {hfTherapyOptionCount} opciones · Matriz IC/shock
        </p>
      </div>
      <TherapyTable
        groups={hfTherapyGroups}
        state={state}
        dispatch={dispatch}
        evaluateOption={evaluateHFTherapyOption}
        matrixTitle="Insuficiencia cardíaca — Alternativas"
        matrixSubtitle="IC · matriz terapéutica"
        contextBadges={<HFContextBadges state={state} />}
      />
    </div>
  );
}
