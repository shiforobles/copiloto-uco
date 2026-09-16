import type { SessionState } from '../context/session';
import { ckdEpi2021 } from '../engine/renal';
import { validateAge, validateCreatinine } from '../engine/validation';
import { validNumber } from './therapy-context';

export type AdviceStatus = 'consider' | 'missing' | 'review' | 'blocked';
export interface TherapyAdvice {
  id: string;
  title: string;
  status: AdviceStatus;
  summary: string;
  reasons: string[];
  missing: string[];
  options: { name: string; text: string }[];
  checks: string[];
  sourceIds: string[];
}

export const statusLabels: Record<AdviceStatus, string> = {
  consider: 'Alternativa a considerar', missing: 'Faltan datos', review: 'Requiere individualizar', blocked: 'Resolver antes de elegir',
};

export function adultPatient(state: SessionState): boolean {
  return state.age !== null && state.age >= 18 && validateAge(state.age).valid;
}

/** TFGe indexada para riesgo / elegibilidad, no sustituye ClCr para cada fármaco. */
export function therapyEgfr(state: SessionState): number | null {
  if (!adultPatient(state) || state.renalStatus !== 'stable' || state.therapy.labsCurrent !== 'yes' ||
    !state.sex || state.creatinine === null || !validateCreatinine(state.creatinine).valid) return null;
  return ckdEpi2021({ age: state.age!, sex: state.sex, creatinine: state.creatinine }).value;
}

