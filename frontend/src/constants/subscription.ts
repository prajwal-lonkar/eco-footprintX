/**
 * Subscription tier/slug values
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  LIGHT: 'light',
  STANDARD: 'standard',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

/**
 * Valid subscription tier values array for validation
 */
export const VALID_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  SUBSCRIPTION_TIERS.FREE,
  SUBSCRIPTION_TIERS.LIGHT,
  SUBSCRIPTION_TIERS.STANDARD,
  SUBSCRIPTION_TIERS.PRO,
  SUBSCRIPTION_TIERS.ENTERPRISE,
];

/**
 * Check if a value is a valid subscription tier
 */
export const isValidSubscriptionTier = (
  value: string
): value is SubscriptionTier => {
  return VALID_SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
};
