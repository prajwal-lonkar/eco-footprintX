import { useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import logoImg from '@assets/images/logoImg.svg';
import styles from './UpgradeSubscriptionModel.module.scss';
import subscriptionCard1 from '@assets/images/subscriptionCard1.svg';
import subscriptionCard2 from '@assets/images/subscriptionCard2.svg';
import subscriptionCard3 from '@assets/images/subscriptionCard3.svg';
import subscriptionCard4 from '@assets/images/subscriptionCard4.svg';
import subscriptionCard5 from '@assets/images/subscriptionCard5.svg';
import checkIcon from '@assets/icons/tick-circle.svg';
import type { SubscriptionPlan } from '@type/subscription';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@constants/subscription';
import { useSpinnerStore } from '@store/useSpinnerStore';

interface UpgradeSubscriptionModalProps {
  show: boolean;
  onHide: () => void;
  onUpgrade?: (planId: SubscriptionTier) => void;
  plans: SubscriptionPlan[];
  isLoading?: boolean;
}

const PRICING_URL = 'https://www.ecofootprintx.tech/pricing';

const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: '£',
};

// Helper function to format product count text
const formatProductCount = (
  maxProducts: number | null,
  prevMaxProducts: number = 0
): string => {
  if (maxProducts === null) return '';

  const start = prevMaxProducts + 1;
  if (start === maxProducts) {
    return `${maxProducts} product${maxProducts > 1 ? 's' : ''}`;
  }

  return `${start} to ${maxProducts} products`;
};

// Helper function to get plan image
const getPlanImage = (tier: string): string => {
  const imageMap: Record<string, string> = {
    [SUBSCRIPTION_TIERS.FREE]: subscriptionCard1,
    [SUBSCRIPTION_TIERS.LIGHT]: subscriptionCard2,
    [SUBSCRIPTION_TIERS.STANDARD]: subscriptionCard3,
    [SUBSCRIPTION_TIERS.PRO]: subscriptionCard4,
    [SUBSCRIPTION_TIERS.ENTERPRISE]: subscriptionCard5,
  };

  return imageMap[tier] || subscriptionCard1;
};

const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number): number => {
  const yearlyMonthlyCost = monthlyPrice * 12;
  return yearlyMonthlyCost - yearlyPrice;
};

// Helper function to capitalize tier name
const capitalizeTier = (tier: string): string => {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOL[currency] || '$';
};

const getUpgradeButtonClass = (
  tier: string,
  isCurrentPlan: boolean
): string => {
  if (isCurrentPlan) return styles.currentButton;
  if (tier === SUBSCRIPTION_TIERS.LIGHT) return styles.lightUpgradeButton;
  if (tier === SUBSCRIPTION_TIERS.STANDARD) return styles.standardUpgradeButton;
  if (tier === SUBSCRIPTION_TIERS.PRO) return styles.proUpgradeButton;
  return styles.currentButton;
};

const getUpgradeButtonText = (
  isCurrentPlan: boolean,
  isDowngrade: boolean,
  tier: string,
  hasAnyCurrentPlan: boolean
): string => {
  if (isCurrentPlan) return 'Current';
  if (!hasAnyCurrentPlan && tier === SUBSCRIPTION_TIERS.FREE) return 'Current';
  if (isDowngrade) return 'Downgrade';
  return 'Upgrade';
};

type PlanCardProps = {
  plan: SubscriptionPlan;
  index: number;
  plans: SubscriptionPlan[];
  currentPlanSortOrder?: number;
  hasExplicitCurrentPlan: boolean;
  onUpgradeClick: (planId: SubscriptionTier) => void;
};

