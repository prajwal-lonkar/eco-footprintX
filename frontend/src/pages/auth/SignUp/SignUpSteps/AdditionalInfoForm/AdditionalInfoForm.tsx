import React, { useEffect, useState } from 'react';
import styles from './AdditionalInfoForm.module.scss';

import infoicon from '@assets/icons/info-icon.svg';
import { useNavigate } from 'react-router-dom';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import {
  isValidDUNSNumber,
  isValidRegistrationNumber,
  isValidWebsite,
  hasLeadingOrTrailingSpaces,
} from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';

import { getIndustryTypes, getCompanyTypes } from '@service/dropdown.service';
import { checkRegistrationNumber } from '@service/supplier.service';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import Tooltip from '@common/Tooltip/Tooltip';
import type { DropdownOption } from '@type/dropdown';

export interface AdditionalInfoFormProps {
  onNext: () => void;
  onPrev: () => void;
  formData: {
    website: string;
    industryType: string;
    companyType: string;
    registrationNumber: string;
    dunsNumber: string;
    address: string;
  };
  onChange: (field: string, value: string) => void;
  isStepPreviouslyValidated: boolean;
}
const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  onPrev,
  onNext,
  formData,
  onChange,
  isStepPreviouslyValidated,
}) => {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [industryOptions, setIndustryOptions] = useState<DropdownOption[]>([]);
  const [companyTypeOptions, setCompanyTypeOptions] = useState<
    DropdownOption[]
  >([]);
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  const {
    website,
    industryType,
    companyType,
    registrationNumber,
    dunsNumber,
    address,
  } = formData;

  useEffect(() => {
    const loadDropdowns = async () => {
      const showDropdownAlert = (message: string) =>
        showAlert(message, 'danger');

      showSpinner();
      try {
        const [industries, companies] = await Promise.all([
          getIndustryTypes(showDropdownAlert),
          getCompanyTypes(showDropdownAlert),
        ]);

        const industryFormatted = industries.map((i) => ({
          label: i.type,
          value: i._id,
        }));

        const companyFormatted = companies.map((c) => ({
          label: c.type,
          value: c._id,
        }));

        setIndustryOptions(industryFormatted);
        setCompanyTypeOptions(companyFormatted);
      } catch {
        setIndustryOptions([{ label: 'Select...', value: '' }]);
        setCompanyTypeOptions([{ label: 'Select...', value: '' }]);
      } finally {
        hideSpinner();
      }
    };

    loadDropdowns();
  }, [showSpinner, hideSpinner, showAlert]);

  // Helper function to clear registration number error
  const clearRegistrationNumberValidation = () => {
    if (errors.registrationNumber) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.registrationNumber;
        return updated;
      });
    }
  };

  // Check registration number uniqueness
  const checkRegistrationNumberUnique = async (
    registrationNumber: string
  ): Promise<boolean> => {
    try {
      const trimmed = registrationNumber.trim();
      if (!trimmed) {
        return false;
      }

      showSpinner();
      const response = await checkRegistrationNumber(trimmed);
      if (response.success && response.data) {
        // If isExists is false, the registration number is unique (valid)
        // If isExists is true, the registration number already exists (not unique)
        return response.data.isExists === false;
      }
      return false;
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'AdditionalInfoForm',
          method: 'checkRegistrationNumberUnique',
          registrationNumber,
        });
      });
      return false;
    } finally {
      hideSpinner();
    }
  };

  //  Validation Logic
  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};

    // Company Registration Number
    if (hasLeadingOrTrailingSpaces(registrationNumber)) {
      newErrors.registrationNumber = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (!isValidRegistrationNumber(registrationNumber)) {
      newErrors.registrationNumber = ERROR_MESSAGES.INVALID_REGISTRATION_NUMBER;
    } else if (registrationNumber.length > 30) {
      newErrors.registrationNumber =
        ERROR_MESSAGES.REGISTRATION_NUMBER_TOO_LONG;
    } else {
      // Check registration number via API
      try {
        const isUnique =
          await checkRegistrationNumberUnique(registrationNumber);
        if (!isUnique) {
          newErrors.registrationNumber =
            ERROR_MESSAGES.COMPANY_REGISTRATION_NUMBER_EXISTS;
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AdditionalInfoForm',
            method: 'validateForm',
            registrationNumber,
          });
        });
        newErrors.registrationNumber = ERROR_MESSAGES.UNEXPECTED_ERROR;
      }
    }

    // Company Address
    if (hasLeadingOrTrailingSpaces(address)) {
      newErrors.address = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (address.length > 150) {
      newErrors.address = ERROR_MESSAGES.ADDRESS_TOO_LONG;
    }

    // Industry
    if (!industryType || industryType === 'Select...') {
      newErrors.industryType = ERROR_MESSAGES.REQUIRED_INDUSTRY;
    }

    // Company Type
    if (!companyType || companyType === 'Select...') {
      newErrors.companyType = ERROR_MESSAGES.REQUIRED_COMPANY_TYPE;
    }

    // Website (optional but must be valid if filled)
    if (website.trim()) {
      if (hasLeadingOrTrailingSpaces(website)) {
        newErrors.website = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
      } else if (!isValidWebsite(website)) {
        newErrors.website = ERROR_MESSAGES.INVALID_WEBSITE;
      }
    }

    // DUNS Number (optional but must be valid if filled)
    if (dunsNumber.trim()) {
      if (hasLeadingOrTrailingSpaces(dunsNumber)) {
        newErrors.dunsNumber = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
      } else if (!isValidDUNSNumber(dunsNumber)) {
        newErrors.dunsNumber = ERROR_MESSAGES.INVALID_DUNS_NUMBER;
      } else if (dunsNumber.replace(/-/g, '').length !== 9) {
        newErrors.dunsNumber = ERROR_MESSAGES.INVALID_DUNS_NUMBER;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = async (
    field: string,
    value: string,
    includeLeadingTrailingSpaceValidation = true
  ) => {
    let error = '';
    switch (field) {
      case 'website':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.trim() && !isValidWebsite(value)) {
          error = ERROR_MESSAGES.INVALID_WEBSITE;
        }
        break;
      case 'registrationNumber':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length > 30) {
          error = ERROR_MESSAGES.REGISTRATION_NUMBER_TOO_LONG;
        } else if (value && !isValidRegistrationNumber(value)) {
          error = ERROR_MESSAGES.INVALID_REGISTRATION_NUMBER;
        } else if (value.trim()) {
          // Check registration number via API
          try {
            const isUnique = await checkRegistrationNumberUnique(value);
            if (!isUnique) {
              error = ERROR_MESSAGES.COMPANY_REGISTRATION_NUMBER_EXISTS;
            }
          } catch (validationError) {
            Bugsnag.notify(validationError as Error, (event) => {
              event.addMetadata('context', {
                component: 'AdditionalInfoForm',
                method: 'validateField',
                field: 'registrationNumber',
                value,
              });
            });
            error = ERROR_MESSAGES.UNEXPECTED_ERROR;
          }
        }
        break;
      case 'address':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length > 150) {
          error = ERROR_MESSAGES.ADDRESS_TOO_LONG;
        }
        break;
      case 'dunsNumber':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.trim() && value.replace(/-/g, '').length !== 9) {
          error = ERROR_MESSAGES.DUNS_NUMBER_INVALID_LENGTH;
        } else if (value.trim() && !isValidDUNSNumber(value)) {
          error = ERROR_MESSAGES.INVALID_DUNS_NUMBER;
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

  // Handlers
  const handleNextClick = async () => {
    const isValid = await validateForm();
    if (isValid) {
      onNext();
    }
  };
  // Generic focus/blur handlers
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = async (field?: string) => {
    setFocusedField(null);
    // Validate fields on blur
    if (field === 'address') {
      await validateField('address', address);
    } else if (field === 'registrationNumber') {
      await validateField('registrationNumber', registrationNumber);
    } else if (field === 'website') {
      await validateField('website', website);
    } else if (field === 'dunsNumber') {
      await validateField('dunsNumber', dunsNumber);
    }
  };
  // Disable Next if required fields empty or have errors
  const hasBlockingValidationError = !!(
    !registrationNumber.trim() ||
    !industryType.trim() ||
    !companyType.trim() ||
    !address.trim() ||
    hasLeadingOrTrailingSpaces(registrationNumber) ||
    hasLeadingOrTrailingSpaces(address) ||
    (website && hasLeadingOrTrailingSpaces(website)) ||
    (dunsNumber && hasLeadingOrTrailingSpaces(dunsNumber)) ||
    (registrationNumber &&
      (!isValidRegistrationNumber(registrationNumber) ||
        registrationNumber.length > 30)) ||
    (address && address.length > 150) ||
    (website && !isValidWebsite(website)) ||
    (dunsNumber &&
      (!isValidDUNSNumber(dunsNumber) ||
        dunsNumber.replace(/-/g, '').length !== 9)) ||
    Object.keys(errors).length > 0
  );
  const isNextDisabled =
    !isStepPreviouslyValidated && hasBlockingValidationError;

  return (
    <>
      <div className={styles.formWrapper}>
        {/* Company Website */}
        <div className={styles.formGroup}>
          <label>Company Website </label>
          <input
            type="text"
            placeholder="www."
            value={website}
            onChange={(e) => {
              onChange('website', e.target.value);
              validateField('website', e.target.value, false);
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              validateField('website', pastedText, false);
            }}
            onFocus={() => handleFocus('website')}
            onBlur={() => handleBlur('website')}
            className={`${styles.inputDefault} ${
              errors.website
                ? styles.inputError
                : focusedField === 'website'
                  ? styles.inputValid
                  : ''
            }`}
          />

          {errors.website && <p className={styles.error}>{errors.website}</p>}
        </div>

        {/* Industry & Company Type */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <DropdownComponent
              title="Industry"
              options={industryOptions}
              value={industryType}
              onChange={(val: string) => onChange('industryType', val)}
              className={`${errors.industryType ? styles.inputError : focusedField === 'industryType' ? styles.inputValid : styles.inputDefault}`}
              truncateLabel={true}
              placeholder="Select..."
            />
            {errors.industryType && (
              <p className={styles.error}>{errors.industryType}</p>
            )}
          </div>
          <div className={styles.formGroup}>
            <DropdownComponent
              title="Company Type"
              options={companyTypeOptions}
              value={companyType}
              onChange={(val: string) => onChange('companyType', val)}
              className={`${errors.companyType ? styles.inputError : focusedField === 'companyType' ? styles.inputValid : styles.inputDefault}`}
              truncateLabel={true}
              placeholder="Select..."
            />
            {errors.companyType && (
              <p className={styles.error}>{errors.companyType}</p>
            )}
          </div>
        </div>

        {/* Company Registration Number */}
        <div className={styles.formGroup}>
          <div className={styles.labels}>
            <label>
              Company Registration Number{' '}
              <span className={styles.required}>*</span>{' '}
            </label>

            <Tooltip text={TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER} noTruncate>
              <img
                src={infoicon}
                alt="info"
                className={styles.infoIcon}
                width={12}
                height={12}
                style={{ verticalAlign: 'baseline' }}
              />
            </Tooltip>
          </div>
          <input
            type="text"
            placeholder="Enter registration number..."
            value={registrationNumber}
            onChange={(e) => {
              onChange('registrationNumber', e.target.value);
              clearRegistrationNumberValidation();
            }}
            onPaste={() => {
              // onChange will also fire on paste, so we just reset state here
              clearRegistrationNumberValidation();
            }}
            onFocus={() => handleFocus('registrationNumber')}
            onBlur={async () => {
              await handleBlur('registrationNumber');
            }}
            className={`${styles.inputDefault} ${
              errors.registrationNumber
                ? styles.inputError
                : focusedField === 'registrationNumber'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.registrationNumber && (
            <p className={styles.error}>{errors.registrationNumber}</p>
          )}
        </div>

        {/* D-U-N-S Number */}
        <div className={styles.formGroup}>
          <div className={styles.labels}>
            <label>D-U-N-S Number </label>

            <Tooltip text={TOOLTIP_TEXT.DUNS_NUMBER} noTruncate>
              <img
                src={infoicon}
                alt="info"
                className={styles.infoIcon}
                width={12}
                height={12}
                style={{ verticalAlign: 'baseline' }}
              />
            </Tooltip>
          </div>
          <input
            type="text"
            placeholder="Enter number..."
            value={dunsNumber}
            onChange={(e) => {
              const filteredValue = e.target.value.replace(/[^0-9-]/g, '');
              onChange('dunsNumber', filteredValue);
              validateField('dunsNumber', filteredValue, false);
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              const filteredValue = pastedText.replace(/[^0-9-]/g, '');
              validateField('dunsNumber', filteredValue, false);
            }}
            onFocus={() => handleFocus('dunsNumber')}
            onBlur={() => handleBlur('dunsNumber')}
            className={`${styles.inputDefault} ${
              errors.dunsNumber
                ? styles.inputError
                : focusedField === 'dunsNumber'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.dunsNumber && (
            <p className={styles.error}>{errors.dunsNumber}</p>
          )}
        </div>

        {/* Company Address */}
        <div className={styles.formGroup}>
          <div className={styles.labelTextarea}>
            <label>
              Company Address <span className={styles.required}>*</span>
            </label>
            <span className={styles.charCount}>{address.length} / 150</span>
          </div>

          <textarea
            placeholder="Enter company address…"
            maxLength={150}
            rows={3}
            value={address}
            onChange={(e) => {
              onChange('address', e.target.value);
            }}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              validateField('address', pastedText, false);
            }}
            onFocus={() => handleFocus('address')}
            onBlur={() => handleBlur('address')}
            style={{
              textAlign: 'start',
              overflowY: 'hidden', // Prevent scrollbars
              resize: 'none', // Prevent manual resizing
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            className={`${styles.inputDefault} ${
              errors.address
                ? styles.inputError
                : focusedField === 'address'
                  ? styles.inputValid
                  : ''
            }`}
          />
          {errors.address && <p className={styles.error}>{errors.address}</p>}
        </div>

        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button className={styles.prevBtn} onClick={onPrev}>
            Previous
          </button>
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

export default AdditionalInfoForm;
