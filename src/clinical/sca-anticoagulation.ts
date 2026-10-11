import type { SessionState } from '../context/session';
import { adultPatient } from './therapy';
import { validNumber } from './therapy-context';
import { completeOption, option, scaDosingClCr, scaNumber as n } from './sca-common';

/** Referencias por escenario. No reconcilia dosis previas ni transfiere un bolo a la bomba. */
export function buildScaAnticoagulation(state: SessionState) {
  const t = state.therapy, s = state.sca, renal = scaDosingClCr(state), crcl = renal?.value ?? null;
  const afterHospitalization = s.moment === 'discharge' || s.moment === 'followup' || state.phase === 'pre_alta';
  const ufh = option('ufh', 'Heparina no fraccionada (HNF)',
    'Inicial / fibrinólisis: bolo IV 60 U/kg (máx. 4.000 U), luego 12 U/kg/h (máx. inicial 1.000 U/h). En PCI sin anticoagulación previa: bolo IV 70–100 U/kg, guiado por ACT; no es la pauta de infusión de internación.',
    'SCA agudo; separar PCI, internación y fibrinólisis.', ['acs', 'heparina']);
  const enox = option('enoxaparin', 'Enoxaparina',
    'SCASEST: 1 mg/kg SC cada 12 h; ClCr <30: 1 mg/kg cada 24 h. SCACEST médico / fibrinólisis: <75 años, 30 mg IV + 1 mg/kg SC cada 12 h (máx. 100 mg en las dos primeras SC); ≥75, sin bolo IV, 0,75 mg/kg cada 12 h (máx. 75 mg en las dos primeras SC). Con ClCr <30: 1 mg/kg SC cada 24 h, con bolo de 30 mg solo si <75 años.',
    'Dosis terapéutica de SCA, distinta de profilaxis de TEV y de la pauta intraprocedimiento.', ['acs', 'enoxaparina']);
  const fonda = option('fondaparinux', 'Fondaparinux',
    'SCASEST: 2,5 mg SC cada 24 h. SCACEST sin PCI primaria: primera dosis 2,5 mg IV; luego 2,5 mg SC cada 24 h. Hasta 8 días o alta, lo que ocurra antes, según estrategia.',
    'Alternativa sin PCI inmediata. Nunca como único anticoagulante durante PCI.', ['fondaparinux', 'acs']);
  const biv = option('bivalirudin', 'Bivalirudina',
    'PCI: bolo IV 0,75 mg/kg + 1,75 mg/kg/h durante el procedimiento. ClCr <30: infusión 1 mg/kg/h. Hemodiálisis: 0,25 mg/kg/h. El bolo no cambia por función renal. En PCI primaria, definir infusión posterior 2–4 h con Hemodinamia y ajuste renal.',
    'Alternativa intraprocedimiento, incluida HIT; confirmar disponibilidad y protocolo.', ['bivalirudin', 'acs']);

  ufh.contraindications = enox.contraindications = 'Sangrado activo, HIT sospechada/confirmada o hipersensibilidad a heparinas. Procedimientos neuraxiales requieren coordinación específica.';
  fonda.contraindications = 'Sangrado activo; ClCr <20 mL/min según ficha AEMPS para SCA. Entre 20–29, balance individual. No sustituir la pauta de SCA por la de TEV.';
  biv.contraindications = 'Sangrado activo o hipersensibilidad. Ajustar infusión en insuficiencia renal y diálisis.';
  ufh.monitoring = 'aPTT o anti-Xa con nomograma local; ACT en PCI. Hemograma, plaquetas y sangrado. Duración según revascularización; no mantener tras PCI sin otra indicación.';
  enox.monitoring = 'Hb, plaquetas, sangrado y ClCr. Verificar hora de la última SC antes de PCI: el complemento IV depende del intervalo y de las dosis previas; no se calcula aquí.';
  fonda.monitoring = 'Función renal y hemograma. Si se realiza PCI, necesita anticoagulante con actividad anti-IIa (habitualmente HNF); si hay HIT, resolver alternativa especializada.';
  biv.monitoring = 'ACT a los 5 min del bolo, sangrado y función renal; duración definida por el operador.';
  ufh.link = { href: '#infusiones/heparina', label: 'Convertir infusión de HNF' };
  const rows = [ufh, enox, fonda, biv];
  for (const row of rows) {
    if (t.acsType === 'unknown') row.pending.push('Tipo de SCA');
    if (t.strategy === 'unknown') row.pending.push('Estrategia de reperfusión');
    if (s.moment === 'unknown') row.pending.push('Momento asistencial');
    if (t.activeBleeding === 'unknown') row.pending.push('Sangrado activo');
    if (t.activeBleeding === 'yes') row.avoid.push('Sangrado activo: evaluar antes de anticoagular.');
    if (s.currentAnticoagulant === 'unknown') row.pending.push('Anticoagulante recibido, dosis y hora');
    else if (s.currentAnticoagulant !== 'none') row.cautions.push('Ya recibe anticoagulante: conciliar dosis/hora; no repetir bolo ni cambiar automáticamente.');
    if (t.oralAnticoagulation === 'unknown') row.pending.push('Indicación de anticoagulación oral');
    if (t.oralAnticoagulation === 'yes') row.cautions.push('ACO indicado: coordinar combinación peri-PCI, sin sumar esquemas automáticamente.');
    if (t.labsCurrent !== 'yes') row.pending.push('Hemograma y función renal vigentes');
    if (!validNumber(t.hemoglobin, 0, 25)) row.pending.push('Hemoglobina válida');
    if (!validNumber(t.platelets, 0, 2000)) row.pending.push('Plaquetas en ×10⁹/L');
    if (t.labsCurrent === 'yes' && ((validNumber(t.platelets, 0, 2000) && t.platelets < 100) || (validNumber(t.hemoglobin, 0, 25) && t.hemoglobin < 8))) row.cautions.push('Anemia marcada o trombocitopenia: discutir estrategia antes de concretar dosis.');
    if (t.surgeryPlanned === 'yes' || t.strategy === 'cabg') row.cautions.push('Cirugía: coordinar fármaco, última dosis e interrupción/reinicio.');
    if (t.strategy === 'fibrinolysis' && t.acsType === 'nstemi') row.cautions.push('SCASEST con fibrinólisis es discordante: revisar contexto.');
    if (t.liver === 'severe' || t.pregnancy === 'yes') row.cautions.push('Hepatopatía grave o embarazo: valoración especializada.');
    if (afterHospitalization) { row.status = 'not-routine'; row.reason = 'No continuar anticoagulación parenteral por el SCA al alta de forma rutinaria. Verificar otra indicación; no es una orden de suspensión.'; }
  }
  for (const row of [ufh, enox]) {
    if (s.hit === 'unknown') row.pending.push('Antecedente o sospecha de HIT');
    if (s.hit === 'yes') row.avoid.push('HIT: evitar heparinas y coordinar alternativa con Hematología/Hemodinamia.');
    if (s.heparinAllergy === 'unknown') row.pending.push('Alergia a heparinas');
    if (s.heparinAllergy === 'yes') row.avoid.push('Alergia a heparinas.');
  }
  for (const row of [enox, fonda, biv]) {
    if (crcl === null) row.pending.push('ClCr de dosificación con creatinina estable y laboratorio vigente');
    if (state.renalStatus === 'unstable' || state.renalStatus === 'dialysis') row.cautions.push('LRA/diálisis: no aplicar un ajuste automático a partir de ClCr estable.');
  }
  if (crcl !== null && crcl < 15) enox.cautions.push('ClCr <15: no se calcula pauta individual; requiere evaluación especializada.');
  if (crcl !== null && crcl < 20) fonda.avoid.push('ClCr <20: contraindicación de fondaparinux en la ficha AEMPS de SCA.');
  else if (crcl !== null && crcl < 30) fonda.cautions.push('ClCr 20–29: experiencia limitada; definir beneficio/riesgo y prospecto local.');
  if (t.strategy === 'pci') { if (!afterHospitalization) ufh.reason = 'Referencia habitual de anticoagulación durante PCI, con ACT y conciliación previa.'; enox.cautions.push('PCI: no trasladar la pauta SC a un bolo del procedimiento.'); fonda.avoid.push('Evitar fondaparinux como único anticoagulante de PCI.'); }
  if (t.strategy !== 'pci' && t.strategy !== 'unknown') { biv.status = 'not-routine'; if (!afterHospitalization) biv.reason = 'Esta pauta es para PCI; no es una infusión estándar de sala ni de fibrinólisis.'; }
  if (t.strategy === 'medical' && t.acsType === 'nstemi' && !afterHospitalization) fonda.reason = 'Alternativa en SCASEST sin estrategia invasiva inmediata, con función renal compatible.';
  const canCalculate = (row: typeof ufh) => state.condition === 'sca' && adultPatient(state) && validNumber(state.weight, 1, 500) && s.currentAnticoagulant === 'none' && !row.avoid.length && !row.cautions.length && row.status !== 'not-routine';
  const kg = state.weight!;
  if (!validNumber(state.weight, 1, 500)) for (const row of [ufh, enox, biv]) row.pending.push('Peso real válido en kg');
  if (canCalculate(ufh) && t.acsType !== 'unknown' && ['medical', 'fibrinolysis'].includes(t.strategy)) ufh.calculation = `Con ${n(kg)} kg: bolo inicial ${n(Math.min(60 * kg, 4000))} U IV; infusión inicial ${n(Math.min(12 * kg, 1000))} U/h. Ajustar por nomograma, no por esta cifra fija.`;
  if (canCalculate(enox) && crcl !== null && crcl >= 15 && ['medical', 'fibrinolysis'].includes(t.strategy)) {
    if (t.acsType === 'nstemi' && t.strategy === 'medical') enox.calculation = `Con ${n(kg)} kg: ${n(kg)} mg SC cada ${crcl < 30 ? '24' : '12'} h.`;
    if (t.acsType === 'stemi') {
      const older = state.age! >= 75, renalSevere = crcl < 30;
      const mg = kg * (older && !renalSevere ? .75 : 1);
      enox.calculation = `${older ? 'Sin bolo IV' : 'Bolo inicial 30 mg IV'}; ${n(mg)} mg SC cada ${renalSevere ? '24' : '12'} h${renalSevere ? ' (ajuste renal)' : `; las dos primeras SC: ${n(Math.min(mg, older ? 75 : 100))} mg cada una`}. Dosis por peso real: ${n(kg)} kg.`;
    }
  }
  if (canCalculate(biv) && t.strategy === 'pci' && crcl !== null) biv.calculation = `Con ${n(kg)} kg: bolo ${n(.75 * kg)} mg IV; infusión durante PCI ${n((crcl < 30 ? 1 : 1.75) * kg)} mg/h. Revisar ACT y duración.`;
  return rows.map(row => completeOption(row, state));
}