const PlanCard = ({
  plan,
  index,
  plans,
  currentPlanSortOrder,
  hasExplicitCurrentPlan,
  onUpgradeClick,
}: PlanCardProps) => {
  const planImage = getPlanImage(plan.tier);

  const monthlyPrice = plan.monthlyPrice;
  const yearlyPrice = plan.yearlyPrice;
  const currency = plan.currency;
  const currencySymbol = getCurrencySymbol(currency);

  const savings = calculateYearlySavings(monthlyPrice, yearlyPrice);

  const prevMaxProducts = index > 0 ? plans[index - 1].maxProducts : 0;
  const productCount = formatProductCount(plan.maxProducts, prevMaxProducts || 0);

  const tierName = capitalizeTier(plan.tier);

  const isEnterprise = plan.tier === SUBSCRIPTION_TIERS.ENTERPRISE;
  const isCurrentPlan = hasExplicitCurrentPlan
    ? Boolean(plan.isCurrentPlan) === true
    : plan.sortOrder === 1;
  const isSelectable = plan.isSelectable;

  const isDowngrade =
    currentPlanSortOrder !== undefined && plan.sortOrder < currentPlanSortOrder;

  const hasAnyCurrentPlan = plans.some((p) => Boolean(p.isCurrentPlan) === true);

  const buttonClass = getUpgradeButtonClass(plan.tier, isCurrentPlan);
  const buttonText = getUpgradeButtonText(
    isCurrentPlan,
    isDowngrade,
    plan.tier,
    hasAnyCurrentPlan
  );

  const isDisabled = isEnterprise || isCurrentPlan || isDowngrade || !isSelectable;

  return (
    <div className={styles.planCard}>
      <div className={styles.planHeader}>
        <div className={styles.hederimg}>
          <img
            src={planImage}
            alt="Subscription"
            className={styles.subscriptionCard1}
          />
          <div className={styles.cardHeaderContent}>
            <h2 className={styles.cardHeaderTitle}>{tierName}</h2>

            {productCount && (
              <div className={styles.cardHeaderIcon}>
                <img src={checkIcon} alt="Check" />
                <p>{productCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.planBody}>
        {isEnterprise ? (
          <div className={styles.enterpriceCard}>
            <p className={styles.enterpriceCardTitle}>
              For organisations that need a tailored solution
            </p>

            <div className={styles.enterpriceCardContactSection}>
              <p className={styles.enterpriceCardContact}>Please contact </p>
              <button className={styles.enterpriseUpgradeButton} disabled>
                enterprise@ecofootprintx.tech
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.planBodyContent}>
              {(monthlyPrice || (plan.tier === SUBSCRIPTION_TIERS.FREE && !monthlyPrice)) && (
                <div className={styles.planBodyContentHeader}>
                  <p className={styles.planBodyContentHeaderTitle}>Monthly Billing</p>
                  <p className={styles.planBodyContentHeaderPrice}>
                    {plan.tier === SUBSCRIPTION_TIERS.FREE && (monthlyPrice === null || monthlyPrice === undefined)
                      ? '£0'
                      : `${currencySymbol}${monthlyPrice}`}
                  </p>
                </div>
              )}

              {(yearlyPrice || (plan.tier === SUBSCRIPTION_TIERS.FREE && !yearlyPrice)) && (
                <div className={styles.planBodyContentHeader}>
                  <p className={styles.planBodyContentHeaderTitle}>Yearly Billing</p>
                  <p className={styles.planBodyContentHeaderPrice}>
                    {plan.tier === SUBSCRIPTION_TIERS.FREE && (yearlyPrice === null || yearlyPrice === undefined)
                      ? '£0'
                      : `${currencySymbol}${yearlyPrice}`}
                  </p>

                  {savings > 0 && (
                    <p className={styles.planBodyContentHeaderSub}>
                      (save {currencySymbol}
                      {savings})
                    </p>
                  )}
                </div>
              )}
            </div>
          
          {!isDowngrade && (
            <div className={styles.buttonContainer}>
              <button
                className={`${buttonClass} ${
                  !isSelectable || isDowngrade ? styles.disabled : ''
                } `}
                onClick={() => onUpgradeClick(plan.tier as SubscriptionTier)}
                disabled={isDisabled}
              >
                {buttonText}
              </button>
            </div>
          )}

          </>
        )}
      </div>
    </div>
  );
};

const UpgradeSubscriptionModal = ({
  show,
  onHide,
  onUpgrade,
  plans,
  isLoading = false,
}: UpgradeSubscriptionModalProps) => {
  const { showSpinner, hideSpinner } = useSpinnerStore();
  const currentPlan = plans.find((plan) => Boolean(plan.isCurrentPlan) === true);
  const hasExplicitCurrentPlan = Boolean(currentPlan);
  const fallbackCurrentPlan = plans.find((plan) => plan.sortOrder === 1);
  const currentPlanSortOrder = (currentPlan || fallbackCurrentPlan)?.sortOrder;

  useEffect(() => {
    if (isLoading) {
      showSpinner();
    } else {
      hideSpinner();
    }
    return () => hideSpinner();
  }, [isLoading, showSpinner, hideSpinner]);

  const handleMoreDetails = () => {
    window.open(PRICING_URL, '_blank', 'noopener,noreferrer');
  };

  const handleUpgrade = (planId: SubscriptionTier) => {
    if (planId === SUBSCRIPTION_TIERS.ENTERPRISE) return;
    onUpgrade?.(planId);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <div className={styles.modalContent}>
        <div className={styles.headerContainer}>
          <div>
            <img src={logoImg} alt="Logo" className={styles.logo} />
          </div>

          <div className={styles.header}>
            <h2 className={styles.title}>Upgrade your Plan</h2>
            <p className={styles.description}>
              You have reached the product limit for your current subscription. Select a
              plan below to continue adding products.
            </p>
          </div>
        </div>

        <div className={styles.plansContainer}>
          {isLoading || plans.length === 0 ? (
            <div>No subscription plans available.</div>
          ) : (
            plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                plans={plans}
                currentPlanSortOrder={currentPlanSortOrder}
                hasExplicitCurrentPlan={hasExplicitCurrentPlan}
                onUpgradeClick={handleUpgrade}
              />
            ))
          )}
        </div>

        <div className={styles.footerButtonContainer}>
          <button className={styles.cancleButton} onClick={onHide}>
            Cancel
          </button>
          <button className={styles.moreDetailsButton} onClick={handleMoreDetails}>
            Know More
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeSubscriptionModal;
