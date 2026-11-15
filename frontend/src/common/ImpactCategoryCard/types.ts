import type { ReactNode } from 'react';

export type ImpactCategoryType = 'carbon' | 'water' | 'land';

export type ImpactCardSource = 'product' | 'component' | 'supplier';

export const DATASOURSE = {
  DATABASE:'database',
  MANUAL:'manual',
  SUPPLIER: 'supplier',
}

export const IMPACT_CATEGORY_STATUSES = {
  GREY: 'grey',
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  BLUE: 'blue',
} as const;

export type ImpactCategoryStatus =
  (typeof IMPACT_CATEGORY_STATUSES)[keyof typeof IMPACT_CATEGORY_STATUSES];

export const ImpactCategoryCardState = {
  NO_DATA: 'NO_DATA',
  NO_IMPACT: 'NO_IMPACT',
  IN_PROGRESS: 'IN_PROGRESS',
  GENERAL: 'GENERAL',
} as const;

export type ImpactCategoryCardState =
  (typeof ImpactCategoryCardState)[keyof typeof ImpactCategoryCardState];

// CTA model - discriminated union
export type CtaConfig =
  | {
      type: 'primary-button';
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }
  | {
      type: 'secondary-button';
      label: string;
      disabled?: boolean;
    }
  | {
      type: 'ternary-button';
      label: string;
      onClick: () => void;
    }
  | { type: 'label'; text: string };

// General state payload
export interface GeneralStatePayload {
  categoryIcon?: string;
  impactValue: string | number;
  impactUnit?: string;
  lciaMethod?: string;
  dataSource?: string;
  hideDataSourceFooter?: boolean;
  progressValue?: number;
  progressLabel?: ImpactProgressLabel;
  hideWarningBadge?: boolean;
  isTemporaryData?: boolean;
  hideTemporaryInfoMessage?: boolean;
  reserveTemporaryDataSpace?: boolean;
  dataUploadedBy?: string;
  offsetQuantity?: number;
  offsetUnit?: string;
  offsetCarbonImpact?: boolean;
  reserveOffsetSpace?: boolean;
  footerContent?: ReactNode;
}

// Discriminated union for props by state
export type ImpactCategoryCardProps =
  | {
      categoryType: ImpactCategoryType;
      source: ImpactCardSource;
      cardState: 'NO_DATA';
      cta?: CtaConfig | CtaConfig[];
    }
  | {
      categoryType: ImpactCategoryType;
      source: ImpactCardSource;
      cardState: 'NO_IMPACT';
      cta?: CtaConfig | CtaConfig[];
      dataUploadedBy?: string;
      categoryIcon?: string;
      footerContent?: ReactNode;
    }
  | {
      categoryType: ImpactCategoryType;
      source: ImpactCardSource;
      cardState: 'IN_PROGRESS';
      impactValue?: string | number;
      impactUnit?: string;
      lciaMethod?: string;
      dataSource?: string;
      cta?: CtaConfig | CtaConfig[];
    }
  | {
      categoryType: ImpactCategoryType;
      source: ImpactCardSource;
      cardState: 'GENERAL';
      general: GeneralStatePayload;
      cta?: CtaConfig | CtaConfig[];
    };

export type ImpactComparison = 'more' | 'less' | 'similar';
export type ImpactCardColor = 'green' | 'yellow' | 'red' | 'blue';

export interface ImpactProgressLabel {
  category: ImpactCategoryType;
  percentage: number; // 0–100
  comparison: ImpactComparison;
  referenceName: string; // product category / component / service name
  cardColor?: ImpactCardColor;
}

export interface ImpactValue {
  value: number;
  unit: string;
  isImpactPresent?: boolean;
  isDataInputInProgress?: boolean;
  averageComparison?: string;
  canPublish?: boolean;
}

export interface ProductImpactSummaryData {
  productId: string;
  publishStatus: string;
  productName?: string;
  productCategory?: string;
  impactCategoryPublishStatus: Record<ImpactCategoryType, boolean>;
  impactBenchMarking?: Partial<Record<ImpactCategoryType, number>> & {
    metadata?: unknown;
  };
  impactSummary: Record<ImpactCategoryType, ImpactValue>;
}

export interface PendingSupplierSubmission {
  versionNumber?: number;
  quantity?: number | null;
  unit?: string | null;
  lciaMethodology?: string | null;
  tempQuantity?: number | null;
  tempUnit?: string | null;
  tempLciaMethodology?: string | null;
  isImpactPresent?: boolean;
  dataSource?: string | null;
  offsetCarbonImpact?: boolean;
  offsetQuantity?: number | null;
  offsetUnit?: string | null;
  averageComparison?: string | null;
}

export type ImpactCategoryItemWithPending<T extends object> = T & {
  hasPendingSupplierSubmission?: boolean;
  pendingSupplierSubmission?: PendingSupplierSubmission | null;
};
