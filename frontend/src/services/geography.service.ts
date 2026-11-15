import { ENDPOINTS } from '@constants/endpoint';
import type { ApiResponse } from '@type/auth';
import type { Geography } from '@type/geography';
import axiosInstance from './api.service';

/**
 * Fetch geographies based on search query
 */
export const getGeographies = async (
  query: string
): Promise<ApiResponse<Geography[]>> => {
  const response = await axiosInstance.get<ApiResponse<Geography[]>>(
    ENDPOINTS.GEOGRAPHY.GET_GEOGRAPHIES,
    { params: { query } }
  );
  return response.data;
};
