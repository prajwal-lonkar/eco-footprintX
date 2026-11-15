import type { ImpactCategoryCardProps } from './types';
import { ImpactCategoryCardState } from './types';
import NoDataCard from './variants/NoDataCard';
import NoImpactCard from './variants/NoImpactCard';
import InProgressCard from './variants/InProgressCard';
import CommonCard from './variants/CommonCard';

const ImpactCategoryCard = (props: ImpactCategoryCardProps) => {
  switch (props.cardState) {
    case ImpactCategoryCardState.NO_DATA:
      return (
        <NoDataCard
          categoryType={props.categoryType}
          source={props.source}
          cta={props.cta}
        />
      );
    case ImpactCategoryCardState.NO_IMPACT:
      return (
        <NoImpactCard
          categoryType={props.categoryType}
          source={props.source}
          cta={props.cta}
          dataUploadedBy={props.dataUploadedBy}
          categoryIcon={props.categoryIcon}
          footerContent={props.footerContent}
        />
      );
    case ImpactCategoryCardState.IN_PROGRESS:
      return (
        <InProgressCard
          categoryType={props.categoryType}
          source={props.source}
          impactValue={props.impactValue}
          impactUnit={props.impactUnit}
          lciaMethod={props.lciaMethod}
          dataSource={props.dataSource}
          cta={props.cta}
        />
      );
    case ImpactCategoryCardState.GENERAL:
      return (
        <CommonCard
          categoryType={props.categoryType}
          source={props.source}
          general={props.general}
          cta={props.cta}
        />
      );
    default:
      return null;
  }
};

export default ImpactCategoryCard;
