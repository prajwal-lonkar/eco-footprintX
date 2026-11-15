import styles from '../ImpactCategoryCard.module.scss';
import { formatUnitForDisplay } from '../utils/formatUnitForDisplay';

interface OffsetInfoBoxProps {
  offsetCarbonImpact?: boolean;
  offsetQuantity?: number | null;
  unit?: string;
}

const OffsetInfoBox = ({
  offsetCarbonImpact,
  offsetQuantity,
  unit,
}: OffsetInfoBoxProps) => {
  if (offsetCarbonImpact === false) return null;

  const formattedUnit = unit ? formatUnitForDisplay(unit) : '';
  const displayValue =
    offsetQuantity == null
      ? '---'
      : `${offsetQuantity} ${formattedUnit}`.trim();

  return (
    <div className={styles.offsetInfoBox}>
      <p>{displayValue} of above total has been offset</p>
    </div>
  );
};

export default OffsetInfoBox;
