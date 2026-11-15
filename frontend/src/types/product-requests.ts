import type { Impacts, BenchmarkingData } from './supplier';

export interface ProcessStepData {
  volumePerUnit?: number;
  volumeUnit?: string;
  numberOfLabels?: number;
  currentTemperature?: number;
  targetTemperature?: number;
  [key: string]: unknown;
}

export type NetUnitValue = number | Record<string, ProcessStepData> | null;

export interface ProductRequestApiItem {
  supplierLinkedRole: string;
  submissionStatus: string;
  componentId: string;
  productId: string;
  roleDetailsId: string;
  companyName: string;
  supplierContactEmail: string;
  supplierContactName: string;
  requestedImpactCategories: string[];
  netUnitSize: NetUnitValue;
  netUnit: string | Record<string, ProcessStepData> | null;
  dateOfRequest: string;
  impacts?: Impacts;
  benchmarkingData?: BenchmarkingData | null;
}

export interface GetProductRequestsResponseData {
  count: number;
  skip: number;
  limit: number;
  result: ProductRequestApiItem[];
}

export interface GetProductRequestsResponse {
  success: boolean;
  statusCode: number;
  data: GetProductRequestsResponseData | null;
}
