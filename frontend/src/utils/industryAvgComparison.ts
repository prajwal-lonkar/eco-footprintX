/**
 * Industry Benchmark Comparison Utility
 */

export type BenchmarkStatus = 'higher' | 'similar' | 'lower' | null;

export interface BenchmarkingData {
  benchmarkingLciaMethodology?: string;
  carbonBenchmarkingData?: number;
  waterBenchmarkingData?: number;
  landBenchmarkingData?: number;
  _id?: string;
}

export type ImpactCategory = 'CARBON' | 'WATER' | 'LAND';

/**
 * Threshold for comparison (20%)
 * - Higher: value > benchmark * 1.2
 * - Similar: benchmark * 0.8 <= value <= benchmark * 1.2
 * - Lower: value < benchmark * 0.8
 */
const THRESHOLD_PERCENTAGE = 0.2;

/**
 * Compares the user's value against the industry benchmark for a given category.
 *
 * @param value - The user-entered value (as string or number)
 * @param benchmarkValue - The industry benchmark value
 * @returns BenchmarkStatus - 'higher' | 'similar' | 'lower' | null
 */
export const compareWithBenchmark = (
  value: string | number | undefined | null,
  benchmarkValue: number | undefined | null
): BenchmarkStatus => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Return null if either value is invalid
  if (
    numericValue === undefined ||
    numericValue === null ||
    isNaN(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  if (
    benchmarkValue === undefined ||
    benchmarkValue === null ||
    isNaN(benchmarkValue) ||
    benchmarkValue <= 0
  ) {
    return null;
  }

  const lowerBound = benchmarkValue * (1 - THRESHOLD_PERCENTAGE);
  const upperBound = benchmarkValue * (1 + THRESHOLD_PERCENTAGE);

  if (numericValue > upperBound) {
    return 'higher';
  } else if (numericValue < lowerBound) {
    return 'lower';
  } else {
    return 'similar';
  }
};

/**
 * Gets the benchmark value for a specific impact category.
 *
 * @param category - The impact category (CARBON, WATER, LAND)
 * @param benchmarkingData - The benchmarking data object
 * @returns The benchmark value or undefined
 */
export const getBenchmarkValueForCategory = (
  category: ImpactCategory,
  benchmarkingData: BenchmarkingData | undefined | null
): number | undefined => {
  if (!benchmarkingData) return undefined;

  switch (category) {
    case 'CARBON':
      return benchmarkingData.carbonBenchmarkingData;
    case 'WATER':
      return benchmarkingData.waterBenchmarkingData;
    case 'LAND':
      return benchmarkingData.landBenchmarkingData;
    default:
      return undefined;
  }
};

/**
 * Gets the status label text for display.
 *
 * @param status - The benchmark status
 * @returns The display text
 */
export const getBenchmarkStatusLabel = (
  status: BenchmarkStatus
): string | null => {
  switch (status) {
    case 'higher':
      return 'Higher impact than industry average';
    case 'similar':
      return 'Similar impact as industry average';
    case 'lower':
      return 'Lower impact than industry average';
    default:
      return null;
  }
};
