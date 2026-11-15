import CardHeader from '@common/ImpactCategoryCard/components/CardHeader';
import ImpactValue from '@common/ImpactCategoryCard/components/ImpactValue';
import ProgressBar from '@common/ImpactCategoryCard/components/ProgressBar';
import { getCategoryConfig } from '@common/ImpactCategoryCard/utils/categoryConfig';
import type { ImpactCategoryType, ConsumerGeneralPayload } from '../types';
import sharedStyles from '@common/ImpactCategoryCard/ImpactCategoryCard.module.scss';
import consumerStyles from '../ConsumerImpactCategoryCard.module.scss';

interface ConsumerGeneralCardProps {
  categoryType: ImpactCategoryType;
  general: ConsumerGeneralPayload;
  tooltip?: string;
  tooltipIcon?: string;
}

const ConsumerGeneralCard = ({
  categoryType,
  general,
  tooltip,
  tooltipIcon,
}: ConsumerGeneralCardProps) => {
  const config = getCategoryConfig(categoryType);
  const { impactValue, impactUnit, progressValue, progressLabel } = general;

  const resolvedIcon =
    progressLabel?.cardColor && progressLabel.cardColor !== 'blue'
      ? config.icons[progressLabel.cardColor]
      : config.skyIcon;

  const displayUnit = impactUnit || config.defaultUnit;

  const hasBenchmarkData = progressValue != null && !!progressLabel;

  return (
    <div className={`${sharedStyles.impactCateItemWrapper} ${consumerStyles.consumerImpactCateItemWrapper}`}>
      <div className={sharedStyles.cardContent}>
        <div className={sharedStyles.categoryHeaderWrap}>
          <div className={consumerStyles.headerWrapper}>
            <CardHeader
              icon={resolvedIcon}
              title={config.displayName}
              hasTooltip={!!tooltip}
              tooltip={tooltip}
              tooltipIcon={tooltipIcon}
              showWarning={false}
              titleClassName={consumerStyles.consumerCategoryHeader}
            />
          </div>
          <ImpactValue
            value={impactValue}
            unit={displayUnit}
            wrapperClassName={consumerStyles.consumerInfoWrap}
            valueContainerClassName={consumerStyles.consumerImpactValueContainer}
            valueClassName={consumerStyles.consumerImpactValue}
            unitClassName={consumerStyles.consumerImpactUnit}
          />
        </div>
      </div>
      <div className={sharedStyles.middleSection}>
        {hasBenchmarkData ? (
          <ProgressBar progressValue={progressValue} progressLabel={progressLabel} source="product" />
        ) : (
          <div className={sharedStyles.progressBarWrapper}>
            <div className={`${sharedStyles.progressLabel} ${consumerStyles.noBenchmarkProgressLabel}`}>
              <div className={`${sharedStyles.progressTrack} ${consumerStyles.noBenchmarkProgressTrack}`} />
              <span>Industry average comparison unavailable</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerGeneralCard;
