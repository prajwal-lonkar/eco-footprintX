import axiosInstance from './api.service';
import { ENDPOINTS } from '@constants/endpoint';
import type { ApiResponse } from '@type/auth';
import Bugsnag from '@utils/bugsnag';
import type {
  UpgradeSubscriptionPayload,
  UpgradeSubscriptionResponse,
  GetSubscriptionsResponse,
} from '@type/subscription';

/**
 * Upgrade user subscription to a new tier
 */
export const upgradeSubscription = async (
  payload: UpgradeSubscriptionPayload
): Promise<UpgradeSubscriptionResponse> => {
  const response = await axiosInstance.post<UpgradeSubscriptionResponse>(
    ENDPOINTS.USERS.UPGRADE_SUBSCRIPTION,
    payload
  );
  return response.data;
};

/**
 * Get all available subscription plans for the current user
 */
export const getSubscriptions = async (): Promise<
  ApiResponse<GetSubscriptionsResponse>
> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<GetSubscriptionsResponse>
    >(ENDPOINTS.USERS.GET_SUBSCRIPTIONS);

    // Validate response success and data presence
    if (response.data.success && response.data.data) {
      return response.data;
    }

    // Return fail-safe response if validation fails
    return {
      success: false,
      statusCode: response.data.statusCode ?? 400,
      data: {
        userId: '',
        allPlans: [],
      },
    };
  } catch (error) {
    Bugsnag.notify(error as Error, (event) => {
      event.addMetadata('context', {
        component: 'SubscriptionService',
        method: 'getSubscriptions',
      });
    });

    // Rethrow error so component can show specific error message
    throw error;
  }
};
