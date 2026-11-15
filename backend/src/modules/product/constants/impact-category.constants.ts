export const IMPACT_CATEGORIES = ['carbon', 'water', 'land'] as const;

export type ImpactCategory = (typeof IMPACT_CATEGORIES)[number];
