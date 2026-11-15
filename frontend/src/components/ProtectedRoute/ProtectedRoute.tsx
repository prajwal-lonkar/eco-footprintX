import { Navigate } from 'react-router-dom';
import useAuthStore from '@store/useAuthStore';
import type { JSX } from 'react';
import { ROUTES } from '@constants/routes';
import type { AuthState } from '@type/auth';
import { USER_ROLES } from '@constants/auth';

export default function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: JSX.Element;
  allowedRole: string;
}) {
  const isAuthenticated = useAuthStore((state: AuthState) =>
    state.isAuthenticated()
  );
  const getRoleSlug = useAuthStore((state: AuthState) => state.getRoleSlug);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  const userRoleSlug = getRoleSlug();
  if (userRoleSlug !== allowedRole) {
    // Redirect to appropriate dashboard based on user's role
    if (userRoleSlug === USER_ROLES.COMPANY) {
      return <Navigate to={ROUTES.COMPANY.BASE} replace />;
    }
    if (userRoleSlug === USER_ROLES.SUPPLIER) {
      return <Navigate to={ROUTES.SUPPLIER.BASE} replace />;
    }
    // If role doesn't match any known role, redirect to login
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return children;
}
