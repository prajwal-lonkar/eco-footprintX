import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RoleSlug } from './roles.decorator';

/**
 * Guard that enforces role-based access control.
 *
 * - Must always be used AFTER JwtAuthGuard (relies on request.user set by JwtStrategy).
 * - If no @Roles() decorator is present on the route, access is granted to all authenticated users.
 * - If @Roles() is present, the user's roleSlug (from JWT payload) must match one of the listed roles.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(RoleSlug.ADMIN)
 *   async myRoute() {}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleSlug[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator — allow any authenticated user through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRoleSlug: string = request.user?.payload?.userRoleSlug;

    if (!userRoleSlug || !requiredRoles.includes(userRoleSlug as RoleSlug)) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
