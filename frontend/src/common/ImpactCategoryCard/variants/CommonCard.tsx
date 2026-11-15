import CardHeader from '../components/CardHeader';
import ImpactValue from '../components/ImpactValue';
import TemporaryDataMessage from '../components/TemporaryDataMessage';
import OffsetInfoBox from '../components/OffsetInfoBox';
import ProgressBar from '../components/ProgressBar';
import DataSourceFooter from '../components/DataSourceFooter';
import CtaRenderer from '../components/CtaRenderer';
import { getCategoryConfig } from '../utils/categoryConfig';
import type {
  ImpactCategoryType,
  ImpactCardSource,
  GeneralStatePayload,
  CtaConfig,
} from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface CommonCardProps {
  categoryType: ImpactCategoryType;
  source: ImpactCardSource;
  general: GeneralStatePayload;
  cta?: CtaConfig | CtaConfig[];
  hasTooltip?: boolean;
  tooltip?: string;
  tooltipIcon?: string;
}

const CommonCard = ({
  categoryType,
  source,
  general,
  cta,
  hasTooltip=true,
  tooltip,
  tooltipIcon,
}: CommonCardProps) => {
  const config = getCategoryConfig(categoryType);
  const {
    categoryIcon,
    impactValue,
    impactUnit,
    lciaMethod,
    dataSource,
    hideDataSourceFooter,
    progressValue,
    progressLabel,
    hideWarningBadge,
    isTemporaryData,
    hideTemporaryInfoMessage,
    reserveTemporaryDataSpace,
    dataUploadedBy,
    offsetQuantity,
    offsetUnit,
    offsetCarbonImpact,
    reserveOffsetSpace,
    footerContent,
  } = general;

  const displayUnit = impactUnit || config.defaultUnit;
  const showWarning =
    hideWarningBadge === true ? false : progressLabel?.comparison === 'more';
  const resolvedIcon =
    progressLabel?.cardColor && progressLabel.cardColor !== 'blue'
      ? config.icons[progressLabel.cardColor]
      : config.icon;
  const displayOffsetUnit = offsetUnit || displayUnit;
  const shouldShowOffsetInfo = offsetCarbonImpact === true;
  const shouldShowDataSourceFooter = !hideDataSourceFooter && !!(lciaMethod || dataSource);
  const shouldRenderBottomSection =
    shouldShowDataSourceFooter || !!dataUploadedBy || !!footerContent || !!cta;

  return (
    <div className={styles.impactCateItemWrapper}>
      <div className={styles.cardContent}>
        <div className={styles.categoryHeaderWrap}>
          <CardHeader
            icon={categoryIcon ?? tooltipIcon ?? resolvedIcon}
            title={config.displayName}
            hasTooltip={hasTooltip}
            tooltip={tooltip || config.tooltip}
            showWarning={showWarning}
          />
          <ImpactValue value={impactValue} unit={displayUnit} />
          {isTemporaryData && !hideTemporaryInfoMessage ? (
            <TemporaryDataMessage />
          ) : reserveTemporaryDataSpace ? (
            <p className={styles.temporaryInfo}>
              <span className={styles.placeholder}>&nbsp;</span>
            </p>
          ) : null}
        </div>

        {shouldShowOffsetInfo && (
          <OffsetInfoBox
            offsetCarbonImpact={offsetCarbonImpact}
            offsetQuantity={offsetQuantity}
            unit={displayOffsetUnit}
          />
        )}
        {!shouldShowOffsetInfo && reserveOffsetSpace && (
          <div className={styles.offsetInfoPlaceholder} />
        )}
      </div>
      <div className={styles.middleSection}>
        <ProgressBar progressValue={progressValue} progressLabel={progressLabel} source={source} />
      </div>
      {shouldRenderBottomSection && (
        <div className={styles.bottomSection}>
          {shouldShowDataSourceFooter && (
            <DataSourceFooter lciaMethod={lciaMethod} dataSource={dataSource} />
          )}
          {dataUploadedBy && (
            <div className={styles.impactData}>{`Data uploaded by ${dataUploadedBy}`}</div>
          )}
          {footerContent}
          <CtaRenderer cta={cta} />
        </div>
      )}
    </div>
  );
};

export default CommonCard;
