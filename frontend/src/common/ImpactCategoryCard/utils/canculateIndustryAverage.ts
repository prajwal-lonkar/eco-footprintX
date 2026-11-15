export const getIndustryAveragePercentage = (
  benchmarkValue: number,
  actualValue: number
): number => {
  if (benchmarkValue === 0) {
    if (actualValue === 0) return 0;
    if (actualValue > 0) return 100;
    return -100;
  }

  const percentage = ((actualValue - benchmarkValue) / benchmarkValue) * 100;

  return Number(percentage.toFixed(0));
};

export const mapComparisonFromPercentage = (
  percentage: number
): 'less' | 'more' | 'similar' => {
  if (percentage < 0) return 'less';
  if (percentage > 0) return 'more';
  return 'similar';
};

export const getDotPositionFromPercentage = (percentage: number): number => {
  return Math.min(100, Math.max(0, 50 + percentage / 2));
};