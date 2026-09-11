import { useState } from 'react';
import type { SessionAction, SessionState } from '../context/session';
import type { Sex } from '../engine/types';

interface PatientFormProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const ANTICOAG_OPTIONS = [
  { value: '', label: '—' },
  { value: 'apixaban', label: 'Apixabán' },
  { value: 'rivaroxaban', label: 'Rivaroxabán' },
  { value: 'dabigatran', label: 'Dabigatrán' },
  { value: 'edoxaban', label: 'Edoxabán' },
  { value: 'warfarin', label: 'Warfarina' },
  { value: 'ufh', label: 'HNF IV/SC' },
  { value: 'lmwh', label: 'HBPM (enoxaparina u otra)' },
];

export function PatientForm({ state, dispatch }: PatientFormProps) {
  const [showAdvancedLab, setShowAdvancedLab] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const setField = (field: keyof SessionState, value: unknown) => {
    dispatch({ type: 'SET_PATIENT_FIELD', field, value });
  };

  const handleNumber = (field: keyof SessionState, raw: string) => {
    if (raw === '') { setField(field, null); return; }
    const num = Number.parseFloat(raw);
    if (!Number.isNaN(num)) setField(field, field === 'age' ? Math.floor(num) : num);
  };

  const toggleBool = (field: keyof SessionState) => {
    // Ciclo tristate: null (desconocido) → true (presente) → false (confirmado ausente) → null
    const cur = state[field];
    if (cur === null || cur === undefined) {
      setField(field, true);
    } else if (cur === true) {
      setField(field, false);
    } else {
      setField(field, null);
    }
  };

  const renalDataCount = [state.age, state.sex, state.weight, state.creatinine]
    .filter((v) => v !== null).length;
  const extraDataCount = [state.height, state.potassium, state.systolicBP, state.heartRate]
    .filter((v) => v !== null).length;
  const advLabCount = [state.hemoglobin, state.platelets, state.magnesium, state.qtcMs, state.lvef]
    .filter((v) => v !== null).length;
  const historyCount = [
    state.dialysis, state.aki, state.activeBleed, state.previousStroke,
    state.structuralHeartDisease, state.preexcitation, state.plannedPciOrSurgery,
    state.hypertension, state.diabetes, state.vascularDisease, state.priorTherapeuticAnticoag,
  ].filter((v) => v === true).length + (state.currentAnticoagulant ? 1 : 0) + (state.afDuration ? 1 : 0);

  return (
    <section className="card" id="section-patient">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title mb-1">
            <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Datos para personalizar
          </h2>
          <p className="text-xs leading-relaxed text-slate-500">
            Son opcionales. Al completarlos, la app agrega cálculos y alertas específicas.
          </p>
        </div>
        <span className={renalDataCount === 4 ? 'badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'badge-info'}>
          {renalDataCount}/4 renal
        </span>
      </div>

      {/* ── Datos esenciales ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="input-age" className="label">Edad</label>
          <input id="input-age" type="number" inputMode="numeric" className="input-field"
            placeholder="72 años" value={state.age ?? ''}
            onChange={(e) => handleNumber('age', e.target.value)} />
        </div>
        <div>
          <label htmlFor="input-sex" className="label">Sexo biológico</label>
          <select id="input-sex" className="select-field" value={state.sex ?? ''}
            onChange={(e) => setField('sex', e.target.value === '' ? null : e.target.value as Sex)}>
            <option value="">—</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </div>
        <div>
          <label htmlFor="input-weight" className="label">Peso</label>
          <input id="input-weight" type="number" inputMode="decimal" className="input-field"
            placeholder="75 kg" value={state.weight ?? ''}
            onChange={(e) => handleNumber('weight', e.target.value)} />
        </div>
        <div>
          <label htmlFor="input-creatinine" className="label">Creatinina</label>
          <input id="input-creatinine" type="number" inputMode="decimal" step="0.1"
            className="input-field" placeholder="1,2 mg/dL" value={state.creatinine ?? ''}
            onChange={(e) => handleNumber('creatinine', e.target.value)} />
        </div>
      </div>

      {/* ── Vitales y electrolitos básicos ── */}
      <details className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-slate-300">
          <span className="inline-flex w-full items-center justify-between gap-2">
            <span>Agregar talla, K, TAS y FC</span>
            <span className="text-xs font-normal text-slate-500">{extraDataCount}/4 cargados</span>
          </span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-700/40 pt-3">
          <div>
            <label htmlFor="input-height" className="label">Talla (cm)</label>
            <input id="input-height" type="number" inputMode="numeric" className="input-field"
              placeholder="170" value={state.height ?? ''}
              onChange={(e) => handleNumber('height', e.target.value)} />
          </div>
          <div>
            <label htmlFor="input-potassium" className="label">K (mEq/L)</label>
            <input id="input-potassium" type="number" inputMode="decimal" step="0.1"
              className="input-field" placeholder="4,5" value={state.potassium ?? ''}
              onChange={(e) => handleNumber('potassium', e.target.value)} />
          </div>
          <div>
            <label htmlFor="input-systolicBP" className="label">TAS (mmHg)</label>
            <input id="input-systolicBP" type="number" inputMode="numeric" className="input-field"
              placeholder="120" value={state.systolicBP ?? ''}
              onChange={(e) => handleNumber('systolicBP', e.target.value)} />
          </div>
          <div>
            <label htmlFor="input-heartRate" className="label">FC (lpm)</label>
            <input id="input-heartRate" type="number" inputMode="numeric" className="input-field"
              placeholder="80" value={state.heartRate ?? ''}
              onChange={(e) => handleNumber('heartRate', e.target.value)} />
          </div>
        </div>
      </details>

      {/* ── Laboratorio avanzado ── */}
      <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
        <button
          type="button"
          onClick={() => setShowAdvancedLab((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-300"
        >
          <span>Laboratorio avanzado (Hb, plaq., Mg, QTc, FEVI)</span>
          <span className="text-xs font-normal text-slate-500">
            {advLabCount > 0 ? `${advLabCount} cargados` : 'Expandir'}
          </span>
        </button>

        {showAdvancedLab && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-700/40 pt-3">
            <div>
              <label htmlFor="input-hemoglobin" className="label">Hb (g/dL)</label>
              <input id="input-hemoglobin" type="number" inputMode="decimal" step="0.1"
                className="input-field" placeholder="12.5" value={state.hemoglobin ?? ''}
                onChange={(e) => handleNumber('hemoglobin', e.target.value)} />
            </div>
            <div>
              <label htmlFor="input-platelets" className="label">Plaquetas (k/µL)</label>
              <input id="input-platelets" type="number" inputMode="numeric"
                className="input-field" placeholder="180" value={state.platelets ?? ''}
                onChange={(e) => handleNumber('platelets', e.target.value)} />
            </div>
            <div>
              <label htmlFor="input-magnesium" className="label">Mg (mEq/L)</label>
              <input id="input-magnesium" type="number" inputMode="decimal" step="0.1"
                className="input-field" placeholder="1.8" value={state.magnesium ?? ''}
                onChange={(e) => handleNumber('magnesium', e.target.value)} />
            </div>
            <div>
              <label htmlFor="input-qtcMs" className="label">QTc (ms)</label>
              <input id="input-qtcMs" type="number" inputMode="numeric"
                className="input-field" placeholder="440" value={state.qtcMs ?? ''}
                onChange={(e) => handleNumber('qtcMs', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label htmlFor="input-lvef" className="label">FEVI (%)</label>
              <input id="input-lvef" type="number" inputMode="numeric"
                className="input-field" placeholder="35" value={state.lvef ?? ''}
                onChange={(e) => handleNumber('lvef', e.target.value)} />
              {state.lvef !== null && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {state.lvef <= 40 ? 'FEVIr (reducida ≤40%)' : state.lvef <= 49 ? 'FEVIm (levemente reducida 41–49%)' : 'FEVIp (preservada ≥50%)'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Antecedentes relevantes ── */}
      <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-300"
        >
          <span>Antecedentes y contexto</span>
          <span className="text-xs font-normal text-slate-500">
            {historyCount > 0 ? `${historyCount} activos` : 'Expandir'}
          </span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-3 border-t border-slate-700/40 pt-3">
            {/* Anticoagulante actual y Duración FA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="input-current-ac" className="label">Anticoagulante actual</label>
                <select id="input-current-ac" className="select-field"
                  value={state.currentAnticoagulant ?? ''}
                  onChange={(e) => setField('currentAnticoagulant', e.target.value === '' ? null : e.target.value)}>
                  {ANTICOAG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="input-af-duration" className="label">Duración FA</label>
                <select id="input-af-duration" className="select-field"
                  value={state.afDuration ?? ''}
                  onChange={(e) => setField('afDuration', e.target.value === '' ? null : (e.target.value as 'lt24h' | '24_48h' | 'gte48h' | 'unknown'))}>
                  <option value="">— (no especificada)</option>
                  <option value="lt24h">&lt; 24 horas</option>
                  <option value="24_48h">24–48 horas</option>
                  <option value="gte48h">&ge; 48 horas</option>
                  <option value="unknown">Desconocida</option>
                </select>
              </div>
              <div>
                <label htmlFor="input-af-guideline" className="label">Perfil de Guías FA</label>
                <select id="input-af-guideline" className="select-field"
                  value={state.afGuidelineProfile ?? 'compare'}
                  onChange={(e) => setField('afGuidelineProfile', e.target.value as any)}>
                  <option value="compare">Comparar guías (ESC 2024 / AHA 2023)</option>
                  <option value="esc2024">ESC 2024 (CHA₂DS₂-VA)</option>
                  <option value="acc_aha2023">ACC/AHA 2023 (CHA₂DS₂-VASc)</option>
                  <option value="institutional">Protocolo institucional (no validado)</option>
                </select>
              </div>
            </div>

            {/* Factores de riesgo tromboembólico / CHA₂DS₂-VASc y evaluación valvular */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Riesgo tromboembólico, vascular y cardioversión
              </p>
              <div className="flex flex-wrap gap-2">
                {([
                  ['hypertension', 'Hipertensión (HTA)'],
                  ['diabetes', 'Diabetes (DM)'],
                  ['previousStroke', 'ACV / AIT previo'],
                  ['vascularDisease', 'Enf. vascular (IAM/EAP)'],
                  ['priorTherapeuticAnticoag', 'AC previa ≥3 sem.'],
                  ['confirmedAdherence', 'Adherencia AC confirmada'],
                  ['teeNoThrombus', 'ETE sin trombo'],
                  ['mechanicalValve', 'Válvula mecánica'],
                  ['rheumaticMitralStenosis', 'Estenosis mitral reumática'],
                ] as Array<[keyof SessionState, string]>).map(([field, label]) => {
                  const val = state[field];
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleBool(field)}
                      className={
                        val === true
                          ? field === 'mechanicalValve' || field === 'rheumaticMitralStenosis'
                            ? 'quick-chip border-rose-500/60 bg-rose-500/20 text-rose-300'
                            : 'quick-chip quick-chip-active'
                          : val === false
                          ? 'quick-chip border-rose-800/50 bg-rose-950/40 text-rose-300'
                          : 'quick-chip'
                      }
                    >
                      {val === true ? '✓ ' : val === false ? '✗ No ' : '+ '}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condiciones clínicas y seguridad */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Condiciones clínicas y seguridad
              </p>
              <div className="flex flex-wrap gap-2">
                {([
                  ['activeBleed', 'Sangrado activo'],
                  ['dialysis', 'Diálisis'],
                  ['aki', 'AKI en curso'],
                  ['structuralHeartDisease', 'Cardiopatía estructural'],
                  ['preexcitation', 'Preexcitación (WPW)'],
                  ['plannedPciOrSurgery', 'PCI/cirugía planif.'],
                ] as Array<[keyof SessionState, string]>).map(([field, label]) => {
                  const val = state[field];
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleBool(field)}
                      className={
                        val === true
                          ? 'quick-chip quick-chip-active'
                          : val === false
                          ? 'quick-chip border-rose-800/50 bg-rose-950/40 text-rose-300'
                          : 'quick-chip'
                      }
                    >
                      {val === true ? '✓ ' : val === false ? '✗ No ' : '+ '}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

