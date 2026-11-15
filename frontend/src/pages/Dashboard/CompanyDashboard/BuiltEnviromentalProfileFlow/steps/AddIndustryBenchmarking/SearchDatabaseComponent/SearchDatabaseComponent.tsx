import { useState, useMemo, useCallback, useEffect } from 'react';
import styles from './SearchDatabaseComponent.module.scss';
import parentStyles from '../../../BuiltEnviromentalProfileFlow.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import { INDUSTRY_OPTIONS } from '@constants/mockData';
import { lciaOptions } from '@constants/mockData';
import {
  SUPPLIER_ROLE_SLUGS,
  TRANSPORT_METHOD_LABELS,
} from '@constants/component-service-flow';
import { ERROR_MESSAGES } from '@constants/messages';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { useShallow } from 'zustand/react/shallow';
import type { SearchDatabaseFormData } from '@type/built-enviromental-profile';
import {
  sanitizeComponentSearchInput,
  hasLeadingOrTrailingSpaces,
  sanitizeCasNumberStrict,
  hasLeadingOrTrailingHyphen,
} from '@utils/validation';
import { useGeographyAutocomplete } from '@hooks/useGeographyAutocomplete';
import LocationSearch from '@common/LocationSearch/LocationSearch';
import UpArrowIcon from '@assets/icons/arrow-up.svg';
import DownArrowIcon from '@assets/icons/arrow-down.svg';
interface SearchDatabaseComponentProps {
  supplierRoleSlug?: string;
  isImpactCategoryForm?: boolean;
  onSearch?: (formData: SearchDatabaseFormData, skip?: number) => void;
  lastSearchedFormData?: SearchDatabaseFormData | null;
  hasResults?: boolean;
  disableSearchOnMount?: boolean;
}

const initialFormData: SearchDatabaseFormData = {
  componentName: '',
  supplierLocation: '',
  transportMethod: '',
  transportRegion: '',
  lciaMethodology: '',
  casNumber: '',
  industry: '',
};

const FIELD_NAME_MAP: Record<string, keyof SearchDatabaseFormData> = {
  rawMaterialsLciaMethod: 'lciaMethodology',
  transportLciaMethod: 'lciaMethodology',
  storageLciaMethod: 'lciaMethodology',
  packagingLciaMethod: 'lciaMethodology',
  rawMaterialsIndustry: 'industry',
  transportMethod: 'transportMethod',
};

const ERROR_KEY_MAP: Record<string, keyof SearchDatabaseFormData> = {
  supplierLocation: 'supplierLocation',
  transportRegion: 'transportRegion',
  storageSupplierLocation: 'supplierLocation',
  packagingSupplierLocation: 'supplierLocation',
  rawMaterialsLciaMethod: 'lciaMethodology',
  transportLciaMethod: 'lciaMethodology',
  storageLciaMethod: 'lciaMethodology',
  packagingLciaMethod: 'lciaMethodology',
};

const getErrorKey = (field: string) =>
  (ERROR_KEY_MAP[field] ??
    (field as keyof SearchDatabaseFormData)) as keyof SearchDatabaseFormData;

