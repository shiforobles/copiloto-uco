import type { SessionAction, SessionState, AFScenario } from '../context/session';
import type {
  ClinicalPhase,
  MainCondition,
  ScaStrategy,
  ScaSubtype,
  AFContext,
} from '../rules/types';

interface QuickPathwayProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const conditions: Array<{ id: MainCondition; label: string; description: string }> = [
  { id: 'sca', label: 'SCA', description: 'Tratamiento y prevención secundaria' },
  { id: 'ic', label: 'Insuf. cardíaca', description: 'IC aguda, crónica y shock' },
  { id: 'fa', label: 'FA / anticoagulación', description: 'Frec., ritmo, cardioversión, AC' },
  { id: 'otra', label: 'Solo consultar dosis', description: 'Elegir una medicación' },
];

const phases: Array<{ id: ClinicalPhase; label: string }> = [
  { id: 'shock_inotropicos', label: 'Shock / inotrópicos' },
  { id: 'compensado', label: 'Estabilizado' },
  { id: 'pre_alta', label: 'Pre-alta' },
];

const scaSubtypes: Array<{ id: Exclude<ScaSubtype, 'unknown'>; label: string }> = [
  { id: 'stemi', label: 'SCACEST' },
  { id: 'nstemi', label: 'SCASEST' },
];

const scaStrategies: Array<{ id: Exclude<ScaStrategy, 'unknown'>; label: string }> = [
  { id: 'pci', label: 'PCI' },
  { id: 'fibrinolysis', label: 'Fibrinólisis' },
  { id: 'medical', label: 'Médica' },
];

const afScenarios: Array<{ id: AFContext; label: string }> = [
  { id: 'unstable', label: 'Inestable' },
  { id: 'rate_control', label: 'Control frecuencia' },
  { id: 'rhythm_control', label: 'Control ritmo' },
  { id: 'cardioversion', label: 'Cardioversión' },
  { id: 'anticoagulation', label: 'Anticoagulación' },
  { id: 'af_acs_pci', label: 'FA + SCA/PCI' },
];

