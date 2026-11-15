const superscriptByExponent: Record<string, string> = {
  '2': '²',
  '3': '³',
};

export const formatUnitForDisplay = (unit: string): string => {
  return unit
    .replace(/\bCO2\b/g, 'CO₂')
    .replace(/\bm([23])\b/g, (_match, exponent: string) => {
      const superscript = superscriptByExponent[exponent] ?? exponent;
      return `m${superscript}`;
    });
};