export const SearchDatabaseComponent = ({
  supplierRoleSlug,
  isImpactCategoryForm = false,
  onSearch,
  lastSearchedFormData,
  disableSearchOnMount = false,
}: SearchDatabaseComponentProps) => {
  const effectiveStoreKey = supplierRoleSlug ?? '';

  const {
    getSearchDatabaseFormData,
    setSearchDatabaseFormData,
    updateSearchDatabaseField,
    getImpactCategorySearchDatabaseFormData,
    setImpactCategorySearchDatabaseFormData,
    updateImpactCategorySearchDatabaseField,
  } = useBuiltEnvironmentalProfileFlowStore(
    useShallow((s) => ({
      getSearchDatabaseFormData: s.getSearchDatabaseFormData,
      setSearchDatabaseFormData: s.setSearchDatabaseFormData,
      updateSearchDatabaseField: s.updateSearchDatabaseField,
      getImpactCategorySearchDatabaseFormData:
        s.getImpactCategorySearchDatabaseFormData,
      setImpactCategorySearchDatabaseFormData:
        s.setImpactCategorySearchDatabaseFormData,
      updateImpactCategorySearchDatabaseField:
        s.updateImpactCategorySearchDatabaseField,
    }))
  );

  const getFormData = useMemo(
    () =>
      isImpactCategoryForm
        ? getImpactCategorySearchDatabaseFormData
        : getSearchDatabaseFormData,
    [
      isImpactCategoryForm,
      getImpactCategorySearchDatabaseFormData,
      getSearchDatabaseFormData,
    ]
  );
  const setFormData = useMemo(
    () =>
      isImpactCategoryForm
        ? setImpactCategorySearchDatabaseFormData
        : setSearchDatabaseFormData,
    [
      isImpactCategoryForm,
      setImpactCategorySearchDatabaseFormData,
      setSearchDatabaseFormData,
    ]
  );
  const updateFormField = useMemo(
    () =>
      isImpactCategoryForm
        ? updateImpactCategorySearchDatabaseField
        : updateSearchDatabaseField,
    [
      isImpactCategoryForm,
      updateImpactCategorySearchDatabaseField,
      updateSearchDatabaseField,
    ]
  );

  const storedFormData = useBuiltEnvironmentalProfileFlowStore(
    useShallow((s) =>
      effectiveStoreKey
        ? (isImpactCategoryForm
            ? (s.impactCategorySearchDatabaseFormDataByRole[effectiveStoreKey] ??
              initialFormData)
            : (s.searchDatabaseFormDataByRole[effectiveStoreKey] ??
              initialFormData))
        : initialFormData
    )
  );

  // Local error state (form data is in the store)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if form has been touched/interacted with
  const [isFormTouched, setIsFormTouched] = useState(false);

  // Initialize store entry for the current role
  useEffect(() => {
    if (!effectiveStoreKey) return;
    const existing = getFormData(effectiveStoreKey);
    setFormData(effectiveStoreKey, existing ?? initialFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveStoreKey, getFormData, setFormData]);

  const setError = useCallback((field: string, message: string) => {
    const key = getErrorKey(field);
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    const key = getErrorKey(field);
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleFocus = useCallback(
    (field: string) => {
      clearError(field);
    },
    [clearError]
  );

  const handleFieldChange = useCallback(
    (field: keyof SearchDatabaseFormData, value: string) => {
      if (!effectiveStoreKey) return;
      if (field === 'componentName') {
        value = sanitizeComponentSearchInput(value);
      }
      if (field === 'casNumber') {
        value = sanitizeCasNumberStrict(value);
      }

      updateFormField(effectiveStoreKey, field, value);
      clearError(field);
      setIsFormTouched(true);
    },
    [effectiveStoreKey, updateFormField, clearError]
  );

  const handleFieldBlur = useCallback(
    (field: keyof SearchDatabaseFormData, value: string) => {
      if (!value || !value.trim()) {
        if (field === 'componentName') {
          setError(field, ERROR_MESSAGES.COMPONENT_NAME_REQUIRED);
        }
      }
    },
    [setError]
  );

  const supplierLocationPlaces = useGeographyAutocomplete({
    value: storedFormData.supplierLocation,
    onSelect: (address) => {
      if (!effectiveStoreKey) return;
      updateFormField(effectiveStoreKey, 'supplierLocation', address);
      clearError('supplierLocation');
      setIsFormTouched(true);
    },
  });

  const transportRegionPlaces = useGeographyAutocomplete({
    value: storedFormData.transportRegion,
    onSelect: (address) => {
      if (!effectiveStoreKey) return;
      updateFormField(effectiveStoreKey, 'transportRegion', address);
      clearError('transportRegion');
      setIsFormTouched(true);
    },
  });

  // Dropdown option mappers
  const industryDropdownOptions = useMemo(
    () =>
      INDUSTRY_OPTIONS.map((option) => ({
        value: option,
        label: option,
      })),
    []
  );

  const lciaMethodDropdownOptions = useMemo(
    () =>
      lciaOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );

  const transportMethodDropdownOptions = useMemo(
    () =>
      Object.entries(TRANSPORT_METHOD_LABELS).map(([key, label]) => ({
        value: key,
        label,
      })),
    []
  );

  const requiredFilled = useMemo(() => {
    if (!supplierRoleSlug) return false;

    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
    ) {
      return !!(
        storedFormData.componentName?.trim() &&
        storedFormData.lciaMethodology?.trim()
      );
    }

    if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
      return !!(
        storedFormData.transportMethod?.trim() &&
        storedFormData.lciaMethodology?.trim() &&
        storedFormData.transportRegion?.trim()
      );
    }

    if (
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RETAILER ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER
    ) {
      return !!(
        storedFormData.supplierLocation?.trim() &&
        storedFormData.lciaMethodology?.trim()
      );
    }

    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
    ) {
      return !!(
        storedFormData.componentName?.trim() &&
        storedFormData.lciaMethodology?.trim()
      );
    }

    return false;
  }, [supplierRoleSlug, storedFormData]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!supplierRoleSlug) return false;

    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
    ) {
      if (!storedFormData.componentName?.trim()) {
        newErrors.componentName = ERROR_MESSAGES.COMPONENT_NAME_REQUIRED;
      }
      if (!storedFormData.lciaMethodology?.trim()) {
        newErrors.lciaMethodology = ERROR_MESSAGES.LCIA_METHODOLOGY_REQUIRED;
      }
    }

    if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
      if (!storedFormData.transportMethod?.trim()) {
        newErrors.transportMethod = ERROR_MESSAGES.TRANSPORT_METHOD_REQUIRED;
      }
      if (!storedFormData.lciaMethodology?.trim()) {
        newErrors.lciaMethodology = ERROR_MESSAGES.LCIA_METHODOLOGY_REQUIRED;
      }
      if (!storedFormData.transportRegion?.trim()) {
        newErrors.transportRegion = ERROR_MESSAGES.SUPPLIER_LOCATION_REQUIRED;
      }
    }

    if (
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RETAILER ||
      supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER
    ) {
      if (!storedFormData.supplierLocation?.trim()) {
        newErrors.supplierLocation = ERROR_MESSAGES.SUPPLIER_LOCATION_REQUIRED;
      }
      if (!storedFormData.lciaMethodology?.trim()) {
        newErrors.lciaMethodology = ERROR_MESSAGES.LCIA_METHODOLOGY_REQUIRED;
      }
    }

    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
    ) {
      if (!storedFormData.componentName?.trim()) {
        newErrors.componentName = ERROR_MESSAGES.COMPONENT_NAME_REQUIRED;
      }
      if (!storedFormData.lciaMethodology?.trim()) {
        newErrors.lciaMethodology = ERROR_MESSAGES.LCIA_METHODOLOGY_REQUIRED;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [supplierRoleSlug, storedFormData]);

  const hasFormErrors = Object.keys(errors).length > 0;

  // Check for form changes since last search
  const formDataChanged = useMemo(() => {
    if (!lastSearchedFormData) return true;
    return (
      Object.keys(initialFormData) as Array<keyof SearchDatabaseFormData>
    ).some((key) => storedFormData[key] !== lastSearchedFormData[key]);
  }, [storedFormData, lastSearchedFormData]);

  // Disable search button if:
  // 1. Form is not valid OR
  // 2. Results were found AND form data hasn't changed since last search AND form hasn't been touched
  // Enable if: no results found OR form data has changed OR form has been touched
  const shouldDisableOnInitialMount =
    disableSearchOnMount && !lastSearchedFormData && !isFormTouched;

  const canSearch =
    requiredFilled &&
    !hasFormErrors &&
    !shouldDisableOnInitialMount &&
    (!lastSearchedFormData || formDataChanged || isFormTouched);

  const renderInput = (
    field: keyof SearchDatabaseFormData,
    label: string,
    placeholder?: string,
    tooltipText?: string,
    required?: boolean,
    type?: React.HTMLInputTypeAttribute
  ) => {
    const value = storedFormData[field] || '';

    return (
      <div className={parentStyles.formField}>
        {tooltipText ? (
          <div className={parentStyles.labelWithIcon}>
            <label
              className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
            >
              {label}{' '}
              {required && <span className={parentStyles.required}>*</span>}
              <Tooltip text={tooltipText} noTruncate position="right">
                <img
                  src={infoIcon}
                  alt="Info"
                  className={parentStyles.infoIcon}
                />
              </Tooltip>
            </label>
          </div>
        ) : (
          <label className={parentStyles.fieldLabel}>
            {label}{' '}
            {required && <span className={parentStyles.required}>*</span>}
          </label>
        )}

        <div className={parentStyles.inputWrapper}>
          <input
            type={type}
            name={String(field)}
            value={value}
            placeholder={placeholder || 'Enter here...'}
            onChange={(e) => {
              let val = e.target.value;
              handleFieldChange(field, val);
            }}
            onBlur={() => {
              if (required) handleFieldBlur(field, value);
              if (hasLeadingOrTrailingSpaces(value)) {
                setError(field, ERROR_MESSAGES.LEADING_TRAILING_SPACES);
              }
              if (field === 'casNumber') {
                if (hasLeadingOrTrailingHyphen(value)) {
                  setError(field, ERROR_MESSAGES.LEADING_TRAILING_HYPHEN);
                }
              }
            }}
            onFocus={() => handleFocus(String(field))}
            className={`${parentStyles.formInput} ${errors[field] ? styles.inputError : ''}`}
            autoComplete="off"
          />
        </div>

        {errors[field] && <p className={styles.error}>{errors[field]}</p>}
      </div>
    );
  };

  const renderDropdown = (
    fieldId: string,
    label: string,
    options: Array<{ value: string; label: string }>,
    value: string,
    placeholder?: string,
    tooltipText?: string,
    required?: boolean,
    error?: string
  ) => {
    const formDataKey =
      FIELD_NAME_MAP[fieldId] || (fieldId as keyof SearchDatabaseFormData);
    const errorKey = getErrorKey(fieldId);

    return (
      <div className={parentStyles.formField}>
        {tooltipText ? (
          <div className={parentStyles.labelWithIcon}>
            <label
              className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
            >
              {label}{' '}
              {required && <span className={parentStyles.required}>*</span>}
              <Tooltip text={tooltipText} noTruncate position="right">
                <img
                  src={infoIcon}
                  alt="Info"
                  className={parentStyles.infoIcon}
                />
              </Tooltip>
            </label>
          </div>
        ) : (
          <label className={parentStyles.fieldLabel}>
            {label}{' '}
            {required && <span className={parentStyles.required}>*</span>}
          </label>
        )}

        <div className={styles.dropdownWrapper}>
          <div className={styles.tooltipWrap}>
            <DropdownComponent
              title=""
              options={options}
              value={value}
              onChange={(val: string) => {
                if (!effectiveStoreKey) return;
                updateFormField(effectiveStoreKey, formDataKey, val);
                if (error) clearError(String(errorKey));
                setIsFormTouched(true);
              }}
              truncateLabel={false}
              placeholder={placeholder || 'Select'}
              arrowRenderer={(isOpen) => (
                <img
                  src={isOpen ? UpArrowIcon : DownArrowIcon}
                  alt="Dropdown"
                  style={{ marginRight: '16px' }}
                />
              )}
              className={`${styles.dropdown} ${styles.labelColor}`}
            />

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {supplierRoleSlug ===
        SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR && (
          <div className={styles.searchDatabaseContainer}>
            <div className={parentStyles.twoColumnFields}>
              {renderInput(
                'componentName',
                'Material, Component, or Service Name',
                'Enter here...',
                TOOLTIP_TEXT.COMPONENT_OR_SERVICE_NAME,
                true,
                'text'
              )}
              {renderInput(
                'casNumber',
                'CAS Number',
                'Enter here...',
                TOOLTIP_TEXT.CAS_NUMBER,
                false,
                'text'
              )}
            </div>

            <div className={parentStyles.twoColumnFields}>
              <LocationSearch
                field="supplierLocation"
                value={storedFormData.supplierLocation}
                geographyHook={supplierLocationPlaces}
                label="Supplier Location"
                placeholder="Search"
                tooltipText={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                error={errors.supplierLocation}
                onFocus={handleFocus}
                required={false}
              />

              {renderDropdown(
                'rawMaterialsLciaMethod',
                'LCIA Methodology',
                lciaMethodDropdownOptions,
                storedFormData.lciaMethodology,
                'Select',
                TOOLTIP_TEXT.LCIA_METHODOLOGY,
                true,
                errors.lciaMethodology
              )}
            </div>

            <div className={styles.industryDropdown}>
              {renderDropdown(
                'rawMaterialsIndustry',
                'Industry',
                industryDropdownOptions,
                storedFormData.industry,
                'Select',
                TOOLTIP_TEXT.INDUSTRY,
                false,
                errors.industry
              )}
            </div>
          </div>
        )}

      {supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT && (
        <div className={styles.searchDatabaseContainer}>
          <div className={parentStyles.twoColumnFields}>
            {renderDropdown(
              'transportMethod',
              'Transport Method',
              transportMethodDropdownOptions,
              storedFormData.transportMethod,
              'Select',
              undefined,
              true,
              errors.transportMethod
            )}

            <LocationSearch
              field="transportRegion"
              value={storedFormData.transportRegion}
              geographyHook={transportRegionPlaces}
              label="Transport Region"
              placeholder="Search"
              tooltipText={TOOLTIP_TEXT.TRANSPORT_REGION}
              error={errors.transportRegion}
              onFocus={handleFocus}
              required={true}
            />
          </div>

          <div className={parentStyles.twoColumnFields}>
            {renderDropdown(
              'transportLciaMethod',
              'LCIA Methodology',
              lciaMethodDropdownOptions,
              storedFormData.lciaMethodology,
              'Select',
              TOOLTIP_TEXT.LCIA_METHODOLOGY,
              true,
              errors.lciaMethodology
            )}
          </div>
        </div>
      )}

      {(supplierRoleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RETAILER ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) && (
          <div className={styles.searchDatabaseContainer}>
            <div className={parentStyles.twoColumnFields}>
              <LocationSearch
                field="storageSupplierLocation"
                value={storedFormData.supplierLocation}
                geographyHook={supplierLocationPlaces}
                label="Supplier Location"
                placeholder="Search"
                tooltipText={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                error={errors.supplierLocation}
                onFocus={handleFocus}
                required={true}
              />

              {renderDropdown(
                'storageLciaMethod',
                'LCIA Methodology',
                lciaMethodDropdownOptions,
                storedFormData.lciaMethodology,
                'Select',
                TOOLTIP_TEXT.LCIA_METHODOLOGY,
                true,
                errors.lciaMethodology
              )}
            </div>
          </div>
        )}

      {supplierRoleSlug ===
        SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR && (
          <div className={styles.searchDatabaseContainer}>
            <div className={parentStyles.twoColumnFields}>
              {renderInput(
                'componentName',
                'Material, Component, or Service Name',
                'Enter here...',
                TOOLTIP_TEXT.COMPONENT_OR_SERVICE_NAME,
                true,
                'text'
              )}

              <LocationSearch
                field="packagingSupplierLocation"
                value={storedFormData.supplierLocation}
                geographyHook={supplierLocationPlaces}
                label="Supplier Location"
                placeholder="Search"
                tooltipText={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                error={errors.supplierLocation}
                onFocus={handleFocus}
                required={false}
              />
            </div>

            <div className={parentStyles.twoColumnFields}>
              {renderDropdown(
                'packagingLciaMethod',
                'LCIA Methodology',
                lciaMethodDropdownOptions,
                storedFormData.lciaMethodology,
                'Select',
                TOOLTIP_TEXT.LCIA_METHODOLOGY,
                true,
                errors.lciaMethodology
              )}
            </div>
          </div>
        )}

      <div className={styles.searchButtonContainer}>
        <button
          className={styles.searchButton}
          disabled={!canSearch}
          onClick={() => {
            if (validateForm() && onSearch) {
              onSearch(storedFormData, 0);
              if (effectiveStoreKey) {
                // Ensure the latest form is stored (explicit save)
                setFormData(effectiveStoreKey, storedFormData);
              }
              setIsFormTouched(false);
            }
          }}
        >
          Search
        </button>
      </div>
    </>
  );
};
