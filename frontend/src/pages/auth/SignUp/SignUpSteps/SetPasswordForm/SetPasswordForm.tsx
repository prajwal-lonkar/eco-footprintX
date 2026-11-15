import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  validatePassword,
  isPasswordValid,
  hasLeadingOrTrailingSpaces,
} from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import { ROUTES } from '@constants/routes';

import PasswordInputField from '@common/PasswordInputField/PasswordInputField';
import PasswordRequirements from '@common/PasswordRequirements/PasswordRequirements';

import styles from './SetPasswordForm.module.scss';

interface SetPasswordFormProps {
  onPrev: () => void;
  onPasswordsValid: () => void;
  formData: {
    password: string;
    confirmPassword: string;
  };
  onChange: (field: string, value: string) => void;
  isCreatingUser: boolean;
}

const SetPasswordForm = ({
  onPrev,
  onPasswordsValid,
  formData,
  onChange,
  isCreatingUser,
}: SetPasswordFormProps) => {
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { password, confirmPassword } = formData;

  // Only validate if password is not empty
  const requirements = password ? validatePassword(password) : null;
  const passwordValid = requirements ? isPasswordValid(requirements) : false;

  // Only check password match if both fields are not empty
  const passwordsMatch =
    password && confirmPassword ? password === confirmPassword : true;

  const handleClearField = (field: 'password' | 'confirmPassword') => {
    onChange(field, '');
    if (field === 'password') {
      setPasswordError('');
    } else {
      setConfirmPasswordError('');
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handlePasswordChange = (value: string) => {
    onChange('password', value);
    setPasswordError('');

    // Revalidate confirm password if it has a value
    if (confirmPassword) {
      if (value === confirmPassword) {
        setConfirmPasswordError('');
      } else {
        setConfirmPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH);
      }
    }
  };

  const handlePasswordBlur = () => {
    // Only validate if password has value
    if (!password) {
      setPasswordError('');
      return;
    }

    if (hasLeadingOrTrailingSpaces(password)) {
      setPasswordError(ERROR_MESSAGES.LEADING_TRAILING_SPACES);
      return;
    }

    const reqs = validatePassword(password);
    const isValid = isPasswordValid(reqs);

    if (!isValid) {
      setPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MEET_REQUIREMENTS);
      return;
    }
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    onChange('confirmPassword', value);

    setConfirmPasswordError('');
    // Show error immediately if doesn't match and both fields have values
    if (password && value && password !== value) {
      setConfirmPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH);
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return;
    }

    if (hasLeadingOrTrailingSpaces(confirmPassword)) {
      setConfirmPasswordError(ERROR_MESSAGES.LEADING_TRAILING_SPACES);
      return;
    }

    if (password && confirmPassword !== password) {
      setConfirmPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH);
      return;
    }

    setConfirmPasswordError('');
  };

  const handleNext = () => {
    // Validate before proceeding
    if (!passwordValid) {
      setPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MEET_REQUIREMENTS);
      return;
    }

    if (!passwordsMatch) {
      setConfirmPasswordError(ERROR_MESSAGES.PASSWORD_DO_NOT_MATCH);
      return;
    }

    // Passwords are valid, trigger API call in parent
    onPasswordsValid();
  };

  const isNextDisabled =
    isCreatingUser ||
    !password ||
    !confirmPassword ||
    hasLeadingOrTrailingSpaces(password) ||
    hasLeadingOrTrailingSpaces(confirmPassword) ||
    !passwordValid ||
    !passwordsMatch ||
    !!passwordError ||
    !!confirmPasswordError;

  return (
    <>
      <div className={styles.formWrapper}>
        {/* <div> */}
        <div className={styles.formGroup}>
          <label>
            Enter New Password <span className={styles.required}>*</span>
          </label>
          <PasswordInputField
            value={password}
            showPassword={showPassword}
            onToggleShow={() => togglePasswordVisibility('password')}
            onClear={() => handleClearField('password')}
            error={passwordError}
            showCheckmark={passwordValid && focusedField !== 'password'}
            containerClassName={styles.inputContainer}
            iconClearClassName={styles.iconClearPassword}
            iconEyeClassName={styles.iconEye}
            iconCheckmarkClassName={styles.iconCheckmark}
            errorClassName={styles.error}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password…"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => {
                setFocusedField(null);
                handlePasswordBlur();
              }}
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              className={`${styles.passwordInput} ${
                passwordError
                  ? styles.inputError
                  : focusedField === 'password'
                    ? styles.inputValid
                    : ''
              }`}
            />
          </PasswordInputField>
        </div>

        <div className={styles.passwordRequirements}>
          <PasswordRequirements requirements={requirements} />
        </div>
        {/* </div> */}

        <div className={styles.formGroup}>
          <label>
            Confirm New Password <span className={styles.required}>*</span>
          </label>
          <PasswordInputField
            value={confirmPassword}
            showPassword={showConfirmPassword}
            onToggleShow={() => togglePasswordVisibility('confirmPassword')}
            onClear={() => handleClearField('confirmPassword')}
            error={confirmPasswordError}
            showCheckmark={passwordValid && passwordsMatch && focusedField !== 'confirmPassword'}
            containerClassName={styles.inputContainer}
            iconClearClassName={styles.iconClearPassword}
            iconEyeClassName={styles.iconEye}
            iconCheckmarkClassName={styles.iconCheckmark}
            errorClassName={styles.error}
          >
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password…"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => {
                setFocusedField(null);
                handleConfirmPasswordBlur();
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              className={`${styles.passwordInput} ${
                confirmPasswordError
                  ? styles.inputError
                  : focusedField === 'confirmPassword'
                    ? styles.inputValid
                    : ''
              }`}
            />
          </PasswordInputField>
        </div>
      </div>

      <div className={styles.buttonWrapper}>
        <div className={styles.buttonRow}>
          <button className={styles.prevBtn} onClick={onPrev}>
            Previous
          </button>
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={isNextDisabled}
          >
            {isCreatingUser ? 'Creating...' : 'Next'}
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

export default SetPasswordForm;
