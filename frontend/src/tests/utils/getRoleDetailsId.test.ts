import { describe, it, expect } from 'vitest';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import { getRoleDetailsId } from '@utils/getRoleDetailsId';

const ROLE_SLUGS = Object.values(SUPPLIER_ROLE_SLUGS);

describe('getRoleDetailsId', () => {
  it('returns _id for any role slug (retailer, manufacturer, etc.)', () => {
    const componentDetails: Record<string, { _id: string }> = {};
    for (const slug of ROLE_SLUGS) {
      componentDetails[`${slug}Details`] = { _id: `${slug}-id` };
    }

    for (const roleSlug of ROLE_SLUGS) {
      expect(getRoleDetailsId(componentDetails, roleSlug)).toBe(
        `${roleSlug}-id`
      );
    }
  });

  it('returns undefined when role slug does not map to a details key (fallback)', () => {
    const componentDetails = { retailerDetails: { _id: 'retailer-123' } };
    expect(getRoleDetailsId(componentDetails, 'unknownRole')).toBeUndefined();
    expect(getRoleDetailsId(null, 'retailer')).toBeUndefined();
  });
});
