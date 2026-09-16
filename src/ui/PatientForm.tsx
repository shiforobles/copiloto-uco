import type { SessionState, SessionAction } from '../context/session';
import type { Sex } from '../engine/types';
import type { ClinicalPhase, MainCondition } from '../rules/types';

interface PatientFormProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function PatientForm({ state, dispatch }: PatientFormProps) {
  const setField = (field: keyof SessionState, value: unknown) => {
    dispatch({ type: 'SET_PATIENT_FIELD', field, value });
  };

  const handleNumber = (field: keyof SessionState, raw: string) => {
    if (raw === '') {
      setField(field, null);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      setField(field, num);
    }
  };

  return (
    <section className="card" id="section-patient">
      <h2 className="section-title">
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Paciente (sesión)
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Edad */}
        <div>
          <label htmlFor="input-age" className="label">Edad (años)</label>
          <input
            id="input-age"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="ej: 72"
            value={state.age ?? ''}
            onChange={(e) => handleNumber('age', e.target.value)}
          />
        </div>

        {/* Sexo */}
        <div>
          <label htmlFor="input-sex" className="label">Sexo</label>
          <select
            id="input-sex"
            className="select-field"
            value={state.sex ?? ''}
            onChange={(e) => setField('sex', e.target.value === '' ? null : e.target.value as Sex)}
          >
            <option value="">—</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </div>

        {/* Peso */}
        <div>
          <label htmlFor="input-weight" className="label">Peso (kg)</label>
          <input
            id="input-weight"
            type="number"
            inputMode="decimal"
            className="input-field"
            placeholder="ej: 75"
            value={state.weight ?? ''}
            onChange={(e) => handleNumber('weight', e.target.value)}
          />
        </div>

        {/* Talla */}
        <div>
          <label htmlFor="input-height" className="label">Talla (cm)</label>
          <input
            id="input-height"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="ej: 170"
            value={state.height ?? ''}
            onChange={(e) => handleNumber('height', e.target.value)}
          />
        </div>

        {/* Creatinina */}
        <div>
          <label htmlFor="input-creatinine" className="label">Creatinina (mg/dL)</label>
          <input
            id="input-creatinine"
            type="number"
            inputMode="decimal"
            step="0.1"
            className="input-field"
            placeholder="ej: 1.2"
            value={state.creatinine ?? ''}
            onChange={(e) => handleNumber('creatinine', e.target.value)}
          />
        </div>

        {/* Potasio */}
        <div>
          <label htmlFor="input-potassium" className="label">K (mEq/L) <span className="text-slate-600">opc.</span></label>
          <input
            id="input-potassium"
            type="number"
            inputMode="decimal"
            step="0.1"
            className="input-field"
            placeholder="ej: 4.5"
            value={state.potassium ?? ''}
            onChange={(e) => handleNumber('potassium', e.target.value)}
          />
        </div>

        {/* TAS */}
        <div>
          <label htmlFor="input-systolicBP" className="label">TAS (mmHg) <span className="text-slate-600">opc.</span></label>
          <input
            id="input-systolicBP"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="ej: 120"
            value={state.systolicBP ?? ''}
            onChange={(e) => handleNumber('systolicBP', e.target.value)}
          />
        </div>

        {/* FC */}
        <div>
          <label htmlFor="input-heartRate" className="label">FC (lpm) <span className="text-slate-600">opc.</span></label>
          <input
            id="input-heartRate"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="ej: 80"
            value={state.heartRate ?? ''}
            onChange={(e) => handleNumber('heartRate', e.target.value)}
          />
        </div>

        {/* Condición */}
        <div>
          <label htmlFor="input-condition" className="label">Condición</label>
          <select
            id="input-condition"
            className="select-field"
            value={state.condition ?? ''}
            onChange={(e) =>
              setField('condition', e.target.value === '' ? null : e.target.value as MainCondition)
            }
          >
            <option value="">—</option>
            <option value="ic">Insuf. cardíaca</option>
            <option value="sca">SCA</option>
            <option value="otra">Otra</option>
          </select>
        </div>

        {/* Fase clínica */}
        <div>
          <label htmlFor="input-phase" className="label">Fase clínica</label>
          <select
            id="input-phase"
            className="select-field"
            value={state.phase ?? ''}
            onChange={(e) =>
              setField('phase', e.target.value === '' ? null : e.target.value as ClinicalPhase)
            }
          >
            <option value="">—</option>
            <option value="shock_inotropicos">Shock / inotrópicos</option>
            <option value="compensado">Compensado</option>
            <option value="pre_alta">Pre-alta</option>
          </select>
        </div>
      </div>

      {/* FA toggle — ancho completo */}
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="input-af" className="label mb-0 cursor-pointer">Fibrilación auricular</label>
        <button
          id="input-af"
          type="button"
          role="switch"
          aria-checked={state.hasAF}
          onClick={() => setField('hasAF', !state.hasAF)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500/50
            ${state.hasAF ? 'bg-sky-600' : 'bg-slate-700'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
              ring-0 transition duration-200 ease-in-out
              ${state.hasAF ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        {state.hasAF && <span className="text-xs text-sky-400">Sí</span>}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-slate-700 pt-4">
        <div>
          <label htmlFor="renal-status" className="label">Situación renal</label>
          <select id="renal-status" className="select-field" value={state.renalStatus} onChange={e => setField('renalStatus', e.target.value)}>
            <option value="unknown">Por confirmar</option>
            <option value="stable">Creatinina estable</option>
            <option value="unstable">Creatinina cambiante / LRA</option>
            <option value="dialysis">Diálisis / reemplazo renal</option>
          </select>
        </div>
        <div>
          <label htmlFor="input-lvef" className="label">FEVI (%) · opcional</label>
          <input id="input-lvef" className="input-field" type="number" min="1" max="100" value={state.lvef ?? ''} onChange={e => handleNumber('lvef', e.target.value)} placeholder="No informada" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">Sesión temporal. Sin nombre ni historia clínica. Los datos se borran al recargar o iniciar una nueva sesión.</p>
      {state.age !== null && (state.age < 18 || state.age > 120 || !Number.isInteger(state.age)) && <p role="alert" className="mt-3 text-sm text-amber-300">Ingresá una edad adulta válida (18–120 años enteros).</p>}
      {state.height !== null && (state.height < 100 || state.height > 250) && <p role="alert" className="mt-3 text-sm text-amber-300">Revisá la talla: se espera un valor entre 100 y 250 cm.</p>}
      {state.lvef !== null && (state.lvef <= 0 || state.lvef > 100) && <p role="alert" className="mt-3 text-sm text-amber-300">La FEVI debe estar entre 1 y 100%.</p>}
    </section>
  );
}
