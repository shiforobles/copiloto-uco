/**
 * Motor de auditoría de seguridad transversal.
 *
 * Función pura: toma SessionState y devuelve SafetyAuditResult con 4 bloques.
 * - receives: medicamentos activos relevantes
 * - missing: tratamientos/profilaxis ausentes
 * - caution: precauciones, interacciones, valores de laboratorio límite
 * - avoid: combinaciones o fármacos a evitar / contraindicados
 *
 * La ausencia de datos NUNCA se interpreta como normalidad.
 * Todas las reglas son verified: false hasta revisión médica.
 */

import type { SessionState } from '../context/session';
import { OPTION_TO_DRUG_MAP } from '../context/session';
import { getTraceableRenalContext } from '../engine/renal';
import { CANONICAL_DRUGS, type DrugId } from '../data/canonical-drugs';
import type { SafetyAuditResult, SafetyFinding } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++_idCounter}`;

function finding(
  prefix: string,
  message: string,
  severity: SafetyFinding['severity'],
  category: SafetyFinding['category'],
): SafetyFinding {
  return { id: nextId(prefix), message, severity, category };
}

interface RenalCtx {
  clcr?: number;
  egfr?: number;
}

function getRenalCtx(state: SessionState): RenalCtx {
  const t = getTraceableRenalContext(state);
  return {
    clcr: t.clcrCockcroftGault ?? undefined,
    egfr: t.egfrCkdEpi2021 ?? undefined,
  };
}

// IDs de anticoagulantes en la matriz combinada
const ALL_ANTICOAG_IDS = [
  'apixaban-af', 'rivaroxaban-af', 'dabigatran-af', 'edoxaban-af', 'warfarin-af',
  'ufh-af', 'enoxaparin-af',
  'ufh', 'enoxaparin-sca', 'fondaparinux-sca', 'bivalirudin-sca',
];

const ALL_ANTIPLATELET_IDS = ['aas', 'clopidogrel', 'ticagrelor', 'prasugrel'];

const NEPHROTOXIC_IDS = [
  'nsaid', 'aminoglycoside', 'vancomycin', 'contrast', 'amphotericin',
  'acyclovir-high', 'cisplatin',
];

const GI_IBP_IDS = ['omeprazole', 'esomeprazole', 'pantoprazole', 'lansoprazole'];

// ─── Módulos de auditoría ─────────────────────────────────────────────────────

/** TEV: profilaxis cuando no hay anticoagulación terapéutica */
function auditTEV(
  state: SessionState,
  renal: RenalCtx,
  receives: SafetyFinding[],
  missing: SafetyFinding[],
  caution: SafetyFinding[],
  _avoid: SafetyFinding[],
) {
  const hasTherapeuticAnticoag = state.selectedTherapyOptionIds.some((id) => ALL_ANTICOAG_IDS.includes(id));

  if (hasTherapeuticAnticoag) {
    receives.push(finding('tev', 'Anticoagulación terapéutica marcada → cubre profilaxis TEV.', 'info', 'tev_prophylaxis'));
    return;
  }

  if (state.activeBleed === true) {
    caution.push(finding('tev', 'Sangrado activo: profilaxis farmacológica TEV contraindicada; evaluar medidas mecánicas.', 'avoid', 'tev_prophylaxis'));
    return;
  }
  if (state.activeBleed === null) {
    missing.push(finding('tev-bleed', 'Sangrado activo: dato no registrado. Confirmar antes de indicar profilaxis TEV.', 'info', 'tev_prophylaxis'));
  }

  // Hospitalización en UCO → riesgo TEV aumentado
  missing.push(finding('tev', 'Profilaxis TEV: ¿se indicó anticoagulación profiláctica o mecánica? (paciente hospitalizado en UCO).', 'caution', 'tev_prophylaxis'));

  if (renal.egfr !== undefined && renal.egfr < 30) {
    caution.push(finding('tev', `eGFR ${renal.egfr.toFixed(1)}: HNF subcutánea o ajuste de HBPM para profilaxis TEV.`, 'caution', 'tev_prophylaxis'));
  }

  if (state.dialysis === true) {
    caution.push(finding('tev', 'Diálisis: HNF sin ajuste preferida para profilaxis TEV.', 'caution', 'tev_prophylaxis'));
  }
}

/** Protección gástrica basada en riesgo */
function auditGIProtection(
  state: SessionState,
  receives: SafetyFinding[],
  missing: SafetyFinding[],
  caution: SafetyFinding[],
) {
  const hasIBP = state.selectedTherapyOptionIds.some((id) => GI_IBP_IDS.includes(id));
  const hasAntiplatelet = state.selectedTherapyOptionIds.some((id) => ALL_ANTIPLATELET_IDS.includes(id));
  const hasAnticoag = state.selectedTherapyOptionIds.some((id) => ALL_ANTICOAG_IDS.includes(id));
  const dualAntiplatelet = state.selectedTherapyOptionIds.filter((id) => ALL_ANTIPLATELET_IDS.includes(id)).length >= 2;
  const highAge = state.age !== null && state.age >= 65;

  const riskFactors = [
    hasAntiplatelet,
    hasAnticoag,
    dualAntiplatelet,
    highAge,
    state.activeBleed === true,  // sólo cuenta si está CONFIRMADO
  ].filter(Boolean).length;

  if (hasIBP) {
    receives.push(finding('gi', 'IBP marcado como medicación actual.', 'info', 'gi_protection'));
    // Verificar interacción clopidogrel-IBP
    if (state.selectedTherapyOptionIds.includes('clopidogrel')) {
      const badIBP = state.selectedTherapyOptionIds.filter((id) => ['omeprazole', 'esomeprazole'].includes(id));
      if (badIBP.length > 0) {
        caution.push(finding('gi', 'Clopidogrel + omeprazol/esomeprazol: interacción CYP2C19 reduce efecto antiagregante. Preferir pantoprazol.', 'avoid', 'interaction'));
      }
    }
    return;
  }

  if (riskFactors >= 2) {
    missing.push(finding('gi', `${riskFactors} factores de riesgo GI (antiagregante, anticoagulante, edad ≥65, sangrado): considerar IBP (preferir pantoprazol si clopidogrel).`, 'caution', 'gi_protection'));
  } else if (riskFactors === 1 && dualAntiplatelet) {
    missing.push(finding('gi', 'Doble antiagregación: evaluar IBP para gastroprotección.', 'caution', 'gi_protection'));
  }
}

/** Electrolitos */
function auditElectrolytes(
  state: SessionState,
  caution: SafetyFinding[],
  avoid: SafetyFinding[],
  missing: SafetyFinding[],
) {
  // Potasio
  if (state.potassium === null) {
    missing.push(finding('k', 'K no registrado: necesario para decisiones sobre ARM, IECA, digoxina.', 'info', 'electrolytes'));
  } else if (state.potassium >= 5.5) {
    avoid.push(finding('k', `K ${state.potassium} mEq/L: hiperpotasemia grave — evitar/suspender ARM, IECA, ARNI, ARA-II hasta corregir.`, 'avoid', 'electrolytes'));
  } else if (state.potassium >= 5.0) {
    caution.push(finding('k', `K ${state.potassium} mEq/L: hiperpotasemia moderada — precaución con ARM, IECA, ARNI; no iniciar hasta corregir.`, 'caution', 'electrolytes'));
  } else if (state.potassium < 3.5) {
    caution.push(finding('k', `K ${state.potassium} mEq/L: hipopotasemia — corregir antes de usar diuréticos de asa o digoxina.`, 'caution', 'electrolytes'));
  } else if (state.potassium < 4.0) {
    caution.push(finding('k', `K ${state.potassium} mEq/L: K en rango bajo-normal; vigilar si recibe diuréticos o tiene arritmias.`, 'info', 'electrolytes'));
  }

  // Magnesio
  if (state.magnesium === null) {
    missing.push(finding('mg', 'Mg no registrado: hipomagnesemia favorece arritmias y dificulta corrección del K.', 'info', 'electrolytes'));
  } else if (state.magnesium < 1.7) {
    caution.push(finding('mg', `Mg ${state.magnesium} mEq/L: hipomagnesemia — reponer Mg antes o junto con K.`, 'caution', 'electrolytes'));
  }

  // QTc
  if (state.qtcMs === null) {
    missing.push(finding('qtc', 'QTc no registrado: necesario para evaluar antiarrítmicos y otras drogas que alargan el QT.', 'info', 'cardiac'));
  } else if (state.qtcMs > 500) {
    avoid.push(finding('qtc', `QTc ${state.qtcMs} ms: >500 ms — evitar amiodarona, flecainida, propafenona, haloperidol, azitromicina y otros que alargan el QT.`, 'avoid', 'cardiac'));
  } else if (state.qtcMs > 450) {
    caution.push(finding('qtc', `QTc ${state.qtcMs} ms: prolongado — precaución con fármacos que alargan el QT.`, 'caution', 'cardiac'));
  }
}

/** Laboratorio hematológico */
function auditHematology(
  state: SessionState,
  caution: SafetyFinding[],
  avoid: SafetyFinding[],
  missing: SafetyFinding[],
) {
  // Hemoglobina
  if (state.hemoglobin === null) {
    missing.push(finding('hb', 'Hb no registrada: importante si hay anticoagulación o riesgo de sangrado.', 'info', 'labvalue'));
  } else if (state.hemoglobin < 7) {
    avoid.push(finding('hb', `Hb ${state.hemoglobin} g/dL: anemia grave — evaluar transfusión y suspender antiagregantes/anticoagulantes en sangrado activo.`, 'avoid', 'bleeding'));
  } else if (state.hemoglobin < 10) {
    caution.push(finding('hb', `Hb ${state.hemoglobin} g/dL: anemia moderada — vigilar sangrado activo y tolerar anticoagulación con cautela.`, 'caution', 'bleeding'));
  }

  // Plaquetas
  if (state.platelets === null) {
    missing.push(finding('plt', 'Plaquetas no registradas: necesario si hay anticoagulación o trombocitopenia sospechada.', 'info', 'labvalue'));
  } else if (state.platelets < 50) {
    avoid.push(finding('plt', `Plaquetas ${state.platelets}k: trombocitopenia grave — contraindicación relativa para anticoagulación y antiagregación.`, 'avoid', 'bleeding'));
  } else if (state.platelets < 100) {
    caution.push(finding('plt', `Plaquetas ${state.platelets}k: trombocitopenia moderada — precaución con anticoagulación.`, 'caution', 'bleeding'));
  }
}

/** Sangrado activo */
function auditBleed(
  state: SessionState,
  missing: SafetyFinding[],
  _caution: SafetyFinding[],
  avoid: SafetyFinding[],
) {
  if (state.activeBleed === null) {
    // Dato no registrado: no asumir ausencia
    missing.push(finding('bleed-unknown', 'Sangrado activo: dato no registrado. Confirmar para evaluar riesgo hemodinámico y suspensión de anticoagulación.', 'caution', 'bleeding'));
    return;
  }
  if (!state.activeBleed) return;


  avoid.push(finding('bleed', 'Sangrado activo: anticoagulación y antiagregación deben reevaluarse urgentemente. Suspender salvo que riesgo isquémico > hemorrágico.', 'avoid', 'bleeding'));

  if (state.selectedTherapyOptionIds.some((id) => ALL_ANTICOAG_IDS.includes(id))) {
    avoid.push(finding('bleed-ac', 'Anticoagulante marcado + sangrado activo: evaluar suspensión y antídoto disponible.', 'contraindicated', 'bleeding'));
  }
}

/** Nefrotoxicidad */
function auditRenal(
  state: SessionState,
  renal: RenalCtx,
  caution: SafetyFinding[],
  avoid: SafetyFinding[],
  missing: SafetyFinding[],
) {
  if (renal.egfr === undefined && renal.clcr === undefined) {
    missing.push(finding('renal', 'Función renal no calculable: ingresar edad, sexo, peso y creatinina para evaluar ajuste de dosis y nefrotóxicos.', 'info', 'renal'));
    return;
  }

  const fnLabel = renal.egfr !== undefined ? `eGFR ${renal.egfr.toFixed(1)}` : `ClCr ${renal.clcr!.toFixed(1)}`;

  if (state.aki === true) {
    caution.push(finding('aki', `AKI en curso + ${fnLabel}: evitar AINE, contraste no urgente, aminoglucósidos; ajustar ACOD.`, 'avoid', 'renal'));
  } else if (state.aki === null) {
    missing.push(finding('aki-unknown', 'AKI: dato no registrado — evaluar si hay deterioro renal agudo.', 'info', 'renal'));
  }

  const hasNephrotoxic = state.selectedTherapyOptionIds.some((id) => NEPHROTOXIC_IDS.includes(id));
  if (hasNephrotoxic) {
    caution.push(finding('nephro', `${fnLabel}: nefrotóxico detectado — monitorizar Cr diariamente.`, 'caution', 'renal'));
  }

  const fnValue = renal.egfr ?? renal.clcr;
  if (fnValue !== undefined && fnValue < 30) {
    // ARM
    const hasARM = state.selectedTherapyOptionIds.some((id) => ['spironolactone-hf', 'eplerenone-hf', 'eplerenone', 'spironolactone'].includes(id));
    if (hasARM) {
      avoid.push(finding('arm-renal', `${fnLabel}: ARM marcado + función renal <30 → riesgo grave de hiperpotasemia. Reevaluar indicación.`, 'avoid', 'renal'));
    }

    // Dabigatrán
    if (state.selectedTherapyOptionIds.includes('dabigatran-af')) {
      avoid.push(finding('dabig-renal', `${fnLabel}: dabigatrán contraindicado (ClCr/eGFR <30).`, 'contraindicated', 'renal'));
    }
  }
}

/** Duplicaciones */
function auditDuplications(
  state: SessionState,
  caution: SafetyFinding[],
  avoid: SafetyFinding[],
) {
  const selectedAnticoags = state.selectedTherapyOptionIds.filter((id) => ALL_ANTICOAG_IDS.includes(id));
  if (selectedAnticoags.length >= 2) {
    avoid.push(finding('dup-ac', `Duplicación: ${selectedAnticoags.join(' + ')} — dos anticoagulantes simultáneos. Revisar indicación urgentemente.`, 'avoid', 'duplication'));
  }

  // Doble antiagregación + anticoagulante = triple terapia
  const selectedAntiplatelets = state.selectedTherapyOptionIds.filter((id) => ALL_ANTIPLATELET_IDS.includes(id));
  if (selectedAntiplatelets.length >= 2 && selectedAnticoags.length >= 1) {
    avoid.push(finding('triple', `Triple terapia: ${selectedAntiplatelets.join(' + ')} + anticoagulante. Alto riesgo hemorrágico. Minimizar duración.`, 'avoid', 'duplication'));
  }

  // Clopidogrel + omeprazol/esomeprazol (ya cubierto en GI, aquí sólo warning adicional si hay)
  if (
    state.selectedTherapyOptionIds.includes('clopidogrel') &&
    state.selectedTherapyOptionIds.some((id) => ['omeprazole', 'esomeprazole'].includes(id))
  ) {
    caution.push(finding('clopi-ibp', 'Clopidogrel + omeprazol/esomeprazol: interacción CYP2C19. Cambiar a pantoprazol.', 'avoid', 'interaction'));
  }

  // IECA + ARA-II (doble bloqueo RAAS)
  const hasIECA = state.selectedTherapyOptionIds.some((id) => ['enalapril-hf', 'ramipril-hf', 'lisinopril-hf', 'enalapril', 'ramipril', 'lisinopril'].includes(id));
  const hasARAII = state.selectedTherapyOptionIds.some((id) => ['losartan-hf', 'valsartan-hf', 'losartan', 'valsartan'].includes(id));
  if (hasIECA && hasARAII) {
    avoid.push(finding('raas-dup', 'IECA + ARA-II: doble bloqueo RAAS no recomendado en IC (riesgo de hiperpotasemia e hipotensión sin beneficio adicional).', 'avoid', 'duplication'));
  }

  // Detección de duplicación de clase farmacológica
  const drugsByClass = new Map<string, Set<DrugId>>();
  for (const optId of state.selectedTherapyOptionIds) {
    const drugId = OPTION_TO_DRUG_MAP[optId];
    if (drugId && CANONICAL_DRUGS[drugId]) {
      const classId = CANONICAL_DRUGS[drugId].classId;
      const set = drugsByClass.get(classId) || new Set<DrugId>();
      set.add(drugId);
      drugsByClass.set(classId, set);
    }
  }

  // Betabloqueantes simultáneos (dos principios activos betabloqueantes distintos)
  const bbSet = drugsByClass.get('betablocker');
  if (bbSet && bbSet.size >= 2) {
    const names = [...bbSet].map((d) => CANONICAL_DRUGS[d]?.name || d);
    avoid.push(
      finding(
        'dup-class-bb',
        `Duplicación de clase (betabloqueantes): ${names.join(' + ')} — dos betabloqueantes simultáneos no recomendados.`,
        'avoid',
        'duplication',
      ),
    );
  }

  // ARM simultáneos
  const mraSet = drugsByClass.get('mra');
  if (mraSet && mraSet.size >= 2) {
    const names = [...mraSet].map((d) => CANONICAL_DRUGS[d]?.name || d);
    avoid.push(
      finding(
        'dup-class-mra',
        `Duplicación de clase (ARM): ${names.join(' + ')} — dos antagonistas mineralocorticoides simultáneos no recomendados.`,
        'avoid',
        'duplication',
      ),
    );
  }
}

/** Válvulas mecánicas y estenosis mitral reumática vs ACOD */
function auditValves(state: SessionState, avoid: SafetyFinding[]) {
  const doacIds = ['apixaban-af', 'rivaroxaban-af', 'dabigatran-af', 'edoxaban-af'];
  const hasDOAC = state.selectedTherapyOptionIds.some((id) => doacIds.includes(id));
  if (hasDOAC) {
    if (state.mechanicalValve === true) {
      avoid.push(
        finding(
          'mech-valve-doac',
          'Prótesis valvular mecánica: los ACOD están estrictamente CONTRAINDICADOS (ensayo RE-ALIGN). Requiere anticoagulación con warfarina / AVK.',
          'contraindicated',
          'cardiac',
        ),
      );
    }
    if (state.rheumaticMitralStenosis === true) {
      avoid.push(
        finding(
          'rheum-ms-doac',
          'Estenosis mitral reumática moderada-severa: los ACOD están contraindicados o no recomendados (ensayo INVICTUS). Requiere warfarina.',
          'avoid',
          'cardiac',
        ),
      );
    }
  }
}

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * Ejecuta la auditoría de seguridad transversal.
 * El resultado tiene 4 bloques y puede estar parcialmente vacío si faltan datos.
 */
export function runSafetyAudit(state: SessionState): SafetyAuditResult {
  // Resetear contador para resultados reproducibles
  _idCounter = 0;

  const receives: SafetyFinding[] = [];
  const missing: SafetyFinding[] = [];
  const caution: SafetyFinding[] = [];
  const avoid: SafetyFinding[] = [];

  const renal = getRenalCtx(state);

  // Módulos
  auditTEV(state, renal, receives, missing, caution, avoid);
  auditGIProtection(state, receives, missing, caution);
  auditElectrolytes(state, caution, avoid, missing);
  auditHematology(state, caution, avoid, missing);
  auditBleed(state, missing, caution, avoid);

  auditRenal(state, renal, caution, avoid, missing);
  auditDuplications(state, caution, avoid);
  auditValves(state, avoid);

  return { receives, missing, caution, avoid };
}
