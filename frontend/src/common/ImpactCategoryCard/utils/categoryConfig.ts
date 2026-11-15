import carbonSkyIcon from '@assets/images/co2.svg';
import waterSkyIcon from '@assets/images/water.svg';
import landSkyIcon from '@assets/images/land.svg';
import carbonGreen from '@assets/icons/carbon-green.svg';
import carbonRed from '@assets/icons/carbon-red.svg';
import carbonYellow from '@assets/icons/carbon-yellow.svg';
import waterGreen from '@assets/icons/water-green.svg';
import waterRed from '@assets/icons/water-red.svg';
import waterYellow from '@assets/icons/water-yellow.svg';
import landGreen from '@assets/icons/land-green.svg';
import landRed from '@assets/icons/land-red.svg';
import landYellow from '@assets/icons/land-yellow.svg';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import type { ImpactCategoryType } from '../types';
import carbonGrey from '@assets/icons/carbon-grey.svg'
import waterGrey from '@assets/icons/water-grey.svg'
import landGrey from '@assets/icons/land-grey.svg'


export interface CategoryConfig {
  icon: string;
  skyIcon: string;
  icons: {
    red: string;
    yellow: string;
    green: string;
  };
  tooltip: string;
  defaultUnit: string;
  displayName: string;
}

export const getCategoryConfig = (
  categoryType: ImpactCategoryType
): CategoryConfig => {
  const configMap: Record<ImpactCategoryType, CategoryConfig> = {
    carbon: {
      icon: carbonGrey,
      skyIcon: carbonSkyIcon,
      icons: {
        red: carbonRed,
        yellow: carbonYellow,
        green: carbonGreen,
      },
      tooltip: TOOLTIP_TEXT.CARBON_IMPACT,
      defaultUnit: 'kg CO₂-eq/unit',
      displayName: 'Carbon',
    },
    water: {
      icon: waterGrey,
      skyIcon:waterSkyIcon,
      icons: {
        red: waterRed,
        yellow: waterYellow,
        green: waterGreen,
      },
      tooltip: TOOLTIP_TEXT.WATER_IMPACT,
      defaultUnit: 'm³/unit',
      displayName: 'Water',
    },
    land: {
      icon: landGrey,
      skyIcon:landSkyIcon,
      icons: {
        red: landRed,
        yellow: landYellow,
        green: landGreen,
      },
      tooltip: TOOLTIP_TEXT.LAND_IMPACT,
      defaultUnit: 'm²/unit',
      displayName: 'Land',
    },
  };

  return configMap[categoryType];
};
