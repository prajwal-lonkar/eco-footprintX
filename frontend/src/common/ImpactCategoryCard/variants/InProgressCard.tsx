import CardHeader from '../components/CardHeader';
import ImpactValue from '../components/ImpactValue';
import InProgressMessage from '../components/InProgressMessage';
import DataSourceFooter from '../components/DataSourceFooter';
import CtaRenderer from '../components/CtaRenderer';
import { getCategoryConfig } from '../utils/categoryConfig';
import type {
  ImpactCategoryType,
  ImpactCardSource,
  CtaConfig,
} from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface InProgressCardProps {
  categoryType: ImpactCategoryType;
  source: ImpactCardSource;
  impactValue?: string | number;
  impactUnit?: string;
  lciaMethod?: string;
  dataSource?: string;
  cta?: CtaConfig | CtaConfig[];
}

const InProgressCard = ({
  categoryType,
  source,
  impactValue,
  impactUnit,
  lciaMethod,
  dataSource,
  cta,
}: InProgressCardProps) => {
  const config = getCategoryConfig(categoryType);
  const displayValue = impactValue ?? '----';
  const displayUnit = impactUnit || config.defaultUnit;

  return (
    <div className={styles.impactCateItemWrapper}>
      <div className={styles.cardContent}>
        <div className={styles.categoryHeaderWrap}>
          <CardHeader
            icon={config.icon}
            title={config.displayName}
            tooltip={config.tooltip}
          />
          <ImpactValue value={displayValue} unit={displayUnit} />
        </div>    
      </div>
      <div className={styles.middleSection}>
        <InProgressMessage source={source} />
      </div>
      <div className={styles.bottomSection}>
        <DataSourceFooter lciaMethod={lciaMethod} dataSource={dataSource} />
        <CtaRenderer cta={cta} />
      </div>
    </div>
  );
};

export default InProgressCard;

