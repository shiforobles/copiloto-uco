import type { ClinicalSource, TherapyGroup } from '../rules/types';

const AHA_ACS: ClinicalSource = {
  label: 'AHA/ACC 2025 · SCA',
  url: 'https://professional.heart.org/en/guidelines-statements/2025-accahaacepnaemspscai-guideline-for-the-management-of-patients-with-acutecir0000000000001309',
};

const AHA_HF: ClinicalSource = {
  label: 'AHA/ACC/HFSA 2022 · IC',
  url: 'https://professional.heart.org/en/science-news/2022-guideline-for-the-management-of-heart-failure',
};

const AHA_LIPIDS: ClinicalSource = {
  label: 'AHA/ACC 2026 · Dislipidemia',
  url: 'https://professional.heart.org/en/science-news/2026-guideline-on-the-management-of-dyslipidemia/top-things-to-know',
};

const label = (name: string, url: string): ClinicalSource => ({ label: `Ficha técnica · ${name}`, url });

const allPhases = ['shock_inotropicos', 'compensado', 'pre_alta'] as const;
const stablePhases = ['compensado', 'pre_alta'] as const;
const acutePhases = ['shock_inotropicos', 'compensado'] as const;

/**
 * Matriz inicial de alternativas para SCA.
 *
 * Todas las filas permanecen en `verified: false` hasta que el equipo médico
 * confronte cada dosis con el protocolo institucional y la disponibilidad local.
 * Las opciones no se ocultan por contexto: el motor agrega advertencias.
 */
