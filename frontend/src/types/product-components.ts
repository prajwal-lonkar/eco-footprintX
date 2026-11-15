import type { BenchmarkingAuditItemDetails } from "./built-enviromental-profile";

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

export interface CreateComponentPayload {
  name: string;
  internalSku: string;
  isNewComponent: boolean;
}

export interface SearchComponentsParams {
  query: string;
}

export interface CheckEmailExistResponse {
  isExists: boolean;
  canProceed: boolean;
}

export interface CalculateDistanceRequestParams {
  roleSlug: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  transportMethod: string;
}

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface CalculateDistanceResponseData {
  origin: LatLngPoint;
  destination: LatLngPoint;
  preferredMode: string;
  distanceKm: number;
  routeDescription: string;
}

export interface RawMaterialSupplierDetails {
  netWeightUsedPerSku: number;
  netWeightUnit: string;
  supplierLocation: string;
  _id?: string;
}

export interface TransportFreight {
  transportMethod: string;
  transportOrigin: string;
  transportDestination: string;
  activityDescription?: string;
  calculatedDistanceKm?: number;
}

export interface TransportFreightDetails {
  netWeightPerUnit: number;
  netWeightUnit: string;
  transportRegion: string;
  calculatedDistanceKm?: number;
}

export interface StorageFulfilmentDetails {
  storageDays: number;
  volumePerSku: number;
  floorAreaPerSku: number;
}

export interface PackagingManufacturerDetails {
  netWeightUsedPerSku: number;
  netWeightUnit: string;
  supplierLocation: string;
  _id?: string;
}

export interface CpgBrandDetails {
  storageDays: number;
  volumePerSku: number;
  floorAreaPerSku: number;
}

export interface RetailerDetails {
  storageDays: number;
  volumePerSku: number;
  floorAreaPerSku: number;
}

interface VolumeUnit {
  volumePerUnit: number;
  volumeUnit: string;
}

interface TemperatureControlled {
  volumePerUnit: number;
  volumeUnit: string;
  currentTemperature: number;
  targetTemperature: number;
}

interface Labelling {
  numberOfLabels: number;
}

export interface ContractManufacturerDetails {
  filling?: VolumeUnit;
  mixing?: VolumeUnit;
  heating?: TemperatureControlled;
  homogenising?: VolumeUnit;
  labelling?: Labelling;
  cooling?: TemperatureControlled;
  fermenting?: VolumeUnit;
  packaging?: VolumeUnit;
};

export interface ComponentDetails extends Component {
  audit?: BenchmarkingAuditItemDetails;
  supplierRoles: string[];
  supplierRole?: string;
  supplierRoleSlug?: string;
  companyRegistrationNumber?: string;
  supplierContactEmail?: string;
  supplierContactName?: string;
  supplierName?: string;
  updatedBy?: string;
  manufacturingActivityTypes?: string[];
  packagingManufacturer?: {
    activityDescription: string;
  };
  rawMaterialSupplier?: {
    internalSku: string;
    supplierSku: string;
    casNumber: string;
    activityDescription: string;
  };
  contractManufacturer?: {
    manufacturingActivityTypes: string[];
    activityDescription: string;
  };
  packagingManufacturerDetails?: PackagingManufacturerDetails;
  rawMaterialSupplierDetails?: RawMaterialSupplierDetails;
  transportFreightDetails?: TransportFreightDetails;
  storageFulfilmentDetails?: StorageFulfilmentDetails;
  cpgBrandDetails?: CpgBrandDetails;
  retailerDetails?: RetailerDetails;
  contractManufacturerDetails?: ContractManufacturerDetails;
  transportFreight?: TransportFreight;
}
