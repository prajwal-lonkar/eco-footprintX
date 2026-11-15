import type { SubscriptionTier } from '@constants/subscription';

/**
 * Request payload for upgrading subscription
 */
export interface UpgradeSubscriptionPayload {
  slug: SubscriptionTier;
}

/**
 * Subscription data response (excluding system fields)
 */
export interface SubscriptionData {
  isActive: boolean;
  comment: string | null;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  _id: string;
}

/**
 * Response from upgrade subscription API
 */
export interface UpgradeSubscriptionResponse {
  success: boolean;
  statusCode: number;
  data: SubscriptionData;
}

/**
 * Subscription plan from API response
 */
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  slug: string;
  maxProducts: number | null;
  isSelectable: boolean;
  sortOrder: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  isCurrentPlan: boolean;
}

/**
 * Response from get subscriptions API
 */
export interface GetSubscriptionsResponse {
  userId: string;
  allPlans: SubscriptionPlan[];
}