export const scaTherapyGroups: TherapyGroup[] = [
  {
    id: 'aas',
    title: '1. Aspirina',
    subtitle: 'Base salvo contraindicación',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'aas',

        kind: 'drug',

        drugId: 'aspirin',

        indicationId: 'ind-sca',
        name: 'AAS',
        role: 'base',
        loadOrStart: '162–325 mg VO masticada',
        maintenance: '75–100 mg/día',
        maximum: '325 mg en carga',
        when: 'SCA confirmado o altamente probable, salvo contraindicación.',
        avoid: ['Sangrado activo', 'Alergia grave a AAS'],
        monitoring: ['Sangrado', 'Hb/plaquetas', 'Tolerancia gastrointestinal'],
        phases: [...allPhases],
        sources: [AHA_ACS],
        verified: false,
      },
    ],
  },
  {
    id: 'p2y12',
    title: '2. Inhibidor P2Y12',
    subtitle: 'Elegir uno; depende de estrategia y sangrado',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'ticagrelor',

        kind: 'drug',

        drugId: 'ticagrelor',

        indicationId: 'ind-sca',
        name: 'Ticagrelor',
        role: 'preferred',
        loadOrStart: '180 mg VO',
        maintenance: '90 mg c/12 h',
        maximum: '90 mg c/12 h durante el primer año',
        when: 'Alternativa preferida a clopidogrel en SCA tratado con PCI si el riesgo hemorrágico lo permite.',
        avoid: ['Hemorragia activa', 'Antecedente de hemorragia intracraneal', 'Hepatopatía grave'],
        monitoring: ['Sangrado', 'Disnea', 'FC', 'Interacciones CYP3A'],
        phases: [...allPhases],
        strategies: ['pci', 'medical'],
        sources: [AHA_ACS, label('ticagrelor', 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5955a5f5-fbc7-8f67-e063-6394a90ada36&type=display')],
        verified: false,
      },
      {
        id: 'prasugrel',

        kind: 'drug',

        drugId: 'prasugrel',

        indicationId: 'ind-sca',
        name: 'Prasugrel',
        role: 'preferred',
        loadOrStart: '60 mg VO',
        maintenance: '10 mg/día; considerar 5 mg si <60 kg',
        maximum: '10 mg/día',
        when: 'SCA con anatomía conocida y PCI; preferido a clopidogrel si no hay alto riesgo hemorrágico.',
        avoid: ['ACV/AIT previo', 'Hemorragia activa', 'En general ≥75 años salvo selección excepcional'],
        monitoring: ['Sangrado', 'Edad', 'Peso'],
        phases: [...allPhases],
        strategies: ['pci'],
        sources: [AHA_ACS, label('prasugrel', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5edc1ab3-5c7a-47d6-8aaa-00523c9b4c8f')],
        verified: false,
      },
      {
        id: 'clopidogrel',

        kind: 'drug',

        drugId: 'clopidogrel',

        indicationId: 'ind-sca',
        name: 'Clopidogrel',
        role: 'alternative',
        loadOrStart: '300–600 mg VO según estrategia',
        maintenance: '75 mg/día',
        maximum: '600 mg en carga',
        when: 'Preferible si se combina con anticoagulación oral, mayor riesgo hemorrágico, fibrinólisis o contraindicación a los agentes más potentes.',
        avoid: ['Hemorragia activa', 'Interacción con omeprazol/esomeprazol'],
        monitoring: ['Sangrado', 'Adherencia', 'Interacciones CYP2C19'],
        phases: [...allPhases],
        strategies: ['pci', 'fibrinolysis', 'medical'],
        sources: [AHA_ACS, label('clopidogrel', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=edae8df1-caf9-ff72-1304-5ae8b355f8e7')],
        verified: false,
      },
      {
        id: 'cangrelor',

        kind: 'drug',

        drugId: 'cangrelor',

        indicationId: 'ind-sca',
        name: 'Cangrelor IV',
        role: 'alternative',
        loadOrStart: '30 µg/kg IV en bolo',
        maintenance: '4 µg/kg/min durante PCI',
        maximum: '≥2 h o duración de la PCI',
        when: 'PCI cuando no se administró un P2Y12 oral o no puede absorberse; requiere transición planificada a vía oral.',
        avoid: ['Sangrado activo significativo'],
        monitoring: ['Sangrado', 'Momento de transición a P2Y12 oral'],
        phases: [...acutePhases],
        strategies: ['pci'],
        sources: [AHA_ACS, label('cangrelor', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c86264c2-ef49-4524-b6af-edb7a6279faa')],
        verified: false,
      },
    ],
  },
  {
    id: 'anticoagulation',
    title: '3. Anticoagulación aguda',
    subtitle: 'Elegir una según estrategia; no continuar de rutina al alta',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'ufh',

        kind: 'drug',

        drugId: 'unfractionated-heparin',

        indicationId: 'ind-sca',
        name: 'Heparina no fraccionada',
        role: 'base',
        loadOrStart: '60 UI/kg IV (máx. 4.000 UI)',
        maintenance: '12 UI/kg/h (máx. 1.000 UI/h)',
        when: 'Opción flexible en SCA y preferida cuando se requiere reversibilidad rápida o la función renal es muy reducida; en PCI, ajustar a ACT/protocolo.',
        avoid: ['HIT activa o antecedente compatible', 'Sangrado activo mayor'],
        monitoring: ['aPTT/anti-Xa según protocolo', 'Plaquetas', 'Sangrado'],
        phases: [...acutePhases],
        strategies: ['pci', 'fibrinolysis', 'medical'],
        sources: [AHA_ACS],
        verified: false,
      },
      {
        id: 'enoxaparin-sca',

        kind: 'drug',

        drugId: 'enoxaparin',

        regimenId: 'reg-enoxaparin-sca',

        indicationId: 'ind-sca',
        name: 'Enoxaparina',
        role: 'alternative',
        loadOrStart: 'SCASEST: 1 mg/kg SC; fibrinólisis: esquema por edad',
        maintenance: '1 mg/kg c/12 h; ClCr <30: c/24 h',
        when: 'SCASEST o SCACEST con fibrinólisis; la dosis cambia con edad, peso y ClCr.',
        avoid: ['Sangrado activo mayor', 'HIT reciente', 'No intercambiar unidad por unidad con otras HBPM'],
        monitoring: ['ClCr', 'Edad', 'Peso', 'Hb/plaquetas', 'Sangrado'],
        phases: [...acutePhases],
        strategies: ['fibrinolysis', 'medical'],
        sources: [AHA_ACS, label('enoxaparina', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=afec67a9-ae16-4f48-bc0b-5331835e8aa2')],
        verified: false,
      },
      {
        id: 'fondaparinux-sca',

        kind: 'drug',

        drugId: 'fondaparinux',

        indicationId: 'ind-sca',
        name: 'Fondaparinux',
        role: 'alternative',
        loadOrStart: '2,5 mg; fibrinólisis: primera dosis IV',
        maintenance: '2,5 mg SC c/24 h',
        maximum: 'Hasta 8 días o el alta según estrategia',
        when: 'Alternativa en manejo no invasivo o con fibrinólisis. Si el paciente va a PCI necesita HNF adicional durante el procedimiento.',
        avoid: ['ClCr <30 mL/min', 'Usarlo como único anticoagulante durante PCI', 'Sangrado activo mayor'],
        monitoring: ['ClCr', 'Hb/plaquetas', 'Sangrado'],
        phases: [...acutePhases],
        strategies: ['fibrinolysis', 'medical'],
        sources: [AHA_ACS],
        verified: false,
      },
      {
        id: 'bivalirudin-sca',

        kind: 'drug',

        drugId: 'bivalirudin',

        indicationId: 'ind-sca',
        name: 'Bivalirudina',
        role: 'alternative',
        loadOrStart: '0,75 mg/kg IV en bolo',
        maintenance: '1,75 mg/kg/h durante PCI',
        maximum: 'ClCr <30: infusión 1 mg/kg/h; diálisis 0,25 mg/kg/h',
        when: 'Alternativa durante PCI, especialmente si hay antecedente de HIT o se prioriza una estrategia de menor sangrado.',
        avoid: ['Sangrado activo significativo'],
        monitoring: ['ACT', 'ClCr', 'Sangrado'],
        phases: [...acutePhases],
        strategies: ['pci'],
        sources: [AHA_ACS, label('bivalirudina', 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=42aa2630-83d6-433d-8277-0f672cf8d71d&type=display')],
        verified: false,
      },
    ],
  },
  {
    id: 'statins',
    title: '4. Estatina',
    subtitle: 'Alta intensidad para todo SCA si es tolerada',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'atorvastatin',

        kind: 'drug',

        drugId: 'atorvastatin',

        indicationId: 'ind-sca',
        name: 'Atorvastatina',
        role: 'preferred',
        loadOrStart: '40–80 mg/día',
        maintenance: '40–80 mg/día',
        maximum: '80 mg/día',
        when: 'Alta intensidad; no requiere ajuste renal habitual.',
        avoid: ['Hepatopatía activa', 'Embarazo', 'Interacciones potentes CYP3A4'],
        monitoring: ['ALT si está indicado', 'Síntomas musculares', 'Perfil lipídico'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('atorvastatina', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=263f60b2-355e-4389-b47f-146854184da8')],
        verified: false,
      },
      {
        id: 'rosuvastatin',

        kind: 'drug',

        drugId: 'rosuvastatin',

        indicationId: 'ind-sca',
        name: 'Rosuvastatina',
        role: 'preferred',
        loadOrStart: '20–40 mg/día',
        maintenance: '20–40 mg/día',
        maximum: '40 mg/día; ClCr <30 sin diálisis: 10 mg/día',
        when: 'Alta intensidad; revisar función renal e interacciones.',
        avoid: ['Hepatopatía activa', 'Embarazo', '40 mg en insuficiencia renal grave'],
        monitoring: ['ClCr', 'ALT si está indicado', 'Síntomas musculares', 'Perfil lipídico'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('rosuvastatina', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ce767751-696f-4750-8438-a276ae999137')],
        verified: false,
      },
      {
        id: 'simvastatin',

        kind: 'drug',

        drugId: 'simvastatin',

        indicationId: 'ind-sca',
        name: 'Simvastatina',
        role: 'alternative',
        loadOrStart: '20–40 mg por la noche',
        maintenance: '20–40 mg/día',
        maximum: '40 mg/día de inicio; no iniciar 80 mg',
        when: 'Alternativa de intensidad moderada si no se tolera alta intensidad; no es equivalente a atorvastatina 40–80 o rosuvastatina 20–40.',
        avoid: ['Iniciar 80 mg', 'Hepatopatía activa', 'Interacciones potentes CYP3A4'],
        monitoring: ['Síntomas musculares', 'Interacciones', 'Perfil lipídico'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('simvastatina', 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=e92b873a-0ccc-4852-845b-e27e5daab40e&type=display')],
        verified: false,
      },
    ],
  },
  {
    id: 'lipid_add_on',
    title: '5. Descenso adicional de LDL',
    subtitle: 'Agregar si no alcanza objetivo o por riesgo muy alto',
    selectionMode: 'one_or_more',
    options: [
      {
        id: 'ezetimibe',

        kind: 'drug',

        drugId: 'ezetimibe',

        indicationId: 'ind-sca',
        name: 'Ezetimibe',
        role: 'add_on',
        loadOrStart: '10 mg/día',
        maintenance: '10 mg/día',
        maximum: '10 mg/día',
        when: 'Primer agregado frecuente a la estatina máxima tolerada; puede iniciarse durante la internación por SCA.',
        avoid: ['Hepatopatía moderada-grave si se combina con estatina'],
        monitoring: ['Perfil lipídico', 'ALT si se combina con estatina'],
        phases: [...stablePhases],
        sources: [AHA_ACS, AHA_LIPIDS, label('ezetimibe', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3fadf4e9-017d-4ccd-91dc-a89b981eb138')],
        verified: false,
      },
      {
        id: 'evolocumab',

        kind: 'drug',

        drugId: 'evolocumab',

        indicationId: 'ind-sca',
        name: 'Evolocumab',
        role: 'add_on',
        loadOrStart: '140 mg SC c/2 semanas',
        maintenance: '140 mg c/2 sem o 420 mg mensual',
        maximum: '420 mg mensual',
        when: 'ASCVD de muy alto riesgo con LDL sobre objetivo pese a estatina máxima ± ezetimibe.',
        avoid: ['Hipersensibilidad grave'],
        monitoring: ['Perfil lipídico', 'Reacción local'],
        phases: ['pre_alta'],
        sources: [AHA_LIPIDS, label('evolocumab', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=consumer&setid=cd61e902-166d-4aa6-9f3c-a18c1008d07e')],
        verified: false,
      },
      {
        id: 'alirocumab',

        kind: 'drug',

        drugId: 'alirocumab',

        indicationId: 'ind-sca',
        name: 'Alirocumab',
        role: 'add_on',
        loadOrStart: '75 mg SC c/2 semanas',
        maintenance: '75–150 mg c/2 sem o 300 mg c/4 sem',
        maximum: '150 mg c/2 semanas',
        when: 'ASCVD de muy alto riesgo con LDL sobre objetivo pese a tratamiento oral máximo tolerado.',
        avoid: ['Hipersensibilidad grave'],
        monitoring: ['Perfil lipídico', 'Reacción local'],
        phases: ['pre_alta'],
        sources: [AHA_LIPIDS, label('alirocumab', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=446f6b5c-0dd4-44ff-9bc2-c2b41f2806b4')],
        verified: false,
      },
      {
        id: 'inclisiran',

        kind: 'drug',

        drugId: 'inclisiran',

        indicationId: 'ind-sca',
        name: 'Inclisirán',
        role: 'add_on',
        loadOrStart: '284 mg SC día 0',
        maintenance: 'A los 3 meses y luego c/6 meses',
        maximum: '284 mg por dosis',
        when: 'Alternativa inyectable para facilitar adherencia cuando se necesita mayor descenso de LDL.',
        avoid: ['Hipersensibilidad grave'],
        monitoring: ['Perfil lipídico', 'Reacción local'],
        phases: ['pre_alta'],
        sources: [AHA_LIPIDS, label('inclisirán', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/214012s018lbl.pdf')],
        verified: false,
      },
      {
        id: 'bempedoic-acid',

        kind: 'drug',

        drugId: 'bempedoic-acid',

        indicationId: 'ind-sca',
        name: 'Ácido bempedoico',
        role: 'add_on',
        loadOrStart: '180 mg/día',
        maintenance: '180 mg/día',
        maximum: '180 mg/día',
        when: 'Alternativa oral si no se tolera estatina suficiente o persiste LDL sobre objetivo.',
        avoid: ['Precaución con antecedente de gota o lesión tendinosa'],
        monitoring: ['Ácido úrico', 'Síntomas tendinosos', 'Perfil lipídico'],
        phases: ['pre_alta'],
        sources: [AHA_LIPIDS, label('ácido bempedoico', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=88d06d89-a3da-40b4-b273-8f4f7d56c4c9')],
        verified: false,
      },
    ],
  },
  {
    id: 'beta_blockers',
    title: '6. Betabloqueantes',
    subtitle: 'Sólo estable; elegir según FEVI, FC, PA y comorbilidad',
    selectionMode: 'one',
    options: [
      {
        id: 'bisoprolol',

        kind: 'drug',

        drugId: 'bisoprolol',

        indicationId: 'ind-sca',
        name: 'Bisoprolol',
        role: 'preferred',
        loadOrStart: '1,25 mg/día',
        maintenance: 'Titular cada 1–2 semanas',
        maximum: '10 mg/día',
        when: 'Opción con beneficio pronóstico en HFrEF; iniciar estable y euvolémico.',
        avoid: ['Shock o hipoperfusión', 'Bradicardia sintomática', 'BAV avanzado sin marcapasos'],
        monitoring: ['FC', 'TAS', 'Congestión/perfusión'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
      {
        id: 'carvedilol',

        kind: 'drug',

        drugId: 'carvedilol',

        indicationId: 'ind-sca',
        name: 'Carvedilol',
        role: 'preferred',
        loadOrStart: '3,125 mg c/12 h',
        maintenance: 'Titular c/2 semanas',
        maximum: '25 mg c/12 h; hasta 50 mg c/12 h si >85 kg',
        when: 'HFrEF o disfunción ventricular post-IAM; mayor efecto sobre PA que un beta-1 selectivo.',
        avoid: ['Shock o hipoperfusión', 'Bradicardia sintomática', 'Asma bronquial activa grave'],
        monitoring: ['FC', 'TAS', 'Peso/congestión'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
      {
        id: 'metoprolol-succinate',

        kind: 'drug',

        drugId: 'metoprolol',

        indicationId: 'ind-sca',
        name: 'Metoprolol succinato',
        role: 'preferred',
        loadOrStart: '12,5–25 mg/día',
        maintenance: 'Titular cada 1–2 semanas',
        maximum: '200 mg/día',
        when: 'Beta-1 selectivo con beneficio pronóstico en HFrEF.',
        avoid: ['Shock o hipoperfusión', 'Bradicardia sintomática', 'BAV avanzado sin marcapasos'],
        monitoring: ['FC', 'TAS', 'Congestión/perfusión'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
      {
        id: 'metoprolol-tartrate',

        kind: 'drug',

        drugId: 'metoprolol',

        indicationId: 'ind-sca',
        name: 'Metoprolol tartrato',
        role: 'alternative',
        loadOrStart: '12,5–25 mg c/6–12 h si estable',
        maintenance: 'Convertir/ajustar según respuesta',
        maximum: 'Protocolo post-IAM monitorizado según ficha técnica',
        when: 'Control agudo de FC/isquemia por su acción corta; no sustituye a succinato para beneficio HFrEF crónico.',
        avoid: ['Shock', 'IC aguda descompensada', 'Bradicardia', 'BAV avanzado'],
        monitoring: ['FC', 'TAS', 'ECG', 'Perfusión'],
        phases: ['compensado'],
        sources: [AHA_ACS, label('metoprolol tartrato', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=consumer&setid=d62a972a-bc45-4582-9701-bed27a1a9e4d')],
        verified: false,
      },
      {
        id: 'nebivolol',

        kind: 'drug',

        drugId: 'nebivolol',

        indicationId: 'ind-sca',
        name: 'Nebivolol',
        role: 'alternative',
        loadOrStart: '5 mg/día; IR grave: 2,5 mg/día',
        maintenance: 'Titular cada ≥2 semanas',
        maximum: '40 mg/día',
        when: 'Alternativa beta-1 selectiva para HTA/FC; no integra el trío con evidencia de mortalidad HFrEF de la guía AHA.',
        avoid: ['Shock', 'Bradicardia grave', 'BAV avanzado', 'Insuficiencia hepática grave'],
        monitoring: ['FC', 'TAS', 'ClCr'],
        phases: [...stablePhases],
        sources: [AHA_HF, label('nebivolol', 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=25b5631c-44a3-05b4-e063-6394a90aeb7d&type=display')],
        verified: false,
      },
    ],
  },
  {
    id: 'raas',
    title: '7. IECA / ARA-II',
    subtitle: 'Priorizar con FEVI ≤40%, HTA, diabetes o ERC',
    selectionMode: 'one',
    options: [
      {
        id: 'enalapril',

        kind: 'drug',

        drugId: 'enalapril',

        indicationId: 'ind-sca',
        name: 'Enalapril',
        role: 'preferred',
        loadOrStart: '2,5 mg c/12 h',
        maintenance: '10–20 mg c/12 h',
        maximum: '40 mg/día',
        when: 'Disfunción ventricular/HFrEF una vez hemodinámicamente estable.',
        avoid: ['Embarazo', 'Angioedema previo por IECA', 'K elevado', 'Hipotensión'],
        monitoring: ['TAS', 'K', 'Creatinina/ClCr'],
        phases: [...stablePhases],
        sources: [AHA_ACS, AHA_HF],
        verified: false,
      },
      {
        id: 'ramipril',

        kind: 'drug',

        drugId: 'ramipril',

        indicationId: 'ind-sca',
        name: 'Ramipril',
        role: 'preferred',
        loadOrStart: '1,25–2,5 mg/día',
        maintenance: '5 mg c/12 h o 10 mg/día',
        maximum: '10 mg/día',
        when: 'Prevención secundaria post-IAM/disfunción ventricular si estable.',
        avoid: ['Embarazo', 'Angioedema previo por IECA', 'K elevado', 'Hipotensión'],
        monitoring: ['TAS', 'K', 'Creatinina/ClCr'],
        phases: [...stablePhases],
        sources: [AHA_ACS, AHA_HF],
        verified: false,
      },
      {
        id: 'lisinopril',

        kind: 'drug',

        drugId: 'lisinopril',

        indicationId: 'ind-sca',
        name: 'Lisinopril',
        role: 'alternative',
        loadOrStart: '2,5–5 mg/día',
        maintenance: '20–40 mg/día',
        maximum: '40 mg/día',
        when: 'Alternativa IECA en disfunción ventricular/HFrEF.',
        avoid: ['Embarazo', 'Angioedema previo por IECA', 'K elevado', 'Hipotensión'],
        monitoring: ['TAS', 'K', 'Creatinina/ClCr'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
      {
        id: 'losartan',

        kind: 'drug',

        drugId: 'losartan',

        indicationId: 'ind-sca',
        name: 'Losartán',
        role: 'alternative',
        loadOrStart: '25–50 mg/día',
        maintenance: '50–150 mg/día',
        maximum: '150 mg/día en HFrEF',
        when: 'ARA-II si no tolera IECA; no combinar de rutina con IECA.',
        avoid: ['Embarazo', 'K elevado', 'Hipotensión', 'Combinación rutinaria con IECA'],
        monitoring: ['TAS', 'K', 'Creatinina/ClCr'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
      {
        id: 'valsartan',

        kind: 'drug',

        drugId: 'valsartan',

        indicationId: 'ind-sca',
        name: 'Valsartán',
        role: 'alternative',
        loadOrStart: '20–40 mg c/12 h',
        maintenance: '160 mg c/12 h',
        maximum: '320 mg/día',
        when: 'ARA-II post-IAM con disfunción ventricular o HFrEF si no tolera IECA.',
        avoid: ['Embarazo', 'K elevado', 'Hipotensión', 'Combinación rutinaria con IECA'],
        monitoring: ['TAS', 'K', 'Creatinina/ClCr'],
        phases: [...stablePhases],
        sources: [AHA_ACS, AHA_HF],
        verified: false,
      },
    ],
  },
  {
    id: 'mra',
    title: '8. Antagonista mineralocorticoide',
    subtitle: 'FEVI ≤40% + IC/diabetes; controlar K y función renal',
    selectionMode: 'one',
    options: [
      {
        id: 'eplerenone',

        kind: 'drug',

        drugId: 'eplerenone',

        indicationId: 'ind-sca',
        name: 'Eplerenona',
        role: 'preferred',
        loadOrStart: '25 mg/día',
        maintenance: '50 mg/día',
        maximum: '50 mg/día',
        when: 'Post-IAM con FEVI ≤40% y síntomas de IC o diabetes, estable y con función renal/K aceptables.',
        avoid: ['K >5 mEq/L al inicio', 'eGFR ≤30 mL/min/1,73 m²', 'Inhibidores potentes CYP3A'],
        monitoring: ['K a los 3 días, 1 semana y mensual al inicio', 'Función renal', 'TAS'],
        phases: [...stablePhases],
        sources: [AHA_ACS, AHA_HF],
        verified: false,
      },
      {
        id: 'spironolactone',

        kind: 'drug',

        drugId: 'spironolactone',

        indicationId: 'ind-sca',
        name: 'Espironolactona',
        role: 'alternative',
        loadOrStart: '12,5–25 mg/día',
        maintenance: '25–50 mg/día',
        maximum: '50 mg/día en HFrEF',
        when: 'Alternativa MRA en HFrEF; eplerenona tiene la indicación post-IAM específica más directa.',
        avoid: ['K ≥5 mEq/L', 'eGFR ≤30 mL/min/1,73 m²'],
        monitoring: ['K', 'Función renal', 'TAS', 'Efectos endocrinos'],
        phases: [...stablePhases],
        sources: [AHA_HF],
        verified: false,
      },
    ],
  },
  {
    id: 'gastroprotection',
    title: '9. Gastroprotección',
    subtitle: 'PPI si riesgo de sangrado gastrointestinal; no universal',
    selectionMode: 'one',
    options: [
      {
        id: 'pantoprazole',

        kind: 'drug',

        drugId: 'pantoprazole',

        indicationId: 'ind-sca',
        name: 'Pantoprazol',
        role: 'preferred',
        loadOrStart: '40 mg/día VO/IV',
        maintenance: '40 mg/día mientras persista el riesgo',
        maximum: 'Según indicación gastrointestinal',
        when: 'PPI práctico si hay DAPT/anticoagulación y riesgo GI; se prefiere frente a omeprazol si usa clopidogrel.',
        avoid: ['Uso crónico sin reevaluar indicación'],
        monitoring: ['Necesidad al alta', 'Mg si uso prolongado', 'Sangrado GI'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('pantoprazol', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7c958802-daad-4c7e-88eb-73be7d2261d8')],
        verified: false,
      },
      {
        id: 'omeprazole',

        kind: 'drug',

        drugId: 'omeprazole',

        indicationId: 'ind-sca',
        name: 'Omeprazol',
        role: 'alternative',
        loadOrStart: '20–40 mg/día',
        maintenance: '20–40 mg/día',
        maximum: 'Según indicación gastrointestinal',
        when: 'PPI alternativo si no utiliza clopidogrel.',
        avoid: ['Asociación con clopidogrel por reducción de su actividad antiplaquetaria'],
        monitoring: ['Interacciones', 'Necesidad al alta'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('interacción clopidogrel–omeprazol', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d14849e1-58f8-44de-9a9d-a1bb23d1f294')],
        verified: false,
      },
      {
        id: 'esomeprazole',

        kind: 'drug',

        drugId: 'esomeprazole',

        indicationId: 'ind-sca',
        name: 'Esomeprazol',
        role: 'alternative',
        loadOrStart: '20–40 mg/día',
        maintenance: '20–40 mg/día',
        maximum: 'Según indicación gastrointestinal',
        when: 'PPI alternativo si no utiliza clopidogrel.',
        avoid: ['Asociación con clopidogrel por reducción de su actividad antiplaquetaria'],
        monitoring: ['Interacciones', 'Necesidad al alta'],
        phases: [...allPhases],
        sources: [AHA_ACS, label('interacción clopidogrel–esomeprazol', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d14849e1-58f8-44de-9a9d-a1bb23d1f294')],
        verified: false,
      },
    ],
  },
  {
    id: 'antiischemic',
    title: '10. Dolor / antiisquémicos',
    subtitle: 'Alivio sintomático; no reemplaza reperfusión',
    selectionMode: 'conditional',
    options: [
      {
        id: 'nitroglycerin-sl',

        kind: 'drug',

        drugId: 'nitroglycerin',

        indicationId: 'ind-sca',
        name: 'Nitroglicerina SL',
        role: 'base',
        loadOrStart: '0,3–0,4 mg SL',
        maintenance: 'Repetir c/5 min hasta 3 dosis',
        maximum: '3 dosis antes de reevaluar',
        when: 'Dolor isquémico persistente con presión adecuada.',
        avoid: ['TAS <90 mmHg o caída >30 mmHg', 'Infarto de VD', 'PDE5 reciente', 'Bradicardia/tacardia extrema'],
        monitoring: ['TAS', 'Dolor', 'ECG'],
        phases: [...acutePhases],
        sources: [AHA_ACS],
        verified: false,
      },
      {
        id: 'nitroglycerin-iv',

        kind: 'drug',

        drugId: 'nitroglycerin',

        indicationId: 'ind-sca',
        name: 'Nitroglicerina IV',
        role: 'add_on',
        loadOrStart: '5–10 µg/min IV',
        maintenance: 'Titular a dolor y PA',
        maximum: 'Según protocolo y respuesta hemodinámica',
        when: 'Dolor persistente, hipertensión o edema pulmonar con PA adecuada.',
        avoid: ['Shock/hipotensión', 'Infarto de VD', 'PDE5 reciente'],
        monitoring: ['TAS continua', 'Dolor', 'Cefalea'],
        phases: [...acutePhases],
        sources: [AHA_ACS],
        verified: false,
      },
      {
        id: 'morphine',

        kind: 'drug',

        drugId: 'morphine',

        indicationId: 'ind-sca',
        name: 'Morfina IV',
        role: 'rescue',
        loadOrStart: '2–4 mg IV',
        maintenance: '2–8 mg c/5–15 min según respuesta',
        maximum: 'Usar la mínima dosis eficaz',
        when: 'Rescate para dolor refractario a tratamiento antiisquémico; no de rutina.',
        avoid: ['Hipotensión', 'Depresión respiratoria', 'Uso rutinario'],
        monitoring: ['FR/SpO₂', 'TAS', 'Sedación'],
        phases: [...acutePhases],
        sources: [AHA_ACS],
        verified: false,
      },
      {
        id: 'fentanyl',

        kind: 'drug',

        drugId: 'fentanyl',

        indicationId: 'ind-sca',
        name: 'Fentanilo IV',
        role: 'rescue',
        loadOrStart: '25–50 µg IV',
        maintenance: 'Repetir en pequeños bolos si es imprescindible',
        maximum: 'Usar la mínima dosis eficaz',
        when: 'Rescate analgésico seleccionado; los opioides pueden retrasar la absorción del P2Y12 oral.',
        avoid: ['Depresión respiratoria', 'Uso rutinario'],
        monitoring: ['FR/SpO₂', 'TAS', 'Sedación'],
        phases: [...acutePhases],
        sources: [AHA_ACS],
        verified: false,
      },
    ],
  },
];

export const scaTherapyOptionCount = scaTherapyGroups.reduce(
  (total, group) => total + group.options.length,
  0,
);