export function evaluateDapt(state: SessionState): TherapyAdvice {
  const t = state.therapy;
  const egfr = therapyEgfr(state);
  const a: TherapyAdvice = {
    id: 'doble-antiagregacion', title: 'Doble antiagregación', status: 'missing',
    summary: 'Completá el contexto del SCA para comparar opciones en este paciente.', reasons: [], missing: [], options: [],
    checks: [
      'Conciliar AAS, P2Y12 y anticoagulantes que ya recibió: dosis, hora, tolerancia y acceso al tratamiento.',
      'Revisar hemograma con plaquetas y función renal vigentes. Hepatograma y función de síntesis si hay sospecha de hepatopatía; transaminasas aisladas no definen insuficiencia hepática.',
      'Si existe riesgo gastrointestinal, considerar gastroprotección. INR y aPTT no miden el efecto antiagregante.',
    ],
    sourceIds: ['acs', 'acsAntithrombotics', 'arcHbr', 'ticagrelor', 'prasugrel', 'clopidogrel', 'liverTests'],
  };
  if (!adultPatient(state)) { a.missing.push('Edad adulta válida (18–120 años).'); return a; }
  if (state.condition !== 'sca') { a.summary = 'La doble antiagregación no se indica por estar en UCO. Confirmá un SCA y su estrategia; esta ficha no evalúa PCI electiva ni otras indicaciones.'; a.missing.push('Condición actual: SCA.'); return a; }

  const strategies = { unknown: 'estrategia no informada', pci: 'PCI / angioplastia', medical: 'tratamiento médico sin PCI', fibrinolysis: 'fibrinólisis', cabg: 'cirugía coronaria' };
  a.reasons.push(`${t.acsType === 'stemi' ? 'SCA con elevación del ST' : t.acsType === 'nstemi' ? 'SCA sin elevación del ST' : 'Tipo de SCA no informado'} · ${strategies[t.strategy]}. Edad ${state.age} años; peso ${state.weight ?? 'no informado'} kg.`);
  if (egfr !== null && egfr >= 60) a.reasons.push(`TFGe ${egfr.toFixed(1)} mL/min/1,73 m² con creatinina estable y laboratorio declarado vigente. La talla no determina por sí sola la dosis antiagregante.`);

  if (state.age! >= 75) a.reasons.push(`Edad ${state.age} años: aumenta el riesgo de sangrado; prasugrel no es una elección habitual a esta edad.`);
  if (validNumber(state.weight, 1, 500) && state.weight < 60) a.reasons.push(`Peso ${state.weight} kg: si se elige prasugrel, el mantenimiento de 10 mg no corresponde.`);
  if (egfr !== null && egfr < 60) a.reasons.push(`TFGe ${egfr.toFixed(1)} mL/min/1,73 m²: factor de riesgo hemorrágico. No aplicar una reducción genérica de todos los antiagregantes.`);
  const lowHb = t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 0, 25) && t.hemoglobin < 11;
  const borderlineHb = t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 11, 25) && t.hemoglobin < (state.sex === 'female' ? 12 : 13);
  const lowPlt = t.labsCurrent === 'yes' && validNumber(t.platelets, 0, 2000) && t.platelets < 100;
  if (lowHb) a.reasons.push(`Hb ${t.hemoglobin} g/dL: anemia relevante para el riesgo de sangrado; investigar causa y tendencia.`);
  if (borderlineHb) a.reasons.push(`Hb ${t.hemoglobin} g/dL: anemia leve que suma riesgo junto a otros factores.`);
  if (lowPlt) a.reasons.push(`Plaquetas ${t.platelets} ×10⁹/L: trombocitopenia; discutir la estrategia con Hematología y Cardiología.`);
  if (t.priorBleeding === 'yes') a.reasons.push('Antecedente de sangrado relevante: precisar sitio, fecha, recurrencia y transfusiones.');
  if (t.priorStroke === 'yes' || t.priorIch === 'yes') a.reasons.push('Antecedente cerebrovascular: prasugrel contraindicado por ACV/AIT; ticagrelor contraindicado si hubo hemorragia intracraneal.');
  if (t.currentP2y12 !== 'unknown' && t.currentP2y12 !== 'none') a.reasons.push(`Ya recibe ${t.currentP2y12}: no repetir carga ni cambiar automáticamente al abrir esta ficha.`);
  if (t.interactions === 'omeprazole') a.reasons.push('Omeprazol/esomeprazol: evitar la asociación con clopidogrel; revisar una alternativa de gastroprotección.');
  if (t.interactions === 'cyp3a') a.reasons.push('Interacción potente CYP3A: ticagrelor no es una alternativa apropiada sin resolver la interacción.');
  if (state.hasAF) a.reasons.push('FA presente: revisar por separado la indicación de anticoagulación; DAPT no sustituye prevención cardioembólica.');

  const hardStops = [
    t.activeBleeding === 'yes' && 'Sangrado activo: resolver en la internación antes de iniciar o intensificar antiagregación.',
    t.aspirinAllergy === 'yes' && 'Alergia a AAS: requiere una estrategia específica; no proponer la combinación estándar.',
    t.p2y12Allergy === 'yes' && 'Alergia a P2Y12: precisar el agente y la reacción antes de elegir otra alternativa.',
    t.liver === 'severe' && 'Hepatopatía grave: no seleccionar automáticamente un P2Y12; revisar contraindicaciones y hemostasia.',
    t.labsCurrent === 'yes' && validNumber(t.hemoglobin, 0, 25) && t.hemoglobin < 8 && 'Anemia marcada: evaluar causa y estabilidad ahora; la app no define transfusión ni suspensión automática.',
    lowPlt && 'Trombocitopenia <100 ×10⁹/L: esta ayuda no selecciona un esquema estándar.',
    t.pregnancy === 'yes' && 'Embarazo/lactancia: esta ficha requiere valoración especializada.',
  ].filter((v): v is string => Boolean(v));
  if (hardStops.length) { a.status = 'blocked'; a.summary = hardStops[0]; a.reasons.unshift(...hardStops.slice(1)); return a; }

  if (t.acsType === 'unknown') a.missing.push('Tipo de SCA.');
  if (t.strategy === 'unknown') a.missing.push('Estrategia: PCI, tratamiento médico, fibrinólisis o cirugía.');
  if (t.strategy === 'fibrinolysis' && t.acsType === 'nstemi') { a.status = 'blocked'; a.summary = 'Contexto discordante: fibrinólisis con SCA sin elevación del ST. Revisá el diagnóstico y la estrategia.'; return a; }
  if (!state.phase) a.missing.push('Fase clínica.');
  if (!validNumber(t.monthsSinceAcs, 0, 240)) a.missing.push('Meses desde el SCA (0 si es el evento actual).');
  if (!validNumber(state.weight, 1, 500)) a.missing.push('Peso válido en kg.');
  for (const [field, label] of [
    ['activeBleeding', 'Sangrado activo'], ['priorBleeding', 'Sangrado relevante previo'], ['priorStroke', 'ACV/AIT previo'],
    ['priorIch', 'Hemorragia intracraneal previa'], ['oralAnticoagulation', 'Indicación de anticoagulación oral'],
    ['aspirinAllergy', 'Alergia a AAS'], ['p2y12Allergy', 'Alergia a P2Y12'], ['surgeryPlanned', 'Cirugía próxima'],
  ] as const) if (t[field] === 'unknown') a.missing.push(`${label}: confirmar sí/no.`);
  if (state.sex !== 'male' && t.pregnancy === 'unknown') a.missing.push('Embarazo/lactancia: descartar cuando corresponda.');
  if (t.currentP2y12 === 'unknown') a.missing.push('P2Y12 que recibe actualmente.');
  if (t.liver === 'unknown') a.missing.push('Situación hepática.');
  if (t.interactions === 'unknown') a.missing.push('Conciliación de interacciones.');
  if (t.bleedingRisk === 'unknown') a.missing.push('Valoración clínica del riesgo de sangrado.');
  if (t.labsCurrent !== 'yes') a.missing.push('Confirmar que el laboratorio cargado es vigente para esta decisión.');
  if (!validNumber(t.hemoglobin, 0, 25)) a.missing.push('Hemoglobina válida en g/dL.');
  if (!validNumber(t.platelets, 0, 2000)) a.missing.push('Plaquetas en ×10⁹/L (ej.: 180, no 180.000).');
  if (state.renalStatus === 'unknown' || (state.renalStatus === 'stable' && egfr === null)) a.missing.push('Función renal: estabilidad, sexo, edad y creatinina válidos.');
  if (a.missing.length) return a;

  a.status = 'review';
  if (state.phase === 'shock_inotropicos') { a.summary = 'Shock: individualizar antiagregación con hemodinamia; la absorción oral y la estrategia invasiva pueden modificar la elección.'; return a; }
  if (t.surgeryPlanned === 'yes' || t.strategy === 'cabg') { a.summary = 'Cirugía coronaria o procedimiento próximo: coordinar interrupción/reinicio con el equipo tratante y según hemostasia. No aplicar un esquema estándar de alta.'; return a; }
  if (state.renalStatus === 'dialysis' || state.renalStatus === 'unstable') { a.summary = 'Diálisis o lesión renal aguda: balance hemorrágico/isquémico individual. Las estimaciones de función renal no habilitan una selección automática.'; return a; }
  if (t.monthsSinceAcs! >= 12) { a.summary = 'A 12 meses o más del SCA, reevaluar continuar, reducir o retirar DAPT según evolución y riesgo. No prolongar el esquema del primer año automáticamente.'; return a; }
  if (t.liver === 'abnormal' || t.interactions === 'other') { a.summary = 'Precisar la alteración hepática o la interacción identificada antes de elegir un esquema.'; return a; }
  if (t.oralAnticoagulation === 'yes') {
    a.summary = 'La indicación de anticoagulación cambia el plan: evitar triple terapia prolongada.';
    a.options.push({ name: 'Estrategia a discutir con Cardiología', text: 'Anticoagulante según su indicación + clopidogrel 75 mg por vía oral cada 24 h. Tras PCI, definir la retirada de AAS habitualmente entre 1 y 4 semanas, según riesgo y fecha del procedimiento. No elegir anticoagulante ni su dosis desde esta ficha.' });
    a.checks.push('Registrar fecha de PCI, tiempo ya transcurrido y fecha concreta de reevaluación del AAS. Si hubo fibrinólisis o no hubo PCI, individualizar el plan.');
    return a;
  }
  // Señales parciales: no constituyen un score ARC-HBR ni certifican riesgo bajo.
  const combinedSignals = [state.age! >= 75, egfr !== null && egfr >= 30 && egfr < 60, borderlineHb].filter(Boolean).length >= 2;
  const substantialRisk = t.bleedingRisk === 'high' || lowHb || t.priorBleeding === 'yes' || t.priorIch === 'yes' || (egfr !== null && egfr < 30) || combinedSignals;
  if (substantialRisk) { a.summary = 'Hay riesgo hemorrágico relevante: discutir elección de P2Y12 y duración abreviada o desescalada. No se propone DAPT potente por 12 meses por defecto.'; return a; }
  if (t.interactions === 'omeprazole' || t.interactions === 'cyp3a') { a.summary = 'Resolver la interacción identificada y reevaluar alternativas antes de concretar la combinación.'; return a; }
  a.status = 'consider';
  if (t.strategy === 'fibrinolysis') {
    a.summary = 'SCA con elevación del ST tratado con fibrinólisis: AAS + clopidogrel es la combinación de referencia.';
    a.options.push({ name: 'Mantenimiento por vía oral', text: 'AAS 75–100 mg cada 24 h + clopidogrel 75 mg cada 24 h.' });
    if (t.currentP2y12 === 'none' && t.monthsSinceAcs === 0 && state.phase !== 'pre_alta') a.checks.push(state.age! > 75 ? 'En el contexto inicial de fibrinólisis y edad >75 años, clopidogrel se inicia sin carga. Confirmar que no recibió dosis previa.' : 'Referencia para inicio con fibrinólisis a edad ≤75 años: carga de clopidogrel 300 mg, tras confirmar dosis previas y protocolo.');
  } else if (t.strategy === 'pci' || (t.strategy === 'medical' && t.acsType === 'nstemi')) {
    a.summary = 'Con el contexto declarado, considerar AAS + un P2Y12. Elegir una sola alternativa y confirmar tolerancia, acceso y adherencia.';
    a.options.push({ name: 'AAS + ticagrelor', text: 'Mantenimiento oral: AAS 75–100 mg cada 24 h + ticagrelor 90 mg cada 12 h durante el primer año. Revisar disnea y bradiarritmia.' });
    if (t.strategy === 'pci' && t.priorStroke === 'no' && state.age! < 75) a.options.push({ name: 'Alternativa: AAS + prasugrel', text: `Solo SCA tratado con PCI, sin ACV/AIT: AAS 75–100 mg cada 24 h + prasugrel ${state.weight! < 60 ? '5' : '10'} mg cada 24 h por vía oral. No combinar con ticagrelor ni clopidogrel.` });
    a.checks.push('Clopidogrel es una alternativa si los agentes potentes no son adecuados o no están disponibles; justificar la elección.');
  } else { a.status = 'review'; a.summary = 'SCA con elevación del ST sin reperfusión: definir estrategia y P2Y12 con el equipo; no extrapolar automáticamente el esquema pos-PCI.'; return a; }
  a.checks.push('Duración de referencia: alrededor de 12 meses si no hay alto riesgo de sangrado; documentar la fecha del evento y reevaluar antes si cambia el riesgo. No es una fecha automática de suspensión.');
  if (t.currentP2y12 !== 'none') a.checks.push('El esquema mostrado es una comparación: cualquier cambio del P2Y12 actual requiere un plan de transición y revisión de la última dosis.');
  return a;
}

