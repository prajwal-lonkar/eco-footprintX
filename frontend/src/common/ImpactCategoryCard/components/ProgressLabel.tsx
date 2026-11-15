import type { ImpactProgressLabel } from '../types';
import { formatImpactProgressLabel } from '../utils/formatters';
import styles from '../ImpactCategoryCard.module.scss';

interface DataLabelProps {
  dataLabel: ImpactProgressLabel;
}

const DataLabel = ({ dataLabel }: DataLabelProps) => {
  const formattedText = formatImpactProgressLabel(dataLabel);

  return (
    <div className={styles.dataLabel}>
      <p>{formattedText.boldText} {formattedText.regularText}</p>
    </div>
  );
};

export default DataLabel;

