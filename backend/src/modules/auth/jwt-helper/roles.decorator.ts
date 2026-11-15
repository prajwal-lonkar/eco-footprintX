import { SetMetadata } from '@nestjs/common';

export enum RoleSlug {
  ADMIN = 'admin_user',
  COMPANY = 'company_user',
  SUPPLIER = 'supplier_user',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to specific user roles.
 * Must be used together with RolesGuard (after JwtAuthGuard).
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RoleSlug.ADMIN)
 * async adminOnlyRoute() {}
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RoleSlug.ADMIN, RoleSlug.COMPANY)
 * async adminOrCompanyRoute() {}
 */
export const Roles = (...roles: RoleSlug[]) => SetMetadata(ROLES_KEY, roles);
