import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import useAuthStore from '@store/useAuthStore';
import { getAccessToken, isTokenValid } from '@utils/tokenHelper';
import { ENDPOINTS, PUBLIC_ENDPOINTS } from '@constants/endpoint';
import { ROUTES } from '@constants/routes';
import type { ApiResponse } from '@type/auth';
import Bugsnag from '@utils/bugsnag';

/**
 * Axios instance with secure JWT cookie-based authentication
 * - Access tokens stored in memory/sessionStorage
 * - Refresh tokens stored in HttpOnly cookies (managed by backend)
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Enable cookie handling for refresh tokens
  headers: { 'ngrok-skip-browser-warning': '69420' },
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Request interceptor: Verify and attach access token, handle pre-emptive refresh
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    const url = config.url || '';

    // Skip auth for PUBLIC endpoints
    if (PUBLIC_ENDPOINTS.some((p) => url.includes(p))) {
      return config;
    }

    const token = getAccessToken();

    if (token) {
      // Verify token signature and check expiry before using
      const isValid = await isTokenValid();

      if (!isValid) {
        // Token invalid or expired - refresh it
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = axios
              .post<ApiResponse<{ accessToken: string }>>(
                `${import.meta.env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
                {}, // Empty body - refresh token is in cookie
                { withCredentials: true }
              )
              .then(async (response) => {
                const { accessToken } = response.data.data!;
                await useAuthStore.getState().updateAccessToken(accessToken);
                return accessToken;
              })
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }

          const newToken = await refreshPromise;
          if (config.headers && newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (error) {
          Bugsnag.notify(error as Error, (event) => {
            event.addMetadata('context', {
              component: 'ApiService',
              method: 'requestInterceptor',
            });
          });
          useAuthStore.getState().logout();
          window.location.href = ROUTES.AUTH.LOGIN;
          return Promise.reject(error);
        }
      } else if (config.headers) {
        // Token is valid - attach to request
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    Bugsnag.notify(error as Error, (event) => {
      event.addMetadata('context', {
        component: 'ApiService',
        method: 'requestInterceptorError',
      });
    });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 errors with automatic token refresh
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest.url || '';

    // Skip refresh for public APIs
    if (PUBLIC_ENDPOINTS.some((ep) => url.includes(ep))) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Attempt to refresh token using HttpOnly cookie
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axios
          .post(
            `${import.meta.env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
            {}, // Empty body - refresh token is in cookie
            { withCredentials: true }
          )
          .then(async (response) => {
            const { accessToken } = response.data;
            await useAuthStore.getState().updateAccessToken(accessToken);
            return accessToken;
          })
          .catch((refreshError) => {
            // Refresh failed - logout user
            Bugsnag.notify(refreshError as Error, (event) => {
              event.addMetadata('context', {
                component: 'ApiService',
                method: 'responseInterceptor',
              });
            });
            useAuthStore.getState().logout();
            window.location.href = ROUTES.AUTH.LOGIN;
            throw refreshError;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        const accessToken = await refreshPromise;
        if (originalRequest.headers && accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        // Retry original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        Bugsnag.notify(refreshError as Error, (event) => {
          event.addMetadata('context', {
            component: 'ApiService',
            method: 'responseInterceptor',
          });
        });
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

