import type { ImpactCategoryType, ImpactProgressLabel } from '../types';

const verbMap: Record<ImpactCategoryType, string> = {
  carbon: 'emissions generated',
  water: 'used',
  land: 'used',
};

export function formatImpactProgressLabel(data: ImpactProgressLabel): {
  boldText: string;
  regularText: string;
} {
  if (data.comparison === 'similar') {
    return {
      boldText: `Similar ${data.category}`,
      regularText: `${verbMap[data.category]} compared to the average ${data.referenceName}`,
    };
  }

  return {
    boldText: `${data.percentage}% ${data.comparison} ${data.category}`,
    regularText: `${verbMap[data.category]} than the average ${data.referenceName}`,
  };
}
