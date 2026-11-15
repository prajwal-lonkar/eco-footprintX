import axiosInstance from './api.service';
import type { ApiResponse } from '@type/auth';
import type { ComponentDetails } from '@type/product-components';
import { ENDPOINTS } from '@constants/endpoint';
import type {
  EnvironmentalProfilePayload,
  BenchmarkingAuditQueryParams,
  IndustryBenchmarkingData,
  IndustryBenchmarkingDetails,
  IndustryBenchmarkingSearchParams,
  SaveIndustryBenchmarkingPayload,
} from '@type/built-enviromental-profile';

/**
 * Save built environmental profile for a component
 */
export const saveBuiltEnvironmentalProfile = async (
  componentId: string,
  payload: EnvironmentalProfilePayload
): Promise<ApiResponse<ComponentDetails>> => {
  const response = await axiosInstance.patch<ApiResponse<ComponentDetails>>(
    ENDPOINTS.PRODUCTS.SAVE_BUILT_ENVIRONMENTAL_PROFILE(componentId),
    payload
  );
  return response.data;
};

//save impact category
export const saveImpactCategory = async (
  impactCategoryId: any,
  componentId: any,
  payload: {
    carbon?: any;
    water?: any;
    land?: any;
    isSaveAndExit?: boolean;
  },
  options?: {
    productRequested?: boolean;
  }
) => {
  const response = await axiosInstance.post(
    ENDPOINTS.PRODUCTS.SAVE_ADD_IMPACT_CATEGORY(componentId, impactCategoryId),
    payload,
    options?.productRequested ? { params: { productRequested: true } } : undefined
  );

  return response.data;
};

export const saveImpactCategoryDatabaseValue = async (
  componentId: string,
  roleDetailsId: string,
  payload: {
    value: number;
    supplierRoleSlug: string;
    rowSelected: Record<string, unknown>;
  }
) => {
  const response = await axiosInstance.post(
    ENDPOINTS.PRODUCTS.SAVE_IMPACT_CATEGORY_DATABASE_VALUE(
      componentId,
      roleDetailsId
    ),
    payload
  );

  return response.data;
};

//get impact category for company dashboard
export const getImpactCategorySummary = async (
  componentId: string,

  supplierRoleSlug: string
) => {
  const response = await axiosInstance.get(
    ENDPOINTS.PRODUCTS.GET_BUILT_ENVIRONMENTAL_SUMMARY(
      componentId,
      supplierRoleSlug
    )
  );

  return response.data;
};

//Get impact category for supplier dashboard
export const getImpactCategorySupplierSummary = async (
  componentId: string,
  supplierRoleSlug: string,
  options?: {
    productRequested?: boolean;
  }
) => {
  const isProductRequested = options?.productRequested === true;
  const url = isProductRequested
    ? ENDPOINTS.PRODUCTS.GET_BUILT_ENVIRONMENTAL_SUMMARY(
        componentId,
        supplierRoleSlug
      )
    : ENDPOINTS.SUPPLIERS.GET_BUILT_ENVIRONMENTAL_SUPPLIER_SUMMARY(
        componentId,
        supplierRoleSlug
      );

  const response = await axiosInstance.get(
    url,
    isProductRequested ? { params: { productRequested: true } } : undefined
  );

  return response.data;
};

export const getIndustryBenchmarkingData = async (
  supplierRoleSlug: string,
  params: IndustryBenchmarkingSearchParams
): Promise<ApiResponse<IndustryBenchmarkingData>> => {
  const response = await axiosInstance.get<
    ApiResponse<IndustryBenchmarkingData>
  >(ENDPOINTS.PRODUCTS.GET_INDUSTRY_BENCHMARKING_DATA, {
    params: {
      supplierRoleSlug,
      referenceProductName: params.referenceProductName,
      lciaMethod: params.lciaMethod,
      geography: params.geography,
      casNumber: params.casNumber,
      isicSection: params.isicSection,
      skip: params.skip,
      limit: params.limit,
    },
  });

  return response.data;
};

/**
 * Get industry benchmarking details for a component
 */
export const getIndustryBenchmarkingDetails = async (
  componentId: string,
  supplierRoleSlug: string
): Promise<ApiResponse<IndustryBenchmarkingDetails>> => {
  const response = await axiosInstance.get<
    ApiResponse<IndustryBenchmarkingDetails>
  >(
    ENDPOINTS.PRODUCTS.GET_INDUSTRY_BENCHMARKING_DETAILS(
      componentId,
      supplierRoleSlug
    )
  );
  return response.data;
};

// save benchmarking data
export const saveIndustryBenchmarkingData = async (
  componentId: string,
  supplierRoleSlug: string,
  payload: SaveIndustryBenchmarkingPayload,
  params?: BenchmarkingAuditQueryParams
): Promise<ApiResponse<ComponentDetails>> => {
  const response = await axiosInstance.patch<ApiResponse<ComponentDetails>>(
    ENDPOINTS.PRODUCTS.SAVE_INDUSTRY_BENCHMARKING_DATA(
      componentId,
      supplierRoleSlug
    ),
    payload,
    params
      ? {
          params: {
            componentName: params.componentName,
            supplierLocation: params.supplierLocation,
            transportMethod: params.transportMethod,
            transportRegion: params.transportRegion,
            lciaMethodology: params.lciaMethodology,
            casNumber: params.casNumber,
            industry: params.industry,
          },
        }
      : undefined
  );

  return response.data;
};
