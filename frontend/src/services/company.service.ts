import { ENDPOINTS } from '@constants/endpoint';
import axiosInstance from './api.service';
import type {
  CompanyProfileResponse,
  UpdateCompanyProfilePayload,
} from '@type/companyDashboard';
import useAuthStore from '@store/useAuthStore';
import { AxiosError } from 'axios';
import type { ApiResponse } from '@type/auth';
import type { ProductDetails } from '@type/product';
import type { GetProductRequestsResponse } from '@type/product-requests';
import type { ImpactCategoryData } from '@type/supplier';
import type {
  ImpactCategoryType,
  ProductImpactSummaryData,
} from '@common/ImpactCategoryCard/types';
import type { ProductSuppliersResponse } from '@type/supplier';

export interface ApprovedCategoryPayload {
  impactCategory: ImpactCategoryType;
  versionNumber: number;
}

//Get Profile Details
export const getCompanyProfile = async (): Promise<CompanyProfileResponse> => {
  const response = await axiosInstance.get(ENDPOINTS.PROFILE.GET);

  return response.data.data;
};

//Edit Profile
export const updateCompanyProfile = async (
  payload: UpdateCompanyProfilePayload
) => {
  const response = await axiosInstance.put(ENDPOINTS.PROFILE.UPDATE, payload);

  return response.data;
};
export interface ProductRow {
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  registrationNumber: string;
  companyType: string;
}

export interface GetProductsResponse {
  success: boolean;
  statusCode: number;
  list: ProductRow[];
  total: number;
}

//Get Product List
export const getProductList = async (
  limit = 10,
  skip = 0
): Promise<GetProductsResponse> => {
  const currentUser = useAuthStore.getState().user;
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.PRODUCTS.GET_PRODUCT_LISTS}?companyId=${currentUser?.userId}`,

      {
        params: { limit, skip },
      }
    );

    if (response.data.success) {
      return {
        success: response.data.success,
        statusCode: response.data.statusCode,
        list: response.data.data.products ?? [],
        total: response.data.data.total ?? 0,
      };
    }
    return {
      success: false,
      statusCode: response.data.statusCode ?? 400,
      list: [],
      total: 0,
    };
  } catch (error) {
    let status = 500;

    if (error instanceof AxiosError) {
      status = error.response?.status ?? 500;
    }
    return {
      success: false,
      statusCode: status,
      list: [],
      total: 0,
    };
  }
};

//Delete Product
export const deleteProduct = async (productId: string) => {
  try {
    const response = await axiosInstance.delete(
      `${ENDPOINTS.PRODUCTS.DELETE_PRODUCT}/${productId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get product details by product ID
 */
export const getProductDetails = async (
  productId: string
): Promise<ApiResponse<ProductDetails>> => {
  const response = await axiosInstance.get<ApiResponse<ProductDetails>>(
    ENDPOINTS.PRODUCTS.GET_PRODUCT(productId)
  );
  return response.data;
};

//Delete Product Image
export const updateProductImageOrInstructions = async (
  productId: string,
  payload: {
    recycleInstructions?: any[];
    image?: string | null;
  }
) => {
  return axiosInstance.patch(
    `${ENDPOINTS.PRODUCTS.DELETE_IMAGE}/${productId}`,
    payload
  );
};

//get component or service list(supplier tab)
export const getProductSuppliers = async (
  productId: string,
  limit = 10,
  page = 1
): Promise<ApiResponse<ProductSuppliersResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<ProductSuppliersResponse>
  >(`${ENDPOINTS.PRODUCTS.GET_SUPPLIERTAB_LIST(productId)}`, {
    params: { limit, page },
  });

  return response.data;
};

export const getProductRequests = async (
  productId: string,
  limit = 10,
  skip = 0
): Promise<GetProductRequestsResponse> => {
  const response = await axiosInstance.get<GetProductRequestsResponse>(
    ENDPOINTS.PRODUCTS.GET_PRODUCT_REQUESTS(productId),
    {
      params: { limit, skip },
    }
  );

  return response.data;
};

//delete component/service
export const deleteComponent = async (
  productId: string,
  componentId: string,
  supplierRoleSlug: string
) => {
  try {
    const response = await axiosInstance.delete(
      `${ENDPOINTS.PRODUCTS.DELETE_COMPONENT(productId, componentId, supplierRoleSlug)}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchComponentWithSupplierRole = async (
  productId: string,
  componentId: string,
  supplierRoleSlug: string,
  roleSlug: string
) => {
  const encodedSlug = encodeURIComponent(supplierRoleSlug);

  const res = await axiosInstance.get(
    `${ENDPOINTS.PRODUCTS.GET_COMPONENT_DETAILS(productId, componentId, encodedSlug, roleSlug)}`
  );

  return res.data;
};

/**
 * Get product impact summary by product ID
 */
export const getProductImpactSummary = async (
  productId: string
): Promise<ApiResponse<ProductImpactSummaryData>> => {
  const response = await axiosInstance.get<
    ApiResponse<ProductImpactSummaryData>
  >(ENDPOINTS.PRODUCTS.GET_IMPACT_SUMMARY(productId));
  return response.data;
};

/**
 * Get component impact summary by component ID and supplier role
 */
export const getComponentImpactSummary = async (
  componentId: string,
  supplierRoleSlug: string,
  options?: {
    productRequested?: boolean;
  }
): Promise<ApiResponse<ImpactCategoryData>> => {
  const encodedSlug = encodeURIComponent(supplierRoleSlug);
  const response = await axiosInstance.get<ApiResponse<ImpactCategoryData>>(
    ENDPOINTS.PRODUCTS.GET_COMPONENT_IMPACT_SUMMARY(componentId, encodedSlug),
    options?.productRequested
      ? { params: { productRequested: true } }
      : undefined
  );
  return response.data;
};

/**
 * Patch impact category publish status
 */
export const patchImpactCategoryPublish = async (
  productId: string,
  category: ImpactCategoryType,
  isPublished: boolean
): Promise<void> => {
  await axiosInstance.patch(
    ENDPOINTS.PRODUCTS.PATCH_IMPACT_CATEGORY(productId, category),
    { isPublished }
  );
};

/**
 * Submit impact category for component detail page (company & supplier)
 */
export const patchImpactCategorySubmit = async (
  componentId: string,
  roleSlug: string,
  categories: ImpactCategoryType[],
  options?: {
    productRequested?: boolean;
  }
): Promise<unknown> => {
  const response = await axiosInstance.patch<unknown>(
    ENDPOINTS.PRODUCTS.PATCH_IMPACT_CATEGORY_SUBMIT(componentId, roleSlug),
    { categories },
    options?.productRequested
      ? { params: { productRequested: true } }
      : undefined
  );
  return response.data;
};

export const patchApproveRejectSupplierSubmission = async (
  componentId: string,
  roleSlug: string,
  approvedCategories: ApprovedCategoryPayload[],
  options?: {
    productRequested?: boolean;
    submissionAction?: 'keep-original' | 'submit-approved';
  }
): Promise<unknown> => {
  // Backend contract: "keep original" is represented by an empty approvedCategories array.
  // submissionAction keeps caller intent explicit at call sites (keep-original vs submit-approved).

  const response = await axiosInstance.patch<unknown>(
    ENDPOINTS.PRODUCTS.PATCH_APPROVE_REJECT_SUPPLIER_SUBMISSION(
      componentId,
      roleSlug
    ),
    { approvedCategories },
    options?.productRequested
      ? { params: { productRequested: true } }
      : undefined
  );
  return response.data;
};