export function QuickPathway({ state, dispatch }: QuickPathwayProps) {
  const setField = (field: keyof SessionState, value: unknown) => {
    dispatch({ type: 'SET_PATIENT_FIELD', field, value });
  };

  const selectCondition = (condition: MainCondition) => {
    setField('condition', condition);

    if (condition === 'otra') {
      setField('phase', null);
      window.setTimeout(() => {
        document.getElementById('section-medication-selector')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
    }
  };

  const hasPathway = state.condition === 'sca' || state.condition === 'ic' || state.condition === 'fa';

  // Ciclo: null (desconocido) → true (presente) → null
  // No se registra false desde el QuickPathway; el "confirmado ausente" se hace en PatientForm
  const toggleBool = (field: keyof SessionState) => {
    setField(field, state[field] === true ? null : true);
  };


  return (
    <section className="card border-sky-700/40" id="section-quick-pathway">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            Pase de sala
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">¿Qué querés revisar?</h2>
        </div>
        <span className="badge-info whitespace-nowrap">1–2 toques</span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        No necesitás completar toda la medicación ni el laboratorio. Primero se muestra
        la guía general y luego se individualiza con los datos disponibles.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {conditions.map((condition) => {
          const active = state.condition === condition.id;
          return (
            <button
              key={condition.id}
              type="button"
              onClick={() => selectCondition(condition.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
                active
                  ? 'border-sky-500/60 bg-sky-500/15'
                  : 'border-slate-700/60 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <span className={active ? 'text-sm font-semibold text-sky-300' : 'text-sm font-semibold text-slate-200'}>
                {condition.label}
              </span>
              <span className="ml-2 text-xs text-slate-500">{condition.description}</span>
            </button>
          );
        })}
      </div>

      {hasPathway && (
        <div className="mt-4 border-t border-slate-700/50 pt-3 space-y-3">
          {/* Situación clínica (compartido entre IC y SCA) */}
          {(state.condition === 'sca' || state.condition === 'ic') && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Situación actual</p>
              <div className="flex flex-wrap gap-2">
                {phases.map((phase) => {
                  const active = state.phase === phase.id;
                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setField('phase', phase.id)}
                      className={active ? 'quick-chip quick-chip-active' : 'quick-chip'}
                    >
                      {phase.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contexto específico SCA */}
          {state.condition === 'sca' && (
            <div className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-950/30 p-3">
              <div>
                <p className="mb-2 text-[11px] font-medium text-slate-500">Subtipo (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {scaSubtypes.map((subtype) => {
                    const active = state.scaSubtype === subtype.id;
                    return (
                      <button
                        key={subtype.id}
                        type="button"
                        onClick={() => setField('scaSubtype', active ? 'unknown' : subtype.id)}
                        className={active ? 'quick-chip quick-chip-active' : 'quick-chip'}
                      >
                        {subtype.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-slate-500">Estrategia (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {scaStrategies.map((strategy) => {
                    const active = state.scaStrategy === strategy.id;
                    return (
                      <button
                        key={strategy.id}
                        type="button"
                        onClick={() => setField('scaStrategy', active ? 'unknown' : strategy.id)}
                        className={active ? 'quick-chip quick-chip-active' : 'quick-chip'}
                      >
                        {strategy.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-600">
                Si no elegís, la matriz muestra todas las alternativas igualmente.
              </p>
            </div>
          )}

          {/* Contexto IC — datos rápidos */}
          {state.condition === 'ic' && (
            <div className="space-y-2 rounded-xl border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-[11px] font-medium text-slate-500">Contexto IC (opcional)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleBool('congestion')}
                  className={state.congestion ? 'quick-chip quick-chip-active' : 'quick-chip'}
                >
                  {state.congestion ? '✓ ' : '+ '}Congestión
                </button>
                <button
                  type="button"
                  onClick={() => toggleBool('hypoperfusion')}
                  className={state.hypoperfusion ? 'quick-chip quick-chip-active' : 'quick-chip'}
                >
                  {state.hypoperfusion ? '✓ ' : '+ '}Hipoperfusión
                </button>
                <button
                  type="button"
                  onClick={() => toggleBool('onVasopressors')}
                  className={state.onVasopressors ? 'quick-chip quick-chip-active' : 'quick-chip'}
                >
                  {state.onVasopressors ? '✓ ' : '+ '}Vasopresores
                </button>
              </div>
              <p className="text-[10px] text-slate-600">
                La FEVI y otros datos avanzados están en la sección "Datos".
              </p>
            </div>
          )}

          {/* Contexto FA */}
          {state.condition === 'fa' && (
            <div className="space-y-2 rounded-xl border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-[11px] font-medium text-slate-500">Escenario FA</p>
              <div className="flex flex-wrap gap-2">
                {afScenarios.map((scenario) => {
                  const active = state.afScenario === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() =>
                        setField('afScenario', active ? null : (scenario.id as AFScenario))
                      }
                      className={
                        active
                          ? scenario.id === 'unstable'
                            ? 'quick-chip border-rose-500/60 bg-rose-500/20 text-rose-300'
                            : 'quick-chip quick-chip-active'
                          : 'quick-chip'
                      }
                    >
                      {scenario.label}
                    </button>
                  );
                })}
              </div>
              {state.afScenario === 'unstable' && (
                <p className="text-[11px] font-medium text-rose-300">
                  ⚠ Paciente inestable: cardioversión eléctrica urgente. Ver grupo 3.
                </p>
              )}

              {/* Duración de la FA */}
              <div className="mt-2">
                <p className="mb-1.5 text-[10px] font-medium text-slate-500">Duración de la FA</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['lt24h', '< 24 h'],
                    ['24_48h', '24–48 h'],
                    ['gte48h', '≥ 48 h'],
                    ['unknown', 'Desconocida'],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setField('afDuration', state.afDuration === val ? null : val)}
                      className={
                        state.afDuration === val
                          ? val === 'gte48h' || val === 'unknown'
                            ? 'quick-chip border-amber-500/60 bg-amber-500/20 text-amber-300'
                            : 'quick-chip quick-chip-active'
                          : 'quick-chip'
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(state.afDuration === 'gte48h' || state.afDuration === 'unknown') && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    ≥48 h o desconocida: descartar trombo auricular (ETE) o anticoagular ≥3 semanas antes de cardioversión electiva.
                  </p>
                )}
                {state.afDuration === '24_48h' && (
                  <p className="mt-1 text-[11px] text-sky-300">
                    24–48 h: riesgo intermedio según ESC 2024; considerar estrategia guiada por ETE o anticoagular.
                  </p>
                )}
              </div>

              <p className="text-[10px] text-slate-600">
                Sin escenario, se muestran todas las opciones.
              </p>
            </div>
          )}


          {/* FA como comorbilidad en SCA/IC */}
          {(state.condition === 'sca' || state.condition === 'ic') && (
            <button
              type="button"
              role="switch"
              aria-checked={state.hasAF}
              onClick={() => setField('hasAF', !state.hasAF)}
              className={state.hasAF ? 'quick-chip quick-chip-active' : 'quick-chip'}
            >
              {state.hasAF ? '✓ ' : '+ '}Fibrilación auricular
            </button>
          )}

          {/* Mensajes orientadores */}
          {!state.phase && state.condition === 'ic' && (
            <p className="text-xs text-amber-400">
              Elegí la situación clínica para mostrar el tratamiento correspondiente.
            </p>
          )}
          {!state.phase && state.condition === 'sca' && (
            <p className="text-xs text-slate-500">
              La matriz ya está disponible; elegir la situación agrega alertas hemodinámicas.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
