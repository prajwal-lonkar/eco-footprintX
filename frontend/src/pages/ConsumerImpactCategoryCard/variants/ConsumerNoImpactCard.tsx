import CardHeader from '@common/ImpactCategoryCard/components/CardHeader';
import { getCategoryConfig } from '@common/ImpactCategoryCard/utils/categoryConfig';
import type { ImpactCategoryType } from '../types';
import sharedStyles from '@common/ImpactCategoryCard/ImpactCategoryCard.module.scss';
import styles from '../ConsumerImpactCategoryCard.module.scss';

interface ConsumerNoImpactCardProps {
  categoryType: ImpactCategoryType;
  tooltip?: string;
}

const ConsumerNoImpactCard = ({ categoryType, tooltip }: ConsumerNoImpactCardProps) => {
  const config = getCategoryConfig(categoryType);

  return (
    <div className={`${sharedStyles.impactCateItemWrapper} ${styles.consumerImpactCateItemWrapper}`}>
      <div className={`${sharedStyles.cardContent} ${styles.consumerNoImpactCardContent}`}>
        <div className={sharedStyles.categoryHeaderWrap}>
          <div className={styles.headerWrapper}>
            <CardHeader
              icon={config.skyIcon}
              title={config.displayName}
              hasTooltip={!!tooltip}
              tooltip={tooltip}
              showWarning={false}
              titleClassName={styles.consumerCategoryHeader}
            />
          </div>
        </div>
        <p className={styles.consumerNoImpactMessage}>
          Great news! This product has no impact on {config.displayName} usage.
        </p>
      </div>
    </div>
  );
};

export default ConsumerNoImpactCard;
