import React, { useEffect, useState } from 'react';
import styles from '@pages/Dashboard/CompanyDashboard/CompanyProfileEdit/CompanyProfileEdit.module.scss';

import companyProfile from '@assets/images/company-profile.png';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';

import { IoIosArrowBack } from 'react-icons/io';
import {
  getCompanyProfile,
  updateCompanyProfile,
} from '@service/company.service';
import { useAlertStore } from '@store/useAlertStore';
import { getCompanyTypes, getIndustryTypes } from '@service/dropdown.service';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import {
  isValidCompanyName,
  isValidContactName,
  isValidDUNSNumber,
  isValidRegistrationNumber,
  isValidWebsite,
  sanitizeComponentSearchInput,
} from '@utils/validation';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import logoImg from '@assets/images/discardIcon.svg';
import calender from '@assets/images/calendar.svg';
import type { CompanyFormData, DropdownOption } from '@type/companyDashboard';
import { formatDate } from '@utils/dateHelpers';

const SupplierProfileEdit = ({
  onBack,
  onProfileUpdate,
}: {
  onBack: () => void;
  onProfileUpdate?: () => void;
}) => {
  const { showAlert } = useAlertStore();
  const [formData, setFormData] = useState<any>(null);

  const [isDiscardModalOpen, setDiscardModalOpen] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<DropdownOption[]>([]);
  const [companyTypeOptions, setCompanyTypeOptions] = useState<
    DropdownOption[]
  >([]);

  const [originalData, setOriginalData] = useState<any>(null); // API untouched copy
  const [isDirty, setIsDirty] = useState(false); // if user modified anything
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleFocus = (field: string) => {
    setFocusedField(field);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleBlur = (field: string, value: string) => {
    setFocusedField(null);
    let error = '';
    switch (field) {
      case 'companyName':
        if (!value.trim()) error = ERROR_MESSAGES.REQUIRED_COMPANY_NAME;
        else if (!isValidCompanyName(value))
          error = ERROR_MESSAGES.COMPANY_NAME_TOO_LONG;
        break;

      case 'contactName':
        if (!value.trim()) error = ERROR_MESSAGES.REQUIRED_CONTACT_NAME;
        if (value.length > 100) error = ERROR_MESSAGES.CONTACT_NAME_TOO_LONG;
        else if (value && !isValidContactName(value))
          error = ERROR_MESSAGES.INVALID_ALPHANUMERIC_NAME;
        break;
      case 'website':
        if (value.trim() && !isValidWebsite(value))
          error = ERROR_MESSAGES.INVALID_WEBSITE;
        break;
      case 'registrationNumber':
        if (!value.trim()) error = ERROR_MESSAGES.REQUIRED_REGISTRATION_NUMBER;
        if (!isValidRegistrationNumber(value))
          error = ERROR_MESSAGES.INVALID_REGISTRATION_NUMBER;
        else if (value.length > 30)
          error = ERROR_MESSAGES.REGISTRATION_NUMBER_TOO_LONG;
        break;
      case 'address':
        if (!value.trim()) error = ERROR_MESSAGES.REQUIRED_ADDRESS;
        if (!formData.address.trim() || value.length > 150)
          error = ERROR_MESSAGES.ADDRESS_TOO_LONG;
        break;

      case 'dunsNumber':
        if (value.trim() && value.replace(/-/g, '').length !== 9)
          error = ERROR_MESSAGES.DUNS_NUMBER_INVALID_LENGTH;
        else if (value.trim() && !isValidDUNSNumber(value))
          error = ERROR_MESSAGES.INVALID_DUNS_NUMBER;
    }

    if (error) setErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanyProfile();

        const formatted = {
          companyName: data.companyName,
          dunsNumber: data.dunsNumber ?? '',
          contactName: data.companyContactName,
          contactEmail: data.companyContactEmail,
          website: data.companyWebsite,
          registrationNumber: data.registrationNumber,
          industry: data.industry?._id,
          companyType: data.companyType?._id,
          address: data.companyAddress,
          createdAt: data.createdAt,
        };

        setFormData(formatted);

        setOriginalData(formatted);
      } catch (err) {
        console.error('Failed to load company details', err);
      }
    })();
  }, []);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [industries, companies] = await Promise.all([
          getIndustryTypes(showAlert as any),
          getCompanyTypes(showAlert as any),
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
      } catch (error) {
        setIndustryOptions([{ label: 'Select...', value: '' }]);
        setCompanyTypeOptions([{ label: 'Select...', value: '' }]);
      }
    };

    loadDropdowns();
  }, []);

  const handleChange = (
    fieldOrEvent:
      | string
      | React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    value?: string
  ) => {
    if (!formData || !originalData) return;

    let updated: CompanyFormData;

    if (typeof fieldOrEvent === 'string') {
      const fieldValue =
        fieldOrEvent === 'companyName' && typeof value === 'string'
          ? sanitizeComponentSearchInput(value)
          : value;
      updated = { ...formData, [fieldOrEvent]: fieldValue };
    } else {
      const { name, value } = fieldOrEvent.target;
      const fieldValue =
        name === 'companyName' ? sanitizeComponentSearchInput(value) : value;
      updated = { ...formData, [name]: fieldValue };
    }

    setFormData(updated);

    // Dirty check
    const dirty = Object.keys(originalData).some(
      (key) =>
        originalData[key as keyof CompanyFormData] !==
        updated[key as keyof CompanyFormData]
    );

    setIsDirty(dirty);
  };
  const handleSave = async () => {
    const payload = {
      contactName: formData.contactName,
      companyName: formData.companyName,
      website: formData.website,
      address: formData.address,
      industryType: formData.industry,
      companyType: formData.companyType,
      registrationNumber: formData.registrationNumber,
      dunsNumber: formData.dunsNumber,
    };

    try {
      await updateCompanyProfile(payload);
      showAlert(SUCCESS_MESSAGES.PROFILE_SAVE_CHANGES);

      setIsDirty(false);
      if (onProfileUpdate) onProfileUpdate();
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Update failed:', error);
      showAlert(ERROR_MESSAGES.PROFILE_FAILE_TO_SAVE_CHANGES, 'danger');
    }
  };

  const handleDiscardClick = () => {
    setDiscardModalOpen(true);
  };

  const confirmDiscardChanges = () => {
    setFormData({ ...originalData });
    setIsDirty(false);
    setDiscardModalOpen(false);
    showAlert(SUCCESS_MESSAGES.PROFILE_CHNAGES_DISCARDED);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  const cancelDiscard = () => {
    setDiscardModalOpen(false);
  };

  const isFormValid = () => {
    const requiredFields = [
      formData.companyName,
      formData.contactName,
      formData.registrationNumber,
      formData.address,
      formData.industry,
      formData.companyType,
    ];

    const hasEmptyRequiredField = requiredFields.some(
      (value) => !value || !value.toString().trim()
    );

    const hasErrors = Object.values(errors).some((e) => e && e.length > 0);

    return !hasEmptyRequiredField && !hasErrors;
  };

  return (
    <>
      <div className={styles.headerWrapper}>
        <div className={styles.btnWrapper}>
          <button className={styles.backBtn} onClick={onBack}>
            <IoIosArrowBack className={styles.backIcon} />
          </button>
          Go Back
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.contentWrapper}>
          {!formData ? (
            <SkeletonLoader type="companyProfileEdit" />
          ) : (
            <>
              <div className={styles.contentInfo}>
                <div className={styles.headerRow}>
                  <img
                    src={companyProfile}
                    alt="profile"
                    className={styles.profileImg}
                  />

                  <div className={styles.companyInfo}>
                    <div className={styles.companyNameWrap}>
                      <h2>{originalData?.companyName}</h2>

                      <p>
                        <img
                          src={calender}
                          alt="calender"
                          width="14"
                          height="14"
                        />

                        <span>
                          Date Joined:{' '}
                          {formatDate(formData.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>
                      Company Name{' '}
                      <span className={styles.required}>*</span>{' '}
                    </label>

                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      onFocus={() => handleFocus('companyName')}
                      onBlur={(e) =>
                        handleBlur('companyName', e.target.value.trim())
                      }
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
                    <label>D-U-N-S Number (optional) </label>
                    <input
                      type="text"
                      name="dunsNumber"
                      value={formData.dunsNumber}
                      onChange={handleChange}
                      onFocus={() => handleFocus('dunsNumber')}
                      onBlur={(e) =>
                        handleBlur('dunsNumber', e.target.value.trim())
                      }
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

                  <div className={styles.formGroup}>
                    <label>
                      Name of Company Contact (First & Last){' '}
                      <span className={styles.required}>*</span>{' '}
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      onFocus={() => handleFocus('contactName')}
                      onBlur={(e) =>
                        handleBlur('contactName', e.target.value.trim())
                      }
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

                  <div
                    className={`${styles.formGroup} ${styles.disabledGroup}`}
                  >
                    <label className={styles.label}>
                      Email of Company Contact{' '}
                      <span className={styles.required}>*</span>{' '}
                    </label>
                    <input
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      type="email"
                      disabled
                      className={styles.disabledInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company Website </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onFocus={() => handleFocus('website')}
                      onBlur={(e) =>
                        handleBlur('website', e.target.value.trim())
                      }
                      className={`${styles.inputDefault} ${
                        errors.website
                          ? styles.inputError
                          : focusedField === 'website'
                            ? styles.inputValid
                            : ''
                      }`}
                    />
                    {errors.website && (
                      <p className={styles.error}>{errors.website}</p>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Company Registration Number{' '}
                      <span className={styles.required}>*</span>{' '}
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      onFocus={() => handleFocus('registrationNumber')}
                      onBlur={(e) =>
                        handleBlur('registrationNumber', e.target.value.trim())
                      }
                      className={`${styles.inputDefault} ${
                        errors.registrationNumber
                          ? styles.inputError
                          : focusedField === 'registrationNumber'
                            ? styles.inputValid
                            : ''
                      }`}
                    />
                    {errors.registrationNumber && (
                      <p className={styles.error}>
                        {errors.registrationNumber}
                      </p>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <DropdownComponent
                      title="Industry"
                      options={industryOptions}
                      value={formData.industry}
                      onChange={(val: string) => handleChange('industry', val)}
                      className={`${styles.dropdown} ${styles.labelColor} ${errors.industryType ? styles.inputError : focusedField === 'industryType' ? styles.inputValid : styles.inputDefault}`}
                      truncateLabel={false}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <DropdownComponent
                      title="Company Type"
                      options={companyTypeOptions}
                      value={formData.companyType}
                      onChange={(val: string) =>
                        handleChange('companyType', val)
                      }
                      className={`${styles.dropdown} ${styles.labelColor} ${errors.companyType ? styles.inputError : focusedField === 'companyType' ? styles.inputValid : styles.inputDefault}`}
                      truncateLabel={false}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ width: '100%' }}>
                    <div className={styles.labelTextarea}>
                      <label className={styles.fullRow}>
                        Company Address{' '}
                        <span className={styles.required}>*</span>
                      </label>
                      <span className={styles.charCount}>
                        {formData.address.length} / 150
                      </span>
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      maxLength={150}
                      onFocus={() => handleFocus('address')}
                      onBlur={(e) =>
                        handleBlur('address', e.target.value.trim())
                      }
                      className={`${styles.inputDefault} ${
                        errors.address
                          ? styles.inputError
                          : focusedField === 'address'
                            ? styles.inputValid
                            : ''
                      }`}
                    />
                    {errors.address && (
                      <p className={styles.error}>{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.actionRow}>
                <button
                  className={styles.discardBtn}
                  onClick={handleDiscardClick}
                  disabled={!isDirty}
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  form="companyProfileForm"
                  onClick={handleSave}
                  disabled={!isDirty || !isFormValid()}
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isDiscardModalOpen && (
        <CommonModal
          icon={logoImg}
          title="Discard Changes"
          message={
            <>
              Are you sure you want to discard the changes? <br />
              The changes made won’t be saved.
            </>
          }
          cancelText="Cancel"
          confirmText="Discard"
          onCancel={cancelDiscard}
          onConfirm={confirmDiscardChanges}
          confirmBtnClass={styles.discardButton}
        />
      )}
    </>
  );
};

export default SupplierProfileEdit;
