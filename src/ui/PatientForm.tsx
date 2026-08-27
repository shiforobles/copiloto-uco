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
      setField(field, field === 'age' ? Math.floor(num) : num);
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
    </section>
  );
}
