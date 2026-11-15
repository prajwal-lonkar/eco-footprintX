import { describe, expect, it } from 'vitest';
import { parseAverageComparison } from '@utils/parseAverageComparision';

describe('parseAverageComparison', () => {
  it('parses negative percentages like -89%', () => {
    const parsed = parseAverageComparison('-89%', 'Carbon', 'Battery');

    expect(parsed).not.toBeNull();
    expect(parsed?.comparison).toBe('less');
    expect(parsed?.cardColor).toBe('green');
    expect(parsed?.labelBold).toBe('89% less carbon');
  });

  it('parses positive percentages like +50%', () => {
    const parsed = parseAverageComparison('+50%', 'Water', 'Battery');

    expect(parsed).not.toBeNull();
    expect(parsed?.comparison).toBe('more');
    expect(parsed?.cardColor).toBe('red');
    expect(parsed?.labelBold).toBe('50% more water');
  });

  it('parses 0% as similar', () => {
    const parsed = parseAverageComparison('0%', 'Land', 'Battery');

    expect(parsed).not.toBeNull();
    expect(parsed?.comparison).toBe('similar');
    expect(parsed?.cardColor).toBe('yellow');
    expect(parsed?.labelBold).toBe('Similar');
  });

  it('clamps out-of-range values to progress bar edges', () => {
    const high = parseAverageComparison('+250%', 'Carbon');
    const low = parseAverageComparison('-250%', 'Carbon');

    expect(high?.dotPosition).toBe(100);
    expect(low?.dotPosition).toBe(0);
  });

  it('returns null for invalid strings', () => {
    expect(parseAverageComparison('abc', 'Carbon')).toBeNull();
    expect(parseAverageComparison('50', 'Carbon')).toBeNull();
    expect(parseAverageComparison('%50', 'Carbon')).toBeNull();
    expect(parseAverageComparison('+-50%', 'Carbon')).toBeNull();
  });

  it('handles "No benchmarking value available for comparison"', () => {
    const parsed = parseAverageComparison(
      'No benchmarking value available for comparison',
      'Carbon'
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.noBenchmark).toBe(true);
    expect(parsed?.comparison).toBe('similar');
    expect(parsed?.cardColor).toBe('blue');
    expect(parsed?.bgColor).toBe('#EFF3FE');
  });
});
