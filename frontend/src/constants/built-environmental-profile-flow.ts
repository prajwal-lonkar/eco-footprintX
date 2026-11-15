export const BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS = {
  INTRODUCTION: 1,
  COMPLETE_SUPPLIER_DETAILS: 2,
  ADD_INDUSTRY_BENCHMARKING: 3,
  ADD_IMPACT_CATEGORY: 4,
  SUMMARY: 5,
} as const;
export const BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS = {
  OVERVIEW: 1,
  CARBON: 2,
  WATER: 3,
  LAND: 4,
} as const;
export const BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS = {
  INTRODUCTION: 1,
  ADD_IMPACT_CATEGORY: 2,
  SUMMARY: 3,
} as const;
export const BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS = {
  CARBON: 1,
  WATER: 2,
  LAND: 3,
} as const;
export type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS;
const CONTRACT_NUMERIC_FIELDS_ARRAY = [
  'filling.volumePerUnit',
  'mixing.volumePerUnit',
  'heating.volumePerUnit',

  'homogenising.volumePerUnit',
  'cooling.volumePerUnit',

  'fermenting.volumePerUnit',
  'packaging.volumePerUnit',
] as const;

const CONTRACT_UNIT_FIELDS_ARRAY = [
  'filling.volumeUnit',
  'mixing.volumeUnit',
  'heating.volumeUnit',
  'homogenising.volumeUnit',
  'cooling.volumeUnit',
  'fermenting.volumeUnit',
  'packaging.volumeUnit',
] as const;

export const CONTRACT_NUMERIC_FIELDS = new Set(CONTRACT_NUMERIC_FIELDS_ARRAY);

export const CONTRACT_UNIT_FIELDS = new Set(CONTRACT_UNIT_FIELDS_ARRAY);

export const NUMERIC_FIELDS = new Set([
  'netWeight',
  'transportNetWeight',
  'packagingNetWeight',
  'volumePerSku',
  'floorAreaPerSku',
  ...CONTRACT_NUMERIC_FIELDS_ARRAY,
]);

export const INTEGER_FIELDS = new Set(['storageDays', 'labelling.numberOfLabels']);

export const UNIT_FIELDS = new Set([
  'unitOfMeasurement',
  'transportUnitOfMeasurement',
  'packagingUnitOfMeasurement',
  ...CONTRACT_UNIT_FIELDS_ARRAY,
]);

export const TEMPERATURE_FIELDS = new Set([
  'heating.currentTemperature',
  'heating.targetTemperature',
  'cooling.currentTemperature',
  'cooling.targetTemperature',
]);
