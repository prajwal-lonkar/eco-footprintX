export const FLOW_STEPS = {
  INTRODUCTION: 1,
  ADD_COMPONENT_OR_SERVICE: 2,
  SELECT_SUPPLIER_WITH_ROLE: 3,
  ADD_SUPPLIER_DETAILS: 4,
  SUMMARY: 5,
} as const;

export const SUPPLIER_ROLE_NAMES = {
  RAW_MATERIALS_SUPPLIER_AND_PROCESSOR: 'Raw Material Suppliers and Processors',
  TRANSPORT_AND_FREIGHT: 'Transport and Freight',
  STORAGE_AND_FULFILMENT: 'Storage & Fulfillment',
  PACKAGING_MANUFACTURER_AND_PROCESSOR: 'Packaging Manufacturers & Processors',
  CPG_BRAND: 'CPG Brand',
  RETAILER: 'Retailer',
  CONTRACT_MANUFACTURER: 'Contract Manufacturer',
} as const;

export const SUPPLIER_ROLE_SLUGS = {
  RAW_MATERIALS_SUPPLIER_AND_PROCESSOR: 'rawMaterialSupplier',
  TRANSPORT_AND_FREIGHT: 'transportFreight',
  STORAGE_AND_FULFILMENT: 'storageFulfilment',
  PACKAGING_MANUFACTURER_AND_PROCESSOR: 'packagingManufacturer',
  CPG_BRAND: 'cpgBrand',
  RETAILER: 'retailer',
  CONTRACT_MANUFACTURER: 'contractManufacturer',
} as const;

export const TRANSPORT_METHOD_LABELS = {
  train: 'Train',
  aircraft: 'Aircraft',
  'light commercial vehicle': 'Light Commercial Vehicle',
  lorry: 'Lorry',
  sea: 'Sea',
} as const;

export type TransportMethod = keyof typeof TRANSPORT_METHOD_LABELS;

export const TRANSPORT_METHODS = Object.keys(
  TRANSPORT_METHOD_LABELS
) as TransportMethod[];

export const MANUFACTURING_ACTIVITY_TYPES: Record<string, string> = {
  filling: 'Filling',
  mixing: 'Mixing',
  homogenising: 'Homogenising',
  labelling: 'Labeling',
  heating: 'Heating',
  cooling: 'Cooling',
  fermenting: 'Fermenting',
  packaging: 'Packing',
};

export const MANUFACTURING_ACTIVITY_TYPE_LIST = Object.keys(
  MANUFACTURING_ACTIVITY_TYPES
) as string[];

export const SUPPLIER_ROLE_LABEL_BY_SLUG: Record<string, string> = {
  [SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR]:
    SUPPLIER_ROLE_NAMES.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR,
  [SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT]:
    SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT,
  [SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT]:
    SUPPLIER_ROLE_NAMES.STORAGE_AND_FULFILMENT,
  [SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR]:
    SUPPLIER_ROLE_NAMES.PACKAGING_MANUFACTURER_AND_PROCESSOR,
  [SUPPLIER_ROLE_SLUGS.CPG_BRAND]: SUPPLIER_ROLE_NAMES.CPG_BRAND,
  [SUPPLIER_ROLE_SLUGS.RETAILER]: SUPPLIER_ROLE_NAMES.RETAILER,
  [SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER]:
    SUPPLIER_ROLE_NAMES.CONTRACT_MANUFACTURER,
};

