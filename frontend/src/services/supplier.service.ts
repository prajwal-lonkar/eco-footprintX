import { ENDPOINTS } from '@constants/endpoint';
import axiosInstance from './api.service';
import type { ApiResponse } from '@type/auth';
import type { PaginationParams } from '@type/common';
import type {
  SupplierRole,
  Supplier,
  ProductSupplier,
  SaveSupplierPayload,
  ImpactCategoryRequestsResponse,
  SupplierComponentDetails,
  ImpactCategoryData,
} from '@type/supplier';

/**
 * Get list of suppliers with pagination and search
 */
export const getSuppliers = async (
  params?: PaginationParams
): Promise<ApiResponse<Supplier[]>> => {
  const response = await axiosInstance.get<ApiResponse<Supplier[]>>(
    ENDPOINTS.SUPPLIERS.GET_SUPPLIERS,
    { params }
  );
  return response.data;
};

/**
 * Get list of supplier roles
 */
export const getSupplierRoles = async (): Promise<ApiResponse<SupplierRole[]>> => {
  const response = await axiosInstance.get<ApiResponse<SupplierRole[]>>(
    ENDPOINTS.SUPPLIERS.GET_SUPPLIER_ROLES
  );
  return response.data;
};
/**
 * Search suppliers
 */
export const searchSuppliers = async (
  params?: PaginationParams
): Promise<ApiResponse<ProductSupplier[]>> => {
  const response = await axiosInstance.get<ApiResponse<ProductSupplier[]>>(
    ENDPOINTS.SUPPLIERS.SEARCH_SUPPLIERS,
    { params }
  );
  return response.data;
};
/**
 * Check if registration number is valid and unique
 */
export const checkRegistrationNumber = async (
  registrationNumber: string
): Promise<ApiResponse<{ isExists: boolean }>> => {
  const response = await axiosInstance.get<ApiResponse<{ isExists: boolean }>>(
    ENDPOINTS.USERS.CHECK_REGISTRATION_NUMBER,
    {
      params: { registrationNumber },
    }
  );
  return response.data;
};

/**
 * Save supplier and its details for a component
 */
export const saveSupplier = async (
  componentId: string,
  payload: SaveSupplierPayload
): Promise<ApiResponse<unknown>> => {
  const response = await axiosInstance.patch<ApiResponse<unknown>>(
    ENDPOINTS.PRODUCTS.SAVE_SUPPLIER_DETAILS(componentId),
    payload
  );
  return response.data;
};

/**
 * Get impact category requests for supplier
 */
export const getImpactCategoryRequests = async (
  limit: number,
  page: number
): Promise<ApiResponse<ImpactCategoryRequestsResponse>> => {
  const response = await axiosInstance.get<ApiResponse<ImpactCategoryRequestsResponse>>(
    ENDPOINTS.SUPPLIERS.GET_IMPACT_CATEGORY_REQUESTS,
    {
      params: { limit, page },
    }
  );
  return response.data;
};

export const getComponentDetails = async (
  productId: string,
  componentId: string,
  supplierRoleSlug: string,
  roleSlug: string,
  options?: {
    productRequested?: boolean;
  }
): Promise<ApiResponse<SupplierComponentDetails>> => {
  const response = await axiosInstance.get<ApiResponse<SupplierComponentDetails>>(
    ENDPOINTS.PRODUCTS.GET_COMPONENT_DETAILS(
      productId,
      componentId,
      supplierRoleSlug,
      roleSlug
    ),
    options?.productRequested ? { params: { productRequested: true } } : undefined
  );
  return response.data;
};

/**
 * Get impact category data for a component by supplier role slug
 */
export const getImpactCategory = async (
  componentId: string,
  supplierRoleSlug: string
): Promise<ApiResponse<ImpactCategoryData>> => {
  const response = await axiosInstance.get<ApiResponse<ImpactCategoryData>>(
    ENDPOINTS.PRODUCTS.GET_BUILT_ENVIRONMENTAL_SUMMARY(componentId, supplierRoleSlug)
  );
  return response.data;
};
