import type { SessionState } from '../context/session';
import { adultPatient, therapyEgfr } from './therapy';
import { validNumber } from './therapy-context';

export interface FollowUpItem {
  id: string;
  title: string;
  reason: string;
  action: string;
  timing: 'now' | 'before-discharge' | 'outpatient';
  sourceIds: string[];
}

/** Propuestas condicionadas por hallazgos; los plazos no certifican aptitud de alta. */
export function buildFollowUp(state: SessionState): FollowUpItem[] {
  if (!adultPatient(state)) return [];
  const t = state.therapy;
  const egfr = therapyEgfr(state);
  const items: FollowUpItem[] = [];
  const add = (item: FollowUpItem) => items.push(item);
  if (t.activeBleeding === 'yes') add({ id: 'bleeding', title: 'Evaluar sangrado durante la internación', reason: 'Se informó sangrado activo.', action: 'Valorar estabilidad, sitio y gravedad; hemograma y hemostasia según contexto. Coordinar con el especialista correspondiente antes de resolver antitrombóticos. No diferir a consultorio.', timing: 'now', sourceIds: ['acsAntithrombotics'] });
  if (t.labsCurrent === 'yes' && validNumber(t.platelets, 0, 2000) && t.platelets < 100) add({ id: 'hematology', title: 'Hematología', reason: `Plaquetas ${t.platelets} ×10⁹/L.`, action: 'Confirmar recuento y frotis, revisar tendencia, fármacos y exposición a heparina. En un SCA, coordinar la estrategia antitrombótica durante la internación; acordar seguimiento si persiste. Sangrado o recuento muy bajo requieren evaluación urgente.', timing: t.platelets < 30 || t.activeBleeding === 'yes' ? 'now' : 'before-discharge', sourceIds: ['platelets', 'arcHbr'] });
  if (t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 0, 25) && t.hemoglobin < (state.sex === 'female' ? 12 : 13)) add({ id: 'anemia', title: 'Estudio de anemia', reason: `Hb ${t.hemoglobin} g/dL; interpretar con sexo, tendencia y contexto.`, action: 'Revisar hemograma completo, pérdidas y ferropenia. Considerar ferritina/saturación de transferrina según sospecha. Hematología si causa no aclarada u otras citopenias; Gastroenterología si se sospecha pérdida digestiva. La cifra aislada no define una transfusión.', timing: t.hemoglobin < 8 ? 'now' : 'before-discharge', sourceIds: ['arcHbr', 'hfMonitoring'] });
  if (state.renalStatus === 'unstable') add({ id: 'nephrology-acute', title: 'Reevaluación renal durante la internación', reason: 'Creatinina cambiante / lesión renal aguda declarada.', action: 'Revisar tendencia, diuresis, volemia, electrolitos y nefrotóxicos. Considerar Nefrología según gravedad, causa y evolución; no basar dosis en una estimación estable ni diferir un deterioro activo a consultorio.', timing: 'now', sourceIds: ['kdigo'] });
  else if (state.renalStatus === 'dialysis') add({ id: 'nephrology-dialysis', title: 'Coordinar con Nefrología', reason: 'Diálisis / reemplazo renal.', action: 'Acordar modalidad, próximas sesiones, peso objetivo y pauta farmacológica; asegurar continuidad antes del alta.', timing: 'before-discharge', sourceIds: ['kdigo'] });
  else if (egfr !== null && egfr < 30) add({ id: 'nephrology', title: 'Nefrología', reason: `TFGe ${egfr.toFixed(1)} mL/min/1,73 m² con creatinina declarada estable.`, action: 'Coordinar seguimiento por filtrado <30; revisar valores previos y albuminuria. Una medición no confirma enfermedad renal crónica. Priorizar durante la internación si hay deterioro, alteraciones electrolíticas o dudas de manejo.', timing: 'outpatient', sourceIds: ['kdigo'] });
  if (validNumber(state.potassium, 1, 10) && (state.potassium >= 6 || state.potassium < 3)) add({ id: 'potassium', title: 'Potasio: evaluación actual', reason: `K informado ${state.potassium} mEq/L.`, action: 'Verificar muestra, temporalidad, ECG y síntomas; resolver según protocolo de la unidad. No convertir este hallazgo en una indicación rutinaria de laboratorio ambulatorio.', timing: 'now', sourceIds: ['hyperk'] });
  if (t.liver === 'severe') add({ id: 'hepatology-urgent', title: 'Valoración hepática antes del alta', reason: 'Se informó hepatopatía grave.', action: 'Definir diagnóstico, compensación y función de síntesis; coordinar con Hepatología. Si hay ictericia aguda, encefalopatía o deterioro de síntesis, evaluar de inmediato.', timing: 'before-discharge', sourceIds: ['liverTests'] });
  else if (t.liver === 'abnormal' || (t.labsCurrent === 'yes' && validNumber(t.altMultiple, 0, 1000) && t.altMultiple >= 3)) add({ id: 'hepatology', title: 'Evaluación hepática y eventual Hepatología', reason: t.altMultiple !== null && t.labsCurrent === 'yes' ? `ALT informada: ${t.altMultiple} × límite superior; revisar el patrón completo.` : 'Alteración hepática declarada.', action: 'Revisar fármacos, alcohol, congestión y tendencia; hepatograma con bilirrubina y, según contexto, albúmina/INR. Estudio etiológico y derivación si no se aclara la causa. El plazo depende de síntomas y función de síntesis, no solo de ALT.', timing: 'before-discharge', sourceIds: ['liverTests'] });
  const dysglycemia = t.glycemicEvents === 'yes' || t.diabetes === 'new';
  if (dysglycemia || t.diabetes === 'type1' || t.diabetes === 'type2') {
    if (t.labsCurrent !== 'yes' || !validNumber(t.hba1c, 2, 25)) add({ id: 'hba1c', title: 'HbA1c y plan glucémico', reason: 'Diabetes o alteración glucémica registrada sin HbA1c vigente.', action: 'Solicitar HbA1c si no hay una de los últimos 3 meses. Interpretar con cautela si hubo transfusión, anemia o alteración de recambio eritrocitario.', timing: 'before-discharge', sourceIds: ['diabetesHospital'] });
    add({ id: 'endocrinology', title: 'Diabetología / Endocrinología o equipo habitual', reason: `${t.diabetes === 'new' ? 'Diabetes de diagnóstico reciente.' : 'Diabetes o disglucemia en la sesión.'}${t.diabetesTherapyChanged === 'yes' ? ' Se modificó el tratamiento.' : ''}`, action: `${dysglycemia || t.diabetesTherapyChanged === 'yes' ? 'Coordinar control en 1–2 semanas si se modificó tratamiento o el control al alta no es adecuado; dentro del mes tras disglucemia hospitalaria.' : 'Acordar el próximo control con el equipo habitual; priorizar si hay dificultades para el autocuidado.'} Revisar acceso a medicación, automonitoreo y reconocimiento de hipoglucemia.`, timing: 'outpatient', sourceIds: ['diabetesHospital'] });
  }
  if (state.condition === 'sca') {
    add({ id: 'cardiology', title: 'Cardiología y rehabilitación cardiovascular', reason: 'SCA registrado.', action: 'Dejar turno y derivación a rehabilitación antes del alta. Documentar combinación antitrombótica, motivo, duración prevista y fecha de reevaluación; explicar signos de sangrado y evitar interrupciones sin consulta.', timing: 'before-discharge', sourceIds: ['acsDischarge'] });
    add({ id: 'lipids', title: 'Respuesta a hipolipemiantes', reason: 'Prevención secundaria tras SCA.', action: 'Si se inicia o ajusta hipolipemiante: perfil lipídico a las 4–8 semanas; controlar tolerancia y adherencia. Transaminasas a los 2–3 meses o antes si hay síntomas.', timing: 'outpatient', sourceIds: ['acsDischarge', 'lipidMonitoring'] });
  }
  if (state.condition === 'ic' && state.phase !== 'shock_inotropicos') add({ id: 'hf-labs', title: 'Laboratorio tras cambios del tratamiento de IC', reason: 'IC en fase compensada o pre-alta.', action: 'Si se inicia o aumenta IECA/ARA II/ARNI/ARM: función renal y electrolitos a las 1–2 semanas; antes según riesgo. Para diuréticos, ajustar control a volemia y respuesta. Dejar responsable de revisar el resultado.', timing: 'outpatient', sourceIds: ['hfMonitoring'] });
  return items;
}
