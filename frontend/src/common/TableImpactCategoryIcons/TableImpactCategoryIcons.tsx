import styles from './TableImpactCategoryIcons.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import {
  getImpactIcon,
  getImpactStatus,
  getImpactTooltipText,
} from '@utils/impactIcon';
import type { Impacts, BenchmarkingData } from '@type/supplier';
import type { ImpactCategoryType } from '@common/ImpactCategoryCard/types';

export const IMPACT_CATEGORY_ORDER: ImpactCategoryType[] = [
  'carbon',
  'water',
  'land',
];

const BENCHMARK_KEY_MAP: Record<ImpactCategoryType, keyof BenchmarkingData> = {
  carbon: 'carbonBenchmarkingData',
  water: 'waterBenchmarkingData',
  land: 'landBenchmarkingData',
};

type TableImpactCategoryIconsProps = {
  impacts?: Impacts;
  benchmarkingData?: BenchmarkingData | null;
  showTooltips?: boolean;
  className?: string;
  emptyState?: boolean;
};

export const TableImpactCategoryIcons = ({
  impacts,
  benchmarkingData,
  showTooltips = true,
  className,
}: TableImpactCategoryIconsProps) => {

  if (!impacts ) {
    <div className={`${styles.iconWrapper} ${className ?? ''}`.trim()}>-</div>
  }

  return (
    <div className={`${styles.iconWrapper} ${className ?? ''}`.trim()}>
      {IMPACT_CATEGORY_ORDER.filter((category) => impacts?.[category] !== undefined
      ).map((category) => {
        const impactData = impacts?.[category];
        const benchmarkKey = BENCHMARK_KEY_MAP[category];
        const benchmarkValue = Number(benchmarkingData?.[benchmarkKey]);
        const { quantity, isImpactPresent, isProspective } = impactData ?? {};
        const resolvedStatus = getImpactStatus(
          quantity,
          benchmarkValue,
          isImpactPresent,
          isProspective === true
        );

        const iconSrc = getImpactIcon(
          category,
          quantity,
          benchmarkValue,
          isImpactPresent,
          isProspective === true
        );
        const tooltipText = getImpactTooltipText(resolvedStatus,benchmarkValue, isImpactPresent);

        const icon = (
          <img
            src={iconSrc}
            alt={`${category} impact category`}
            className={styles.iconImg}
          />
        );

        return showTooltips && tooltipText ? (
          <Tooltip key={category} text={tooltipText}>
            <span>{icon}</span>
          </Tooltip>
        ) : (
          <span key={category}>{icon}</span>
        );
      })}
    </div>
  );
};
