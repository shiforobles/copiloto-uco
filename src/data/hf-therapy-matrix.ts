import type { ClinicalSource, TherapyGroup } from '../rules/types';

/**
 * Matriz terapéutica de insuficiencia cardíaca aguda y crónica descompensada.
 *
 * TODAS LAS OPCIONES PERMANECEN EN verified: false.
 * La información fue resumida a partir de guías ESC 2021/2026 y AHA/ACC/HFSA 2022.
 * No se copiaron tablas completas protegidas; se resumen los principios de dosificación.
 * La validación institucional debe realizarse antes de usar en la práctica.
 *
 * Fuentes:
 * - ESC 2021 Heart Failure Guidelines (actualización 2022 y 2023 focused updates)
 * - AHA/ACC/HFSA 2022 Heart Failure Guideline
 * - ESC 2024 HFpEF Position Paper
 */

const ESC_HF: ClinicalSource = {
  label: 'ESC 2021/2022 · Insuficiencia cardíaca',
  url: 'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure/',
};

const AHA_HF: ClinicalSource = {
  label: 'AHA/ACC/HFSA 2022 · Insuficiencia cardíaca',
  url: 'https://professional.heart.org/en/science-news/2022-guideline-for-the-management-of-heart-failure',
};

const label = (name: string, url: string): ClinicalSource => ({
  label: `Ficha técnica · ${name}`,
  url,
});

const allPhases = ['shock_inotropicos', 'compensado', 'pre_alta'] as const;
const stablePhases = ['compensado', 'pre_alta'] as const;
const acutePhases = ['shock_inotropicos', 'compensado'] as const;

/**
 * Matriz IC por grupos terapéuticos.
 *
 * Cada opción tiene hfContexts para contextualizar sin ocultar.
 * Si el contexto del paciente no coincide, el motor agrega una advertencia pero mantiene la opción visible.
 */
