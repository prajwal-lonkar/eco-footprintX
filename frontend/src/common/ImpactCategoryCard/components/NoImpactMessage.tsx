import type { ImpactCategoryType, ImpactCardSource } from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface NoImpactMessageProps {
  categoryType: ImpactCategoryType;
  source: ImpactCardSource;
}

const NoImpactMessage = ({ categoryType, source }: NoImpactMessageProps) => {
  const categoryMap: Record<ImpactCategoryType, string> = {
    carbon: 'carbon',
    water: 'water',
    land: 'land',
  };

  const sourceText = source === 'product' ? 'product' : 'component or service';
  const categoryText = categoryMap[categoryType];

  return (
    <div className={styles.noImpactBox}>
      <h3>Great news!</h3>
      <p>
        This {sourceText} has no reported impact on {categoryText} usage.
      </p>
    </div>
  );
};

export default NoImpactMessage;

