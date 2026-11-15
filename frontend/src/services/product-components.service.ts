import { ENDPOINTS } from '@constants/endpoint';
import type { ApiResponse } from '@type/auth';
import type {
  Component,
  CreateComponentPayload,
  SearchComponentsParams,
  ComponentDetails,
  CheckEmailExistResponse,
  CalculateDistanceRequestParams,
  CalculateDistanceResponseData,
} from '@type/product-components';
import axiosInstance from './api.service';
// import type { AssignSupplierPayload, AssignSupplierResponse } from '@type/supplier';

/**
 * Add a new component to a product
 */
export const addComponent = async (
  productId: string,
  payload: CreateComponentPayload
): Promise<ApiResponse<{component: Component}>> => {
  const response = await axiosInstance.post<ApiResponse<{component: Component}>>(
    ENDPOINTS.PRODUCTS.ADD_COMPONENT(productId),
    payload
  );
  return response.data;
};

/**
 * Search components by query string
 */
export const searchComponents = async (
  params: SearchComponentsParams
): Promise<ApiResponse<Component[]>> => {
  const response = await axiosInstance.get<ApiResponse<Component[]>>(
    ENDPOINTS.PRODUCTS.SEARCH_COMPONENTS,
    { params }
  );
  return response.data;
};

/**
 * Get component details by product ID and component ID
 */
export const getComponent = async (
  productId: string,
  componentId: string,
  supplierRoleSlug: string,
  roleSlug: string
): Promise<ApiResponse<ComponentDetails>> => {
  const response = await axiosInstance.get<ApiResponse<ComponentDetails>>(
    ENDPOINTS.PRODUCTS.GET_COMPONENT_DETAILS(productId, componentId, supplierRoleSlug, roleSlug)
  );
  return response.data;
};

/**
 * Check if a email already exists
 */
export const checkEmailExist = async (
  email: string,
  componentName: string
): Promise<ApiResponse<CheckEmailExistResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<CheckEmailExistResponse>
  >(ENDPOINTS.USERS.CHECK_EMAIL_EXIST(email, componentName));
  return response.data;
};

export const calculateComponentDistance = async (
  componentId: string,
  params: CalculateDistanceRequestParams
): Promise<ApiResponse<CalculateDistanceResponseData>> => {
  const { roleSlug, ...queryParams } = params;
  const response = await axiosInstance.get<ApiResponse<CalculateDistanceResponseData>>(
    ENDPOINTS.PRODUCTS.CALCULATE_DISTANCE(componentId, roleSlug),
    { params: queryParams }
  );
  return response.data;
};

/**
 * Assign supplier to a component
 */
// export const assignSupplierToComponent = async (
//   componentId: string,
//   payload: AssignSupplierPayload
// ): Promise<ApiResponse<AssignSupplierResponse>> => {
//   const response = await axiosInstance.patch<ApiResponse<AssignSupplierResponse>>(
//     ENDPOINTS.PRODUCTS.ASSIGN_SUPPLIER(componentId),
//     payload
//   );
//   return response.data;
// };
