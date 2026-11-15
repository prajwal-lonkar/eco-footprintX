import CardHeader from '../components/CardHeader';
import ImpactValue from '../components/ImpactValue';
import NoImpactMessage from '../components/NoImpactMessage';
import CtaRenderer from '../components/CtaRenderer';
import { getCategoryConfig } from '../utils/categoryConfig';
import type { ImpactCategoryType, ImpactCardSource, CtaConfig } from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface NoImpactCardProps {
  categoryType: ImpactCategoryType;
  source: ImpactCardSource;
  cta?: CtaConfig | CtaConfig[];
  dataUploadedBy?: string;
  categoryIcon?: string;
  footerContent?: React.ReactNode;
}

const NoImpactCard = ({
  categoryType,
  source,
  cta,
  dataUploadedBy,
  categoryIcon,
  footerContent,
}: NoImpactCardProps) => {
  const config = getCategoryConfig(categoryType);

  return (
    <div className={styles.impactCateItemWrapper}>
      <div className={`${styles.cardContent} ${styles.noImpactCardContent}`}>
        <div className={styles.categoryHeaderWrap}>
          <CardHeader
            icon={categoryIcon ?? config.icons.green}
            title={config.displayName}
            tooltip={config.tooltip}
          />
          <ImpactValue value="0.00" unit="No Impact" />
        </div>
      </div>
      <div className={styles.noImpactBottomSection}>
        <NoImpactMessage categoryType={categoryType} source={source} />
      </div>
      {(dataUploadedBy || cta || footerContent) && (
        <div className={styles.bottomSection}>
          {dataUploadedBy && (
            <div
              className={styles.impactData}
            >{`Data uploaded by ${dataUploadedBy}`}</div>
          )}
          {footerContent}
          <CtaRenderer cta={cta} />
        </div>
      )}
    </div>
  );
};

export default NoImpactCard;
