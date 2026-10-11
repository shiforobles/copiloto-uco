import type { SessionState } from '../context/session';
import { buildDaptReference } from './dapt-reference';
import { buildFollowUp, type FollowUpItem } from './follow-up';
import { adultPatient, evaluateTreatment, therapyEgfr } from './therapy';
import { validNumber } from './therapy-context';
import { buildScaAnticoagulation } from './sca-anticoagulation';
import { completeOption, option, scaDosingClCr, type ScaOption } from './sca-common';
import { scaReview } from './sca-sources';

export interface ScaGroup { id: string; title: string; note: string; rows: ScaOption[] }

export function buildScaIntegral(state: SessionState) {
  const t = state.therapy, s = state.sca;
  const renal = scaDosingClCr(state), egfr = therapyEgfr(state);
  const shock = state.phase === 'shock_inotropicos';
  const lowBp = validNumber(state.systolicBP, 40, 300) && state.systolicBP < 90;
  const lowHr = validNumber(state.heartRate, 20, 300) && state.heartRate < 55;
  const reducedEf = validNumber(state.lvef, 1, 100) && state.lvef <= 40;
  const diabetic = ['type1', 'type2', 'new'].includes(t.diabetes);
  const alerts: string[] = [];
  if (state.condition !== 'sca') alerts.push('Confirmar SCA: la condición actual no establece esta indicación. Las dosis siguientes son referencias generales para adultos.');
  if (state.age !== null && !adultPatient(state)) alerts.push('Edad fuera del alcance adulto: no aplicar estas pautas al paciente ingresado.');
  if (shock || lowBp) alerts.push('Inestabilidad hemodinámica: priorizar perfusión, reperfusión y complicaciones. No iniciar automáticamente tratamiento crónico.');
  if (s.acuteHf === 'yes') alerts.push('IC aguda descompensada: estabilizar y revisar congestión antes de iniciar o titular betabloqueantes.');
  if (state.renalStatus === 'unstable' || state.renalStatus === 'dialysis') alerts.push('LRA/diálisis: no se calculan ajustes mediante ecuaciones de función renal estable.');
  if (t.activeBleeding === 'yes') alerts.push('Sangrado activo: resolver durante la internación; conservar las referencias no habilita antitrombóticos.');
  if (s.hit === 'yes') alerts.push('HIT sospechada/confirmada: evitar HNF y enoxaparina; valoración urgente y alternativa especializada.');
  if (t.strategy === 'fibrinolysis' && t.acsType === 'nstemi') alerts.push('SCASEST con fibrinólisis: revisar diagnóstico y estrategia antes de trasladar cualquier pauta.');
  if (s.moment === 'discharge' || s.moment === 'followup') alerts.push('Prealta/seguimiento no significa estabilidad confirmada ni aptitud de alta. Revisar los problemas activos.');

  const groups: ScaGroup[] = [];
  const atorva = option('atorvastatin', 'Atorvastatina', '40–80 mg VO cada 24 h.', 'Alta intensidad tras SCA o máxima dosis tolerada.', ['acs', 'atorvastatin', 'lipidMonitoring']);
  const rosu = option('rosuvastatin', 'Rosuvastatina', '20–40 mg VO cada 24 h como referencia de alta intensidad; no es dosis inicial universal.', 'Alternativa a atorvastatina; revisar función renal y factores de miopatía.', ['acs', 'rosuvastatin']);
  const eze = option('ezetimibe', 'Ezetimiba', '10 mg VO cada 24 h.', 'Añadir según LDL y respuesta a estatina máxima tolerada, o valorar ante intolerancia.', ['acs', 'ezetimibe']);
  const statinAdvice = evaluateTreatment('estatina', state);
  for (const row of [atorva, rosu, eze]) {
    row.contraindications = 'Revisar alergia, enfermedad hepática, embarazo/lactancia e interacciones. Ezetimiba no se recomienda con disfunción hepática moderada/grave.';
    row.monitoring = 'LDL y ALT/AST basales. Perfil lipídico a las 4–8 semanas tras iniciar/cambiar; transaminasas a los 2–3 meses o según síntomas.';
    if (t.liver === 'unknown') row.pending.push('Situación hepática');
    if (t.interactions === 'unknown') row.pending.push('Interacciones y medicación habitual');
    if (s.lipidTherapy === 'unknown') row.pending.push('Hipolipemiante actual, tolerancia y adherencia');
    if (t.labsCurrent !== 'yes' || !validNumber(t.altMultiple, 0, 1000)) row.pending.push('ALT/AST basales vigentes');
    if (state.sex !== 'male' && t.pregnancy === 'unknown') row.pending.push('Embarazo/lactancia cuando corresponda');
    if (t.liver === 'severe' || t.pregnancy === 'yes') row.avoid.push('Hepatopatía grave o embarazo/lactancia: no iniciar esta pauta sin evaluación especializada.');
    if (t.liver === 'abnormal' || (t.interactions !== 'none' && t.interactions !== 'unknown')) row.cautions.push('Precisar alteración hepática / interacción antes de elegir.');
  }
  for (const row of [atorva, rosu]) {
    row.contraindications += ' No iniciar/intensificar ante elevación relevante de transaminasas o síntomas musculares sin evaluar.';
    row.monitoring += ' CK si síntomas musculares, no de rutina.';
    if (statinAdvice.status === 'blocked') row.avoid.push(statinAdvice.summary);
    // Advertencias independientes de campos que hacen retornar temprano al evaluador heredado.
    if (t.labsCurrent === 'yes' && validNumber(t.altMultiple, 0, 1000) && t.altMultiple >= 3) row.avoid.push('ALT ≥3 × LSN: evaluar antes de iniciar/intensificar estatina.');
    if (t.muscleSymptoms === 'unknown') row.pending.push('Síntomas musculares');
    if (t.muscleSymptoms === 'yes' || s.lipidTherapy === 'intolerant') row.cautions.push('Evaluar intolerancia/miopatía, CK si corresponde; no reexponer automáticamente.');
  }
  if (renal === null) rosu.pending.push('ClCr antes de elegir intensidad');
  if (renal && renal.value < 30) rosu.avoid.push('ClCr <30: rosuvastatina contraindicada según la ficha AEMPS consultada.');
  else if (renal && renal.value < 60) rosu.cautions.push('ClCr <60: inicio de ficha 5 mg/día; 40 mg contraindicado. No trasladar automáticamente alta intensidad.');
  if (state.renalStatus === 'unstable' || state.renalStatus === 'dialysis') rosu.cautions.push('Función renal no evaluable por ClCr estable: individualizar.');
  if (adultPatient(state) && state.age! > 70) rosu.cautions.push('Edad >70: la ficha propone inicio de 5 mg; titular según tolerancia.');
  if (t.liver === 'abnormal') eze.cautions.push('Precisar gravedad hepática antes de ezetimiba.');
  if (!validNumber(t.ldl, 0, 1000) || t.labsCurrent !== 'yes') eze.pending.push('LDL vigente y tratamiento con el que se obtuvo');
  eze.reason = s.lipidTherapy === 'max-tolerated' && t.labsCurrent === 'yes' && validNumber(t.ldl, 70, 1000)
    ? 'LDL ≥70 mg/dL pese a estatina máxima tolerada declarada: considerar añadir un no-estatínico; ezetimiba es una opción.'
    : 'Referencia para intensificación individual: no añadir solo por un LDL aislado sin conocer el tratamiento previo. Con LDL 55–69 también puede valorarse según riesgo.';
  groups.push({ id: 'lipids', title: 'Estatinas y control lipídico', note: 'Atorvastatina y rosuvastatina son alternativas. Ezetimiba puede ser complemento; no se indican las tres por defecto.', rows: [atorva, rosu, eze] });

  const carvedilol = option('carvedilol', 'Carvedilol', 'IC estabilizada: iniciar 3,125 mg VO cada 12 h; titular gradualmente según tolerancia (referencia habitual: 25 mg cada 12 h).', 'Referencia de dosis para IC estable con FEVI reducida.', ['carvedilol', 'acs']);
  const metoprolol = option('metoprolol', 'Metoprolol succinato LP', 'IC estabilizada: iniciar 12,5–25 mg VO cada 24 h; titular cada 2 semanas hasta 200 mg/día o máxima tolerada.', 'Alternativa en IC estable; confirmar formulación de liberación prolongada.', ['metoprolol', 'acs']);
  for (const row of [carvedilol, metoprolol]) {
    row.reason = reducedEf ? 'FEVI ≤40%: beneficio del betabloqueo una vez estabilizado. No comenzar durante shock o IC descompensada.' : 'En SCA, valorar inicio oral temprano si no hay contraindicaciones. Estas dosis corresponden a IC estabilizada; con FEVI preservada, individualizar pauta y duración.';
    row.contraindications = 'Shock, hipoperfusión, IC aguda descompensada, bradicardia, bloqueo AV avanzado sin marcapasos o broncoespasmo activo.';
    row.monitoring = 'FC, TAS, ECG, perfusión, congestión y tolerancia. No suspender bruscamente un tratamiento previo ni duplicar betabloqueantes.';
    if (shock || lowBp || lowHr || s.acuteHf === 'yes' || s.avBlock === 'yes' || s.bronchospasm === 'yes') row.avoid.push('No iniciar/titular ahora: shock, hipotensión, FC <55, IC aguda, bloqueo o broncoespasmo declarado.');
    if (t.liver === 'severe') row.cautions.push('Hepatopatía grave: revisar ficha y dosis.');
    if (row.id === 'carvedilol' && t.liver === 'severe') row.avoid.push('Carvedilol: hepatopatía clínicamente manifiesta grave.');
    if (!state.phase) row.pending.push('Estabilidad hemodinámica');
    if (!validNumber(state.systolicBP, 40, 300)) row.pending.push('TAS');
    if (!validNumber(state.heartRate, 20, 300)) row.pending.push('FC');
    if (!validNumber(state.lvef, 1, 100)) row.pending.push('FEVI e indicación');
    for (const [field, label] of [['acuteHf', 'IC aguda descompensada'], ['avBlock', 'Bloqueo AV / ECG'], ['bronchospasm', 'Broncoespasmo']] as const) if (s[field] === 'unknown') row.pending.push(label);
  }
  groups.push({ id: 'beta', title: 'Betabloqueantes', note: 'Elegir uno. La pauta de IC estable no reemplaza un protocolo de las primeras horas del infarto; no proponer betabloqueo IV rutinario.', rows: [carvedilol, metoprolol] });

  const ramipril = option('ramipril', 'Ramipril (IECA)', 'Posinfarto con IC, >48 h y estable: 2,5 mg VO cada 12 h; si no tolera, 1,25 mg cada 12 h. Titular hacia 5 mg cada 12 h según tolerancia y función renal.', 'Prioridad con FEVI ≤40%, IC, diabetes, HTA o infarto anterior; valorar en otros SCA.', ['ramipril', 'acs']);
  const valsartan = option('valsartan', 'Valsartán (ARA II)', 'Posinfarto estable con disfunción VI / IC: iniciar 20 mg VO cada 12 h; titular hacia 160 mg cada 12 h según tolerancia.', 'Alternativa especialmente si hay intolerancia a IECA; no combinar con IECA ni ARNI.', ['valsartan', 'acs']);
  for (const row of [ramipril, valsartan]) {
    row.contraindications = 'Embarazo, hipotensión/shock, hiperpotasemia, estenosis bilateral de arterias renales o deterioro renal que requiera reevaluación. No combinar IECA + ARA II + ARNI.';
    row.monitoring = 'TAS, creatinina y K basales; repetir 1–2 semanas después de iniciar/aumentar, antes si alto riesgo. Revisar volemia, AINE y suplementos de K.';
    if (shock || lowBp || t.pregnancy === 'yes') row.avoid.push('No iniciar en shock/hipotensión ni embarazo.');
    if (validNumber(state.potassium, 1, 10) && state.potassium >= 5.5) row.avoid.push('K ≥5,5: resolver antes de iniciar o aumentar.');
    if (state.renalStatus === 'unstable' || state.renalStatus === 'dialysis') row.cautions.push('LRA/diálisis: individualizar con evolución, volemia y Nefrología.');
    if (!state.phase) row.pending.push('Estabilidad hemodinámica');
    if (!validNumber(state.systolicBP, 40, 300)) row.pending.push('TAS');
    if (!validNumber(state.lvef, 1, 100)) row.pending.push('FEVI / indicación');
    if (egfr === null || !validNumber(state.potassium, 1, 10)) row.pending.push('Función renal y K vigentes');
    if (s.currentRas === 'unknown') row.pending.push('IECA / ARA II / ARNI actual y última toma');
    else if (s.currentRas !== 'none') row.cautions.push('Ya recibe bloqueo renina-angiotensina: conciliar; no sumar otro agente. Si se pasa de IECA a ARNI, separación de al menos 36 h.');
    if (s.angioedema === 'unknown') row.pending.push('Antecedente de angioedema');
    if (state.sex !== 'male' && t.pregnancy === 'unknown') row.pending.push('Embarazo cuando corresponda');
    if (s.angioedema === 'yes') (row.id === 'ramipril' ? row.avoid : row.cautions).push('Angioedema previo: evitar IECA; ARA II solo tras valoración específica.');
    if (t.liver === 'severe') row.cautions.push('Hepatopatía grave: revisar contraindicaciones y límites de ficha.');
  }
  if (s.aceIntolerance === 'yes') { ramipril.cautions.push('Intolerancia a IECA: precisar reacción.'); valsartan.reason = 'Intolerancia a IECA declarada: valorar ARA II si no hay contraindicaciones.'; }
  if (t.liver === 'severe') valsartan.avoid.push('Valsartán: insuficiencia hepática grave / cirrosis biliar / colestasis, según ficha.');
  if (t.liver === 'abnormal' || t.liver === 'severe') ramipril.cautions.push('Si hay insuficiencia hepática, la ficha limita ramipril a 2,5 mg/día bajo supervisión; no aplicar el objetivo posinfarto sin revisar.');
  if (renal && renal.value < 60) ramipril.cautions.push('ClCr <60: revisar dosis inicial y techo renal; la ficha limita a 5 mg/día con ClCr 10–60. No aplicar objetivo de 10 mg/día.');
  groups.push({ id: 'ras', title: 'IECA / ARA II', note: 'Son alternativas. ARNI corresponde a una indicación de IC; no se propone como sustitución rutinaria solo por haber tenido SCA.', rows: [ramipril, valsartan] });

  const arm = option('eplerenone', 'Eplerenona (ARM)', 'Inicio de referencia: 25 mg VO cada 24 h; objetivo 50 mg/día según K y tolerancia. Con ClCr 30–60: iniciar 25 mg en días alternos. Habitualmente entre días 3–14 tras IAM, una vez estable.', 'IAM con FEVI ≤40% y signos de IC y/o diabetes, con función renal y K compatibles.', ['acs', 'eplerenone', 'scaNice']);
  arm.contraindications = 'No iniciar con K ≥5,0 o TFGe ≤30 en este motor; también contraindicación si ClCr <30, hepatopatía grave o inhibidores potentes CYP3A4. No asociar otro ahorrador de K.';
  arm.monitoring = 'K/creatinina antes, durante la primera semana y al mes de iniciar o ajustar; luego según riesgo. Con ClCr <50, experiencia posinfarto limitada: especial cautela.';
  if (s.infarction === 'unknown') arm.pending.push('IAM confirmado (SCASEST no equivale siempre a infarto)');
  if (s.hfSigns === 'unknown' && !diabetic) arm.pending.push('Signos de IC o diabetes');
  if (s.hfSigns !== 'yes' && t.diabetes === 'unknown') arm.pending.push('Diabetes para establecer indicación');
  if (!validNumber(state.lvef, 1, 100)) arm.pending.push('FEVI');
  if (egfr === null || renal === null) arm.pending.push('TFGe y ClCr válidos con laboratorio vigente');
  if (!validNumber(state.potassium, 1, 10)) arm.pending.push('Potasio');
  if (!state.phase) arm.pending.push('Estabilidad hemodinámica');
  if (!validNumber(state.systolicBP, 40, 300)) arm.pending.push('TAS');
  if (state.sex !== 'male' && t.pregnancy === 'unknown') arm.pending.push('Embarazo/lactancia cuando corresponda');
  if (t.interactions === 'unknown') arm.pending.push('Interacciones, otros ARM y suplementos de K');
  if (t.liver === 'unknown') arm.pending.push('Situación hepática');
  if (s.infarction === 'no' || (validNumber(state.lvef, 1, 100) && !reducedEf) || (s.hfSigns === 'no' && t.diabetes === 'no')) { arm.status = 'not-routine'; arm.reason = 'Con los datos declarados no reúne la indicación posinfarto de esta referencia. No añadir ARM de rutina.'; }
  if (shock || lowBp || t.liver === 'severe' || t.interactions === 'cyp3a' || (validNumber(state.potassium, 1, 10) && state.potassium >= 5) || (egfr !== null && egfr <= 30) || (renal !== null && renal.value < 30)) arm.avoid.push('No iniciar: inestabilidad, K/función renal incompatibles, hepatopatía grave o interacción CYP3A potente.');
  if (state.renalStatus === 'unstable' || state.renalStatus === 'dialysis') arm.cautions.push('LRA/diálisis: no seleccionar pauta automática.');
  if (t.interactions === 'other' || t.interactions === 'omeprazole') arm.cautions.push('Revisar conciliación completa: este campo no descarta otras interacciones de eplerenona.');
  if (t.pregnancy === 'yes') arm.cautions.push('Embarazo/lactancia: evaluación especializada.');
  groups.push({ id: 'arm', title: 'Antagonista mineralocorticoide', note: 'La FEVI baja sola no basta para la indicación posinfarto. No extrapolar la pauta a todo SCA.', rows: [arm] });

  const ppi = option('pantoprazole', 'Pantoprazol', 'Referencia oral de gastroprotección: 20 mg cada 24 h; confirmar pauta local e indicación. No es tratamiento de hemorragia digestiva aguda.', 'Valorar IBP si riesgo gastrointestinal con antitrombóticos.', ['ppiClopidogrel', 'pantoprazole', 'acs']);
  ppi.contraindications = 'Hipersensibilidad a IBP; revisar interacciones. En hepatopatía grave, no superar 20 mg/día según ficha y controlar enzimas.';
  ppi.monitoring = 'Revisar motivo y duración. Con clopidogrel, evitar omeprazol/esomeprazol; pantoprazol es una alternativa. Control de Mg si uso prolongado o riesgo clínico.';
  if (s.giRisk === 'unknown') ppi.pending.push('Úlcera/sangrado digestivo previo y riesgo gastrointestinal');
  if (s.giRisk === 'no' && t.oralAnticoagulation === 'no') { ppi.status = 'not-routine'; ppi.reason = 'Sin riesgo GI ni ACO declarados: revisar necesidad individual; no IBP universal por estar en UCO.'; }
  if (s.giRisk === 'yes' || t.oralAnticoagulation === 'yes') ppi.reason = 'Riesgo GI o combinación con ACO: considerar gastroprotección y definir duración.';
  if (t.activeBleeding === 'yes') ppi.cautions.push('Sangrado activo: identificar origen y tratar ahora; una pauta oral preventiva no resuelve el evento.');
  if (t.interactions === 'unknown') ppi.pending.push('Interacciones y alergia a IBP');
  if (t.liver === 'severe') ppi.cautions.push('Hepatopatía grave: límite de 20 mg/día y seguimiento hepático.');
  groups.push({ id: 'gastro', title: 'Gastroprotección', note: 'La indicación de IBP depende del riesgo, no de completar un casillero.', rows: [ppi] });

  const nitro = option('nitroglycerin', 'Nitroglicerina IV', 'Inicio de referencia: 5 µg/min IV con equipo no adsorbente; titular por síntomas y presión según protocolo. Preparación explícita para convertir a mL/h.', 'Alivio de isquemia/congestión seleccionada; no reemplaza reperfusión.', ['scaNitro', 'acs']);
  nitro.contraindications = 'Hipotensión/shock, dependencia de precarga (p. ej. infarto de VD), PDE5 recientes o riociguat. Verificar agente e intervalo, no basta preguntar por el día de hoy.';
  nitro.monitoring = 'TAS, síntomas y perfusión; concentración y material de la línea.';
  if (shock || lowBp || s.pde5 === 'yes' || s.rvInfarction === 'yes') nitro.avoid.push('Hipotensión/shock, interacción vasodilatadora o compromiso de VD: evitar esta pauta.');
  if (!validNumber(state.systolicBP, 40, 300)) nitro.pending.push('TAS');
  if (s.pde5 === 'unknown') nitro.pending.push('PDE5/riociguat y hora de última dosis');
  if (s.rvInfarction === 'unknown') nitro.pending.push('Infarto de VD / dependencia de precarga');
  if (s.nitrateIndication === 'unknown') nitro.pending.push('Isquemia/congestión que justifique nitratos');
  if (s.nitrateIndication === 'no') { nitro.status = 'not-routine'; nitro.reason = 'Sin isquemia/congestión declarada que justifique nitratos: no iniciar de rutina.'; }
  nitro.link = { href: '#infusiones/nitroglicerina', label: 'Calcular preparación de nitroglicerina' };
  const oxygen = option('oxygen', 'Oxígeno', 'Titular oxígeno suplementario si SpO₂ <90%; objetivo al menos 90%, adaptado a la situación respiratoria.', 'No administrar de rutina en un SCA normoxémico.', ['acs']);
  oxygen.contraindications = 'Evitar hiperoxia; valorar retención de CO₂ y objetivo individual si hay enfermedad respiratoria.';
  oxygen.monitoring = 'Oximetría y trabajo respiratorio; confirmar señal fiable.';
  if (!validNumber(s.spo2, 1, 100)) oxygen.pending.push('SpO₂ válida');
  else if (s.spo2 >= 90) { oxygen.status = 'not-routine'; oxygen.reason = `SpO₂ ${s.spo2}%: sin indicación rutinaria de oxígeno por SCA aislado.`; }
  else oxygen.reason = `SpO₂ ${s.spo2}%: hipoxemia, evaluar y aportar oxígeno ahora.`;
  groups.unshift({ id: 'symptoms', title: 'Soporte y síntomas en fase aguda', note: 'ECG, reperfusión y complicaciones tienen prioridad. Estas medidas no sustituyen una estrategia invasiva ni valoran elegibilidad para fibrinólisis.', rows: [oxygen, nitro] });

  const existingFollowUp = buildFollowUp(state);
  const generalFollowUp: FollowUpItem[] = [
    { id: 'cardiology', title: 'Cardiología y rehabilitación cardiovascular', reason: 'Referencia general tras SCA.', action: 'Organizar turno, rehabilitación, acceso a medicamentos y educación antes del alta. Confirmar diagnóstico y plan de revascularización.', timing: 'before-discharge', sourceIds: ['scaNice', 'acsDischarge'] },
    { id: 'lipids', title: 'Respuesta a hipolipemiantes', reason: 'Si se inicia o modifica el tratamiento.', action: 'Perfil lipídico a las 4–8 semanas; ALT/AST a los 2–3 meses o antes por síntomas. Revisar adherencia y tolerancia.', timing: 'outpatient', sourceIds: ['acsDischarge', 'lipidMonitoring'] },
    { id: 'sca-renal-check', title: 'Control tras IECA / ARA II / ARM', reason: 'Solo si se inicia o aumenta alguno de estos tratamientos.', action: 'IECA/ARA II: K y creatinina a las 1–2 semanas, antes según riesgo. Eplerenona: primera semana y al mes. Dejar fecha y responsable de revisar resultados.', timing: 'outpatient', sourceIds: ['hfMonitoring', 'eplerenone'] },
  ];
  const followUp = [...existingFollowUp, ...generalFollowUp.filter(item => !existingFollowUp.some(i => i.id === item.id))];
  return { ...scaReview, alerts, renal, egfr, dapt: buildDaptReference(state), anticoagulation: buildScaAnticoagulation(state),
    groups: groups.map(group => ({ ...group, rows: group.rows.map(row => completeOption(row, state)) })), followUp,
    discharge: [
      'Conciliar medicación realmente recibida: fármaco, dosis, última toma, alergias, adherencia y acceso. Esta pantalla es referencia para indicaciones en papel.',
      'Documentar diagnóstico, fecha del evento/PCI, FEVI y plan de revascularización. Revisar dolor, congestión, arritmias, sangrado y función renal pendientes.',
      'Dejar combinación antitrombótica, duración prevista y fecha de reevaluación. DAPT no sustituye ACO por FA; no continuar heparinas por SCA sin otra indicación.',
      'Acordar metas y titulación, educación sobre síntomas de alarma, tabaquismo, actividad y rehabilitación. Ningún estado de esta página certifica aptitud de alta.',
    ],
  };
}