export const treatmentTitles: Record<string, string> = {
  'doble-antiagregacion': 'Doble antiagregación', estatina: 'Estatina y control lipídico',
  'sistema-renina': 'ARNI / IECA / ARA II', betabloqueante: 'Betabloqueante', arm: 'Antagonista mineralocorticoide',
  isglt2: 'iSGLT2', diuretico: 'Diurético de asa', anticoagulacion: 'Anticoagulación',
};

export function treatmentIds(state: SessionState): string[] {
  if (state.condition === 'sca') return ['doble-antiagregacion', 'estatina', 'betabloqueante', 'sistema-renina', ...(state.phase !== 'pre_alta' || state.hasAF || state.therapy.oralAnticoagulation === 'yes' ? ['anticoagulacion'] : [])];
  if (state.condition === 'ic') return ['sistema-renina', 'betabloqueante', 'arm', 'isglt2', 'diuretico', ...(state.hasAF ? ['anticoagulacion'] : [])];
  return state.hasAF ? ['anticoagulacion'] : [];
}

export function evaluateTreatment(id: string, state: SessionState): TherapyAdvice {
  if (id === 'doble-antiagregacion') return evaluateDapt(state);
  const t = state.therapy;
  const egfr = therapyEgfr(state);
  const a: TherapyAdvice = { id, title: treatmentTitles[id] ?? 'Tratamiento', status: 'review', summary: '', reasons: [], missing: [], options: [], checks: [], sourceIds: ['hf2022', 'hfMonitoring'] };
  if (!adultPatient(state)) { a.status = 'missing'; a.summary = 'Ingresá una edad adulta válida para contextualizar la ficha.'; return a; }
  if (!state.condition || !state.phase) { a.status = 'missing'; a.summary = 'Seleccioná condición y fase clínica.'; return a; }
  if (id === 'estatina') {
    a.sourceIds = ['acs', 'acsDischarge', 'lipidMonitoring', 'atorvastatin'];
    a.checks = ['Obtener perfil lipídico y ALT/AST basales. Si hay síntomas musculares inexplicados, solicitar CK; no pedir CK sistemática en pacientes asintomáticos.', 'Tras SCA: perfil lipídico a las 4–8 semanas de iniciar o ajustar tratamiento. Control de transaminasas a los 2–3 meses y luego según evolución.'];
    if (state.condition !== 'sca') { a.summary = 'Esta ficha contextualiza prevención secundaria tras SCA. La IC aislada no basta para indicar estatina.'; return a; }
    if (t.liver === 'severe' || t.pregnancy === 'yes') { a.status = 'blocked'; a.summary = 'Hepatopatía grave o embarazo/lactancia: revisar contraindicaciones antes de indicar estatina.'; return a; }
    if (t.labsCurrent === 'yes' && validNumber(t.altMultiple, 0, 1000) && t.altMultiple >= 3) { a.status = 'blocked'; a.summary = 'ALT ≥3 veces el límite superior: evaluar la alteración antes de iniciar o intensificar estatina.'; return a; }
    if (t.liver === 'unknown') a.missing.push('Situación hepática.');
    if (t.labsCurrent !== 'yes' || !validNumber(t.altMultiple, 0, 1000)) a.missing.push('Transaminasas basales vigentes (ALT como múltiplo del límite del laboratorio).');
    if (t.interactions !== 'none') a.missing.push('Revisión de interacciones antes de concretar dosis.');
    if (t.muscleSymptoms !== 'no') a.missing.push('Aclarar síntomas musculares; si están presentes, CK y evaluación antes de iniciar.');
    if (state.sex !== 'male' && t.pregnancy !== 'no') a.missing.push('Descartar embarazo/lactancia cuando corresponda.');
    a.status = a.missing.length ? 'missing' : 'consider';
    a.summary = a.missing.length ? 'El SCA favorece estatina de alta intensidad; completar la evaluación antes de concretar la dosis.' : 'SCA: considerar estatina de alta intensidad o la máxima dosis tolerada.';
    if (!a.missing.length) a.options.push({ name: 'Referencia de alta intensidad', text: 'Atorvastatina 40–80 mg por vía oral cada 24 h. Individualizar según tratamiento previo, tolerancia, fragilidad e interacciones; la dosis no se calcula por kg.' });
    if (egfr !== null && egfr < 60) a.reasons.push('La atorvastatina no requiere ajuste renal habitual; la enfermedad renal aumenta la necesidad de vigilar toxicidad muscular.');
    if (t.labsCurrent === 'yes' && validNumber(t.ldl, 0, 1000)) a.reasons.push(`LDL ${t.ldl} mg/dL: valorar respecto del tratamiento que realmente recibe. Sin conocer dosis, adherencia y respuesta previa no se añade otro hipolipemiante automáticamente.`);
    return a;
  }
  if (id === 'anticoagulacion') {
    a.sourceIds = ['acs', 'af', 'apixaban', 'heparina', 'enoxaparina'];
    a.summary = state.hasAF ? 'FA: valorar riesgo embólico, válvula mecánica/estenosis mitral y sangrado antes de elegir anticoagulante. El diagnóstico de FA por sí solo no determina la prescripción.' : 'En SCA, la anticoagulación parenteral depende de reperfusión, procedimiento y momento clínico; no implica continuar al alta.';
    if (t.activeBleeding === 'yes') { a.status = 'blocked'; a.summary = 'Sangrado activo: evaluar antes de iniciar o intensificar anticoagulación.'; }
    a.checks = ['Revisar hemograma, plaquetas, función renal y hepática; conciliar antiagregantes y anticoagulantes.', 'Calcular ClCr para la droga/indicación correspondiente con creatinina estable. Peso, edad y creatinina intervienen de manera distinta en cada anticoagulante.', 'Si se combina con antiagregación tras SCA, abrir la ficha de doble antiagregación y definir duración de cada componente.'];
    return a;
  }
  if (state.condition !== 'ic' && state.condition !== 'sca') { a.summary = 'Confirmar IC o SCA antes de aplicar esta referencia.'; return a; }
  if (state.phase === 'shock_inotropicos') { a.status = 'blocked'; a.summary = 'Shock / inotrópicos: no usar una pauta de inicio de tratamiento crónico. Priorizar estabilización y revisar continuidad de cada fármaco individualmente.'; return a; }
  if (!validNumber(state.lvef, 1, 100)) a.missing.push('FEVI válida para definir el fenotipo y la indicación.');
  if (id !== 'diuretico' && state.condition === 'ic' && validNumber(state.lvef, 1, 100) && state.lvef > 40) {
    a.summary = 'FEVI >40%: no extrapolar el esquema de IC con FEVI reducida. Consultá el fenotipo de IC; iSGLT2 puede tener indicación en otros fenotipos.'; a.sourceIds.push('hfUpdate'); return a;
  }
  if (['sistema-renina', 'arm', 'diuretico', 'isglt2'].includes(id) && egfr === null) a.missing.push('Laboratorio vigente y función renal estable; LRA/diálisis requieren evaluación específica.');
  if (['sistema-renina', 'arm', 'diuretico'].includes(id) && !validNumber(state.potassium, 1, 10)) a.missing.push('Potasio válido.');
  if (!validNumber(state.systolicBP, 40, 300)) a.missing.push('Presión sistólica válida.');
  if (validNumber(state.systolicBP, 40, 300) && state.systolicBP < 90) { a.status = 'blocked'; a.summary = 'TAS <90 mmHg: reevaluar perfusión y tolerancia antes de iniciar o titular.'; return a; }
  if (id === 'arm') {
    a.summary = 'En IC con FEVI reducida sintomática, considerar un ARM si TFGe >30 y K <5,0, con seguimiento del laboratorio.';
    if ((egfr !== null && egfr <= 30) || (validNumber(state.potassium, 1, 10) && state.potassium >= 5)) { a.status = 'blocked'; a.summary = 'No iniciar ARM con TFGe ≤30 mL/min/1,73 m² o K ≥5,0 mEq/L. Resolver y reevaluar; no es una regla automática de suspensión de un tratamiento previo.'; }
  } else if (id === 'sistema-renina') {
    a.summary = state.condition === 'ic' ? 'En IC con FEVI reducida, revisar ARNI o IECA/ARA II según tolerancia. Son alternativas, no pilares para combinar entre sí.' : 'Tras SCA, valorar IECA/ARA II según FEVI, IC y comorbilidades; no indicarlos por defecto sin caracterizar al paciente.';
    a.checks.push('Revisar angioedema y embarazo. Para pasar de IECA a ARNI deben transcurrir al menos 36 horas; no combinarlos.');
    if (validNumber(state.potassium, 1, 10) && state.potassium >= 5.5) { a.status = 'blocked'; a.summary = 'K ≥5,5: abordar hiperpotasemia antes de iniciar o aumentar bloqueo del sistema renina-angiotensina.'; }
  } else if (id === 'betabloqueante') {
    a.summary = 'Considerar según indicación y FEVI una vez estable. Revisar congestión, perfusión, bloqueo AV, broncoespasmo y tratamiento previo antes de fijar dosis.';
    if (!validNumber(state.heartRate, 20, 300)) a.missing.push('Frecuencia cardíaca válida y ECG para descartar trastorno de conducción.');
    if (validNumber(state.heartRate, 20, 300) && state.heartRate < 55) { a.status = 'blocked'; a.summary = 'FC <55 lpm: revisar síntomas, ECG y fármacos bradicardizantes antes de iniciar o titular.'; }
    a.checks.push('Controlar FC, presión, síntomas y congestión durante la titulación.');
  } else if (id === 'isglt2') {
    a.summary = 'IC: revisar indicación de dapagliflozina o empagliflozina según fenotipo y ficha local; no confundir TFGe de inicio con eficacia glucémica.';
    a.sourceIds.push('kdigo');
    a.checks.push('No iniciar en enfermedad crítica, ayuno prolongado o perioperatorio; valorar volemia y riesgo de cetosis. Revisar diabetes tipo 1 y antecedentes de cetoacidosis.');
    if (t.diabetes === 'type1') { a.status = 'blocked'; a.summary = 'Diabetes tipo 1: esta herramienta no propone iSGLT2 por el riesgo de cetoacidosis.'; }
    if (t.diabetes === 'unknown') a.missing.push('Situación diabética y factores de riesgo de cetosis.');
  } else if (id === 'diuretico') {
    a.summary = 'Furosemida según congestión y respuesta. El peso aislado no define la dosis: revisar balance, diuresis, dosis previa y volemia.';
    a.sourceIds.push('furosemida');
    a.checks.push('Controlar peso y síntomas; medir creatinina, sodio, potasio y magnesio según evolución y cambios de dosis.');
  }
  if (['sistema-renina', 'arm'].includes(id)) a.checks.push('Medir función renal y electrolitos antes del inicio; repetir a las 1–2 semanas de iniciar/aumentar, antes si hay inestabilidad o riesgo elevado.');
  if (a.missing.length && a.status !== 'blocked') a.status = 'missing';
  if (state.lvef !== null) a.reasons.push(`FEVI declarada: ${state.lvef}%.`);
  if (egfr !== null) a.reasons.push(`TFGe CKD-EPI 2021: ${egfr.toFixed(1)} mL/min/1,73 m².`);
  return a;
}
