export interface Supplier {
  id?: string;
  companyName: string;
  contactName: string;
  email: string;
  registrationNumber?: string;
}

export interface ProductSupplier {
  supplierId: string;
  supplierName: string;
  supplierContactName: string;
  supplierContactEmail: string;
  companyRegistrationNumber: string;
  supplierRoles: string[];
}

export interface SupplierRole {
  _id: string;
  role: string;
  comment: string | null;
  supplierRoleSlug: string;
}

export interface RawMaterialSupplier {
  internalSku: string;
  supplierSku?: string;
  casNumber?: string;
  activityDescription?: string;
}

export interface TransportFreight {
  transportMethod: string;
  transportOrigin: string;
  transportDestination: string;
  activityDescription?: string;
  calculatedDistanceKm: number;
}

export interface StorageActivityBase {
  storageType: string;
  activityDescription?: string;
}

export interface Retailer extends StorageActivityBase { }

export interface CpgBrand extends StorageActivityBase { }

export interface StorageFulfilment extends StorageActivityBase { }

export interface PackagingManufacturer {
  activityDescription?: string;
}

export interface ContractManufacturer {
  manufacturingActivityTypes: string[];
  activityDescription?: string;
}

export interface SaveSupplierPayload {
  supplierId?: string;
  supplierName: string;
  companyRegistrationNumber: number | string;
  supplierRoles: string[];
  supplierContactName: string;
  supplierContactEmail: string;
  rawMaterialSupplier?: RawMaterialSupplier;
  transportFreight?: TransportFreight;
  retailer?: Retailer;
  cpgBrand?: CpgBrand;
  storageFulfilment?: StorageFulfilment;
  packagingManufacturer?: PackagingManufacturer;
  contractManufacturer?: ContractManufacturer;
}

export interface ImpactCategories {
  carbon: boolean;
  water: boolean;
  land: boolean;
}

export type SubmissionStatus = 'pending' | 'submitted' | 'partial' | 'ready';

export interface ComponentImpactRequest {
  _id: string;
  componentId: string;
  productId: string;
  componentName: string;
  supplierName: string;
  impacts: Impacts;
  submissionStatus: SubmissionStatus;
  supplierRole: string;
  supplierRoleSlug: string;
  createdAt: string;
  benchmarkingData?: BenchmarkingData | null;
  transportFreight?: TransportFreight;
}

export interface ImpactCategoryRequestsResponse {
  results: ComponentImpactRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RawMaterialSupplierDetails {
  netWeightUsedPerSku: number;
  netWeightUnit: string;
  supplierLocation: string;
  _id?: string;
}

export interface CpgBrandDetails {
  storageDays: number;
  volumePerSku: number;
  floorAreaPerSku: number;
  _id?: string;
}

export interface SupplierComponentDetails {
  name: string;
  companyRegistrationNumber: string;
  dateOfRequest?: string;
  internalSku: string;
  image: string;
  requestSentBy: string;
  nameOfCompanyContact: string;
  emailIdOfCompanyContact: string;
  companyWebsite: string;
  supplierRole: string;
  supplierRoleSlug: string;
  casNumber: string;
  activityDescription: string;
  netWeightUsedPerSku: number;
  netWeightUnit: string;
  supplierLocation: string;
  _id: string;
  supplierName: string;
  supplierContactName: string;
  supplierContactEmail: string;
  supplierRoles: string[];
  supplierSku?: string;
  requestedProductId: string;
  retailer?: {
    storageType: string;
    activityDescription: string;
  };
  cpgBrand?: {
    storageType: string;
    activityDescription: string;
  };
  cpgBrandDetails?: CpgBrandDetails;
  rawMaterialSupplier?: {
    internalSku: string;
    casNumber?: string;
    activityDescription: string;
  };
  rawMaterialSupplierDetails?: RawMaterialSupplierDetails;
  packagingManufacturer?: {
    activityDescription: string;
  };
  transportFreight?: TransportFreight;
}

export interface ImpactCategoryItem {
  versionNumber?: number;
  dataSource?: string;
  quantity?: number | null;
  unit?: string | null;
  lciaMethodology?: string | null;
  tempQuantity?: number | null;
  tempUnit?: string | null;
  tempLciaMethodology?: string | null;
  presentableQuantity?: number | null;
  presentableUnit?: string | null;
  presentableLciaMethodology?: string | null;
  presentableDataSource?: string | null;
  presentableIsImpactPresent?: boolean;
  presentableIsImpactpresent?: boolean;
  uploadedBy?: string | null;
  averageComparison?: string | null;
  offsetQuantity?: number | null;
  offsetUnit?: string | null;
  offsetCarbonImpact?: boolean;
  audit?: any;
  isSubmitted?: boolean;
  isRequested?: boolean;
  isImpactPresent?: boolean;
}

export interface LatestPreviousSubmittedVersion {
  hasData?: boolean;
  carbon?: ImpactCategoryItem;
  water?: ImpactCategoryItem;
  land?: ImpactCategoryItem;
}

export interface ImpactCategoryData {
  componentId: string;
  supplierLinkedRole: string;
  carbon?: ImpactCategoryItem;
  water?: ImpactCategoryItem;
  land?: ImpactCategoryItem;
  previouslySubmittedData?: {
    hasPreviousData?: boolean;
    carbon?: ImpactCategoryItem;
    water?: ImpactCategoryItem;
    land?: ImpactCategoryItem;
  };
  latestPreviousCompanySubmittedVersion?: LatestPreviousSubmittedVersion;
  requestEmailSent: boolean;
  submissionStatus?: SubmissionStatus;
  supplierSubmissionStatus?: SubmissionStatus;
}

export interface ImpactMetric {
  quantity?: number | null;
  unit?: string | null;
  lciaMethodology?: string | null;
  isSubmitted?: boolean;
  isImpactPresent?: boolean;
  isProspective?: boolean;
}

export interface Impacts {
  carbon?: ImpactMetric;
  water?: ImpactMetric;
  land?: ImpactMetric;
}

export interface BenchmarkingData {
  benchmarkingLciaMethodology: string;
  carbonBenchmarkingData: number;
  waterBenchmarkingData: number;
  landBenchmarkingData: number;
  _id: string;
}

export interface ProductSupplierListItem {
  _id: string;
  supplierName: string;
  submissionStatus: string;
  impacts?: Impacts;
  productId: string;
  componentId: string;
  componentName: string;
  supplierRole: string;
  transportFreight?: TransportFreight;
  supplierRoleSlug: string;
  createdAt: string;
  benchmarkingData?: BenchmarkingData | null;
}

export interface ProductSuppliersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: ProductSupplierListItem[];
}
