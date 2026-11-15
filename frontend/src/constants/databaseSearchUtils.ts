import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import type {
  ImpactCategory,
  ImpactDatabaseSearchResultRow,
  IndustryBenchmarkingResultItem,
  SearchDatabaseFormData,
} from '@type/built-enviromental-profile';

// Re-export so existing consumers of ImpactCategory from this module keep working.
export type { ImpactCategory };

/** Union of all valid supplier role slug values. */
export type SupplierRoleSlug =
  (typeof SUPPLIER_ROLE_SLUGS)[keyof typeof SUPPLIER_ROLE_SLUGS];

/** Non-display fields in ImpactDatabaseSearchResultRow that are not table columns. */
type NonDisplayRowFields = 'id' | 'value' | 'industryComparison';

/**
 * Valid keys that can appear as result-table column identifiers.
 */
export type ResultColumnKey = Exclude<
  keyof ImpactDatabaseSearchResultRow,
  NonDisplayRowFields
>;

export type DatabaseSearchApiParams = {
  lciaMethod: string;
  referenceProductName?: string;
  geography?: string;
  casNumber?: string;
  isicSection?: string;
};

export type ResultColumnDef = {
  key: ResultColumnKey;
  label: string;
  headerTooltip?: string;
  width?: string;
};

// Constants

/** Roles that only require Supplier Location + LCIA Methodology filters. */
export const ROLES_SUPPLIER_LOCATION_LCIA_ONLY = [
  SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT,
  SUPPLIER_ROLE_SLUGS.CPG_BRAND,
  SUPPLIER_ROLE_SLUGS.RETAILER,
  SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER,
] as const;

/** Check if a supplier role only requires Location + LCIA filters. */
export function isLocationLciaOnlyRole(slug: string): boolean {
  return ROLES_SUPPLIER_LOCATION_LCIA_ONLY.includes(
    slug as (typeof ROLES_SUPPLIER_LOCATION_LCIA_ONLY)[number]
  );
}

// Build API Params

/** Pre-trimmed field values passed to each role strategy. */
type ParamBuilderContext = {
  lciaMethod: string;
  referenceProductName: string;
  geography: string;
  casNumber: string;
  isicSection: string;
};

type ParamBuilderFn = (
  ctx: ParamBuilderContext
) => DatabaseSearchApiParams | null;

/**
 * Storage / CPG Brand / Retailer shared strategy.
 * Required: lciaMethod + geography.
 */
const locationLciaStrategy: ParamBuilderFn = (ctx) => {
  if (!ctx.lciaMethod || !ctx.geography) return null;
  return { lciaMethod: ctx.lciaMethod, geography: ctx.geography };
};

/**
 * Per-role strategy map for building search API params.
 * Each function returns `null` when minimum required fields are missing.
 */
const roleParamStrategies: Record<string, ParamBuilderFn> = {
  /**
   * Raw Materials: lciaMethod + referenceProductName required.
   * Optional: casNumber, geography, isicSection.
   */
  [SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR]: (ctx) => {
    if (!ctx.lciaMethod || !ctx.referenceProductName) return null;
    const params: DatabaseSearchApiParams = {
      lciaMethod: ctx.lciaMethod,
      referenceProductName: ctx.referenceProductName,
    };
    if (ctx.casNumber) params.casNumber = ctx.casNumber;
    if (ctx.geography) params.geography = ctx.geography;
    if (ctx.isicSection) params.isicSection = ctx.isicSection;
    return params;
  },

  /**
   * Transport & Freight: lciaMethod + referenceProductName + geography required.
   */
  [SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT]: (ctx) => {
    if (!ctx.lciaMethod || !ctx.referenceProductName || !ctx.geography)
      return null;
    return {
      lciaMethod: ctx.lciaMethod,
      referenceProductName: ctx.referenceProductName,
      geography: ctx.geography,
    };
  },

  /**
   * Packaging: lciaMethod + referenceProductName required.
   * Optional: geography.
   */
  [SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR]: (ctx) => {
    if (!ctx.lciaMethod || !ctx.referenceProductName) return null;
    const params: DatabaseSearchApiParams = {
      lciaMethod: ctx.lciaMethod,
      referenceProductName: ctx.referenceProductName,
    };
    if (ctx.geography) params.geography = ctx.geography;
    return params;
  },

  /** Storage & Fulfilment: lciaMethod + geography required. */
  [SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT]: locationLciaStrategy,

  /** CPG Brand: lciaMethod + geography required. */
  [SUPPLIER_ROLE_SLUGS.CPG_BRAND]: locationLciaStrategy,

  /** Retailer: lciaMethod + geography required. */
  [SUPPLIER_ROLE_SLUGS.RETAILER]: locationLciaStrategy,

  /**
   * Contract Manufacturer: lciaMethod + geography required.
   * Optional: referenceProductName.
   */
  [SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER]: (ctx) => {
    if (!ctx.lciaMethod || !ctx.geography) return null;
    const params: DatabaseSearchApiParams = {
      lciaMethod: ctx.lciaMethod,
      geography: ctx.geography,
    };
    if (ctx.referenceProductName)
      params.referenceProductName = ctx.referenceProductName;
    return params;
  },
};

