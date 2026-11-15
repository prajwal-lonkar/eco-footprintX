import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

import { useAuth } from '@hooks/useAuth';
import { ERROR_MESSAGES } from '@constants/messages';
import { ROUTES } from '@constants/routes';
import {
  isValidEmail,
  hasLeadingOrTrailingSpaces,
} from '@utils/validation';
import Bugsnag from '@utils/bugsnag';
import RestrictedUser from '@pages/auth/SignUp/RestrictedUser/RestrictedUser';

import ClearIcon from '@assets/icons/Clear.svg';

import PasswordInputField from '@common/PasswordInputField/PasswordInputField';

import styles from './Login.module.scss';
import { useAlertStore } from '@store/useAlertStore';
import { API_ERROR_CODES } from '@constants/mockData';

const Login = () => {
  const { showAlert } = useAlertStore();
  const { handleLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({
    emailError: '',
    passwordError: '',
    showPassword: false,
    loading: false,
  });
  const [showRestricted, setShowRestricted] = useState(false);

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setStatusField = (field: string, value: boolean | string) =>
    setStatus((prev) => ({ ...prev, [field]: value }));

  const validateEmail = (
    value: string,
    includeLeadingTrailingSpaceValidation = true
  ) => {
    if (!value) {
      setStatusField('emailError', '');
      return;
    }
    if (
      includeLeadingTrailingSpaceValidation &&
      hasLeadingOrTrailingSpaces(value)
    ) {
      setStatusField('emailError', ERROR_MESSAGES.LEADING_TRAILING_SPACES);
      return;
    }
    if (!isValidEmail(value)) {
      setStatusField('emailError', ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
      return;
    }
    setStatusField('emailError', '');
  };

  const validatePassword = (
    value: string,
    includeLeadingTrailingSpaceValidation = true
  ) => {
    if (!value) {
      setStatusField('passwordError', '');
      return;
    }
    if (
      includeLeadingTrailingSpaceValidation &&
      hasLeadingOrTrailingSpaces(value)
    ) {
      setStatusField('passwordError', ERROR_MESSAGES.LEADING_TRAILING_SPACES);
      return;
    }
    setStatusField('passwordError', '');
  };

  const handleClearField = (field: 'email' | 'password') => {
    setField(field, '');
    if (field === 'email') {
      setStatusField('emailError', '');
    } else {
      setStatusField('passwordError', '');
    }
  };

  const togglePasswordVisibility = () =>
    setStatusField('showPassword', !status.showPassword);

  const handleGoBack = () => {
    setShowRestricted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusField('passwordError', '');
    setStatusField('emailError', '');
    setStatusField('loading', true);

    try {
      const result = await handleLogin(form, searchParams.get('redirectTo'));

      if (!result.success) {
        if (result.statusCode === 401) {
          const code = result.code;
          if (code === API_ERROR_CODES.INVALID_CREDENTIALS) {
            setStatusField('passwordError', ERROR_MESSAGES.INCORRECT_PASSWORD);
          } else if(code === API_ERROR_CODES.USER_ACCOUNT_BLOCKED) {
            showAlert(ERROR_MESSAGES.USER_ACCOUNT_BLOCKED, 'danger');
            return;
          }
        } else if (result.statusCode === 404) {
          setShowRestricted(true);
          return;
        } else if (result.alertShown) {
          // Alert already shown in useAuth hook, don't show another one
          return;
        } else {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          return;
        }
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'Login',
          method: 'handleSubmit',
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
    } finally {
      setStatusField('loading', false);
    }
  };

  const { email, password } = form;
  const { emailError, passwordError, showPassword, loading } = status;

  const isSubmitDisabled =
    loading || !!emailError || !!passwordError || !email || !password;

  if (showRestricted) {
    return (
      <div className={styles.container}>
        <RestrictedUser goToStep={handleGoBack} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Log In</h1>

      <Form onSubmit={handleSubmit} className={styles.formContainer}>
        <Form.Group className={styles.inputWrapper} controlId="email">
          <Form.Label className={styles.label}>Email ID</Form.Label>
          <div className={styles.inputContainer}>
            <Form.Control
              className={styles.input}
              type="email"
              placeholder="Enter dev email ID"
              value={email}
              onChange={(e) => {
                setField('email', e.target.value);
                validateEmail(e.target.value, false);
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                validateEmail(pastedText, false);
              }}
              onBlur={(e) => {
                validateEmail(e.target.value, true);
              }}
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              required
              isInvalid={!!emailError}
            />
            {email && (
              <img
                src={ClearIcon}
                alt="Clear"
                className={styles.iconClear}
                onClick={() => handleClearField('email')}
              />
            )}
          </div>
          {emailError && <p className={styles.error}>{emailError}</p>}
        </Form.Group>

        <div className={styles.passwordSection}>
          <Form.Group className={styles.inputWrapper} controlId="password">
            <Form.Label className={styles.label}>Password</Form.Label>
            <PasswordInputField
              value={password}
              showPassword={showPassword}
              onToggleShow={togglePasswordVisibility}
              onClear={() => handleClearField('password')}
              error={passwordError}
              containerClassName={styles.inputContainer}
              iconClearClassName={styles.iconClearPassword}
              iconEyeClassName={styles.iconEye}
              errorClassName={styles.error}
            >
              <Form.Control
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter dev password"
                value={password}
                onChange={(e) => {
                  setField('password', e.target.value);
                  validatePassword(e.target.value, false);
                }}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  validatePassword(pastedText, false);
                }}
                onBlur={(e) => {
                  validatePassword(e.target.value, true);
                }}
                onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
                required
                isInvalid={!!passwordError}
              />
            </PasswordInputField>
          </Form.Group>

          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD}
            className={styles.forgotPasswordLink}
          >
            Forgot Password
          </Link>
        </div>

        <div className={styles.actionsContainer}>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={styles.button}
          >
            Log In
          </Button>

          <p className={styles.signUpText}>
            Don't have an dev account? <Link to={ROUTES.AUTH.SIGN_UP}>Sign up</Link>
          </p>
        </div>
      </Form>
    </div>
  );
};

export default Login;
