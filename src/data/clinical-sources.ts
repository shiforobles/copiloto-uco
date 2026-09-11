/**
 * Registro canónico de fuentes clínicas primarias y regulatorias.
 *
 * Fuente única de procedencia para todas las reglas, matrices y regímenes.
 * Toda regla o recomendación debe apuntar a una fuente de este registro.
 *
 * Ninguna regla cambia automáticamente a verified: true.
 * Requiere validación médica institucional.
 */

export type SourceId =
  | 'acc_aha_2023_af'
  | 'esc_2024_af'
  | 'esc_2021_hf'
  | 'esc_2023_hf_update'
  | 'aha_acc_hfsa_2022_hf'
  | 'esc_2023_acs'
  | 'ema_eliquis_epar'
  | 'ema_xarelto_epar'
  | 'ema_pradaxa_epar'
  | 'ema_lixiana_epar'
  | 'anmat_vademecum'
  | 'fda_drug_label'
  | 'soap_ii_nejm_2010';

export interface ClinicalSource {
  sourceId: SourceId | string;
  organization: string;
  title: string;
  year: number;
  url: string;
  jurisdiction: 'global' | 'eu' | 'us' | 'ar' | 'institutional';
  type: 'guideline' | 'drug_label' | 'consensus' | 'clinical_trial' | 'protocol';
  accessedDate: string;
  licenseNote?: string;
  supersedesVersion?: string;
}

export const CLINICAL_SOURCES: Record<string, ClinicalSource> = {
  acc_aha_2023_af: {
    sourceId: 'acc_aha_2023_af',
    organization: 'ACC/AHA/ACCP/HRS',
    title: '2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation',
    year: 2023,
    url: 'https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001193',
    jurisdiction: 'us',
    type: 'guideline',
    accessedDate: '2026-09-07',
    supersedesVersion: 'AHA/ACC/HRS 2019 AF Focused Update',
  },
  esc_2024_af: {
    sourceId: 'esc_2024_af',
    organization: 'ESC / EACTS',
    title: '2024 ESC Guidelines for the management of atrial fibrillation',
    year: 2024,
    url: 'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/',
    jurisdiction: 'eu',
    type: 'guideline',
    accessedDate: '2026-09-07',
    supersedesVersion: 'ESC 2020 AF Guidelines',
  },
  esc_2021_hf: {
    sourceId: 'esc_2021_hf',
    organization: 'ESC',
    title: '2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure',
    year: 2021,
    url: 'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Acute-and-Chronic-Heart-Failure',
    jurisdiction: 'eu',
    type: 'guideline',
    accessedDate: '2026-09-07',
  },
  esc_2023_hf_update: {
    sourceId: 'esc_2023_hf_update',
    organization: 'ESC',
    title: '2023 Focused Update of the 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure',
    year: 2023,
    url: 'https://academic.oup.com/eurheartj/article/44/37/3627/7246294',
    jurisdiction: 'eu',
    type: 'guideline',
    accessedDate: '2026-09-07',
  },
  aha_acc_hfsa_2022_hf: {
    sourceId: 'aha_acc_hfsa_2022_hf',
    organization: 'AHA / ACC / HFSA',
    title: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
    year: 2022,
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063',
    jurisdiction: 'us',
    type: 'guideline',
    accessedDate: '2026-09-07',
  },
  esc_2023_acs: {
    sourceId: 'esc_2023_acs',
    organization: 'ESC',
    title: '2023 ESC Guidelines for the management of acute coronary syndromes',
    year: 2023,
    url: 'https://academic.oup.com/eurheartj/article/44/38/3720/7246293',
    jurisdiction: 'eu',
    type: 'guideline',
    accessedDate: '2026-09-07',
    supersedesVersion: 'ESC 2020 NSTE-ACS & 2017 STEMI Guidelines',
  },
  ema_eliquis_epar: {
    sourceId: 'ema_eliquis_epar',
    organization: 'EMA',
    title: 'Eliquis (apixaban) European Public Assessment Report (EPAR) / Summary of Product Characteristics',
    year: 2023,
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/eliquis',
    jurisdiction: 'eu',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  ema_xarelto_epar: {
    sourceId: 'ema_xarelto_epar',
    organization: 'EMA',
    title: 'Xarelto (rivaroxaban) European Public Assessment Report (EPAR) / Summary of Product Characteristics',
    year: 2023,
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/xarelto',
    jurisdiction: 'eu',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  ema_pradaxa_epar: {
    sourceId: 'ema_pradaxa_epar',
    organization: 'EMA',
    title: 'Pradaxa (dabigatran etexilate) European Public Assessment Report (EPAR) / Summary of Product Characteristics',
    year: 2023,
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/pradaxa',
    jurisdiction: 'eu',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  ema_lixiana_epar: {
    sourceId: 'ema_lixiana_epar',
    organization: 'EMA',
    title: 'Lixiana (edoxaban) European Public Assessment Report (EPAR) / Summary of Product Characteristics',
    year: 2023,
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/lixiana',
    jurisdiction: 'eu',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  anmat_vademecum: {
    sourceId: 'anmat_vademecum',
    organization: 'ANMAT',
    title: 'Vademécum Nacional de Medicamentos / Fichas Técnicas Oficiales',
    year: 2024,
    url: 'https://www.argentina.gob.ar/anmat/regulados/medicamentos',
    jurisdiction: 'ar',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  fda_drug_label: {
    sourceId: 'fda_drug_label',
    organization: 'US FDA',
    title: 'FDA Online Label Repository (Drugs@FDA)',
    year: 2024,
    url: 'https://labels.fda.gov/',
    jurisdiction: 'us',
    type: 'drug_label',
    accessedDate: '2026-09-07',
  },
  soap_ii_nejm_2010: {
    sourceId: 'soap_ii_nejm_2010',
    organization: 'SOAP II Investigators',
    title: 'Comparison of Dopamine and Norepinephrine in the Treatment of Shock (SOAP II)',
    year: 2010,
    url: 'https://www.nejm.org/doi/10.1056/NEJMoa0907118',
    jurisdiction: 'global',
    type: 'clinical_trial',
    accessedDate: '2026-09-07',
  },
};

export function getClinicalSource(sourceId: string): ClinicalSource | undefined {
  return CLINICAL_SOURCES[sourceId];
}
