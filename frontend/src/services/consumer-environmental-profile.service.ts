import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';

import type { ApiResponse } from '@type/auth';
import type { ConsumerEnvironmentalProfileProduct } from '@type/consumer-environmental-profile';

export const getConsumerEnvironmentalProfile = async (
  productId: string
): Promise<ApiResponse<ConsumerEnvironmentalProfileProduct>> => {
  const response =
    await axiosInstance.get<ApiResponse<ConsumerEnvironmentalProfileProduct>>(
      `${ENDPOINTS.CONSUMER_PROFILE.GET_PRODUCT}/${productId}`
    );

  return response.data;
};


