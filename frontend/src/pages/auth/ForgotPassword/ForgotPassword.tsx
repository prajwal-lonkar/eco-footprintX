import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { isValidEmail } from '@utils/validation';
import Bugsnag from '@utils/bugsnag';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@type/auth';

import ClearIcon from '@assets/icons/Clear.svg';

import styles from './ForgotPassword.module.scss';
import { useAlertStore } from '@store/useAlertStore';
import { ROUTES } from '@constants/routes';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { showAlert } = useAlertStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClearField = () => {
    setEmail('');
    setEmailError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handleEmailBlur = () => {
    if (!email) return;
    if (!isValidEmail(email)) {
      setEmailError(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { toEmail: email, emailType: 'resetPassword' });
      if (response.data.success) {
        showAlert(SUCCESS_MESSAGES.EMAIL_SENT_FOR_PASSWORD_RESET, 'success');
      } else {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const statusCode = axiosError.response?.status;

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'ForgotPassword',
          method: 'handleSubmit',
          statusCode,
        });
      });

      if (statusCode === 400) {
        showAlert(ERROR_MESSAGES.RESET_LINK_RECENTLY_SENT, 'danger');
      } else if (statusCode === 404) {
        showAlert(ERROR_MESSAGES.USER_NOT_FOUND, 'danger');
      } else {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !email || !!emailError;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Forgot Password</h1>

      <Form onSubmit={handleSubmit} className={styles.formContainer}>
        <Form.Group className={styles.inputWrapper} controlId="email">
          <Form.Label className={styles.label}>Email ID</Form.Label>
          <div className={styles.inputContainer}>
            <Form.Control
              className={styles.input}
              type="email"
              placeholder="Enter email ID..."
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              isInvalid={!!emailError}
            />
            {email && (
              <img
                src={ClearIcon}
                alt="Clear"
                className={styles.iconClear}
                onClick={handleClearField}
              />
            )}
          </div>
          {emailError && <p className={styles.error}>{emailError}</p>}
        </Form.Group>

        <div className={styles.actionsContainer}>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={styles.button}
          >
            Submit
          </Button>
          <p>
            Go back to <Link to={ROUTES.AUTH.LOGIN}>Log in</Link> or{' '}
            <Link to={ROUTES.AUTH.SIGN_UP}>Sign up</Link>
          </p>
        </div>
      </Form>
    </div>
  );
};

export default ForgotPassword;
