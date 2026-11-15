import type {
  RawMaterialSupplierDetails,
  ContractManufacturerDetails,
  TransportFreightDetails,
  StorageFulfilmentDetails,
  PackagingManufacturerDetails,
  CpgBrandDetails,
  RetailerDetails,
} from '@type/product-components';

/* Canonical impact-category union reused across the entire application. */
export type ImpactCategory = 'carbon' | 'water' | 'land';

export interface Component {
  _id: string;
  isActive: boolean;
  createdBy: string;
  deletedAt: string | null;
  deletedBy: string | null;
  comment: string | null;
  name: string;
  internalSku: string;
  supplierRoles: string[];
  productId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface EnvironmentalProfilePayload {
  rawMaterialSupplierDetails?: RawMaterialSupplierDetails;
  transportFreightDetails?: TransportFreightDetails;
  storageFulfilmentDetails?: StorageFulfilmentDetails;
  packagingManufacturerDetails?: PackagingManufacturerDetails;
  cpgBrandDetails?: CpgBrandDetails;
  retailerDetails?: RetailerDetails;
  contractManufacturerDetails?: ContractManufacturerDetails;
}

export interface MaterialInputFormData {
  netWeight: string;
  unitOfMeasurement: string;
  supplierLocation: string;
}

interface VolumeUnitFormData {
  volumePerUnit: string;
  volumeUnit: string;
}

interface TemperatureControlledFormData {
  volumePerUnit: string;
  volumeUnit: string;
  currentTemperature: string;
  targetTemperature: string;
}

interface LabellingFormData {
  numberOfLabels: string;
}

export interface SupplierDetailsFormData {
  rawMaterialSupplier: MaterialInputFormData;

  transportFreight: {
    transportNetWeight: string;
    transportUnitOfMeasurement: string;
    transportRegion: string;
  };

  storageSection: {
    storageDays: string;
    volumePerSku: string;
    floorAreaPerSku: string;
  };

  packagingManufacturer: MaterialInputFormData;