export const hfTherapyGroups: TherapyGroup[] = [
  // ─── 1. Diuréticos de asa ───────────────────────────────────────────────────
  {
    id: 'loop_diuretics',
    title: '1. Diuréticos de asa',
    subtitle: 'Descongestión — ajustar a diuresis y peso',
    selectionMode: 'one_or_more',
    defaultOpen: true,
    options: [
      {
        id: 'furosemide-hf',

        kind: 'drug',

        drugId: 'furosemide',

        indicationId: 'ind-hf',
        name: 'Furosemida',
        role: 'base',
        loadOrStart: '20–80 mg IV en bolo (según uso previo); infusión continua posible',
        maintenance: '20–40 mg/día VO mínima dosis efectiva',
        maximum: '600 mg/día IV en cuadros refractarios',
        when: 'Congestión aguda o crónica. Primera línea para descongestión en IC aguda.',
        avoid: [
          'Hipovolemia no congestiva',
          'Alergia a sulfonamidas (considerar bumetanida)',
          'K <3 mEq/L sin reposición',
        ],
        monitoring: ['Diuresis horaria / balance hídrico', 'K, Na, Cr diarios en fase aguda', 'Peso diario'],
        phases: [...acutePhases],
        hfContexts: ['shock', 'congestion_no_shock', 'stabilization'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'bumetanide-hf',

        kind: 'drug',

        drugId: 'bumetanide',

        indicationId: 'ind-hf',
        name: 'Bumetanida',
        role: 'alternative',
        loadOrStart: '0,5–1 mg IV o VO (equivale a ~40 mg furosemida)',
        maintenance: '0,5–2 mg/día VO',
        maximum: '10 mg/día',
        when: 'Alternativa a furosemida; mayor biodisponibilidad oral en edema intestinal.',
        avoid: [
          'Hipovolemia no congestiva',
          'K <3 mEq/L sin reposición',
        ],
        monitoring: ['Diuresis', 'K, Na, Cr', 'Peso'],
        phases: [...acutePhases],
        hfContexts: ['congestion_no_shock', 'stabilization'],
        sources: [ESC_HF, label('bumetanida-ANMAT', 'https://www.anmat.gov.ar/listados/Medicamentos.asp')],
        verified: false,
      },
      {
        id: 'torsemide-hf',

        kind: 'drug',

        drugId: 'torsemide',

        indicationId: 'ind-hf',
        name: 'Torsemida',
        role: 'alternative',
        loadOrStart: '10–20 mg VO (equivale a ~40 mg furosemida)',
        maintenance: '10–40 mg/día VO',
        maximum: '200 mg/día',
        when: 'Mayor biodisponibilidad oral que furosemida; puede preferirse en mantenimiento.',
        avoid: ['Hipovolemia no congestiva'],
        monitoring: ['Diuresis', 'K, Na, Cr', 'Peso'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization'],
        sources: [ESC_HF],
        verified: false,
      },
    ],
  },

  // ─── 2. Diuréticos adyuvantes ───────────────────────────────────────────────
  {
    id: 'adjunct_diuretics',
    title: '2. Bloqueo diurético secuencial',
    subtitle: 'Agregar si refractariedad a diurético de asa',
    selectionMode: 'conditional',
    options: [
      {
        id: 'acetazolamide-hf',

        kind: 'drug',

        drugId: 'acetazolamide',

        indicationId: 'ind-hf',
        name: 'Acetazolamida',
        role: 'add_on',
        loadOrStart: '500 mg IV c/24 h × 3 días (ensayo ADVOR)',
        maintenance: '500 mg/día IV o VO',
        maximum: '500 mg/día',
        when: 'Bloqueo proximal para potenciar diurético de asa en IC aguda descompensada; evidencia ADVOR 2022.',
        avoid: [
          'Alergia a sulfamidas',
          'IRC avanzada (eGFR <20)',
          'Acidosis metabólica severa',
          'Cirrosis hepática avanzada',
        ],
        monitoring: ['pH / bicarbonato', 'K, Na', 'Diuresis'],
        phases: [...acutePhases],
        hfContexts: ['congestion_no_shock', 'stabilization'],
        sources: [
          ESC_HF,
          { label: 'ADVOR trial 2022 · NEJM', url: 'https://www.nejm.org/doi/10.1056/NEJMoa2203094' },
        ],
        verified: false,
      },
      {
        id: 'metolazone-hf',

        kind: 'drug',

        drugId: 'metolazone',

        indicationId: 'ind-hf',
        name: 'Metolazona',
        role: 'add_on',
        loadOrStart: '2,5–5 mg VO 30 min antes del diurético de asa',
        maintenance: '2,5–5 mg/día o interdiario',
        maximum: '10 mg/día',
        when: 'Bloqueo distal en refractariedad a asa. Efecto prolongado; vigilar hipopotasemia.',
        avoid: ['Anuria', 'K <3 mEq/L sin reposición'],
        monitoring: ['K, Na, Mg (riesgo de hipopotasemia intensa)', 'Diuresis', 'Cr'],
        phases: [...acutePhases],
        hfContexts: ['congestion_no_shock', 'stabilization'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'hctz-hf',

        kind: 'drug',

        drugId: 'hydrochlorothiazide',

        indicationId: 'ind-hf',
        name: 'Hidroclorotiazida',
        role: 'alternative',
        loadOrStart: '25–50 mg VO',
        maintenance: '25–50 mg/día',
        maximum: '100 mg/día',
        when: 'Alternativa a metolazona para bloqueo distal; menor potencia.',
        avoid: ['Anuria', 'K <3 mEq/L sin reposición', 'IRC grave (ClCr <30)'],
        monitoring: ['K, Na', 'Diuresis', 'Cr'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization'],
        sources: [ESC_HF],
        verified: false,
      },
    ],
  },

  // ─── 3. Vasodilatadores ─────────────────────────────────────────────────────
  {
    id: 'vasodilators',
    title: '3. Vasodilatadores IV',
    subtitle: 'Congestión sin hipotensión; reducción de pre y poscarga',
    selectionMode: 'one',
    options: [
      {
        id: 'nitroglycerin-hf',

        kind: 'drug',

        drugId: 'nitroglycerin',

        indicationId: 'ind-hf',
        name: 'Nitroglicerina IV',
        role: 'preferred',
        loadOrStart: '5–10 µg/min IV; titular cada 3–5 min',
        maintenance: '20–200 µg/min según TAS y síntomas',
        maximum: '400 µg/min (riesgo de tolerancia rápida)',
        when: 'IC aguda con congestión y TAS ≥90 mmHg. Reduce precarga (y poscarga a dosis altas). Especialmente útil en IC hipertensiva y EPA.',
        avoid: [
          'TAS <90 mmHg',
          'Shock cardiogénico',
          'Uso de inhibidores de PDE5 en las últimas 24–48 h',
          'Estenosis aórtica grave',
        ],
        monitoring: ['TAS cada 5–15 min durante titulación', 'Cefalea', 'FC', 'Diuresis'],
        phases: [...acutePhases],
        hfContexts: ['congestion_no_shock', 'stabilization'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'nitroprusside-hf',

        kind: 'drug',

        drugId: 'nitroprusside',

        indicationId: 'ind-hf',
        name: 'Nitroprusiato',
        role: 'alternative',
        loadOrStart: '0,3 µg/kg/min IV; titular cada 5 min',
        maintenance: '0,5–3 µg/kg/min (máx. 10 µg/kg/min por cortos períodos)',
        maximum: '10 µg/kg/min; no superar 72 h sin monitoreo de tiocianato',
        when: 'IC hipertensiva con resistencia vascular elevada. Reduce pre y poscarga simétricamente. Útil en regurgitaciones valvulares agudas graves.',
        avoid: [
          'TAS <90 mmHg o hipoperfusión',
          'IAM agudo activo (puede producir robo coronario)',
          'Insuficiencia hepática grave (metabolismo de cianuro)',
          'Uso prolongado sin monitoreo de tiocianato',
        ],
        monitoring: ['TAS invasiva recomendada', 'Tiocianato si >48–72 h', 'Proteger de la luz'],
        phases: [...acutePhases],
        hfContexts: ['congestion_no_shock'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
    ],
  },

  // ─── 4. Vasopresores / Inotrópicos ──────────────────────────────────────────
  {
    id: 'vasopressors_inotropes',
    title: '4. Vasopresores / Inotrópicos',
    subtitle: 'Shock cardiogénico o hipoperfusión grave — no iniciar si TAS ≥90',
    selectionMode: 'one_or_more',
    defaultOpen: false,
    options: [
      {
        id: 'norepinephrine-hf',

        kind: 'drug',

        drugId: 'norepinephrine',

        indicationId: 'ind-hf',
        name: 'Noradrenalina',
        role: 'preferred',
        loadOrStart: '0,05–0,1 µg/kg/min IV; titular a TAM ≥65 mmHg',
        maintenance: '0,1–1 µg/kg/min según respuesta',
        maximum: '1–2 µg/kg/min (dosis altas = vasoconstricción excesiva)',
        when: 'Vasopresor de primera línea en shock cardiogénico. Preferir sobre dopamina para reducir arritmias (ensayo SOAP-II). Combinar con inotrópico si gasto bajo.',
        avoid: [
          'Sin hipotensión documentada',
          'Isquemia mesentérica o de extremidades activa',
        ],
        monitoring: ['TAS/TAM cada 15–30 min', 'Diuresis', 'Lactato', 'Perfusión periférica'],
        phases: ['shock_inotropicos'],
        hfContexts: ['shock'],
        sources: [
          ESC_HF,
          { label: 'SOAP-II trial · NEJM 2010', url: 'https://www.nejm.org/doi/10.1056/NEJMoa0907118' },
        ],
        verified: false,
      },
      {
        id: 'dobutamine-hf',

        kind: 'drug',

        drugId: 'dobutamine',

        indicationId: 'ind-hf',
        name: 'Dobutamina',
        role: 'preferred',
        loadOrStart: '2,5–5 µg/kg/min IV; titular según respuesta clínica',
        maintenance: '5–15 µg/kg/min',
        maximum: '20 µg/kg/min',
        when: 'Inotrópico de primera línea en bajo gasto con TAS ≥80 mmHg. Reduce resistencia vascular. Puede producir taquicardia y arritmias.',
        avoid: [
          'TAS <75 mmHg sin vasopresor (considerar noradrenalina primero)',
          'Estenosis subaórtica dinámica',
          'FC >120 lpm sin compensar',
        ],
        monitoring: ['FC (riesgo de taquicardia)', 'TAS', 'Ritmo cardíaco', 'Diuresis', 'Lactato'],
        phases: ['shock_inotropicos'],
        hfContexts: ['shock'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'milrinone-hf',

        kind: 'drug',

        drugId: 'milrinone',

        indicationId: 'ind-hf',
        name: 'Milrinona',
        role: 'alternative',
        loadOrStart: 'Bolo 25–75 µg/kg IV en 10–20 min (omitir en hipotensión)',
        maintenance: '0,375–0,75 µg/kg/min',
        maximum: '0,75 µg/kg/min',
        when: 'Inodilatador (inotrópico + vasodilatador). Útil en bajo gasto con resistencia elevada o en pacientes con betabloqueantes a dosis plenas. Ajuste renal necesario.',
        avoid: [
          'TAS <85 mmHg sin vasopresor',
          'Obstrucción subaórtica dinámica',
          'Arritmias ventriculares activas',
        ],
        monitoring: ['TAS (vasodilatación)', 'Ritmo', 'Cr (ajustar en IRC)'],
        phases: ['shock_inotropicos'],
        hfContexts: ['shock'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'epinephrine-hf',

        kind: 'drug',

        drugId: 'epinephrine',

        indicationId: 'ind-hf',
        name: 'Adrenalina',
        role: 'rescue',
        loadOrStart: '0,05–0,1 µg/kg/min IV; titular',
        maintenance: '0,1–0,5 µg/kg/min',
        maximum: '1 µg/kg/min',
        when: 'Shock cardiogénico refractario. Alta potencia vasopresora e inotrópica. Mayor riesgo de taquiarritmias e isquemia.',
        avoid: [
          'FC >130 lpm sin control',
          'Sin monitoreo invasivo disponible',
        ],
        monitoring: ['FC (riesgo de taquicardia y FV)', 'TAS invasiva recomendada', 'Lactato'],
        phases: ['shock_inotropicos'],
        hfContexts: ['shock'],
        sources: [ESC_HF],
        verified: false,
      },
      {
        id: 'vasopressin-hf',

        kind: 'drug',

        drugId: 'vasopressin',

        indicationId: 'ind-hf',
        name: 'Vasopresina',
        role: 'add_on',
        loadOrStart: '0,01–0,03 U/min IV fija (no titular como dosis principal)',
        maintenance: '0,01–0,04 U/min',
        maximum: '0,04 U/min',
        when: 'Vasopresión sin efecto inotrópico. Agrega efecto vasopresor puro cuando noradrenalina es insuficiente; puede reducir la dosis de catecolaminas.',
        avoid: [
          'Sin hipotensión',
          'Cardiopatía isquémica activa (vasoespasmo coronario posible)',
        ],
        monitoring: ['TAS', 'Diuresis', 'Sodio (efecto V2)'],
        phases: ['shock_inotropicos'],
        hfContexts: ['shock'],
        sources: [ESC_HF],
        verified: false,
      },
      {
        id: 'levosimendan-hf',

        kind: 'drug',

        drugId: 'levosimendan',

        indicationId: 'ind-hf',
        name: 'Levosimendán',
        role: 'alternative',
        loadOrStart: '6–12 µg/kg IV en 10 min (opcional; puede omitirse en hipotensión)',
        maintenance: '0,05–0,2 µg/kg/min × 24 h (infusión única)',
        maximum: '0,2 µg/kg/min',
        when: 'Inotrópico sensibilizador de calcio. Mejora hemodinamia sin aumentar consumo de O₂. Útil si hay betabloqueantes. Efecto persiste hasta 7–9 días. Disponibilidad local variable.',
        avoid: [
          'TAS <85 mmHg (bolo contraindicado)',
          'FC >120 lpm sin control',
          'IR grave (ClCr <30): con cautela',
          'QTc >500 ms',
        ],
        monitoring: ['TAS cada 15 min durante bolo', 'FC (vasodilatación → taquicardia refleja)', 'K (hipoK frecuente)'],
        phases: ['shock_inotropicos', 'compensado'],
        hfContexts: ['shock', 'stabilization'],
        sources: [
          ESC_HF,
          { label: 'SURVIVE trial · JAMA 2007', url: 'https://jamanetwork.com/journals/jama/fullarticle/208948' },
        ],
        verified: false,
      },
    ],
  },

  // ─── 5. GDMT — IECA / ARA-II / ARNI ────────────────────────────────────────
  {
    id: 'raas',
    title: '5. GDMT — IECA / ARA-II / ARNI',
    subtitle: 'Modificadores de pronóstico en FEVIr; elegir uno',
    selectionMode: 'one',
    options: [
      {
        id: 'sacubitril-valsartan-hf',

        kind: 'drug',

        drugId: 'sacubitril-valsartan',

        indicationId: 'ind-hf',
        name: 'Sacubitrilo/Valsartán',
        role: 'preferred',
        loadOrStart: '24/26 mg c/12 h (titular desde mínima dosis)',
        maintenance: '49/51 → 97/103 mg c/12 h según tolerancia',
        maximum: '97/103 mg c/12 h',
        when: 'GDMT de primera línea en FEVIr (FEVI ≤40%). Superior a enalapril en mortalidad (PARADIGM-HF). Iniciar ≥36 h después de suspender IECA.',
        avoid: [
          'Angioedema previo a IECA o ARNI',
          'Uso conjunto con IECA (esperar ≥36 h)',
          'K ≥5,5 mEq/L',
          'TAS <90 mmHg',
          'eGFR <30 mL/min/1,73m² (usar con cautela)',
          'Embarazo',
        ],
        monitoring: ['K, Cr al inicio, a las 2 semanas y luego periódico', 'TAS', 'Angioedema'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced'],
        sources: [
          ESC_HF,
          AHA_HF,
          { label: 'PARADIGM-HF · NEJM 2014', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1409077' },
        ],
        verified: false,
      },
      {
        id: 'enalapril-hf',

        kind: 'drug',

        drugId: 'enalapril',

        indicationId: 'ind-hf',
        name: 'Enalapril',
        role: 'alternative',
        loadOrStart: '2,5 mg c/12 h VO',
        maintenance: '5–10 mg c/12 h',
        maximum: '20 mg c/12 h',
        when: 'IECA en FEVIr si ARNI no disponible, no tolerado o contraindicado. Evidencia de base (CONSENSUS, SOLVD).',
        avoid: [
          'K ≥5 mEq/L sin reevaluar',
          'TAS <90 mmHg',
          'Angioedema previo a IECA',
          'ClCr <10 mL/min',
          'Embarazo',
        ],
        monitoring: ['K, Cr a las 1–2 semanas del inicio', 'TAS', 'Tos seca'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'ramipril-hf',

        kind: 'drug',

        drugId: 'ramipril',

        indicationId: 'ind-hf',
        name: 'Ramipril',
        role: 'alternative',
        loadOrStart: '1,25–2,5 mg c/12–24 h VO',
        maintenance: '5 mg c/12 h',
        maximum: '10 mg c/12 h',
        when: 'IECA alternativo en FEVIr o post-IAM con disfunción sistólica (AIRE).',
        avoid: ['K ≥5 mEq/L', 'TAS <90 mmHg', 'Angioedema', 'Embarazo'],
        monitoring: ['K, Cr', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF, { label: 'AIRE trial 1993', url: 'https://www.thelancet.com/journals/lancet/article/PII0140-6736(93)92585-N/abstract' }],
        verified: false,
      },
      {
        id: 'lisinopril-hf',

        kind: 'drug',

        drugId: 'lisinopril',

        indicationId: 'ind-hf',
        name: 'Lisinopril',
        role: 'alternative',
        loadOrStart: '2,5–5 mg/día VO',
        maintenance: '20–35 mg/día',
        maximum: '35 mg/día',
        when: 'IECA alternativo en FEVIr (ATLAS). Útil si hay dificultad con dosis c/12 h.',
        avoid: ['K ≥5 mEq/L', 'TAS <90 mmHg', 'Angioedema', 'Embarazo'],
        monitoring: ['K, Cr', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF],
        verified: false,
      },
      {
        id: 'losartan-hf',

        kind: 'drug',

        drugId: 'losartan',

        indicationId: 'ind-hf',
        name: 'Losartán',
        role: 'alternative',
        loadOrStart: '25–50 mg/día VO',
        maintenance: '50–100 mg/día',
        maximum: '150 mg/día',
        when: 'ARA-II en FEVIr si intolerancia a IECA por tos. No de primera línea si ARNI disponible.',
        avoid: ['K ≥5 mEq/L', 'TAS <90 mmHg', 'Uso simultáneo con IECA o ARNI', 'Embarazo'],
        monitoring: ['K, Cr', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF],
        verified: false,
      },
      {
        id: 'valsartan-hf',

        kind: 'drug',

        drugId: 'valsartan',

        indicationId: 'ind-hf',
        name: 'Valsartán',
        role: 'alternative',
        loadOrStart: '40 mg c/12 h VO',
        maintenance: '80–160 mg c/12 h',
        maximum: '160 mg c/12 h',
        when: 'ARA-II en FEVIr si intolerancia a IECA. Evidencia en Val-HeFT. No combinar con IECA ni ARNI.',
        avoid: ['K ≥5 mEq/L', 'TAS <90 mmHg', 'Uso simultáneo con IECA', 'Embarazo'],
        monitoring: ['K, Cr', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF],
        verified: false,
      },
    ],
  },

  // ─── 6. GDMT — Betabloqueantes ──────────────────────────────────────────────
  {
    id: 'betablockers_hf',
    title: '6. GDMT — Betabloqueantes',
    subtitle: 'NO iniciar en shock o descompensación activa; elegir uno',
    selectionMode: 'one',
    options: [
      {
        id: 'carvedilol-hf',

        kind: 'drug',

        drugId: 'carvedilol',

        indicationId: 'ind-hf',
        name: 'Carvedilol',
        role: 'preferred',
        loadOrStart: '3,125 mg c/12 h VO',
        maintenance: 'Titular cada 2 semanas hasta 25 mg c/12 h (6,25 si >85 kg)',
        maximum: '25 mg c/12 h (50 mg c/12 h si >85 kg)',
        when: 'GDMT en FEVIr estabilizado (FEVI ≤40%). Bloqueante α y β. Evidencia en COPERNICUS, US Carvedilol. Iniciar con FC ≥60 y TAS ≥90.',
        avoid: [
          'Shock cardiogénico o descompensación activa con hipoperfusión',
          'Bradicardia (FC <55 lpm)',
          'BAV 2°–3° sin marcapaso',
          'Broncoespasmo grave',
          'TAS <90 mmHg',
        ],
        monitoring: ['FC', 'TAS', 'Síntomas de retención hídrica al iniciar'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'bisoprolol-hf',

        kind: 'drug',

        drugId: 'bisoprolol',

        indicationId: 'ind-hf',
        name: 'Bisoprolol',
        role: 'preferred',
        loadOrStart: '1,25 mg/día VO',
        maintenance: 'Titular hasta 10 mg/día',
        maximum: '10 mg/día',
        when: 'GDMT en FEVIr. Beta-1 selectivo; más conveniente en EPOC leve-moderado. Evidencia CIBIS-II.',
        avoid: [
          'Shock o descompensación con hipoperfusión',
          'FC <55 lpm',
          'BAV 2°–3° sin marcapaso',
          'Asma grave',
          'TAS <90 mmHg',
        ],
        monitoring: ['FC', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced', 'fevi_mid'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
      {
        id: 'metoprolol-succinate-hf',

        kind: 'drug',

        drugId: 'metoprolol',

        indicationId: 'ind-hf',
        name: 'Metoprolol succinato',
        role: 'preferred',
        loadOrStart: '12,5–25 mg/día VO',
        maintenance: 'Titular hasta 200 mg/día',
        maximum: '200 mg/día',
        when: 'GDMT en FEVIr. Beta-1 selectivo de liberación prolongada. Evidencia MERIT-HF. No reemplazar por metoprolol tartrato (formulación diferente).',
        avoid: [
          'Shock o descompensación',
          'FC <55 lpm',
          'BAV sin marcapaso',
          'Asma grave',
          'TAS <90 mmHg',
        ],
        monitoring: ['FC', 'TAS'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced', 'fevi_mid'],
        sources: [ESC_HF, AHA_HF],
        verified: false,
      },
    ],
  },

  // ─── 7. GDMT — ARM ──────────────────────────────────────────────────────────
  {
    id: 'mra',
    title: '7. GDMT — Antagonistas mineralocorticoides (ARM)',
    subtitle: 'FEVIr; evitar si K ≥5 mEq/L o eGFR <30',
    selectionMode: 'one',
    options: [
      {
        id: 'spironolactone-hf',

        kind: 'drug',

        drugId: 'spironolactone',

        indicationId: 'ind-hf',
        name: 'Espironolactona',
        role: 'preferred',
        loadOrStart: '12,5–25 mg/día VO',
        maintenance: '25–50 mg/día',
        maximum: '50 mg/día (dosis mayores no aportan beneficio y elevan riesgo de hiperK)',
        when: 'GDMT en FEVIr (FEVI ≤35%). Evidencia en RALES. Reducción de mortalidad y hospitalización.',
        avoid: [
          'K ≥5 mEq/L',
          'eGFR <30 mL/min/1,73m² (riesgo de hiperpotasemia grave)',
          'Uso simultáneo con IECA + ARA-II',
          'Ginecomastia severa (considerar eplerenona)',
        ],
        monitoring: ['K, Cr a las 1–2 semanas del inicio y periódico', 'Ginecomastia'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced'],
        sources: [ESC_HF, AHA_HF, { label: 'RALES · NEJM 1999', url: 'https://www.nejm.org/doi/10.1056/NEJM199909023411001' }],
        verified: false,
      },
      {
        id: 'eplerenone-hf',

        kind: 'drug',

        drugId: 'eplerenone',

        indicationId: 'ind-hf',
        name: 'Eplerenona',
        role: 'alternative',
        loadOrStart: '25 mg/día VO',
        maintenance: '25–50 mg/día',
        maximum: '50 mg/día',
        when: 'ARM en FEVIr o post-IAM con disfunción (EPHESUS). Preferir si ginecomastia con espironolactona.',
        avoid: [
          'K ≥5 mEq/L',
          'eGFR <30 mL/min/1,73m²',
          'Inhibidores potentes de CYP3A4 (ketoconazol, itraconazol)',
        ],
        monitoring: ['K, Cr', 'Interacciones CYP3A4'],
        phases: [...stablePhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced'],
        sources: [ESC_HF, { label: 'EPHESUS · NEJM 2003', url: 'https://www.nejm.org/doi/10.1056/NEJMoa030207' }],
        verified: false,
      },
    ],
  },

  // ─── 8. GDMT — iSGLT2 ──────────────────────────────────────────────────────
  {
    id: 'sglt2i',
    title: '8. GDMT — inhibidores SGLT2',
    subtitle: 'Todas las FEVI; iniciar precoz en IC aguda estabilizada',
    selectionMode: 'one',
    options: [
      {
        id: 'dapagliflozin-hf',

        kind: 'drug',

        drugId: 'dapagliflozin',

        indicationId: 'ind-hf',
        name: 'Dapagliflozina',
        role: 'preferred',
        loadOrStart: '10 mg/día VO',
        maintenance: '10 mg/día',
        maximum: '10 mg/día',
        when: 'GDMT en todas las FEVI con IC (DAPA-HF, DELIVER). Puede iniciarse durante hospitalización si paciente estabilizado y eGFR ≥20. Efecto diurético + protección cardiorrenal.',
        avoid: [
          'eGFR <20 mL/min/1,73m²',
          'Diálisis',
          'DM tipo 1',
          'Infección urinaria o genital activa',
        ],
        monitoring: ['eGFR periódico', 'Candidiasis / ITU', 'TAS (efecto diurético suave)'],
        phases: [...allPhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced', 'fevi_mid', 'fevi_preserved'],
        sources: [
          ESC_HF,
          AHA_HF,
          { label: 'DAPA-HF · NEJM 2019', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1911303' },
          { label: 'DELIVER · NEJM 2022', url: 'https://www.nejm.org/doi/10.1056/NEJMoa2207181' },
        ],
        verified: false,
      },
      {
        id: 'empagliflozin-hf',

        kind: 'drug',

        drugId: 'empagliflozin',

        indicationId: 'ind-hf',
        name: 'Empagliflozina',
        role: 'preferred',
        loadOrStart: '10 mg/día VO',
        maintenance: '10 mg/día',
        maximum: '10 mg/día',
        when: 'GDMT en todas las FEVI (EMPEROR-Reduced, EMPEROR-Preserved). Equivalente a dapagliflozina en IC.',
        avoid: [
          'eGFR <20 mL/min/1,73m²',
          'Diálisis',
          'DM tipo 1',
        ],
        monitoring: ['eGFR periódico', 'Candidiasis / ITU'],
        phases: [...allPhases],
        hfContexts: ['stabilization', 'optimization', 'fevi_reduced', 'fevi_mid', 'fevi_preserved'],
        sources: [
          ESC_HF,
          { label: 'EMPEROR-Reduced · NEJM 2020', url: 'https://www.nejm.org/doi/10.1056/NEJMoa2022190' },
          { label: 'EMPEROR-Preserved · NEJM 2021', url: 'https://www.nejm.org/doi/10.1056/NEJMoa2107038' },
        ],
        verified: false,
      },
    ],
  },

  // ─── 9. Alternativas / Agregados ────────────────────────────────────────────
  {
    id: 'alternatives_addons',
    title: '9. Alternativas y agregados',
    subtitle: 'Indicaciones específicas — no para todos',
    selectionMode: 'conditional',
    options: [
      {
        id: 'hydralazine-isdn-hf',

        kind: 'drug',

        drugId: 'hydralazine-isdn',

        indicationId: 'ind-hf',
        name: 'Hidralazina/Dinitrato',
        role: 'alternative',
        loadOrStart: 'Hidralazina 25 mg c/8 h + DNIS 20 mg c/8 h VO',
        maintenance: 'Hidralazina 75 mg c/8 h + DNIS 40 mg c/8 h',
        maximum: 'Hidralazina 300 mg/día + DNIS 120 mg/día',
        when: 'Alternativa en FEVIr si intolerancia o contraindicación a IECA/ARA-II/ARNI. Especialmente en pacientes de raza negra (AHeFT). Evitar en etnia sin IECA si no está contraindicado.',
        avoid: [
          'TAS <90 mmHg',
          'Lupus eritematoso sistémico',
          'Taquicardia no controlada (hidralazina)',
        ],
        monitoring: ['TAS', 'Cefalea', 'Flushing', 'Náuseas'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF, AHA_HF, { label: 'AHeFT · NEJM 2004', url: 'https://www.nejm.org/doi/10.1056/NEJMoa042934' }],
        verified: false,
      },
      {
        id: 'ivabradine-hf',

        kind: 'drug',

        drugId: 'ivabradine',

        indicationId: 'ind-hf',
        name: 'Ivabradina',
        role: 'add_on',
        loadOrStart: '5 mg c/12 h VO',
        maintenance: '7,5 mg c/12 h si tolerada',
        maximum: '7,5 mg c/12 h',
        when: 'Agregado en FEVIr (FEVI ≤35%) en ritmo sinusal con FC ≥70 lpm a pesar de betabloqueante a dosis máxima tolerada o si betabloqueante contraindicado. Evidencia SHIFT.',
        avoid: [
          'FA o flutter auricular',
          'BAV 2°–3°',
          'FC <60 lpm',
          'TAS <90 mmHg',
          'Marcapaso dependiente',
        ],
        monitoring: ['FC (objetivo 55–60 lpm)', 'Fosfenos (efecto visual transitorio)'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF, { label: 'SHIFT · Lancet 2010', url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(10)61198-1/abstract' }],
        verified: false,
      },
      {
        id: 'digoxin-hf',

        kind: 'drug',

        drugId: 'digoxin',

        indicationId: 'ind-hf',
        name: 'Digoxina',
        role: 'add_on',
        loadOrStart: '0,125–0,25 mg/día VO (sin carga de rutina en IC crónica)',
        maintenance: '0,0625–0,25 mg/día (ajustar por función renal y edad)',
        maximum: '0,25 mg/día (niveles objetivo: 0,5–0,9 ng/mL)',
        when: 'Reducción de hospitalizaciones en FEVIr en ritmo sinusal refractario (DIG trial). Útil también en FA para control de frecuencia. Margen terapéutico estrecho.',
        avoid: [
          'BAV 2°–3° sin marcapaso',
          'Síndrome de preexcitación',
          'Hipopotasemia (potencia toxicidad)',
          'IRC grave sin ajuste de dosis',
        ],
        monitoring: ['Niveles séricos (0,5–0,9 ng/mL)', 'K (hipoK potencia toxicidad)', 'Cr (ajuste renal)', 'ECG'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [ESC_HF, { label: 'DIG trial · NEJM 1997', url: 'https://www.nejm.org/doi/10.1056/NEJM199702203360801' }],
        verified: false,
      },
      {
        id: 'vericiguat-hf',

        kind: 'drug',

        drugId: 'vericiguat',

        indicationId: 'ind-hf',
        name: 'Vericiguat',
        role: 'add_on',
        loadOrStart: '2,5 mg/día VO',
        maintenance: 'Titular a 5 → 10 mg/día cada 2 semanas según tolerancia',
        maximum: '10 mg/día',
        when: 'Estimulante del GMPc. En FEVIr de alto riesgo con empeoramiento reciente (hospitalización o aumento de diuréticos). Evidencia VICTORIA 2020.',
        avoid: [
          'TAS <90 mmHg',
          'Uso conjunto con inhibidores de PDE5 o riociguat',
          'Embarazo',
        ],
        monitoring: ['TAS', 'Síntomas de hipotensión'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced'],
        sources: [
          ESC_HF,
          { label: 'VICTORIA · NEJM 2020', url: 'https://www.nejm.org/doi/10.1056/NEJMoa1915928' },
        ],
        verified: false,
      },
      {
        id: 'iv-iron-hf',

        kind: 'drug',

        drugId: 'iv-iron',

        indicationId: 'ind-hf',
        name: 'Hierro IV (ferrocarboximaltosa)',
        role: 'add_on',
        loadOrStart: 'Dosis según déficit (fórmula de Ganzoni) o 500–1000 mg IV en dosis única/dividida',
        maintenance: 'Reevaluar ferritina/TSAT a los 3 meses',
        maximum: 'Según déficit calculado',
        when: 'Déficit de hierro (ferritina <100 ng/mL o 100–299 ng/mL con TSAT <20%) en IC con FEVIr o FEVIm sintomática. Mejora calidad de vida y capacidad funcional (AFFIRM-AHF, HEART-FID). Disponibilidad local variable.',
        avoid: [
          'Hierro suficiente (ferritina ≥300 ng/mL y TSAT ≥20%)',
          'Anemia no ferropénica sin diagnóstico (excluir causa)',
          'Infección activa sistémica',
        ],
        monitoring: ['Ferritina y TSAT (antes y a los 3 meses)', 'Reacción infusional (primeros 15 min)'],
        phases: [...stablePhases],
        hfContexts: ['optimization', 'fevi_reduced', 'fevi_mid'],
        sources: [
          ESC_HF,
          { label: 'AFFIRM-AHF · Lancet 2020', url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)32220-6/abstract' },
        ],
        verified: false,
      },
    ],
  },
];

export const hfTherapyOptionCount = hfTherapyGroups.reduce(
  (total, group) => total + group.options.length,
  0,
);
