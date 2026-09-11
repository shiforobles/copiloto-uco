import type { ClinicalSource, TherapyGroup } from '../rules/types';

/**
 * Matriz terapéutica de fibrilación auricular y anticoagulación.
 *
 * TODAS LAS OPCIONES EN verified: false.
 * Fuentes principales:
 * - ESC 2020 AF Guidelines + 2024 focused update
 * - AHA/ACC/HRS 2023 AF Guideline
 * - ESC 2021 Cardiovascular Drug Therapy
 *
 * Las dosis de anticoagulación son ESPECÍFICAS para FA. No reutilizar para TVP/TEP.
 */

const ESC_AF: ClinicalSource = {
  label: 'ESC 2020/2024 · Fibrilación auricular',
  url: 'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/',
};

const AHA_AF: ClinicalSource = {
  label: 'AHA/ACC/HRS 2023 · Fibrilación auricular',
  url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193',
};

const label = (name: string, url: string): ClinicalSource => ({
  label: `Ficha técnica · ${name}`,
  url,
});

const allPhases = ['shock_inotropicos', 'compensado', 'pre_alta'] as const;
const stablePhases = ['compensado', 'pre_alta'] as const;

export const afTherapyGroups: TherapyGroup[] = [
  // ─── 1. Control de frecuencia agudo (IV) ────────────────────────────────────
  {
    id: 'rate_control_iv',
    title: '1. Control de frecuencia agudo (IV)',
    subtitle: 'FA estable con FC elevada — elegir según FEVI y TAS',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'metoprolol-iv-af',

        kind: 'drug',

        drugId: 'metoprolol',

        indicationId: 'ind-af',
        name: 'Metoprolol IV',
        role: 'preferred',
        loadOrStart: '2,5–5 mg IV en 2–5 min; repetir c/5 min hasta 3 dosis',
        maintenance: 'Pasar a metoprolol oral una vez estabilizado',
        maximum: '15 mg IV en la sesión aguda',
        when: 'Control rápido de FC en FA con función ventricular normal o reducida (con cautela). No usar en FEVI muy reducida y descompensación activa.',
        avoid: [
          'Bradicardia (FC <60 lpm)',
          'BAV 2°–3° sin marcapaso',
          'TAS <90 mmHg',
          'Síndrome de preexcitación (WPW)',
          'Asma grave / broncoespasmo activo',
        ],
        monitoring: ['FC cada 5 min durante administración', 'TAS', 'ECG'],
        phases: [...allPhases],
        afContexts: ['rate_control', 'unstable'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
      {
        id: 'esmolol-iv-af',

        kind: 'drug',

        drugId: 'esmolol',

        indicationId: 'ind-af',
        name: 'Esmolol IV',
        role: 'alternative',
        loadOrStart: '500 µg/kg IV en 1 min (bolo); luego infusión',
        maintenance: '50–200 µg/kg/min',
        maximum: '300 µg/kg/min',
        when: 'Betabloqueante IV de acción ultracorta (vida media ~9 min). Útil cuando se necesita efecto rápido y reversible, o en pacientes con riesgo de intolerancia.',
        avoid: [
          'Bradicardia severa',
          'BAV 2°–3° sin marcapaso',
          'TAS <90 mmHg',
          'Preexcitación',
          'IC descompensada grave',
        ],
        monitoring: ['FC', 'TAS', 'ECG'],
        phases: [...allPhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'diltiazem-iv-af',

        kind: 'drug',

        drugId: 'diltiazem',

        indicationId: 'ind-af',
        name: 'Diltiazem IV',
        role: 'alternative',
        loadOrStart: '0,25 mg/kg IV en 2 min; puede repetirse 0,35 mg/kg a los 15 min',
        maintenance: 'Infusión 5–15 mg/h',
        maximum: '15 mg/h',
        when: 'Control de FC en FA cuando betabloqueantes están contraindicados. CONTRAINDICADO si FEVI ≤40% o IC descompensada.',
        avoid: [
          'FEVI ≤40% / IC descompensada',
          'BAV 2°–3° sin marcapaso',
          'TAS <90 mmHg',
          'Síndrome de preexcitación (WPW)',
          'Uso con betabloqueantes IV (riesgo de BAV)',
        ],
        monitoring: ['FC', 'TAS', 'ECG', 'FEVI antes de administrar'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
      {
        id: 'verapamil-iv-af',

        kind: 'drug',

        drugId: 'verapamil',

        indicationId: 'ind-af',
        name: 'Verapamilo IV',
        role: 'alternative',
        loadOrStart: '2,5–5 mg IV en 2 min; repetir 5–10 mg c/15 min hasta 20 mg',
        maintenance: 'No usar infusión de rutina',
        maximum: '20 mg total agudo',
        when: 'Control de FC en FA. CONTRAINDICADO si FEVI ≤40% o IC descompensada. Evitar con betabloqueantes.',
        avoid: [
          'FEVI ≤40% / IC descompensada',
          'BAV 2°–3° sin marcapaso',
          'TAS <90 mmHg',
          'Síndrome de preexcitación (WPW)',
          'Uso simultáneo con betabloqueantes IV',
        ],
        monitoring: ['FC', 'TAS', 'ECG'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'digoxin-iv-af',

        kind: 'drug',

        drugId: 'digoxin',

        indicationId: 'ind-af',
        name: 'Digoxina IV',
        role: 'add_on',
        loadOrStart: '0,25–0,5 mg IV lento; puede repetirse 0,25 mg c/6 h hasta 1 mg total',
        maintenance: 'Pasar a digital oral; dosis según función renal',
        maximum: '1 mg en carga IV',
        when: 'Control de FC en reposo en FA con IC descompensada o FEVI muy reducida cuando betabloqueantes no son tolerados. Efecto lento; escasa eficacia en FA con alta actividad simpática.',
        avoid: [
          'Síndrome de preexcitación (WPW)',
          'BAV 2°–3° sin marcapaso',
          'Hipopotasemia (potencia toxicidad)',
          'IRC grave sin ajuste de dosis',
        ],
        monitoring: ['FC', 'K', 'Cr', 'Niveles séricos (0,5–0,9 ng/mL)', 'ECG (ondas T)'],
        phases: [...allPhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
    ],
  },

  // ─── 2. Control de frecuencia oral ──────────────────────────────────────────
  {
    id: 'rate_control_oral',
    title: '2. Control de frecuencia oral (mantenimiento)',
    subtitle: 'Objetivo: FC <110 lpm en reposo (o <80 si síntomas)',
    selectionMode: 'one',
    options: [
      {
        id: 'bisoprolol-af',

        kind: 'drug',

        drugId: 'bisoprolol',

        indicationId: 'ind-af',
        name: 'Bisoprolol',
        role: 'preferred',
        loadOrStart: '1,25–2,5 mg/día VO',
        maintenance: 'Titular hasta 10 mg/día según FC',
        maximum: '10 mg/día',
        when: 'Control de FC oral en FA. Primera línea. Beta-1 selectivo; mejor perfil en EPOC leve.',
        avoid: ['FC <55 lpm', 'BAV sin marcapaso', 'Asma grave', 'FEVI <40% no estabilizada'],
        monitoring: ['FC', 'TAS'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
      {
        id: 'metoprolol-tartrate-af',

        kind: 'drug',

        drugId: 'metoprolol',

        indicationId: 'ind-af',
        name: 'Metoprolol tartrato',
        role: 'preferred',
        loadOrStart: '25–50 mg c/12 h VO',
        maintenance: '50–100 mg c/12 h',
        maximum: '200 mg/día',
        when: 'Control de FC oral en FA. Alternativa al bisoprolol.',
        avoid: ['FC <55 lpm', 'BAV sin marcapaso', 'TAS <90 mmHg'],
        monitoring: ['FC', 'TAS'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'diltiazem-oral-af',

        kind: 'drug',

        drugId: 'diltiazem',

        indicationId: 'ind-af',
        name: 'Diltiazem oral',
        role: 'alternative',
        loadOrStart: '60 mg c/8 h VO (liberación inmediata)',
        maintenance: '120–360 mg/día en formulación de liberación prolongada',
        maximum: '360 mg/día',
        when: 'Control de FC oral si betabloqueantes contraindicados y FEVI >40%.',
        avoid: ['FEVI ≤40%', 'IC descompensada', 'BAV', 'Uso con betabloqueantes'],
        monitoring: ['FC', 'TAS', 'FEVI'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'verapamil-oral-af',

        kind: 'drug',

        drugId: 'verapamil',

        indicationId: 'ind-af',
        name: 'Verapamilo oral',
        role: 'alternative',
        loadOrStart: '40–80 mg c/8 h VO',
        maintenance: '120–360 mg/día',
        maximum: '480 mg/día',
        when: 'Control de FC oral si betabloqueantes contraindicados y FEVI >40%. Múltiples interacciones.',
        avoid: ['FEVI ≤40%', 'IC descompensada', 'BAV', 'Uso con betabloqueantes'],
        monitoring: ['FC', 'TAS', 'FEVI', 'Interacciones (digoxina, estatinas)'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'digoxin-oral-af',

        kind: 'drug',

        drugId: 'digoxin',

        indicationId: 'ind-af',
        name: 'Digoxina oral',
        role: 'add_on',
        loadOrStart: '0,125–0,25 mg/día VO (ajustar por función renal)',
        maintenance: '0,0625–0,25 mg/día',
        maximum: '0,25 mg/día en FA; niveles objetivo 0,5–0,9 ng/mL',
        when: 'Agregado si FC no controlada con betabloqueante solo, especialmente en IC con FEVI reducida o vida sedentaria.',
        avoid: ['K <3,5 mEq/L', 'Preexcitación', 'BAV', 'IRC grave sin ajuste'],
        monitoring: ['K', 'Cr', 'Niveles séricos', 'ECG'],
        phases: [...stablePhases],
        afContexts: ['rate_control'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
    ],
  },

  // ─── 3. Control de ritmo / Cardioversión farmacológica ──────────────────────
  {
    id: 'rhythm_control',
    title: '3. Control de ritmo y cardioversión farmacológica',
    subtitle: 'Solo en FA ≤48 h o con anticoagulación adecuada previa',
    selectionMode: 'conditional',
    options: [
      {
        id: 'amiodarone-af',

        kind: 'drug',

        drugId: 'amiodarone',

        indicationId: 'ind-af',
        name: 'Amiodarona',
        role: 'preferred',
        loadOrStart: '150–300 mg IV en 20–60 min; luego infusión 900–1200 mg en 24 h',
        maintenance: '100–200 mg/día VO (mantenimiento crónico)',
        maximum: '2,2 g/día IV en la primera 24 h (protocolo carga)',
        when: 'Control de ritmo en FA con IC o cardiopatía estructural. Cardioversión farmacológica. No usar como primera línea crónica por toxicidad. Eficaz pero tóxica a largo plazo.',
        avoid: [
          'QTc >500 ms (relativo)',
          'Disfunción tiroidea grave',
          'Toxicidad pulmonar o hepática previa a amiodarona',
          'Bradicardia o BAV sin marcapaso',
        ],
        monitoring: ['QTc (prolongación esperada)', 'TAS', 'TSH cada 6 meses', 'Función hepática', 'Función pulmonar anual'],
        phases: [...allPhases],
        afContexts: ['rhythm_control', 'cardioversion', 'rate_control'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
      {
        id: 'flecainide-af',

        kind: 'drug',

        drugId: 'flecainide',

        indicationId: 'ind-af',
        name: 'Flecainida',
        role: 'preferred',
        loadOrStart: '200–300 mg VO (dosis única para cardioversión ambulatoria) o 1–2 mg/kg IV en 10 min',
        maintenance: '100–200 mg c/12 h VO (control de ritmo crónico)',
        maximum: '200 mg c/12 h',
        when: 'Cardioversión farmacológica en FA sin cardiopatía estructural ni enfermedad coronaria. Estrategia "pill-in-the-pocket" para paroxismo. NO usar en IC o cardiopatía estructural.',
        avoid: [
          'Cardiopatía estructural (FEVIr, cardiopatía isquémica, HVI)',
          'IC',
          'QTc prolongado',
          'BAV o trastornos de conducción',
          'Insuficiencia renal grave (ClCr <50: ajuste)',
        ],
        monitoring: ['QRS (ensanchamiento ≥25% = toxicidad)', 'ECG', 'ClCr'],
        phases: [...stablePhases],
        afContexts: ['rhythm_control', 'cardioversion'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
      {
        id: 'propafenone-af',

        kind: 'drug',

        drugId: 'propafenone',

        indicationId: 'ind-af',
        name: 'Propafenona',
        role: 'alternative',
        loadOrStart: '450–600 mg VO (dosis única, pill-in-the-pocket) o 1,5–2 mg/kg IV en 10 min',
        maintenance: '150–300 mg c/8 h VO',
        maximum: '300 mg c/8 h',
        when: 'Cardioversión farmacológica o control de ritmo en FA sin cardiopatía estructural. Alternativa a flecainida.',
        avoid: [
          'Cardiopatía estructural (FEVIr, cardiopatía isquémica)',
          'IC',
          'EPOC grave (efecto betabloqueante leve)',
          'QTc prolongado',
        ],
        monitoring: ['QRS', 'ECG', 'TAS'],
        phases: [...stablePhases],
        afContexts: ['rhythm_control', 'cardioversion'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'electrical-cv-af',

        kind: 'procedure',
        name: 'Cardioversión eléctrica sincronizada',
        role: 'preferred',
        loadOrStart: '100–200 J bifásico sincronizado',
        maintenance: 'No aplica',
        when: 'Indicación formal: FA con inestabilidad hemodinámica (primer paso). También en FA estable con síntomas refractarios al control de ritmo farmacológico. Requiere anticoagulación adecuada si FA ≥48 h o duración desconocida.',
        avoid: [
          'FA de larga data sin anticoagulación previa adecuada (riesgo de embolismo)',
          'Intoxicación digitálica (riesgo de FV)',
          'Hipotiroidismo severo no corregido',
        ],
        monitoring: ['ECG post-cardioversión', 'TAS', 'Anticoagulación 4 semanas post-CV si FA ≥48 h'],
        phases: [...allPhases],
        afContexts: ['unstable', 'cardioversion'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
    ],
  },

  // ─── 4. Anticoagulación oral (FA no valvular) ───────────────────────────────
  {
    id: 'anticoagulation_af',
    title: '4. Anticoagulación oral — FA no valvular',
    subtitle: 'ACOD preferidos; dosis específicas para FA (≠ TVP/TEP)',
    selectionMode: 'one',
    defaultOpen: true,
    options: [
      {
        id: 'apixaban-af',

        kind: 'drug',

        drugId: 'apixaban',

        regimenId: 'reg-apixaban-af-5',

        indicationId: 'ind-af',
        name: 'Apixabán',
        role: 'preferred',
        loadOrStart: '5 mg c/12 h VO',
        maintenance: '5 mg c/12 h; reducir a 2,5 mg c/12 h si ≥2 de: edad ≥80, peso ≤60 kg, Cr ≥1,5 mg/dL',
        maximum: '5 mg c/12 h (dosis FA; no subir)',
        when: 'ACOD de primera línea en FA no valvular. Sin ajuste renal leve-moderado. Menor sangrado GI que rivaroxabán/dabigatrán (ARISTOTLE). Dosis FA ≠ dosis TVP/TEP.',
        avoid: [
          'Válvula mecánica (usar warfarina)',
          'FA en estenosis mitral moderada-grave',
          'Hemorragia activa mayor',
          'ClCr <15 mL/min (sin datos suficientes)',
        ],
        monitoring: ['Función renal anual o si deterioro', 'Hemorragia', 'Interacciones (inhibidores/inductores P-gp, CYP3A4)'],
        phases: [...stablePhases],
        afContexts: ['anticoagulation', 'af_acs_pci'],
        sources: [
          ESC_AF,
          AHA_AF,
          { label: 'ARISTOTLE · NEJM 2011', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1107039' },
          label('apixabán', 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=d3dfb3d8-5c07-4651-bc37-3b685f010f86&type=display'),
        ],
        verified: false,
      },
      {
        id: 'rivaroxaban-af',

        kind: 'drug',

        drugId: 'rivaroxaban',

        regimenId: 'reg-rivaroxaban-af-20',

        indicationId: 'ind-af',
        name: 'Rivaroxabán',
        role: 'preferred',
        loadOrStart: '20 mg/día con la cena (o 15 mg/día si ClCr 15–49)',
        maintenance: '20 mg/día con la cena (dosis FA)',
        maximum: '20 mg/día',
        when: 'ACOD en FA no valvular. Dosis única diaria (adherencia). Ajustar si ClCr 15–49 (15 mg/día). Dosis FA ≠ dosis TVP/TEP.',
        avoid: [
          'Válvula mecánica',
          'FA en estenosis mitral moderada-grave',
          'ClCr <15 mL/min',
          'Hemorragia activa mayor',
        ],
        monitoring: ['Cr anual', 'Hemorragia GI (mayor que apixabán)'],
        phases: [...stablePhases],
        afContexts: ['anticoagulation', 'af_acs_pci'],
        sources: [
          ESC_AF,
          { label: 'ROCKET-AF · NEJM 2011', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1009638' },
        ],
        verified: false,
      },
      {
        id: 'dabigatran-af',

        kind: 'drug',

        drugId: 'dabigatran',

        regimenId: 'reg-dabigatran-af-150',

        indicationId: 'ind-af',
        name: 'Dabigatrán',
        role: 'preferred',
        loadOrStart: '150 mg c/12 h VO; 110 mg c/12 h si edad ≥80 o riesgo alto de sangrado',
        maintenance: '150 mg c/12 h (dosis FA)',
        maximum: '150 mg c/12 h',
        when: 'ACOD en FA no valvular. Dosis 110 mg si ≥80 años, alto riesgo hemorrágico o uso de verapamilo. Tiene antídoto específico (idarucizumab). Dosis FA ≠ TVP/TEP.',
        avoid: [
          'ClCr <30 mL/min (contraindicado)',
          'Válvula mecánica',
          'FA en estenosis mitral moderada-grave',
          'Hemorragia activa mayor',
        ],
        monitoring: ['ClCr al inicio y c/6 meses (o más frecuente si deterioro)', 'Hemorragia GI'],
        phases: [...stablePhases],
        afContexts: ['anticoagulation', 'af_acs_pci'],
        sources: [
          ESC_AF,
          { label: 'RE-LY · NEJM 2009', url: 'https://www.nejm.org/doi/10.1056/NEJMoa0905561' },
        ],
        verified: false,
      },
      {
        id: 'edoxaban-af',

        kind: 'drug',

        drugId: 'edoxaban',

        regimenId: 'reg-edoxaban-af-60',

        indicationId: 'ind-af',
        name: 'Edoxabán',
        role: 'preferred',
        loadOrStart: '60 mg/día VO; 30 mg/día si ClCr 15–50, peso ≤60 kg o uso de inhibidores P-gp',
        maintenance: '60 mg/día (dosis FA)',
        maximum: '60 mg/día',
        when: 'ACOD en FA no valvular. Atención: paradójicamente, si ClCr >95 mL/min, puede ser menos eficaz (subgrupo ENGAGE). Dosis FA ≠ TVP/TEP.',
        avoid: [
          'Válvula mecánica',
          'ClCr <15 mL/min',
          'FA en estenosis mitral moderada-grave',
          'Hemorragia activa',
        ],
        monitoring: ['ClCr al inicio', 'Hemorragia'],
        phases: [...stablePhases],
        afContexts: ['anticoagulation', 'af_acs_pci'],
        sources: [
          ESC_AF,
          { label: 'ENGAGE AF · NEJM 2013', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1310907' },
        ],
        verified: false,
      },
      {
        id: 'warfarin-af',

        kind: 'drug',

        drugId: 'warfarin',

        indicationId: 'ind-af',
        name: 'Warfarina',
        role: 'alternative',
        loadOrStart: '5 mg/día VO; 2,5 mg si anciano/bajo peso (ajustar por RIN)',
        maintenance: 'Titular a RIN 2–3',
        maximum: 'Titular por RIN (no por dosis absoluta)',
        when: 'Anticoagulación en FA con válvula mecánica o estenosis mitral moderada-grave (única indicación donde supera ACOD). También si ACOD no disponibles o inaccesibles.',
        avoid: [
          'FA no valvular con ACOD disponibles (ACOD preferidos)',
          'Hemorragia activa',
          'No posibilidad de monitoreo de RIN',
        ],
        monitoring: ['RIN cada 1–4 semanas (objetivo 2–3)', 'Hemorragia', 'Interacciones múltiples (dietéticas y farmacológicas)'],
        phases: [...stablePhases],
        afContexts: ['anticoagulation'],
        sources: [ESC_AF, AHA_AF],
        verified: false,
      },
    ],
  },

  // ─── 5. Anticoagulación parenteral en FA ──────────────────────────────
  {
    id: 'parenteral_anticoag_af',
    title: '5. Anticoagulación parenteral en FA',
    subtitle: 'Indicaciones específicas: cardioversión urgente, válvula mecánica, perioperatorio o intolerancia a ACOD',
    selectionMode: 'conditional',
    options: [
      {
        id: 'ufh-af',

        kind: 'drug',

        drugId: 'unfractionated-heparin',

        indicationId: 'ind-af',
        name: 'HNF IV (Heparina no fraccionada)',
        role: 'preferred',
        loadOrStart: 'Bolo 60–80 UI/kg (máx 5.000 UI); infusión 12–15 UI/kg/h (máx 1.000 UI/h)',
        maintenance: 'Titular por aPTT ratio 1,5–2,5 (protocolo institucional)',
        maximum: 'Según aPTT',
        when: 'Anticoagulación parenteral en FA cuando se necesita efecto rápido y reversible: pre-cardioversión urgente, válvula mecánica, diálisis, o transición desde warfarina. NO como puente rutinario para iniciar ACOD en FA (los ACOD se inician directamente sin heparina previa).',
        avoid: [
          'Trombocitopenia inducida por heparina (TIH) previa',
          'Hemorragia activa mayor',
          'Alergia a heparina',
        ],
        monitoring: ['aPTT c/6 h hasta rango estable; luego c/24 h', 'Plaquetas c/3 días (riesgo TIH)', 'Hemorragia'],
        phases: [...allPhases],
        afContexts: ['anticoagulation', 'unstable', 'cardioversion', 'af_acs_pci'],
        sources: [ESC_AF],
        verified: false,
      },
      {
        id: 'enoxaparin-af',

        kind: 'drug',

        drugId: 'enoxaparin',

        regimenId: 'reg-enoxaparin-af-ther',

        indicationId: 'ind-af',
        name: 'Enoxaparina SC (dosis terapéutica)',
        role: 'alternative',
        loadOrStart: '1 mg/kg c/12 h SC (dosis anticoagulante)',
        maintenance: '1 mg/kg c/12 h; ajustar a 1 mg/kg c/24 h si ClCr <30',
        maximum: '1 mg/kg c/12 h (dosis terapéutica FA ≠ profilaxis TEV)',
        when: '\u26a0 Indicaciones específicas en FA: pre-cardioversión sin ACOD establecido, perioperatorio, o cuando ACOD contraindicado. NO es puente rutinario para iniciar ACOD: los ACOD en FA se inician directamente. Dosis terapéutica (1 mg/kg c/12 h) ≠ dosis profiláctica TVP (40 mg/día). No intercambiar.',
        avoid: [
          'ClCr <15 mL/min (acumulación, no recomendado)',
          'TIH previa',
          'Hemorragia activa mayor',
          'No usar dosis profiláctica para indicación terapéutica',
        ],
        monitoring: ['Cr, plaquetas', 'Anti-Xa si ClCr <30 o peso extremo', 'Hemorragia'],
        phases: [...allPhases],
        afContexts: ['anticoagulation', 'cardioversion'],
        sources: [ESC_AF],
        verified: false,
      },
    ],
  },
];

export const afTherapyOptionCount = afTherapyGroups.reduce(
  (total, group) => total + group.options.length,
  0,
);
