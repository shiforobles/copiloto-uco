import { clinicalSources } from './sources';
import type { ClinicalSource } from './types';

export const scaReview = { reviewedAt: '2026-09-27', validation: 'pending-local-review' as const };
// Agregado independiente: no cambia las fuentes ni el estado del módulo DAPT congelado.
export const scaSources: Record<string, ClinicalSource> = {
  ...clinicalSources,
  scaNice: { title: 'NICE NG185 · SCA, prevención secundaria y rehabilitación', year: '2020; consulta 2026', url: 'https://www.nice.org.uk/guidance/NG185/chapter/recommendations' },
  fondaparinux: { title: 'AEMPS · Arixtra 2,5 mg: SCA y función renal', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/02206003/FT_02206003.html' },
  bivalirudin: { title: 'DailyMed · Bivalirudina: PCI y ajuste renal', year: 'Consulta 2026', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=af943fa0-ab0f-4b62-9ff0-54ee24cdb772' },
  rosuvastatin: { title: 'AEMPS · Rosuvastatina: dosis y contraindicaciones', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/80273/FT_80273.html' },
  ezetimibe: { title: 'AEMPS · Ezetimiba 10 mg', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/78507/FT_78507.html' },
  carvedilol: { title: 'AEMPS · Carvedilol: IC estable', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/66923/FichaTecnica_66923.html' },
  metoprolol: { title: 'DailyMed · Metoprolol succinato de liberación prolongada', year: 'Consulta 2026', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=6588d77c-090f-4722-9c91-437887d4624a' },
  ramipril: { title: 'AEMPS · Ramipril: posinfarto, IC y función renal', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/90367/FT_90367.html' },
  valsartan: { title: 'AEMPS · Valsartán: posinfarto', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/70323/FT_70323.html' },
  eplerenone: { title: 'AEMPS · Eplerenona: posinfarto, K y función renal', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/76240/FT_76240.html' },
  ppiClopidogrel: { title: 'NHS SPS · Clopidogrel e inhibidores de bomba de protones', year: '2023; consulta 2026', url: 'https://sps.nhs.uk/articles/using-clopidogrel-with-proton-pump-inhibitors-ppis/' },
  pantoprazole: { title: 'AEMPS · Pantoprazol 20 mg', year: 'Consulta 2026', url: 'https://cima.aemps.es/cima/dochtml/ft/70025/FT_70025.html' },
  scaNitro: { title: 'DailyMed · Nitroglicerina IV: inicio y titulación', year: 'Consulta 2026', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7b98d1fc-44b2-08a1-e053-2991aa0af3ab' },
};
