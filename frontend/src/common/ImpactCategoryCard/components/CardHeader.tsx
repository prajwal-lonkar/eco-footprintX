import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import dangerIcon from '@assets/icons/danger.svg';
import styles from '../ImpactCategoryCard.module.scss';

interface CardHeaderProps {
  icon: string;
  title: string;
  hasTooltip?: boolean;
  tooltip?: string;
  tooltipIcon?: string;
  showWarning?: boolean;
  titleClassName?: string;
}
const CardHeader = ({
  icon,
  title,
  hasTooltip = true,
  tooltip,
  tooltipIcon,
  showWarning = false,
  titleClassName,
}: CardHeaderProps) => {
  return (
    <div className={styles.categoryHeader1}>
      <div className={`${styles.categoryHeader}${titleClassName ? ` ${titleClassName}` : ''}`}>
        <img src={icon} alt="logo" />
        {title}
      </div>
      <div className={styles.headerRightSection}>
        {showWarning && (
          <div className={styles.warningBadge}>
            <img src={dangerIcon} alt="warning" width={16} height={16} />
            <span>Warning</span>
          </div>
        )}
        {hasTooltip && (
          <Tooltip text={tooltip} noTruncate position="rightbottom">
            <img
              src={tooltipIcon ?? infoIcon}
              alt="info"
              className={styles.infoIcon}
              width={16}
              height={16}
              style={{ cursor: 'pointer' }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default CardHeader;

