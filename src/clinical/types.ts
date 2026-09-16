import type { InfusionDoseUnit } from '../engine/infusion';

export interface ClinicalSource { title: string; url: string; year: string }
export interface ClinicalEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  summary: string;
  sourceIds: string[];
  reviewedAt: string;
  validation: 'pending-local-review';
}
export interface ClinicalPathway extends ClinicalEntry {
  urgent: boolean;
  first: string;
  checks: string[];
  avoid: string;
  drugIds: string[];
}
export interface DrugEntry extends ClinicalEntry {
  doses: { context: string; text: string; sourceId: string }[];
  precautions: string;
  monitoring: string;
  infusionUnit?: InfusionDoseUnit;
  renalRuleIds?: string[];
}
