import type { FC } from 'react';
import styles from './IndustryAvgPlaceholderStatus.module.scss';
import type { BenchmarkStatus } from '@utils/industryAvgComparison';
import { getBenchmarkStatusLabel } from '@utils/industryAvgComparison';

import higherImpactIcon from '@assets/icons/higherImpact.svg';
import lowerImpactIcon from '@assets/icons/lowerImpact.svg';
import warningIcon from '@assets/icons/warning.svg';

interface IndustryAvgPlaceholderStatusProps {
  status: BenchmarkStatus;
  className?: string;
}

/**
 * Gets the appropriate icon for the status.
 */
const getStatusIcon = (status: BenchmarkStatus): string | null => {
  switch (status) {
    case 'higher':
      return higherImpactIcon;
    case 'similar':
      return warningIcon;
    case 'lower':
      return lowerImpactIcon;
    default:
      return null;
  }
};

/**

* Displays the industry comparison status.

 */
const IndustryAvgPlaceholderStatus: FC<IndustryAvgPlaceholderStatusProps> = ({
  status,
  className = '',
}) => {
  if (!status) return null;

  const label = getBenchmarkStatusLabel(status);
  const icon = getStatusIcon(status);
  if (!label) return null;

  const statusClass =
    status === 'higher'
      ? styles.higher
      : status === 'similar'
        ? styles.similar
        : styles.lower;

  return (
    <div className={`${styles.container} ${statusClass} ${className}`}>
      {icon && (
        <img src={icon} alt="" className={styles.icon} aria-hidden="true" />
      )}
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default IndustryAvgPlaceholderStatus;
