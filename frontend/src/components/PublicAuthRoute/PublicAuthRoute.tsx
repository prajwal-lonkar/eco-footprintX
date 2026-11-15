import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import useAuthStore from '@store/useAuthStore';
import type { AuthState } from '@type/auth';
import { USER_ROLES } from '@constants/auth';
import { ROUTES } from '@constants/routes';

export default function PublicAuthRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const isAuthenticated = useAuthStore((state: AuthState) =>
    state.isAuthenticated()
  );
  const getRoleSlug = useAuthStore((state: AuthState) => state.getRoleSlug);

  if (!isAuthenticated) {
    return children;
  }

  const userRoleSlug = getRoleSlug();
  if (userRoleSlug === USER_ROLES.COMPANY) {
    return <Navigate to={ROUTES.COMPANY.BASE} replace />;
  }
  if (userRoleSlug === USER_ROLES.SUPPLIER) {
    return <Navigate to={ROUTES.SUPPLIER.BASE} replace />;
  }

  return children;
}
