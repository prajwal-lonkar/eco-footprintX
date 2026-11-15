import React, { useState } from 'react';
import styles from './UserInfoForm.module.scss';
import { useNavigate } from 'react-router-dom';
import {
  isValidContactName,
  isValidCompanyName,
  isValidEmail,
  hasLeadingOrTrailingSpaces,
  sanitizeComponentSearchInput,
} from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import { useEmailVerification } from '@hooks/useEmailVerification';

export interface UserInfoFormProps {
  onNext: () => void;
  onRestricted: () => void;
  formData: {
    companyName: string;
    email: string;
    contactName: string;
  };
  onChange: (field: string, value: string) => void;
  isStepPreviouslyValidated: boolean;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  onNext,
  onRestricted,
  formData,
  onChange,
  isStepPreviouslyValidated,
}) => {
  const navigate = useNavigate();
  const { verifyEmail, isVerifying } = useEmailVerification();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { companyName, email, contactName } = formData;
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation Logic
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Company Name
    if (hasLeadingOrTrailingSpaces(companyName)) {
      newErrors.companyName = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (!isValidCompanyName(companyName)) {
      newErrors.companyName = ERROR_MESSAGES.COMPANY_NAME_TOO_LONG;
    }

    // Email
    if (hasLeadingOrTrailingSpaces(email)) {
      newErrors.email = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (email && !isValidEmail(email)) {
      newErrors.email = ERROR_MESSAGES.INVALID_EMAIL_FORMAT;
    }

    // Contact Name
    if (hasLeadingOrTrailingSpaces(contactName)) {
      newErrors.contactName = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (contactName && !isValidContactName(contactName)) {
      newErrors.contactName = ERROR_MESSAGES.INVALID_ALPHANUMERIC_NAME;
    } else if (contactName.length > 100) {
      newErrors.contactName = ERROR_MESSAGES.CONTACT_NAME_TOO_LONG;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (
    field: string,
    value: string,
    includeLeadingTrailingSpaceValidation = true
  ) => {
    let error = '';
    switch (field) {
      case 'companyName':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (!isValidCompanyName(value)) {
          error = ERROR_MESSAGES.COMPANY_NAME_TOO_LONG;
        }
        break;
      case 'email':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value && !isValidEmail(value)) {
          error = ERROR_MESSAGES.INVALID_EMAIL_FORMAT;
        }
        break;
      case 'contactName':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value && !isValidContactName(value)) {
          error = ERROR_MESSAGES.INVALID_ALPHANUMERIC_NAME;
        } else if (value.length > 100) {
          error = ERROR_MESSAGES.CONTACT_NAME_TOO_LONG;
        }
        break;
    }
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const checkEligibility = async (): Promise<boolean> => {
    const result = await verifyEmail(email, 'signup');

    if (result.error) {
      return false;
    } else if (result.isEligible) {
      return true;
    } else {
      onRestricted();
      return false;
    }
  };

  const handleNextClick = async () => {
    if (validateForm()) {
      const isEligible = await checkEligibility();
      if (isEligible) {
        onNext();
      }
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = (field: string, value: string) => {
    setFocusedField(null);
    validateField(field, value, true);
  };

  // Disable Next button if any field is empty, has errors, or checking eligibility
  const hasBlockingValidationError =
    !companyName.trim() ||
    !email.trim() ||
    !contactName.trim() ||
    hasLeadingOrTrailingSpaces(companyName) ||
    hasLeadingOrTrailingSpaces(email) ||
    hasLeadingOrTrailingSpaces(contactName) ||
    (email && !isValidEmail(email)) ||
    (contactName && !isValidContactName(contactName)) ||
    !isValidCompanyName(companyName) ||
    contactName.length > 100 ||
    Object.keys(errors).length > 0;
  const isNextDisabled =
    isVerifying || (!isStepPreviouslyValidated && hasBlockingValidationError);

  return (
    <>
      <div className={styles.formWrapper}>
        <div className={styles.formGroup}>
          <label>
            Company Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter company name..."
            value={companyName}
            onChange={(e) => {
              const sanitizedValue = sanitizeComponentSearchInput(
                e.target.value
              );
              onChange('companyName', sanitizedValue);
              validateField('companyName', sanitizedValue, false);
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const sanitizedValue = sanitizeComponentSearchInput(pastedText);
              onChange('companyName', sanitizedValue);
              validateField('companyName', sanitizedValue, false);
            }}
            onFocus={() => handleFocus('companyName')}
            onBlur={(e) => handleBlur('companyName', e.target.value)}
            className={`${styles.inputDefault} ${
              errors.companyName
                ? styles.inputError
                : focusedField === 'companyName'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.companyName && (
            <p className={styles.error}>{errors.companyName}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            Email of Company Contact <span className={styles.required}>*</span>
          </label>
          <input
            type="email"
            placeholder="Enter company contact number..."
            value={email}
            onChange={(e) => {
              onChange('email', e.target.value);
              validateField('email', e.target.value, false);
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              validateField('email', pastedText, false);
            }}
            onFocus={() => handleFocus('email')}
            onBlur={(e) => handleBlur('email', e.target.value)}
            onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
            className={`${styles.inputDefault} ${
              errors.email
                ? styles.inputError
                : focusedField === 'email'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <label>
            Name of Company Contact (First &amp; Last)
            <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter contact name..."
            value={contactName}
            onChange={(e) => {
              const filteredValue = e.target.value.replace(/[^A-Za-z\s]/g, '');
              onChange('contactName', filteredValue);
              validateField('contactName', filteredValue, false);
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              const filteredValue = pastedText.replace(/[^A-Za-z\s]/g, '');
              validateField('contactName', filteredValue, false);
            }}
            onFocus={() => handleFocus('contactName')}
            onBlur={(e) => handleBlur('contactName', e.target.value)}
            className={`${styles.inputDefault} ${
              errors.contactName
                ? styles.inputError
                : focusedField === 'contactName'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.contactName && (
            <p className={styles.error}>{errors.contactName}</p>
          )}
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button
            className={styles.nextBtn}
            onClick={handleNextClick}
            disabled={isNextDisabled}
          >
            Next
          </button>
        </div>

        <p className={styles.loginText}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </div>
    </>
  );
};

export default UserInfoForm;
