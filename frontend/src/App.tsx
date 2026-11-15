import './App.css';
import { useEffect, lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from '@pages/PageNotFound/PageNotFound';
import CustomAlert from '@common/CustomAlert/CustomAlert';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ROUTES } from '@constants/routes';
import AuthLayout from '@common/AuthLayout/AuthLayout';
import { initializeAuth } from '@store/useAuthStore';
import ResolutionModal from '@components/ResolutionModal/ResolutionModal';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';
import ProtectedRoute from '@components/ProtectedRoute/ProtectedRoute';
import PublicAuthRoute from '@components/PublicAuthRoute/PublicAuthRoute';
import { USER_ROLES } from '@constants/auth';
import RouteLoader from '@common/RouteLoader/RouteLoader';

const CompanyDashboard = lazy(
  () => import('@pages/Dashboard/CompanyDashboard/CompanyDashboard')
);
const SupplierDashboard = lazy(
  () => import('@pages/Dashboard/SupplierDashboard/SupplierDashboard')
);
const Login = lazy(() => import('@pages/auth/Login/Login'));
const SignUp = lazy(() => import('@pages/auth/SignUp/SignUp'));
const ForgotPassword = lazy(
  () => import('@pages/auth/ForgotPassword/ForgotPassword')
);
const ResetPassword = lazy(
  () => import('@pages/auth/ResetPassword/ResetPassword')
);
const ConsumerEnvironmentalProfile = lazy(
  () => import('@pages/ConsumerEnvironmentalProfile/ConsumerEnvironmentalProfile')
);

function App() {
  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <>
      <ResolutionModal />
      <CustomAlert />
      <SpinnerLoader />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <PublicAuthRoute>
                <Navigate to={ROUTES.AUTH.LOGIN} replace />
              </PublicAuthRoute>
            }
          />

          <Route
            path={`${ROUTES.COMPANY.BASE}/*`}
            element={
              <ProtectedRoute allowedRole={USER_ROLES.COMPANY}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path={`${ROUTES.SUPPLIER.BASE}/*`}
            element={
              <ProtectedRoute allowedRole={USER_ROLES.SUPPLIER}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.AUTH.LOGIN}
            element={
              <PublicAuthRoute>
                <AuthLayout>
                  <Login />
                </AuthLayout>
              </PublicAuthRoute>
            }
          />
          <Route
            path={ROUTES.AUTH.SIGN_UP}
            element={
              <AuthLayout>
                <SignUp />
              </AuthLayout>
            }
          />
          <Route
            path={ROUTES.AUTH.FORGOT_PASSWORD}
            element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            }
          />
          <Route
            path={ROUTES.AUTH.RESET_PASSWORD}
            element={
              <AuthLayout>
                <ResetPassword />
              </AuthLayout>
            }
          />

          <Route path={ROUTES.NOT_FOUND} element={<PageNotFound />} />
          <Route
            path="/01/:gtin"
            element={<ConsumerEnvironmentalProfile />}
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
