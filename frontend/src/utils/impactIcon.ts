// impactStatus.ts

import carbonGreyIcon from '@assets/icons/carbon-grey.svg';
import carbonGreenIcon from '@assets/icons/carbon-green.svg';
import carbonRedIcon from '@assets/icons/carbon-red.svg';
import carbonYellowIcon from '@assets/icons/carbon-yellow.svg';
import carbonBlueIcon from '@assets/icons/carbon-blue.svg';

import waterGreyIcon from '@assets/icons/water-grey.svg';
import waterGreenIcon from '@assets/icons/water-green.svg';
import waterRedIcon from '@assets/icons/water-red.svg';
import waterYellowIcon from '@assets/icons/water-yellow.svg';
import waterBlueIcon from '@assets/icons/water-blue.svg';

import landGreyIcon from '@assets/icons/land-grey.svg';
import landGreenIcon from '@assets/icons/land-green.svg';
import landRedIcon from '@assets/icons/land-red.svg';
import landYellowIcon from '@assets/icons/land-yellow.svg';
import landBlueIcon from '@assets/icons/land-blue.svg';
import type {
  ImpactCategoryType,
  ImpactCategoryStatus,
} from '@common/ImpactCategoryCard/types';
import { IMPACT_CATEGORY_STATUSES } from '@common/ImpactCategoryCard/types';
import { TOOLTIP_TEXT } from '@constants/tooltips';

export const getImpactStatus = (
  actualValue: number | null | undefined,
  benchmarkValue: number | null | undefined,
  isImpactPresent?: boolean,
  isNewSupplierData: boolean = false
): ImpactCategoryStatus => {
  if (isNewSupplierData) return IMPACT_CATEGORY_STATUSES.BLUE;
  if (isImpactPresent === false) {
    return IMPACT_CATEGORY_STATUSES.GREEN;
  }

  if (actualValue == null || Number.isNaN(actualValue)) {
    return IMPACT_CATEGORY_STATUSES.GREY;
  }

  if (benchmarkValue == null || Number.isNaN(benchmarkValue)) {
    return IMPACT_CATEGORY_STATUSES.GREEN;
  }

  const lowerBound = benchmarkValue * 0.8;
  const upperBound = benchmarkValue * 1.2;

  if (actualValue < lowerBound) {
    return IMPACT_CATEGORY_STATUSES.GREEN;
  } else if (actualValue > upperBound) {
    return IMPACT_CATEGORY_STATUSES.RED;
  } else if (actualValue >= lowerBound && actualValue <= upperBound) {
    return IMPACT_CATEGORY_STATUSES.YELLOW;
  }
  return IMPACT_CATEGORY_STATUSES.GREY;
};

const iconMap: Record<
  ImpactCategoryType,
  Record<ImpactCategoryStatus, string>
> = {
  carbon: {
    grey: carbonGreyIcon,
    green: carbonGreenIcon,
    yellow: carbonYellowIcon,
    red: carbonRedIcon,
    blue: carbonBlueIcon,
  },
  water: {
    grey: waterGreyIcon,
    green: waterGreenIcon,
    yellow: waterYellowIcon,
    red: waterRedIcon,
    blue: waterBlueIcon,
  },
  land: {
    grey: landGreyIcon,
    green: landGreenIcon,
    yellow: landYellowIcon,
    red: landRedIcon,
    blue: landBlueIcon,
  },
};

export const getImpactIcon = (
  category: ImpactCategoryType,
  impactValue: number | null | undefined,
  benchmarkingDataValue: number | null | undefined,
  isImpactPresent?: boolean,
  isNewSupplierData: boolean = false
): string => {
  const resolvedStatus = getImpactStatus(
    impactValue,
    benchmarkingDataValue,
    isImpactPresent,
    isNewSupplierData
  );
  return iconMap[category][resolvedStatus];
};

export const getImpactTooltipText = (status: ImpactCategoryStatus,benchmarkingDataValue: number | null | undefined, isImpactPresent?: boolean): string =>
{
  if(isImpactPresent === false && status === IMPACT_CATEGORY_STATUSES.BLUE) {
    return TOOLTIP_TEXT.BLUE;
  }
  if (isImpactPresent === false) {
    return TOOLTIP_TEXT.GREEN;
  }

  if (status === IMPACT_CATEGORY_STATUSES.GREEN && (benchmarkingDataValue == null || Number.isNaN(benchmarkingDataValue))) {
    return TOOLTIP_TEXT.BENCHMARKING_DATA_NOT_AVAILABLE;
  }

  return TOOLTIP_TEXT[status.toUpperCase() as keyof typeof TOOLTIP_TEXT];
}
