import { useState } from 'react';
import type { AxiosError } from 'axios';
import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import { ERROR_MESSAGES } from '@constants/messages';
import type { ApiResponse, EligibilityResponse } from '@type/auth';
import { useAlertStore } from '@store/useAlertStore';
import Bugsnag from '@utils/bugsnag';

/**
 * Hook for verifying email eligibility via API
 * Returns loading state, error state, and verification function
 */
export const useEmailVerification = () => {
  const { showAlert } = useAlertStore();
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyEmail = async (
    email: string,
    flow?: 'signup' | 'login'
  ): Promise<{ isEligible: boolean; error?: string }> => {
    setIsVerifying(true);

    try {
      const response = await axiosInstance.post<
        ApiResponse<EligibilityResponse>
      >(
        // ENDPOINTS.USERS.VERIFY_WHITELISTED_EMAIL,
        flow === 'signup'
          ? `${ENDPOINTS.USERS.VERIFY_WHITELISTED_EMAIL}?flow=signup`
          : ENDPOINTS.USERS.VERIFY_WHITELISTED_EMAIL,
        { email }
      );

      return { isEligible: response.data.data?.isEligible ?? false };
    } catch (error) {
      const axiosError = error as AxiosError<EligibilityResponse>;
      if (axiosError.response?.status === 400) {
        return { isEligible: false };
      }
      if (axiosError.response?.status === 409) {
        const message =
          (axiosError.response?.data as any)?.message ||
          ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
        showAlert(message, 'danger');
        return { isEligible: false, error: message };
      }

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'useEmailVerification',
          method: 'verifyEmail',
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_VERIFY_EMAIL_ELIGIBILITY, 'danger');
      return {
        isEligible: false,
        error: ERROR_MESSAGES.FAILED_TO_VERIFY_EMAIL_ELIGIBILITY,
      };
    } finally {
      setIsVerifying(false);
    }
  };

  return { verifyEmail, isVerifying };
};
