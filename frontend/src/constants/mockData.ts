export const unitOptions = [
  { value: 'g', label: 'Grams (g)', labelShort: 'g' },
  { value: 'kg', label: 'Kilograms (kg)', labelShort: 'kg' },
  { value: 't', label: 'Metric Tonnes (t)', labelShort: 't' },
  { value: 'oz', label: 'Ounces (oz)', labelShort: 'oz' },
  { value: 'lb', label: 'Pounds (lb)', labelShort: 'lb' },
  { value: 'ml', label: 'Millilitres (ml)', labelShort: 'ml' },
  { value: 'l', label: 'Litres (l)', labelShort: 'l' },
  { value: 'fl oz', label: 'Fluid Ounces (fl oz)', labelShort: 'fl oz' },
  { value: 'other', label: 'Other', labelShort: 'Other' },
];

export const KG_G_UNITS = ['kg', 'g'] as const;

export const INDUSTRY_OPTIONS = [
  'Transportation and storage',
  'Mining and quarrying',
  'Agriculture, forestry and fishing',
  'Manufacturing',
  'Electricity, gas, steam and air conditioning supply',
  'Water supply; sewerage, waste management and remediation activities',
  'Construction',
  'Wholesale and retail trade; repair of motor vehicles and motorcycles',
  'Accommodation and food service activities',
  'Information and communication',
  'Professional, scientific and technical activities',
  'Administrative and support service activities',
] as const;

export const dataSourceOptions = [
  { label: 'Enter Manually', value: 'manual' },
  { label: 'Use our Database', value: 'database' },
];

export const lciaOptions = [
  { label: 'TRACI', value: 'TRACI' },
  { label: 'ReCIPe', value: 'ReCIPe' },
  { label: 'CML', value: 'CML' },
  { label: 'EF', value: 'EF' },
];

export const API_ERROR_CODES = {
  USER_ACCOUNT_BLOCKED: "USER_ACCOUNT_BLOCKED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  PRODUCT_ALREADY_EXISTS: "PRODUCT_ALREADY_EXISTS",
};