import CardHeader from '../components/CardHeader';
import ImpactValue from '../components/ImpactValue';
import StatusMessage from '../components/StatusMessage';
import CtaRenderer from '../components/CtaRenderer';
import { getCategoryConfig } from '../utils/categoryConfig';
import type {
  ImpactCategoryType,
  ImpactCardSource,
  CtaConfig,
} from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface NoDataCardProps {
  categoryType: ImpactCategoryType;
  source: ImpactCardSource;
  cta?: CtaConfig | CtaConfig[];
}

const NoDataCard = ({ categoryType, source: _source, cta }: NoDataCardProps) => {
  const config = getCategoryConfig(categoryType);

  return (
    <div className={styles.impactCateItemWrapperNoData}>
      <div className={styles.cardContent}>
        <div className={styles.categoryHeaderWrap}>
          <CardHeader
            icon={config.icon}
            title={config.displayName}
            tooltip={config.tooltip}
          />
          <ImpactValue value="----" unit={config.defaultUnit} />
        </div>
      </div>
      <div className={styles.noDataBottomSection}>
        <StatusMessage message="Data yet to be uploaded." />      
      </div>
      <CtaRenderer cta={cta} />
    </div>
  );
};

export default NoDataCard;

