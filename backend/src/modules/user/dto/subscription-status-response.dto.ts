export class SubscriptionStatusResponseDto {
  userId: string;
  allPlans: Array<{
    id: string;
    tier: string;
    slug: string;
    maxProducts: number | null;
    isSelectable: boolean;
    sortOrder: number;
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    isCurrentPlan: boolean;
  }>;
}
