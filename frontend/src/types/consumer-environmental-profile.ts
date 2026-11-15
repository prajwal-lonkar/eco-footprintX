import type { ImpactCategories } from './supplier';

export interface RecycleInstruction {
  component: string;
  instructions: string;
  _id: string;
}

export interface ConsumerImpactMetric {
  value: number;
  unit: string;
  isImpactPresent: boolean;
  dataSource?: string;
}

export interface ConsumerImpactSummary {
  carbon?: ConsumerImpactMetric;
  water?: ConsumerImpactMetric;
  land?: ConsumerImpactMetric;
}

export interface ImpactBenchMarkingMetric {
  value: number;
  unit: string;
  calculationSteps: string;
  sources: string[];
}

export interface ImpactBenchMarkingMetadata {
  carbonEmissions: ImpactBenchMarkingMetric;
  waterUsage: ImpactBenchMarkingMetric;
  landUse: ImpactBenchMarkingMetric;
  wasteGeneration: ImpactBenchMarkingMetric;
}

export interface ImpactBenchMarking {
  carbon: number;
  water: number;
  land: number;
  metadata: ImpactBenchMarkingMetadata;
}

export interface ConsumerEnvironmentalProfileProduct {
  _id: string;
  isActive: boolean;
  createdBy: string;
  deletedAt: string | null;
  deletedBy: string | null;
  comment: string | null;
  name: string;
  internalSku: string;
  gstin: number;
  netSize: number;
  unit: string;
  customUnit: string;
  category: string;
  batchNumber: string;
  description: string;
  companyId: string;
  image: string;
  publishStatus: string;
  recycleInstructions: RecycleInstruction[];
  impactCategoryPublishStatus: ImpactCategories;
  createdAt: string;
  updatedAt: string;
  __v: number;
  impactSummary: ConsumerImpactSummary;
  impactBenchMarking?: ImpactBenchMarking;
}