  contractManufacturer: {
    filling?: VolumeUnitFormData;
    mixing?: VolumeUnitFormData;
    heating?: TemperatureControlledFormData;
    homogenising?: VolumeUnitFormData;
    labelling?: LabellingFormData;
    cooling?: TemperatureControlledFormData;
    fermenting?: VolumeUnitFormData;
    packaging?: VolumeUnitFormData;
  };
}

export type Impact = 'CARBON' | 'WATER' | 'LAND';

export type ImpactOption = 'request' | 'database';

//Add impact category
export interface ComponentWithSupplierRole {
  companyRegistrationNumber?: string;
  image?: string;
  internalSku?: string;
  name?: string;
  supplierContactEmail?: string;
  supplierContactName?: string;
  supplierName?: string;
  supplierRole?: string;
  supplierRoleSlug?: string;
  supplierRoles?: string[];
  supplierSku: string;
}
// Audit data for "Use our Database" option

export type DatabaseAuditData = {
  query: {
    supplierLocation?: string;
    lciaMethodology?: string;
    transportMethod?: string;
    industry?: string;
    componentOrServiceName?: string;
    casNumber?: string;
  };

  result: Record<string, any>;
};

type BaseImpactData = {
  active: boolean;
  value: string;
  lciaMethod: string;
  confirmAccuracy: boolean;

  audit?: DatabaseAuditData;
};

export type CarbonImpactData = BaseImpactData & {
  dataSource: string;
  offsetting?: boolean;
  offsetValue?: string | number;
};

export type WaterLandImpactData = BaseImpactData & {
  noImpact: boolean;
  dataSource: string;
};
type BaseImpactDataRequest = {
  active: boolean;
  value: string;
  lciaMethod: string;
  isRequested?: boolean;
};
export type RequestImpactDataMap = {
  CARBON: BaseImpactDataRequest;
  WATER: BaseImpactDataRequest;
  LAND: BaseImpactDataRequest;
};
export type ManualImpactDataMap = {
  CARBON: CarbonImpactData;
  WATER: WaterLandImpactData;
  LAND: WaterLandImpactData;
};

//select dtaa source

export type ImpactDataMap = {
  CARBON: CarbonImpactData;
  WATER: WaterLandImpactData;
  LAND: WaterLandImpactData;
};

export type ImpactKey = keyof ImpactDataMap;
//summary

interface BaseImpactSummary {
  dataSource?: string;
  presentableDataSource?: string;
  requestedDataSource?: string;
  quantity?: number;
  presentableQuantity?: number;
  unit?: string;
  presentableUnit?: string;
  lciaMethodology?: string;
  presentableLciaMethodology?: string;
  requestedQuantity?: number;
  requestedUnit?: string;
  requestedLciaMethodology?: string;
  isImpactPresent?: boolean;
  presentableIsImpactPresent?: boolean;
  presentableIsImpactpresent?: boolean;
  tempQuantity?: string;
  tempUnit?: string;
  tempLciaMethodology?: string;
  isRequested?: boolean;
  averageComparison?: string;
}

interface CarbonImpactSummary extends BaseImpactSummary {
  offsetCarbonImpact?: boolean;
  offsetQuantity?: number;
  offsetUnit?: string;
  requestedOffsetCarbonImpact?: boolean;
  requestedOffsetQuantity?: number;
}

export interface ImpactSummary {
  carbon?: CarbonImpactSummary;
  water?: BaseImpactSummary;
  land?: BaseImpactSummary;
}

// Industry benchmarking types
export interface IndustryBenchmarkingImpact {
  carbon: number;
  land: number;
  water: number;
  _id: string;
}

export interface IndustryBenchmarkingImpacts {
  [lciaMethod: string]: IndustryBenchmarkingImpact;
}

export interface IndustryBenchmarkingResultItem {
  _id: string;
  activityName: string;
  casNumber?: string;
  geography: string;
  impacts: IndustryBenchmarkingImpacts;
  lciaMethod: string;
  referenceProductName: string;
  cpcClassification: string;
  unit: string;
}

export interface IndustryBenchmarkingData {
  page: number;
  limit: number;
  count: number;
  result: IndustryBenchmarkingResultItem[];
}

export interface SearchDatabaseFormData {
  componentName: string;
  supplierLocation: string;
  transportMethod: string;
  transportRegion: string;
  lciaMethodology: string;
  casNumber: string;
  industry: string;
}

// Save industry benchmarking data payload

export interface BenchmarkingAuditItem {
  _id: string;
  activityName: string;
  geography: string;
  unit: string;
  impacts: IndustryBenchmarkingImpacts;
  referenceProductName: string;
  casNumber?: string;
  cpcClassification?: string;
}

export interface SaveIndustryBenchmarkingPayload {
  audit: BenchmarkingAuditItem[];
}
/** Search filters for "Use our Database" – shape varies by supplier role */
export interface ImpactDatabaseSearchFilters {
  componentOrServiceName?: string;
  supplierLocation?: string;
  lciaMethodology: string;
  casNumber?: string;
  industry?: string;
  transportMethod?: string;
  transportRegion?: string;
}

/** Single row from impact database search (columns vary by supplier role) */
export interface ImpactDatabaseSearchResultRow {
  id: string;
  componentOrServiceName?: string;
  activityDescription?: string;
  supplierLocation?: string;
  casNumber?: string;
  lciaMethodology?: string;
  transportMethod?: string;
  transportDescription?: string;
  transportRegion?: string;
  value?: number | string;
  industryComparison?: 'higher' | 'similar' | 'lower' | null;
}

export interface BenchmarkingAuditQueryParams {
  componentName?: string;
  supplierLocation?: string;
  transportMethod?: string;
  transportRegion?: string;
  lciaMethodology: string;
  casNumber?: string;
  industry?: string;
}

export interface IndustryBenchmarkingSearchParams {
  referenceProductName?: string;
  lciaMethod: string;
  geography?: string;
  casNumber?: string;
  isicSection?: string;
  skip?: number;
  limit?: number;
}

export interface BenchmarkingAuditItemDetails {
  query: BenchmarkingAuditQueryParams;
  results: BenchmarkingAuditItem[];
}

export interface IndustryBenchmarkingDetails {
  storageDays?: number;
  volumePerSku?: number;
  floorAreaPerSku?: number;
  _id: string;
  audit: BenchmarkingAuditItemDetails;
  benchmarkingData?: {
    benchmarkingLciaMethodology?: string;
    carbonBenchmarkingData?: number;
    waterBenchmarkingData?: number;
    landBenchmarkingData?: number;
    _id?: string;
  };
}
