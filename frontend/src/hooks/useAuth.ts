import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import useAuthStore from '@store/useAuthStore';
import { ROUTES } from '@constants/routes';
import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import type { ApiResponse, LoginData, LoginPayload } from '@type/auth';
import Bugsnag from '@utils/bugsnag';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';
import { USER_ROLES } from '@constants/auth';

/**
 * Authentication hook with secure cookie-based JWT flow
 * - Access token stored in memory/sessionStorage
 * - Refresh token stored in HttpOnly cookie (managed by backend)
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();
  const { login, logout } = useAuthStore();

  /**
   * Login user with credentials
   * Backend sets refresh token as HttpOnly cookie
   */
  const handleLogin = async (
    payload: LoginPayload,
    redirectTo?: string | null
  ) => {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginData>>(
        ENDPOINTS.AUTH.LOGIN,
        payload
      );

      const { accessToken, isEmailVerified, roleSlug } = response.data.data!;

      // Store access token and extract user data (with verification)
      await login(accessToken, roleSlug);

      // Check if email is verified
      if (!isEmailVerified) {
        // Navigate to SignUp OTP verification step
        navigate(ROUTES.AUTH.SIGN_UP, {
          state: { step: 4, email: payload.email },
        });
        return { success: true, data: response.data };
      }

      // Navigate based on user role
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        const error = new Error('User state missing after login');
        Bugsnag.notify(error, (event) => {
          event.addMetadata('context', {
            component: 'useAuth',
            method: 'handleLogin',
          });
        });
        showAlert(ERROR_MESSAGES.USER_STATE_MISSING, 'danger');
        return { success: false, data: response.data, alertShown: true };
      }

      if (!roleSlug) {
        const error = new Error('User role missing after login');
        Bugsnag.notify(error, (event) => {
          event.addMetadata('context', {
            component: 'useAuth',
            method: 'handleLogin',
          });
        });
        showAlert(ERROR_MESSAGES.USER_ROLE_MISSING, 'danger');
        return { success: false, data: response.data, alertShown: true };
      }

      if (redirectTo) {
        navigate(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`);
        return { success: true, data: response.data };
      }
      switch (roleSlug) {
        case USER_ROLES.COMPANY:
          navigate(ROUTES.COMPANY.BASE, { replace: true });
          break;
        case USER_ROLES.SUPPLIER:
          navigate(ROUTES.SUPPLIER.BASE, { replace: true });
          break;
        default:
          navigate(ROUTES.DASHBOARD, { replace: true });
          break;
      }

      return { success: true, data: response.data };
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<LoginData>>;
      const statusCode = axiosError.response?.status;

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'useAuth',
          method: 'handleLogin',
        });
      });

      // Don't show alert here - let the component handle specific error cases
      return {
        success: false,
        statusCode,
        data: axiosError.response?.data,
        code: axiosError.response?.data?.code,
        message: axiosError.response?.data?.message,
      };
    }
  };

  /**
   * Logout user and clear session
   * Backend clears refresh token cookie
   */
  const handleLogout = async () => {
    try {
      // Call backend to clear refresh cookie
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      // Continue with logout even if backend call fails
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'useAuth',
          method: 'handleLogout',
        });
      });
    } finally {
      // Clear local state and redirect
      logout();
      navigate(ROUTES.AUTH.LOGIN);
    }
  };

  return { handleLogin, handleLogout };
};
