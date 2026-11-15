import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';

/** Known supplier role slug values — use union for strong typing */
export type SupplierRoleSlug =
  (typeof SUPPLIER_ROLE_SLUGS)[keyof typeof SUPPLIER_ROLE_SLUGS];

/**
 * Get the role-specific details _id from component details.
 * Safe fallback: returns undefined when componentDetails or roleSlug is invalid,
 * or when the role slug doesn't map to a details key (e.g. unknown role).
 */
export const getRoleDetailsId = (
  componentDetails: unknown,
  roleSlug: SupplierRoleSlug | string | null | undefined
): string | undefined => {
  if (!componentDetails || !roleSlug || typeof componentDetails !== 'object')
    return undefined;

  const obj = componentDetails as Record<string, unknown>;
  const detailsKey = `${roleSlug}Details`;
  const details = obj[detailsKey] as { _id?: string } | undefined;

  return details?._id;
};
