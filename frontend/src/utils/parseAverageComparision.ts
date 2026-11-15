export type ComparisonType = 'less' | 'more' | 'similar';

export type CardColor = 'green' | 'yellow' | 'red' | 'blue';

export interface ParsedComparison {
  noBenchmark: boolean;
  percentage: number;
  dotPosition: number;
  comparison: ComparisonType;
  cardColor: CardColor;
  labelBold: string;
  labelRegular: string;
  bgColor: string;
}

export const NO_BENCHMARK_LABEL_BOLD =
  'Industry average comparison unavailable -';
export const NO_BENCHMARK_LABEL_REGULAR =
  'benchmarking data for this component or service is missing';

const VERB_MAP: Record<string, string> = {
  Carbon: 'carbon emissions generated',
  Water: 'water used',
  Land: 'land size used',
};

/**
 * Card colour rules (from acceptance criteria):
 *
 *  Green  — value < -20%  (less than industry average by 20%)
 *  Yellow — value between -20% and +20% (within 20% of industry average)
 *  Red    — value > +20%  (higher than industry average by 20%)
 *  Blue   — no benchmarking data available
 */
function getCardColor(numericValue: number): CardColor {
  if (numericValue <= -20) return 'green';
  if (numericValue >= 20) return 'red';
  return 'yellow';
}

const CARD_BG_MAP: Record<CardColor, string> = {
  green: '#EAFBF5',
  yellow: '#FDEED3',
  red: '#FFEFED',
  blue: '#EFF3FE',
};

/**
 * Parses API `averageComparison` values such as:
 *  - legacy format: "-89%", "+50%", "0%"
 *  - current format: "17% Similar", "42% More", "8% Less"
 *
 * The returned `dotPosition` is mapped on a centered axis:
 *  -100% => 0 (left end), 0 => 50 (center), +100% => 100 (right end).
 * Values outside [-100, 100] are clamped to the ends.
 *
 * Background colour is determined by the ±20% threshold (see getCardColor).
 */
export function parseAverageComparison(
  raw: string | undefined,
  categoryTitle: string,
  componentName?: string
): ParsedComparison | null {
  if (!raw) return null;

  if (raw === 'No benchmarking value available for comparison') {
    return {
      noBenchmark: true,
      percentage: 0,
      dotPosition: 0,
      comparison: 'similar',
      cardColor: 'blue',
      labelBold: NO_BENCHMARK_LABEL_BOLD,
      labelRegular: NO_BENCHMARK_LABEL_REGULAR,
      bgColor: CARD_BG_MAP.blue,
    };
  }

  const valueWithWordMatch = raw.match(
    /^([+-]?\d+(?:\.\d+)?)%\s+(Similar|More|Less)$/i
  );
  const valueOnlyMatch = raw.match(/^([+-]?\d+(?:\.\d+)?)%$/);
  const match = valueWithWordMatch ?? valueOnlyMatch;
  if (!match) return null;

  const numericValue = parseFloat(match[1]);
  const absPercent = Math.round(Math.abs(numericValue));
  // Keep original value for label text (e.g. 728%), do not clamp.
  const percentage = absPercent;

  const explicitComparison = valueWithWordMatch?.[2]?.toLowerCase() as
    | ComparisonType
    | undefined;
  const comparison: ComparisonType =
    explicitComparison ??
    (numericValue < 0 ? 'less' : numericValue > 0 ? 'more' : 'similar');

  const signedValueForScale =
    comparison === 'less'
      ? -Math.abs(numericValue)
      : comparison === 'more'
        ? Math.abs(numericValue)
        : 0;
  const clampedSignedValue = Math.max(-100, Math.min(100, signedValueForScale));
  const dotPosition = ((clampedSignedValue + 100) / 200) * 100;
  const colorAnchorValue =
    comparison === 'less' ? -absPercent : comparison === 'more' ? absPercent : 0;

  const verb = VERB_MAP[categoryTitle] ?? 'impact';
  const cardColor = getCardColor(colorAnchorValue);
  const bgColor = CARD_BG_MAP[cardColor];

  const labelBold =
    comparison === 'similar'
      ? 'Similar'
      : `${percentage}% ${comparison} ${categoryTitle.toLowerCase()}`;

  const labelRegular =
    comparison === 'similar'
      ? componentName
        ? `${verb} compared to the average ${componentName}`
        : `${verb} compared to the average`
      : componentName
        ? `${verb} than the average ${componentName}`
        : `${verb} than the average`;

  return {
    noBenchmark: false,
    percentage,
    dotPosition,
    comparison,
    cardColor,
    labelBold,
    labelRegular,
    bgColor,
  };
}
