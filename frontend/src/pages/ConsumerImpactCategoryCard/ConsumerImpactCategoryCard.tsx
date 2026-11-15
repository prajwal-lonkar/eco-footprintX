import type { ConsumerImpactCategoryCardProps } from './types';
import ConsumerGeneralCard from './variants/ConsumerGeneralCard';
import ConsumerNoImpactCard from './variants/ConsumerNoImpactCard';

const ConsumerImpactCategoryCard = (props: ConsumerImpactCategoryCardProps) => {
  switch (props.cardState) {
    case 'GENERAL':
      return (
        <ConsumerGeneralCard
          categoryType={props.categoryType}
          general={props.general}
          tooltip={props.tooltip}
          tooltipIcon={props.tooltipIcon}
        />
      );
    case 'NO_IMPACT':
      return (
        <ConsumerNoImpactCard
          categoryType={props.categoryType}
          tooltip={props.tooltip}
        />
      );
    default:
      return null;
  }
};

export default ConsumerImpactCategoryCard;