/**
 * Build API params for database search from SearchDatabaseFormData.

 */
export function buildDatabaseSearchParams(
  formData: SearchDatabaseFormData,
  supplierRoleSlug: string
): DatabaseSearchApiParams | null {
  const ctx: ParamBuilderContext = {
    lciaMethod: (formData.lciaMethodology || '').trim(),
    referenceProductName:
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
        ? (formData.transportMethod || '').trim()
        : (formData.componentName || '').trim(),
    geography:
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
        ? (formData.transportRegion || '').trim()
        : (formData.supplierLocation || '').trim(),
    casNumber: (formData.casNumber || '').trim(),
    isicSection: (formData.industry || '').trim(),
  };

  const strategy = roleParamStrategies[supplierRoleSlug];
  if (strategy) return strategy(ctx);

  // Fallback: only lciaMethod is required
  if (!ctx.lciaMethod) return null;
  return { lciaMethod: ctx.lciaMethod };
}

// ── Column Config (role-to-columns) ──────────────────────────────────────

const COLUMN_WIDTHS_5 = ['180px', '210px', '90px', '80px', '80px'] as const;
const COLUMN_WIDTHS_4 = ['180px', '260px', '140px', '140px'] as const;

/** Standard 4-column layout used by most roles. */
const STANDARD_COLUMNS: ResultColumnDef[] = [
  {
    key: 'componentOrServiceName',
    label: 'Component or Service Name',
    width: COLUMN_WIDTHS_4[0],
  },
  {
    key: 'activityDescription',
    label: 'Activity Description',
    headerTooltip: TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
    width: COLUMN_WIDTHS_4[1],
  },
  {
    key: 'supplierLocation',
    label: 'Supplier Location',
    width: COLUMN_WIDTHS_4[2],
  },
  {
    key: 'lciaMethodology',
    label: 'LCIA Methodology',
    width: COLUMN_WIDTHS_4[3],
  },
];

/** Per-role column overrides (only roles that differ from STANDARD_COLUMNS). */
const roleColumnOverrides: Record<string, ResultColumnDef[]> = {
  [SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR]: [
    {
      key: 'componentOrServiceName',
      label: 'Component or Service Name',
      width: COLUMN_WIDTHS_5[0],
    },
    {
      key: 'activityDescription',
      label: 'Activity Description',
      headerTooltip: TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
      width: COLUMN_WIDTHS_5[1],
    },
    {
      key: 'supplierLocation',
      label: 'Supplier Location',
      width: COLUMN_WIDTHS_5[2],
    },
    { key: 'lciaMethodology', label: 'LCIA', width: COLUMN_WIDTHS_5[3] },
    { key: 'casNumber', label: 'CAS Number', width: COLUMN_WIDTHS_5[4] },
  ],

  [SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT]: [
    {
      key: 'transportMethod',
      label: 'Transport Method',
      width: COLUMN_WIDTHS_4[0],
    },
    {
      key: 'transportDescription',
      label: 'Transport Description',
      width: COLUMN_WIDTHS_4[1],
    },
    {
      key: 'transportRegion',
      label: 'Transport Region',
      width: COLUMN_WIDTHS_4[2],
    },
    {
      key: 'lciaMethodology',
      label: 'LCIA Methodology',
      width: COLUMN_WIDTHS_4[3],
    },
  ],
};

/** Return the result-table columns for a given supplier role. */
export function getResultColumnsForRole(
  supplierRoleSlug: string
): ResultColumnDef[] {
  return roleColumnOverrides[supplierRoleSlug] ?? STANDARD_COLUMNS;
}

// Map API Response

/**
 * Map API result items to impact database table rows.
 */
export function mapApiResponseToTableRows(
  items: IndustryBenchmarkingResultItem[],
  supplierRoleSlug: string,
  _lciaMethod: string,
  impactType: ImpactCategory
): ImpactDatabaseSearchResultRow[] {
  return items.map((item) => {
    const impactsObj = item.impacts ?? {};
    const lciaMethodFromApi =
      Object.keys(impactsObj).find((key) => key !== '_id') || '';

    const impactByMethod = lciaMethodFromApi
      ? impactsObj[lciaMethodFromApi]
      : null;
    const value =
      impactByMethod &&
      (impactType === 'carbon'
        ? impactByMethod.carbon
        : impactType === 'water'
          ? impactByMethod.water
          : impactByMethod.land);

    // Base row for all supplier types
    const row: ImpactDatabaseSearchResultRow = {
      id: item._id,
      componentOrServiceName: item.referenceProductName,
      activityDescription: item.activityName,
      supplierLocation: item.geography,
      casNumber: item.casNumber ?? undefined,
      lciaMethodology: lciaMethodFromApi,
      value: value != null ? value : undefined,
    };

    // Transport and Freight specific mapping
    if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
      row.transportMethod = item.referenceProductName;
      row.transportDescription = item.cpcClassification;
      row.transportRegion = item.geography;
    }

    return row;
  });
}
