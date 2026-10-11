import { useSession, type SessionState } from '../context/session';
import type { ScaContext } from '../clinical/sca-context';
import type { TherapyContext } from '../clinical/therapy-context';
import { validNumber } from '../clinical/therapy-context';

type Choices = readonly (readonly [string, string])[];
const yesNo: Choices = [['unknown', 'Confirmar'], ['no', 'No, confirmado'], ['yes', 'Sí']];
export const scaMoments: Choices = [['unknown', 'Momento no informado'], ['acute', 'Fase aguda'], ['ward', 'Internación'], ['discharge', 'Prealta'], ['followup', 'Seguimiento']];

export function ScaMoment() {
  const { state, dispatch } = useSession();
  return <div><label className="label" htmlFor="sca-moment">Momento de la consulta</label><select id="sca-moment" className="select-field" value={state.sca.moment} onChange={e => dispatch({ type: 'SET_SCA_FIELD', field: 'moment', value: e.target.value as ScaContext['moment'] })}>{scaMoments.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>;
}

export function ScaContextForm() {
  const { state, dispatch } = useSession();
  const scaSelect = (field: keyof ScaContext, label: string, choices: Choices = yesNo) => <div key={field}><label className="label" htmlFor={`sca-${field}`}>{label}</label><select className="select-field" id={`sca-${field}`} value={String(state.sca[field])} onChange={e => dispatch({ type: 'SET_SCA_FIELD', field, value: e.target.value as ScaContext[typeof field] })}>{choices.map(([v, name]) => <option key={v} value={v}>{name}</option>)}</select></div>;
  const therapySelect = (field: keyof TherapyContext, label: string, choices: Choices = yesNo) => <div key={field}><label className="label" htmlFor={`sca-shared-${field}`}>{label}</label><select className="select-field" id={`sca-shared-${field}`} value={String(state.therapy[field])} onChange={e => dispatch({ type: 'SET_THERAPY_FIELD', field, value: e.target.value as TherapyContext[typeof field] })}>{choices.map(([v, name]) => <option key={v} value={v}>{name}</option>)}</select></div>;
  const number = (id: string, label: string, value: number | null, min: number, max: number, set: (v: number | null) => void) => <div key={id}><label className="label" htmlFor={`sca-${id}`}>{label}</label><input id={`sca-${id}`} className="input-field" type="number" inputMode="decimal" step="any" min={min} max={max} value={value ?? ''} placeholder="No informado" aria-invalid={value !== null && !validNumber(value, min, max)} onChange={e => set(e.target.value === '' ? null : Number(e.target.value))} />{value !== null && !validNumber(value, min, max) && <p className="text-xs text-amber-200">Revisá valor y unidad ({min}–{max}).</p>}</div>;
  const patientNumber = (field: keyof SessionState, label: string, min: number, max: number) => number(field, label, state[field] as number | null, min, max, value => dispatch({ type: 'SET_PATIENT_FIELD', field, value }));
  return <details className="source-details sca-context"><summary>Personalizar SCA · datos compartidos y precauciones</summary>
    <p className="text-sm text-slate-400 my-4">Opcional para consultar referencias. Desconocido no equivale a ausente. Lo que edites se conserva al navegar durante esta sesión.</p>
    <fieldset><legend className="section-title">Hemodinamia y función renal</legend><div className="sca-form-grid">
      {patientNumber('age', 'Edad (años)', 18, 120)}{patientNumber('weight', 'Peso (kg)', 1, 500)}{patientNumber('height', 'Talla (cm)', 100, 250)}
      <div><label className="label" htmlFor="sca-sex">Sexo</label><select id="sca-sex" className="select-field" value={state.sex ?? ''} onChange={e => dispatch({ type: 'SET_PATIENT_FIELD', field: 'sex', value: e.target.value || null })}><option value="">No informado</option><option value="male">Masculino</option><option value="female">Femenino</option></select></div>
      {patientNumber('systolicBP', 'TAS (mmHg)', 40, 300)}{patientNumber('heartRate', 'FC (lpm)', 20, 300)}{patientNumber('lvef', 'FEVI (%)', 1, 100)}{patientNumber('creatinine', 'Creatinina (mg/dL)', .01, 30)}{patientNumber('potassium', 'Potasio (mEq/L)', 1, 10)}
      <div><label className="label" htmlFor="sca-phase">Situación hemodinámica</label><select id="sca-phase" className="select-field" value={state.phase ?? ''} onChange={e => dispatch({ type: 'SET_PATIENT_FIELD', field: 'phase', value: e.target.value || null })}><option value="">No informada</option><option value="shock_inotropicos">Shock / inotrópicos</option><option value="compensado">Compensado</option><option value="pre_alta">Prealta clínicamente evaluada</option></select></div>
      <div><label className="label" htmlFor="sca-renal">Situación renal</label><select id="sca-renal" className="select-field" value={state.renalStatus} onChange={e => dispatch({ type: 'SET_PATIENT_FIELD', field: 'renalStatus', value: e.target.value })}><option value="unknown">No informada</option><option value="stable">Creatinina estable</option><option value="unstable">Creatinina cambiante / LRA</option><option value="dialysis">Diálisis</option></select></div>
      {number('spo2', 'SpO₂ (%)', state.sca.spo2, 1, 100, value => dispatch({ type: 'SET_SCA_FIELD', field: 'spo2', value }))}
    </div></fieldset>
    <fieldset className="mt-5"><legend className="section-title">Datos que modifican la elección</legend><div className="sca-form-grid">
      {scaSelect('infarction', 'Infarto de miocardio confirmado')}{scaSelect('hfSigns', 'Signos de insuficiencia cardíaca')}{scaSelect('acuteHf', 'IC aguda descompensada')}
      {scaSelect('hit', 'HIT: antecedente o sospecha')}{scaSelect('heparinAllergy', 'Alergia a heparinas')}{scaSelect('otherDrugAllergy', 'Alergia a otra medicación propuesta')}
      {scaSelect('avBlock', 'Bloqueo AV avanzado sin marcapasos')}{scaSelect('bronchospasm', 'Broncoespasmo activo')}{scaSelect('angioedema', 'Angioedema previo')}{scaSelect('aceIntolerance', 'Intolerancia a IECA')}
      {scaSelect('giRisk', 'Riesgo gastrointestinal valorado')}{scaSelect('nitrateIndication', 'Isquemia/congestión que justifique nitratos')}{scaSelect('pde5', 'PDE5 recientes o riociguat')}{scaSelect('rvInfarction', 'Infarto de VD / dependencia de precarga')}
      {scaSelect('currentAnticoagulant', 'Anticoagulante recibido', [['unknown', 'No conciliado'], ['none', 'Ninguno, confirmado'], ['ufh', 'HNF'], ['enoxaparin', 'Enoxaparina'], ['fondaparinux', 'Fondaparinux'], ['oral', 'Anticoagulante oral'], ['other', 'Otro']])}
      {scaSelect('currentRas', 'IECA / ARA II / ARNI actual', [['unknown', 'No conciliado'], ['none', 'Ninguno, confirmado'], ['acei', 'IECA'], ['arb', 'ARA II'], ['arni', 'ARNI']])}
      {scaSelect('lipidTherapy', 'Tratamiento hipolipemiante actual', [['unknown', 'No conciliado'], ['none', 'Sin tratamiento'], ['not-maximal', 'Estatina, aún no máxima tolerada'], ['max-tolerated', 'Estatina máxima tolerada confirmada'], ['intolerant', 'Intolerancia por evaluar']])}
      {therapySelect('diabetes', 'Diabetes', [['unknown', 'No informada'], ['no', 'No'], ['type1', 'Tipo 1'], ['type2', 'Tipo 2'], ['new', 'Diagnóstico reciente']])}
      {therapySelect('muscleSymptoms', 'Síntomas musculares inexplicados')}{therapySelect('glycemicEvents', 'Hiper / hipoglucemia en la internación')}{therapySelect('diabetesTherapyChanged', 'Tratamiento glucémico modificado')}
      {number('ldl', 'LDL (mg/dL)', state.therapy.ldl, 0, 1000, value => dispatch({ type: 'SET_THERAPY_FIELD', field: 'ldl', value }))}
      {number('hba1c', 'HbA1c (%)', state.therapy.hba1c, 2, 25, value => dispatch({ type: 'SET_THERAPY_FIELD', field: 'hba1c', value }))}
    </div></fieldset>
    <p className="text-xs text-slate-400 mt-4">Sangrado, anticoagulación oral y P2Y12 se editan en Decisión rápida. Hemograma, hepatopatía, interacciones y ALT están en Datos avanzados de la ficha de antiagregación integrada debajo; son los mismos datos de Paciente.</p>
  </details>;
}
