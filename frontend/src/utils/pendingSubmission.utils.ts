import carbonBlueIcon from '@assets/icons/carbon-blue.svg';
import waterBlueIcon from '@assets/icons/water-blue.svg';
import landBlueIcon from '@assets/icons/land-blue.svg';
import type {
  ImpactCategoryType,
  ImpactCategoryItemWithPending,
} from '@common/ImpactCategoryCard';
import type { ImpactCategoryData, ImpactCategoryItem } from '@type/supplier';
import type { ApprovedCategoryPayload } from '@service/company.service';

export const mapDataSourceToLabel = (dataSource?: string | null) => {
  const normalized = (dataSource ?? '').trim().toLowerCase();
  if (normalized === 'manual') return 'Manual Input';
  if (normalized === 'database') return 'Database';
  if (normalized === 'supplier') return 'Supplier';
  if (normalized === 'temporary data') return 'Temporary Data';
  if (!normalized) return undefined;
  return dataSource ?? undefined;
};

export const PENDING_COMPARE_ICONS: Record<ImpactCategoryType, string> = {
  carbon: carbonBlueIcon,
  water: waterBlueIcon,
  land: landBlueIcon,
};

export const buildApprovedCategoriesPayload = (
  selectedKeys: readonly ImpactCategoryType[],
  impactCategoryData: ImpactCategoryData | null
): ApprovedCategoryPayload[] => {
  if (!impactCategoryData || selectedKeys.length === 0) return [];

  const result: ApprovedCategoryPayload[] = [];

  for (const key of selectedKeys) {
    const item = impactCategoryData[key] as
      | ImpactCategoryItemWithPending<ImpactCategoryItem>
      | undefined;

    const pendingVersion = item?.pendingSupplierSubmission?.versionNumber;
    if (pendingVersion != null) {
      result.push({ impactCategory: key, versionNumber: pendingVersion });
      continue;
    }

    const previousVersion =
      impactCategoryData.latestPreviousCompanySubmittedVersion?.[key]
        ?.versionNumber;
    if (previousVersion != null) {
      result.push({ impactCategory: key, versionNumber: previousVersion });
    }
  }

  return result;
};
