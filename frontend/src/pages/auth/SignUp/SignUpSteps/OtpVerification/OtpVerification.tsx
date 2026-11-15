import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './OtpVerification.module.scss';
import { ROUTES } from '@constants/routes';
import { isValidOtpDigit, extractOtpDigits } from '@utils/validation';
import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import type { VerifyOtpPayload, VerifyOtpResponse } from '@type/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import inputCheckEmpty from '@assets/icons/input-check-empty.svg';
import inputCheck from '@assets/icons/input-check.svg';
import { useAlertStore } from '@store/useAlertStore';
import Bugsnag from '@utils/bugsnag';

interface OtpVerificationProps {
  formData: {
    email: string;
  };
}

interface ConsentState {
  marketing: boolean;
  terms: boolean;
  privacy: boolean;
}

const TERMS_AND_CONDITIONS_URL =
  'http://www.ecofootprintx.tech/termsandconditions';
const PRIVACY_POLICY_URL = 'http://www.ecofootprintx.tech/privacypolicy';

// Move outside component to prevent recreation
const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const OtpVerification: React.FC<OtpVerificationProps> = ({ formData }) => {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    marketing: false,
    terms: false,
    privacy: false,
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasSentOtpOnMount = useRef(false);

  const isOtpComplete = useMemo(
    () => otp.every((digit) => digit !== ''),
    [otp]
  );
  const isNextEnabled = useMemo(
    () =>
      consent.terms &&
      consent.privacy &&
      isOtpComplete &&
      !isVerifying &&
      !otpError,
    [consent.terms, consent.privacy, isOtpComplete, isVerifying, otpError]
  );

  // Send OTP function
  const sendOtp = useCallback(async () => {
    if (!formData.email || isSendingOtp) return;

    try {
      setIsSendingOtp(true);
      setOtpError('');

      const response = await axiosInstance.post(ENDPOINTS.USERS.SEND_OTP, {
        toEmail: formData.email,
        emailType: 'register',
      });

      if (!response.data.success) {
        showAlert(ERROR_MESSAGES.FAILED_TO_SEND_OTP, 'danger');
        return;
      }

      showAlert(SUCCESS_MESSAGES.OTP_SENT_SUCCESSFULLY, 'success');

      // Reset timer and state on success
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '']);
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'OtpVerification',
          method: 'sendOtp',
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_SEND_OTP, 'danger');
    } finally {
      setIsSendingOtp(false);
    }
  }, [formData.email, isSendingOtp, showAlert]);

  // Auto-send OTP on mount if email is present
  useEffect(() => {
    if (formData.email && !hasSentOtpOnMount.current) {
      hasSentOtpOnMount.current = true;
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      if (value && !isValidOtpDigit(value)) return;

      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value;
        return newOtp;
      });

      // Clear error when user types
      if (otpError) {
        setOtpError('');
      }

      // Auto-focus next input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpError]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        setOtp((prevOtp) => {
          if (!prevOtp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
          }
          return prevOtp;
        });
      }
    },
    []
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = extractOtpDigits(pastedData, 4);

    setOtp((prevOtp) => {
      const newOtp = [...prevOtp];
      digits.forEach((digit, index) => {
        if (index < 4) {
          newOtp[index] = digit;
        }
      });

      // Focus the next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[3]?.focus();
      }

      return newOtp;
    });
  }, []);

  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;
    await sendOtp();
    inputRefs.current[0]?.focus();
  }, [canResend, sendOtp]);

  const handleConsentChange = useCallback(
    (field: keyof ConsentState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setConsent((prev) => ({
        ...prev,
        [field]: e.target.checked,
      }));
    },
    []
  );

  const handleOTPVerify = async () => {
    if (!isOtpComplete) return;

    try {
      setIsVerifying(true);
      setOtpError('');

      const otpString = otp.join('');

      const payload: VerifyOtpPayload = {
        email: formData.email,
        otp: otpString,
      };

      const response = await axiosInstance.post<VerifyOtpResponse>(
        ENDPOINTS.USERS.VERIFY_OTP,
        payload
      );

      if (response.data.success) {
        showAlert(SUCCESS_MESSAGES.ACCOUNT_CREATED_SUCCESSFULLY, 'success');
        navigate(ROUTES.AUTH.LOGIN);
      } else {
        setOtpError(ERROR_MESSAGES.INCORRECT_OTP);
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'OtpVerification',
          method: 'handleOTPVerify',
        });
      });
      setOtpError(ERROR_MESSAGES.INCORRECT_OTP);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className={styles.formWrapper}>
        <div className={styles.otpContainer}>
          <label className={styles.otpLabel}>Enter OTP</label>
          <div className={styles.otpInputs}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`${styles.otpInput} ${otpError ? styles.isInvalid : ''}`}
              />
            ))}
          </div>
          <div
            className={styles.otpFooter}
            style={{ justifyContent: timer > 0 ? 'space-between' : 'flex-end' }}
          >
            {/* <span className={styles.timer}>{formatTimer(timer)}</span> */}
            {timer > 0 && <p className={styles.timer}>{formatTimer(timer)}</p>}
            <button
              type="button"
              className={`${styles.resendBtn} ${!canResend ? styles.disabled : ''}`}
              onClick={handleResendOtp}
              disabled={!canResend}
            >
              Resend OTP
            </button>
          </div>
          {otpError && <p className={styles.error}>{otpError}</p>}
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        <div className={styles.checkboxSection}>
          <label className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={handleConsentChange('marketing')}
              className={styles.checkboxInput}
            />
            <span className={styles.customCheckbox}>
              <img
                src={consent.marketing ? inputCheck : inputCheckEmpty}
                alt={consent.marketing ? 'Checked' : 'Unchecked'}
              />
            </span>
            <span className={styles.checkboxLabel}>
              I agree to receive marketing communications and updates
            </span>
          </label>
          <label className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              checked={consent.terms}
              onChange={handleConsentChange('terms')}
              className={styles.checkboxInput}
            />
            <span className={styles.customCheckbox}>
              <img
                src={consent.terms ? inputCheck : inputCheckEmpty}
                alt={consent.terms ? 'Checked' : 'Unchecked'}
              />
            </span>
            <span className={styles.checkboxLabel}>
              I have read and agreed to the website{' '}
              <a
                href={TERMS_AND_CONDITIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                Terms and Conditions
              </a>{' '}
              <span className={styles.required}>*</span>
            </span>
          </label>
          <label className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              checked={consent.privacy}
              onChange={handleConsentChange('privacy')}
              className={styles.checkboxInput}
            />
            <span className={styles.customCheckbox}>
              <img
                src={consent.privacy ? inputCheck : inputCheckEmpty}
                alt={consent.privacy ? 'Checked' : 'Unchecked'}
              />
            </span>
            <span className={styles.checkboxLabel}>
              I have read and agreed to the website{' '}
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>{' '}
              <span className={styles.required}>*</span>
            </span>
          </label>
        </div>
        <div className={styles.buttonRow}>
          <button
            className={styles.prevBtn}
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
          >
            Previous
          </button>
          <button
            className={styles.nextBtn}
            onClick={handleOTPVerify}
            disabled={!isNextEnabled}
          >
            Next
          </button>
        </div>
        <div className={styles.loginText}>
          Already have an account?{' '}
          <Link to={ROUTES.AUTH.LOGIN} className={styles.loginLink}>
            Log In
          </Link>
        </div>
      </div>
    </>
  );
};

export default OtpVerification;
