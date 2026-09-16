import { useSession } from '../context/session';
import { validNumber, type TherapyContext } from '../clinical/therapy-context';

type Choice = [string, string];
const yesNo: Choice[] = [['unknown', 'No informado'], ['no', 'No'], ['yes', 'Sí']];
const safetyQuestions = [
  ['activeBleeding', 'Sangrado activo'], ['priorBleeding', 'Sangrado relevante previo'],
  ['priorStroke', 'ACV o AIT previo'], ['priorIch', 'Hemorragia intracraneal previa'],
  ['oralAnticoagulation', 'Indicación de anticoagulación oral'], ['aspirinAllergy', 'Alergia a AAS'],
  ['p2y12Allergy', 'Alergia a algún P2Y12'], ['surgeryPlanned', 'Cirugía o procedimiento próximo'],
] as const;

export function TherapyContextForm({ antiplateletsOnly = false }: { antiplateletsOnly?: boolean }) {
  const { state, dispatch } = useSession();
  const set = (field: keyof TherapyContext, value: TherapyContext[keyof TherapyContext]) => dispatch({ type: 'SET_THERAPY_FIELD', field, value });
  const select = (field: keyof TherapyContext, label: string, choices: Choice[] = yesNo) => <div key={field}>
    <label className="label" htmlFor={`therapy-${field}`}>{label}</label>
    <select id={`therapy-${field}`} className="select-field" value={String(state.therapy[field])} onChange={e => set(field, e.target.value as TherapyContext[keyof TherapyContext])}>
      {choices.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select>
  </div>;
  const number = (field: keyof TherapyContext, label: string, min: number, max: number, hint: string) => {
    const value = state.therapy[field] as number | null;
    const invalid = value !== null && !validNumber(value, min, max);
    return <div key={field}><label className="label" htmlFor={`therapy-${field}`}>{label}</label>
      <input id={`therapy-${field}`} className="input-field" type="number" inputMode="decimal" step="any" min={min} max={max} value={value ?? ''} placeholder="No informado" aria-invalid={invalid} aria-describedby={`hint-${field}`} onChange={e => set(field, e.target.value === '' ? null : Number(e.target.value))} />
      <p id={`hint-${field}`} className={`text-xs mt-1 ${invalid ? 'text-amber-300' : 'text-slate-500'}`}>{invalid ? `Revisá la unidad y el valor (${min}–${max}).` : hint}</p>
    </div>;
  };
  return <div className="space-y-6">
    <p className="text-sm text-slate-400">Se comparte con el paciente actual. Un dato no informado nunca se interpreta como “no”. Edad, peso, talla y creatinina se editan en <a href="#paciente" className="text-teal-300 underline">Paciente</a>.</p>
    {(state.condition === 'sca' || antiplateletsOnly) && <fieldset><legend className="section-title">Contexto coronario</legend><div className="grid sm:grid-cols-2 gap-3">
      {select('acsType', 'Tipo de SCA', [['unknown', 'No informado'], ['stemi', 'Con elevación del ST'], ['nstemi', 'Sin elevación del ST']])}
      {select('strategy', 'Estrategia del SCA', [['unknown', 'No informada'], ['pci', 'PCI / angioplastia'], ['medical', 'Tratamiento médico sin PCI'], ['fibrinolysis', 'Fibrinólisis'], ['cabg', 'Cirugía coronaria']])}
      {number('monthsSinceAcs', 'Meses desde el SCA', 0, 240, '0 = evento actual; podés usar decimales.')}
      {select('currentP2y12', 'P2Y12 que recibe actualmente', [['unknown', 'No conciliado'], ['none', 'Ninguno, confirmado'], ['clopidogrel', 'Clopidogrel'], ['ticagrelor', 'Ticagrelor'], ['prasugrel', 'Prasugrel']])}
    </div></fieldset>}
    <fieldset><legend className="section-title">Antecedentes que cambian la elección</legend><div className="grid sm:grid-cols-2 gap-3">
      {safetyQuestions.map(([field, label]) => select(field, label))}
      {select('bleedingRisk', 'Riesgo hemorrágico valorado por el médico', [['unknown', 'No valorado'], ['not-high', 'Sin alto riesgo tras evaluación clínica'], ['high', 'Alto riesgo hemorrágico']])}
      {select('liver', 'Situación hepática', [['unknown', 'No evaluada'], ['none', 'Sin hepatopatía conocida tras revisión'], ['abnormal', 'Alterada / en estudio'], ['severe', 'Insuficiencia grave / cirrosis descompensada']])}
      {select('interactions', 'Interacciones tras conciliar medicación', [['unknown', 'No revisadas'], ['none', 'Sin interacción relevante identificada'], ['cyp3a', 'Interacción potente CYP3A'], ['omeprazole', 'Omeprazol / esomeprazol'], ['other', 'Otra interacción por resolver']])}
      {state.sex !== 'male' && select('pregnancy', 'Embarazo o lactancia', [['unknown', 'No informado'], ['no', 'No / no corresponde, confirmado'], ['yes', 'Sí']])}
    </div><p className="text-xs text-slate-500 mt-3">Las señales detectadas pueden requerir individualizar aunque se haya declarado “sin alto riesgo”.</p></fieldset>
    <fieldset><legend className="section-title">Laboratorio para esta decisión</legend><div className="grid sm:grid-cols-2 gap-3">
      {select('labsCurrent', 'Laboratorio vigente para esta decisión')}
      {number('hemoglobin', 'Hemoglobina (g/dL)', 0, 25, 'Ejemplo: 12,5 g/dL.')}
      {number('platelets', 'Plaquetas (×10⁹/L)', 0, 2000, '180 equivale a 180.000/mm³. No ingresar 180000.')}
      {number('altMultiple', 'ALT (veces el límite superior normal)', 0, 1000, 'ALT ÷ límite del laboratorio. Ej.: 80 ÷ 40 = 2.')}
      {!antiplateletsOnly && number('ldl', 'LDL (mg/dL)', 0, 1000, 'Interpretar junto al tratamiento que recibe.')}
      {!antiplateletsOnly && number('hba1c', 'HbA1c (%)', 2, 25, 'Resultado reciente; verificar interferencias.')}
    </div></fieldset>
    {!antiplateletsOnly && <fieldset><legend className="section-title">Metabolismo y seguimiento</legend><div className="grid sm:grid-cols-2 gap-3">
      {select('diabetes', 'Diabetes', [['unknown', 'No informada'], ['no', 'No'], ['type1', 'Tipo 1'], ['type2', 'Tipo 2'], ['new', 'Diagnóstico reciente / por caracterizar']])}
      {select('glycemicEvents', 'Hiper / hipoglucemia en la internación')}
      {select('diabetesTherapyChanged', 'Tratamiento glucémico modificado')}
      {select('muscleSymptoms', 'Síntomas musculares inexplicados')}
    </div></fieldset>}
  </div>;
}
