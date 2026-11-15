import type { ImpactCategoryType, ImpactProgressLabel } from '@common/ImpactCategoryCard/types';

export type { ImpactCategoryType, ImpactProgressLabel };

export const ConsumerImpactCardState = {
  GENERAL: 'GENERAL',
  NO_IMPACT: 'NO_IMPACT',
} as const;

export type ConsumerImpactCardState =
  (typeof ConsumerImpactCardState)[keyof typeof ConsumerImpactCardState];

export interface ConsumerGeneralPayload {
  impactValue: string | number;
  impactUnit?: string;
  progressValue?: number;
  progressLabel?: ImpactProgressLabel;
}

export type ConsumerImpactCategoryCardProps =
  | {
      categoryType: ImpactCategoryType;
      cardState: 'GENERAL';
      general: ConsumerGeneralPayload;
      tooltip?: string;
      tooltipIcon?: string;
    }
  | {
      categoryType: ImpactCategoryType;
      cardState: 'NO_IMPACT';
      tooltip?: string;
    };
