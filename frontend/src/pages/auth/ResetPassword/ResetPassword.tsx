import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

import axiosInstance from '@service/api.service';
import { verifyResetToken } from '@utils/tokenHelper';
import { ENDPOINTS } from '@constants/endpoint';
import { ROUTES } from '@constants/routes';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { validatePassword, isPasswordValid } from '@utils/validation';
import ConfirmationModal from '@components/modals/ConfirmationModal/ConfirmationModal';
import Bugsnag from '@utils/bugsnag';
import type { AxiosError } from 'axios';

import PasswordInputField from '@common/PasswordInputField/PasswordInputField';
import PasswordRequirements from '@common/PasswordRequirements/PasswordRequirements';

import styles from './ResetPassword.module.scss';
import { useAlertStore } from '@store/useAlertStore';
import type { ApiResponse } from '@type/auth';

const ResetPassword = () => {
  const { showAlert } = useAlertStore();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState({
    passwordError: '',
    confirmPasswordError: '',
    tokenError: '',
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    tokenValid: null as boolean | null,
    passwordFocused: false,
    confirmPasswordFocused: false,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSubmitError, setHasSubmitError] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setStatusField = (field: string, value: string | boolean) =>
    setStatus((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        showAlert(ERROR_MESSAGES.RESET_LINK_INVALID, 'danger');
        setStatusField('tokenError', ERROR_MESSAGES.RESET_LINK_INVALID);
        setStatusField('tokenValid', false);
        return;
      }

      try {
        await verifyResetToken(token);
        setStatusField('tokenValid', true);
      } catch {
        showAlert(ERROR_MESSAGES.RESET_LINK_EXPIRED, 'danger');
        setStatusField('tokenError', ERROR_MESSAGES.RESET_LINK_EXPIRED);
        setStatusField('tokenValid', false);
      }
    };

    validateToken();
  }, [token]);

  // Only validate if password is not empty
  const requirements = form.password ? validatePassword(form.password) : null;
  const passwordValid = requirements ? isPasswordValid(requirements) : false;

  // Only check password match if both fields are not empty
  const passwordsMatch =
    form.password && form.confirmPassword
      ? form.password === form.confirmPassword
      : true;

  const handleClearField = (field: 'password' | 'confirmPassword') => {
    setField(field, '');
    if (field === 'password') {
      setStatusField('passwordError', '');
    } else {
      setStatusField('confirmPasswordError', '');
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setStatusField('showPassword', !status.showPassword);
    } else {
      setStatusField('showConfirmPassword', !status.showConfirmPassword);
    }
  };

  const handlePasswordChange = (value: string) => {
    setField('password', value);
    setStatusField('passwordError', '');
    setHasSubmitError(false);

    // Revalidate confirm password if it has a value
    if (form.confirmPassword) {
      if (value === form.confirmPassword) {
        setStatusField('confirmPasswordError', '');
      } else {
        setStatusField(
          'confirmPasswordError',
          ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH
        );
      }
    }
  };

  const handlePasswordBlur = () => {
    // Only validate if password has value
    if (!form.password) return;

    const reqs = validatePassword(form.password);
    const isValid = isPasswordValid(reqs);

    if (!isValid) {
      setStatusField(
        'passwordError',
        ERROR_MESSAGES.PASSWORD_DO_NOT_MEET_REQUIREMENTS
      );
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setField('confirmPassword', value);
    setStatusField('confirmPasswordError', '');
    setHasSubmitError(false);
    // Show error immediately if doesn't match and both fields have values
    if (form.password && value && form.password !== value) {
      setStatusField(
        'confirmPasswordError',
        ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusField('passwordError', '');
    setStatusField('confirmPasswordError', '');
    setStatusField('tokenError', '');

    if (!token) {
      setStatusField('tokenError', ERROR_MESSAGES.RESET_LINK_EXPIRED);
      return;
    }

    if (!passwordValid) {
      setStatusField(
        'passwordError',
        ERROR_MESSAGES.PASSWORD_DO_NOT_MEET_REQUIREMENTS
      );
      return;
    }

    if (!passwordsMatch) {
      setStatusField(
        'confirmPasswordError',
        ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH
      );
      return;
    }

    setStatusField('loading', true);

    try {
      await axiosInstance.post<ApiResponse<unknown>>(ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword: form.password,
      });

      setShowSuccessModal(true);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const statusCode = axiosError.response?.status;
      const apiResponse = axiosError.response?.data;

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'ResetPassword',
          method: 'handleSubmit',
          statusCode,
        });
      });

      if (apiResponse?.message === 'Reset Old and New Password cannot be same') {
        setErrorMessage(ERROR_MESSAGES.SAME_PASSWORD_USED);
      } else if (apiResponse?.message === 'Invalid reset link') {
        setErrorMessage(ERROR_MESSAGES.RESET_LINK_INVALID);
      } else if (apiResponse?.message === 'Reset Link Already Used') {
        setErrorMessage(ERROR_MESSAGES.RESET_LINK_ALREADY_USED);
      } else {
        setErrorMessage(ERROR_MESSAGES.UNEXPECTED_ERROR);
      }
      setShowErrorModal(true);
      setHasSubmitError(true);
    } finally {
      setStatusField('loading', false);
    }
  };


  const { password, confirmPassword } = form;
  const {
    passwordError,
    confirmPasswordError,
    showPassword,
    showConfirmPassword,
    loading,
  } = status;

  const isSubmitDisabled =
    loading ||
    !password ||
    !confirmPassword ||
    !passwordValid ||
    !passwordsMatch ||
    hasSubmitError;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reset Password</h1>
      <Form onSubmit={handleSubmit} className={styles.formContainer}>
        <div>
          <Form.Group className={styles.inputWrapper} controlId="password">
            <Form.Label className={styles.label}>Enter New Password</Form.Label>
            <PasswordInputField
              value={password}
              showPassword={showPassword}
              onToggleShow={() => togglePasswordVisibility('password')}
              onClear={() => handleClearField('password')}
              error={passwordError}
              showCheckmark={passwordValid && !status.passwordFocused}
              containerClassName={styles.inputContainer}
              iconClearClassName={styles.iconClearPassword}
              iconEyeClassName={styles.iconEye}
              iconCheckmarkClassName={styles.iconCheckmark}
              errorClassName={styles.error}
            >
              <Form.Control
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password…"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setStatusField('passwordFocused', true)}
                onBlur={() => {
                  handlePasswordBlur();
                  setStatusField('passwordFocused', false);
                }}
                required
                isInvalid={!!passwordError}
              />
            </PasswordInputField>
          </Form.Group>

          <div className={styles.passwordRequirements}>
            <PasswordRequirements requirements={requirements} />
          </div>
        </div>

        <Form.Group className={styles.inputWrapper} controlId="confirmPassword">
          <Form.Label className={styles.label}>Confirm New Password</Form.Label>
          <PasswordInputField
            value={confirmPassword}
            showPassword={showConfirmPassword}
            onToggleShow={() => togglePasswordVisibility('confirmPassword')}
            onClear={() => handleClearField('confirmPassword')}
            error={confirmPasswordError}
            showCheckmark={passwordsMatch && !status.confirmPasswordFocused}
            containerClassName={styles.inputContainer}
            iconClearClassName={styles.iconClearPassword}
            iconEyeClassName={styles.iconEye}
            iconCheckmarkClassName={styles.iconCheckmark}
            errorClassName={styles.error}
          >
            <Form.Control
              className={styles.input}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password…"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onFocus={() => setStatusField('confirmPasswordFocused', true)}
              onBlur={(e) => {
                handleConfirmPasswordChange(e.target.value);
                setStatusField('confirmPasswordFocused', false);
              }}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              required
              isInvalid={!!confirmPasswordError}
            />
          </PasswordInputField>
        </Form.Group>

        <div className={styles.actionsContainer}>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={styles.button}
          >
            Reset
          </Button>
        </div>
      </Form>

      <ConfirmationModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Password Reset"
        message={SUCCESS_MESSAGES.RESET_PASSWORD_SUCCESS}
        variant="success"
        showCancelButton={false}
        confirmText="Login"
        onConfirm={() => navigate(ROUTES.AUTH.LOGIN)}
      />

      <ConfirmationModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Password Reset"
        message={errorMessage}
        variant="error"
        showCancelButton={false}
        confirmText="Try Again"
      />
    </div>
  );
};

export default ResetPassword;
