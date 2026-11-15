import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import styles from './SelectSupplierWithRole.module.scss';
import parentStyles from '../../AddComponentAndServiceFlow.module.scss';
import type {
  ProductSupplier,
  Supplier,
} from '@type/supplier';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@type/auth';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import {
  searchSuppliers,
} from '@service/supplier.service';
import { checkEmailExist } from '@service/product-components.service';
import {
  isValidEmail,
  isValidSupplierName,
  isValidRegistrationNumber,
  hasLeadingOrTrailingSpaces,
  isValidContactName,
} from '@utils/validation';
import Bugsnag from '@utils/bugsnag';
import searchIcon from '@assets/icons/search.svg';
import arrowDownIcon from '@assets/icons/arrow-down.svg';
import AddIcon from '@assets/icons/add.svg';
import infoIcon from '@assets/icons/info-icon.svg';
import checkIcon from '@assets/icons/check.svg';
import checkedIcon from '@assets/icons/checked.svg';
import closeCircleIcon from '@assets/icons/close-circle.svg';
import Tooltip from '@common/Tooltip/Tooltip';


interface SelectSupplierWithRoleProps { }

const initialFormErrors = {
  companyName: '',
  contactName: '',
  email: '',
  registrationNumber: '',
};

const SelectSupplierWithRole: React.FC<SelectSupplierWithRoleProps> = memo(
  () => {
    // Zustand store
    const selectedComponent = useAddComponentAndServiceFlowStore(
      (state) => state.selectedComponent
    );
    const assignedSupplier = useAddComponentAndServiceFlowStore(
      (state) => state.assignedSupplier
    );
    const supplierRoles = useAddComponentAndServiceFlowStore(
      (state) => state.supplierRoles
    );
    const currentUserEmail = useAddComponentAndServiceFlowStore(
      (state) => state.currentUserEmail
    );
    const setAssignedSupplier = useAddComponentAndServiceFlowStore(
      (state) => state.setAssignedSupplier
    );
    const goToNextStep = useAddComponentAndServiceFlowStore(
      (state) => state.goToNextStep
    );
    const goToPreviousStep = useAddComponentAndServiceFlowStore(
      (state) => state.goToPreviousStep
    );
    const { showAlert } = useAlertStore();
    const {
      showSpinner,
      hideSpinner,
      visible: isSpinnerVisible,
    } = useSpinnerStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
      null
    );

    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [isSearchComplete, setIsSearchComplete] = useState(false);

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isNewSupplier, setIsNewSupplier] = useState(false);

    const [openUpwards, setOpenUpwards] = useState(false);

    const [formErrors, setFormErrors] = useState(initialFormErrors);
    const [isRegistrationNumberUnique, setIsRegistrationNumberUnique] =
      useState<boolean>(false);

    const searchWrapperRef = useRef<HTMLDivElement>(null);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    const componentName = selectedComponent?.name || '';
    const componentSku = selectedComponent?.internalSku || '';

    const hasSelectedSupplier = !!selectedSupplier;
    const isNewSupplierFlow = hasSelectedSupplier && isNewSupplier;
    const showSupplierSearch = !hasSelectedSupplier;

    // --- Effects ---

    // Pre-fill supplier data when assignedSupplier is available (e.g., when navigating back)
    useEffect(() => {
      if (assignedSupplier) {
        const supplier: Supplier = {
          id: assignedSupplier.id,
          companyName: assignedSupplier.name,
          contactName: assignedSupplier.contactName,
          email: assignedSupplier.contactEmail,
          registrationNumber: assignedSupplier.registrationNumber,
        };

        setSelectedSupplier(supplier);
        setSearchQuery(assignedSupplier.name);
        setSelectedRoles(assignedSupplier.roles);
        setIsNewSupplier(false);
        setIsRegistrationNumberUnique(true);
        setFormErrors(initialFormErrors);
        setShowSearchResults(false);
        setIsSearchComplete(false);
      }
    }, [assignedSupplier]);

    // Search suppliers (debounced)
    const performSearch = useCallback(
      async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
          setSearchResults([]);
          setShowSearchResults(false);
          setIsSearchComplete(false);
          return;
        }

        setIsSearchComplete(false);
        showSpinner();
        try {
          const response = await searchSuppliers({ query: trimmed });

          if (response.success && response.data) {
            const results = response.data || [];
            const transformedResults: Supplier[] = results.map(
              (result: ProductSupplier) => ({
                id: result.supplierId,
                companyName: result.supplierName,
                contactName: result.supplierContactName,
                email: result.supplierContactEmail,
                registrationNumber: result.companyRegistrationNumber,
              })
            );
            setSearchResults(transformedResults);
          } else {
            setSearchResults([]);
          }

          setShowSearchResults(true);
          setIsSearchComplete(true);
        } catch (error) {
          Bugsnag.notify(error as Error, (event) => {
            event.addMetadata('context', {
              component: 'SelectSupplierWithRole',
              method: 'performSearch',
              query: trimmed,
            });
          });
          setSearchResults([]);
          setShowSearchResults(true);
          setIsSearchComplete(true);
          showAlert(ERROR_MESSAGES.FAILED_TO_SEARCH_SUPPLIERS, 'danger');
        } finally {
          hideSpinner();
        }
      },
      [showSpinner, hideSpinner, showAlert]
    );

    useEffect(() => {
      if (selectedSupplier) return;

      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setSearchResults([]);
        setIsSearchComplete(false);
        return;
      }

      setShowSearchResults(true);
      const timer = setTimeout(() => {
        performSearch(trimmed);
      }, 1000);

      return () => clearTimeout(timer);
    }, [searchQuery, performSearch, selectedSupplier]);

    // Outside click handlers
    useEffect(() => {
      if (!showSearchResults && !showRoleDropdown) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          searchWrapperRef.current &&
          !searchWrapperRef.current.contains(event.target as Node)
        ) {
          setShowSearchResults(false);
        }
        if (
          roleDropdownRef.current &&
          !roleDropdownRef.current.contains(event.target as Node)
        ) {
          setShowRoleDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [showSearchResults, showRoleDropdown]);



    // Reset registration number uniqueness state when typing (new supplier only)
    useEffect(() => {
      if (!isNewSupplier) {
        setIsRegistrationNumberUnique(true);
        return;
      }

      const registrationNumber = selectedSupplier?.registrationNumber || '';
      const trimmedNumber = registrationNumber.trim();

      // Reset validation state when typing - API check will happen on blur only
      if (!trimmedNumber || !isValidRegistrationNumber(trimmedNumber)) {
        setIsRegistrationNumberUnique(false);
        setSelectedRoles([]);
      }
    }, [isNewSupplier, selectedSupplier?.registrationNumber]);

    // Close role dropdown and clear roles when disabled due to reg number
    useEffect(() => {
      if (isNewSupplier && !isRegistrationNumberUnique) {
        if (showRoleDropdown) {
          setShowRoleDropdown(false);
        }
        setSelectedRoles([]);
      }
    }, [isNewSupplier, isRegistrationNumberUnique, showRoleDropdown]);

    // --- Validation helpers ---

    const validateCompanyName = (value: string) => {
      if (hasLeadingOrTrailingSpaces(value)) {
        setFormErrors((prev) => ({
          ...prev,
          companyName: ERROR_MESSAGES.LEADING_TRAILING_SPACES,
        }));
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        setFormErrors((prev) => ({
          ...prev,
          companyName: ERROR_MESSAGES.REQUIRED_SUPPLIER_NAME,
        }));
        return;
      }
      if (trimmed.length > 150) {
        setFormErrors((prev) => ({
          ...prev,
          companyName: ERROR_MESSAGES.SUPPLIER_NAME_TO_LONG,
        }));
        return;
      }
      if (!isValidSupplierName(trimmed)) {
        setFormErrors((prev) => ({
          ...prev,
          companyName: ERROR_MESSAGES.INVALID_SUPPLIER_NAME,
        }));
        return;
      }
      setFormErrors((prev) => ({ ...prev, companyName: '' }));
    };

    const validateContactName = (value: string) => {
      if (hasLeadingOrTrailingSpaces(value)) {
        setFormErrors((prev) => ({
          ...prev,
          contactName: ERROR_MESSAGES.LEADING_TRAILING_SPACES,
        }));
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        setFormErrors((prev) => ({
          ...prev,
          contactName: ERROR_MESSAGES.REQUIRED_CONTACT_NAME,
        }));
        return;
      }
      // Check length first
      if (trimmed.length > 100) {
        setFormErrors((prev) => ({
          ...prev,
          contactName: ERROR_MESSAGES.CONTACT_NAME_TOO_LONG,
        }));
        return;
      }
      // Then check format using validation function
      if (!isValidContactName(trimmed)) {
        setFormErrors((prev) => ({
          ...prev,
          contactName: ERROR_MESSAGES.INVALID_ALPHANUMERIC_NAME,
        }));
        return;
      }
      setFormErrors((prev) => ({ ...prev, contactName: '' }));
    };

    const validateEmail = (value: string) => {
      if (hasLeadingOrTrailingSpaces(value)) {
        setFormErrors((prev) => ({
          ...prev,
          email: ERROR_MESSAGES.LEADING_TRAILING_SPACES,
        }));
        return;
      }
      const trimmed = value.trim();
      if (!trimmed || !isValidEmail(trimmed)) {
        setFormErrors((prev) => ({
          ...prev,
          email: ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
        }));
        return;
      }
      if (
        currentUserEmail &&
        trimmed.toLowerCase() === currentUserEmail.toLowerCase()
      ) {
        setFormErrors((prev) => ({
          ...prev,
          email: ERROR_MESSAGES.CANNOT_USE_OWN_EMAIL,
        }));
        return;
      }
      setFormErrors((prev) => ({ ...prev, email: '' }));
    };

    const validateRegistrationNumber = async (value: string) => {
      if (hasLeadingOrTrailingSpaces(value)) {
        setFormErrors((prev) => ({
          ...prev,
          registrationNumber: ERROR_MESSAGES.LEADING_TRAILING_SPACES,
        }));
        setIsRegistrationNumberUnique(false);
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        setFormErrors((prev) => ({
          ...prev,
          registrationNumber:
            ERROR_MESSAGES.REQUIRED_COMPANY_REGISTRATION_NUMBER,
        }));
        setIsRegistrationNumberUnique(false);
        return;
      }
      // Check length first
      if (trimmed.length > 30) {
        setFormErrors((prev) => ({
          ...prev,
          registrationNumber: ERROR_MESSAGES.REGISTRATION_NUMBER_TOO_LONG,
        }));
        setIsRegistrationNumberUnique(false);
        return;
      }
      // Then check format using validation function
      if (!isValidRegistrationNumber(trimmed)) {
        setFormErrors((prev) => ({
          ...prev,
          registrationNumber: ERROR_MESSAGES.INVALID_REGISTRATION_NUMBER,
        }));
        setIsRegistrationNumberUnique(false);
        return;
      }

      setIsRegistrationNumberUnique(true);

      setFormErrors((prev) => ({
        ...prev,
        registrationNumber: '',
      }));
    };

    const handleFieldBlur = async (
      field: keyof typeof initialFormErrors,
      value: string
    ) => {
      switch (field) {
        case 'companyName':
          validateCompanyName(value);
          break;
        case 'contactName':
          validateContactName(value);
          break;
        case 'email':
          validateEmail(value);
          break;
        case 'registrationNumber':
          await validateRegistrationNumber(value);
          break;
      }
    };

    const validateForm = async (): Promise<boolean> => {
      const errors = { ...initialFormErrors };
      let isValid = true;

      const companyNameValue = selectedSupplier?.companyName || '';
      const contactNameValue = selectedSupplier?.contactName || '';
      const emailValue = selectedSupplier?.email || '';
      const registrationNumberValue =
        selectedSupplier?.registrationNumber || '';

      if (hasLeadingOrTrailingSpaces(companyNameValue)) {
        errors.companyName = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        isValid = false;
      } else {
        const companyName = companyNameValue.trim();
        if (!companyName) {
          errors.companyName = ERROR_MESSAGES.REQUIRED_SUPPLIER_NAME;
          isValid = false;
        } else if (!isValidSupplierName(companyName)) {
          errors.companyName = ERROR_MESSAGES.INVALID_SUPPLIER_NAME;
          isValid = false;
        }
      }

      if (hasLeadingOrTrailingSpaces(contactNameValue)) {
        errors.contactName = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        isValid = false;
      } else {
        const contactName = contactNameValue.trim();
        if (!contactName) {
          errors.contactName = ERROR_MESSAGES.REQUIRED_CONTACT_NAME;
          isValid = false;
        } else if (contactName.length > 100) {
          errors.contactName = ERROR_MESSAGES.CONTACT_NAME_TOO_LONG;
          isValid = false;
        } else if (!isValidContactName(contactName)) {
          errors.contactName = ERROR_MESSAGES.INVALID_ALPHANUMERIC_NAME;
          isValid = false;
        }
      }

      if (hasLeadingOrTrailingSpaces(emailValue)) {
        errors.email = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        isValid = false;
      } else {
        const email = emailValue.trim();
        if (!email) {
          errors.email = ERROR_MESSAGES.INVALID_EMAIL_FORMAT;
          isValid = false;
        } else if (!isValidEmail(email)) {
          errors.email = ERROR_MESSAGES.INVALID_EMAIL_FORMAT;
          isValid = false;
        } else if (
          currentUserEmail &&
          email.toLowerCase() === currentUserEmail.toLowerCase()
        ) {
          errors.email = ERROR_MESSAGES.CANNOT_USE_OWN_EMAIL;
          isValid = false;
        }
      }

      if (hasLeadingOrTrailingSpaces(registrationNumberValue)) {
        errors.registrationNumber = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        isValid = false;
      } else {
        const registrationNumber = registrationNumberValue.trim();
        if (!registrationNumber) {
          errors.registrationNumber =
            ERROR_MESSAGES.REQUIRED_COMPANY_REGISTRATION_NUMBER;
          isValid = false;
        } else if (registrationNumber.length > 30) {
          errors.registrationNumber =
            ERROR_MESSAGES.REGISTRATION_NUMBER_TOO_LONG;
          isValid = false;
        } else {
          // Check format using validation function
          if (!isValidRegistrationNumber(registrationNumber)) {
            errors.registrationNumber =
              ERROR_MESSAGES.INVALID_REGISTRATION_NUMBER;
            isValid = false;
          } else {
            setIsRegistrationNumberUnique(true);
          }
        }
      }

      setFormErrors(errors);
      return isValid;
    };

    const areAllFieldsValid = (): boolean => {
      if (!selectedSupplier) return false;

      if (!isNewSupplier) {
        return (
          !!selectedSupplier.companyName &&
          !!selectedSupplier.contactName &&
          !!selectedSupplier.email &&
          !!selectedSupplier.registrationNumber
        );
      }

      const companyName = (selectedSupplier.companyName || '').trim();
      const contactName = (selectedSupplier.contactName || '').trim();
      const email = (selectedSupplier.email || '').trim();
      const registrationNumber = (
        selectedSupplier.registrationNumber || ''
      ).trim();

      if (!companyName || !isValidSupplierName(companyName)) return false;
      if (!contactName || !isValidContactName(contactName)) return false;
      if (
        !email ||
        !isValidEmail(email) ||
        (currentUserEmail &&
          email.toLowerCase() === currentUserEmail.toLowerCase())
      ) {
        return false;
      }
      if (
        !registrationNumber ||
        !isValidRegistrationNumber(registrationNumber)
      ) {
        return false;
      }
      if (!isRegistrationNumberUnique) return false;

      return true;
    };

    const hasFormErrors = Object.values(formErrors).some(
      (error) => error !== ''
    );

    const canSaveContinue =
      hasSelectedSupplier &&
      areAllFieldsValid() &&
      selectedRoles.length > 0 &&
      (!isNewSupplier || isRegistrationNumberUnique) &&
      !hasFormErrors;

    // --- Handlers ---

    const handleBack = () => {
      goToPreviousStep();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setSelectedSupplier(null);
      setIsNewSupplier(false);
      setSelectedRoles([]);
      setIsSearchComplete(false);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isSpinnerVisible) {
        e.preventDefault();
      }
    };

    const handleSearchInputClick = () => {
      if (!showSearchResults) {
        setShowSearchResults(true);
        if (searchQuery.trim()) {
          performSearch(searchQuery);
        }
      }
    };

    const handleArrowIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowSearchResults((prev) => {
        const willOpen = !prev;
        if (willOpen && searchQuery.trim()) {
          performSearch(searchQuery);
        }
        return willOpen;
      });
    };

    const handleSelectSupplier = (supplier: Supplier) => {
      setSelectedSupplier(supplier);
      setSearchQuery(supplier.companyName);
      setShowSearchResults(false);
      setIsNewSupplier(false);
      setIsRegistrationNumberUnique(true);
      setSelectedRoles([]);
      setFormErrors(initialFormErrors);
      setIsSearchComplete(false);
    };

    const handleAddNew = () => {
      const prefillSupplierName = searchQuery.trim();
      const newSupplier: Supplier = {
        id: '',
        companyName: prefillSupplierName,
        contactName: '',
        email: '',
        registrationNumber: '',
      };
      setSelectedSupplier(newSupplier);
      setSearchQuery('');
      setShowSearchResults(false);
      setSelectedRoles([]);
      setIsNewSupplier(true);
      setFormErrors(initialFormErrors);
      if (prefillSupplierName) {
        validateCompanyName(prefillSupplierName);
      }
      setIsRegistrationNumberUnique(false);
      setIsSearchComplete(false);
    };

    const handleFormFieldChange = (
      field: keyof typeof initialFormErrors,
      value: string
    ) => {
      if (!isNewSupplier) return;
      if (!selectedSupplier) return;

      setSelectedSupplier({
        ...selectedSupplier,
        [field === 'registrationNumber' ? 'registrationNumber' : field]: value,
      });

      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

    const handleToggleRole = (roleSlug: string) => {
      setSelectedRoles((prev) =>
        prev.includes(roleSlug)
          ? prev.filter((slug) => slug !== roleSlug)
          : [...prev, roleSlug]
      );
    };

    const handleCancelAddNew = () => {
      setSelectedSupplier(null);
      setSearchQuery('');
      setIsNewSupplier(false);
      setIsRegistrationNumberUnique(false);
      setFormErrors(initialFormErrors);
      setSelectedRoles([]);
      setIsSearchComplete(false);
    };

    const handleSaveAndContinue = async () => {
      if (!selectedSupplier || !selectedComponent?._id) return;

      if (isNewSupplier) {
        const valid = await validateForm();
        if (!valid) return;

        const emailToCheck = (selectedSupplier.email).trim();

        if (emailToCheck) {
          try {
            showSpinner();

            const emailCheckResponse = await checkEmailExist(emailToCheck, componentName);

            if (emailCheckResponse.success && !emailCheckResponse.data?.canProceed) {
              setFormErrors((prev) => ({
                ...prev,
                email: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
              }));
              return;
            }
          } catch (error) {
            const axiosError = error as AxiosError<ApiResponse<unknown>>;
            const statusCode = axiosError.response?.status;
            const apiResponse = axiosError.response?.data;

            Bugsnag.notify(error as Error, (event) => {
              event.addMetadata('context', {
                component: 'SelectSupplierWithRole',
                method: 'handleSaveAndContinue_checkEmailExist',
                email: emailToCheck,
                statusCode,
              });
            });

            // 409 (custom error from backend)
            if ((statusCode === 409 || statusCode === 404 || statusCode === 400) && apiResponse?.message) {
              showAlert(apiResponse.message, 'danger');
              return;
            }

            showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
            return;
          } finally {
            hideSpinner();
          }
        }
      }

      const registrationNumber = selectedSupplier.registrationNumber
        ? selectedSupplier.registrationNumber
        : '';

      // Save supplier data to store
      setAssignedSupplier({
        id: selectedSupplier.id || '',
        name: selectedSupplier.companyName,
        registrationNumber: registrationNumber,
        contactName: selectedSupplier.contactName,
        contactEmail: selectedSupplier.email,
        roles: selectedRoles,
      });

      goToNextStep();
    };

    // --- Render helpers ---

    const renderSupplierSearch = () => (
      <div className={styles.supplierSearchSection}>
        <div className={parentStyles.formField}>
          <label className={parentStyles.fieldLabel}>
            Supplier Name <span className={parentStyles.required}>*</span>
          </label>

          <div className={parentStyles.searchWrapper} ref={searchWrapperRef}>
            <div className={parentStyles.searchInputContainer}>
              <div className={parentStyles.searchIconWrapper}>
                <img
                  src={searchIcon}
                  alt="Search"
                  className={parentStyles.searchIcon}
                />
              </div>
              <input
                type="text"
                className={parentStyles.searchInput}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onClick={handleSearchInputClick}
                placeholder="Search supplier..."
              />
              <div
                className={parentStyles.dropdownIconWrapper}
                onClick={handleArrowIconClick}
              >
                <img
                  src={arrowDownIcon}
                  alt="Dropdown"
                  className={parentStyles.dropdownIcon}
                />
              </div>
            </div>

            {showSearchResults && (
              <div className={parentStyles.searchResults}>
                <div
                  className={parentStyles.addNewResultItem}
                  onClick={handleAddNew}
                >
                  <div className={parentStyles.addNewIconWrapper}>
                    <img
                      src={AddIcon}
                      alt="Add New"
                      className={parentStyles.addNewIcon}
                    />
                  </div>
                  <span className={parentStyles.addNewText}>Add New</span>
                </div>

                {searchResults.length > 0 &&
                  searchResults.map((supplier) => (
                    <div
                      key={supplier.id}
                      className={`${parentStyles.searchResultItem} ${selectedSupplier?.id === supplier.id
                        ? styles.selected
                        : ''
                        }`}
                      onClick={() => handleSelectSupplier(supplier)}
                    >
                      <span className={styles.resultName}>
                        {supplier.companyName}
                      </span>
                    </div>
                  ))}

                {searchQuery.trim() &&
                  searchResults.length === 0 &&
                  isSearchComplete && (
                    <div className={styles.noResults}>
                      No suppliers found. Click &quot;Add New&quot; to create
                      one.
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    );

    const effectiveForm = {
      companyName: selectedSupplier?.companyName ?? '',
      contactName: selectedSupplier?.contactName ?? '',
      email: selectedSupplier?.email ?? '',
      registrationNumber: selectedSupplier?.registrationNumber ?? '',
    };

    const roleSelectionDisabled = isNewSupplier && !isRegistrationNumberUnique;

    return (
      <div className={parentStyles.container}>
        <div className={parentStyles.contentFrame}>
          <div className={parentStyles.header}>
            <h2 className={parentStyles.pageTitle}>
              Assign and Select Supplier Roles
            </h2>
            <p className={parentStyles.helperText}>
              Choose an existing supplier or add a new one responsible for
              providing this component or service, and specify their role(s).
            </p>
          </div>

          <div className={parentStyles.formCard}>
            <div className={parentStyles.twoColumnFields}>
              <div className={parentStyles.formField}>
                <label className={parentStyles.fieldLabel}>
                  Component or Service Name{' '}
                  <span className={parentStyles.required}>*</span>
                </label>
                <div className={parentStyles.inputWrapper}>
                  <input
                    type="text"
                    className={parentStyles.formInput}
                    value={componentName}
                    disabled
                  />
                </div>
              </div>

              <div className={parentStyles.formField}>
                <div className={parentStyles.labelWithIcon}>
                  <label
                    className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
                  >
                    Internal SKU{' '}
                    <span className={parentStyles.required}>*</span>{' '}
                    <Tooltip
                      text={TOOLTIP_TEXT.INTERNAL_SKU}
                      noTruncate
                    >
                      <img
                        src={infoIcon}
                        alt="Info"
                        className={parentStyles.infoIcon}
                      />
                    </Tooltip>
                  </label>
                </div>
                <div className={parentStyles.inputWrapper}>
                  <input
                    type="text"
                    className={parentStyles.formInput}
                    value={componentSku}
                    disabled
                  />
                </div>
              </div>
            </div>

            {showSupplierSearch
              ? renderSupplierSearch()
              : selectedSupplier && (
                <div className={styles.supplierDetailsSection}>
                  <div className={parentStyles.twoColumnFields}>
                    <div className={parentStyles.formField}>
                      <label className={parentStyles.fieldLabel}>
                        Supplier Name{' '}
                        <span className={parentStyles.required}>*</span>
                      </label>
                      {isNewSupplierFlow ? (
                        <>
                          <div className={parentStyles.inputWrapper}>
                            <input
                              type="text"
                              className={`${parentStyles.formInput} ${formErrors.companyName
                                ? styles.inputError
                                : ''
                                }`}
                              value={effectiveForm.companyName}
                              onChange={(e) =>
                                handleFormFieldChange(
                                  'companyName',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur('companyName', e.target.value)
                              }
                              placeholder="Enter supplier name"
                            />
                          </div>
                          {formErrors.companyName && (
                            <p className={styles.error}>
                              {formErrors.companyName}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className={parentStyles.inputWrapper}>
                          <input
                            type="text"
                            className={parentStyles.formInput}
                            value={selectedSupplier.companyName}
                            disabled
                          />
                        </div>
                      )}
                    </div>

                    <div className={parentStyles.formField}>
                      <div className={parentStyles.labelWithIcon}>
                        <label
                          className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
                        >
                          Company Registration Number{' '}
                          <span className={parentStyles.required}>*</span>
                          <Tooltip
                            text={TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER}
                            noTruncate
                          >
                            <img
                              src={infoIcon}
                              alt="Info"
                              className={parentStyles.infoIcon}
                            />
                          </Tooltip>
                        </label>
                      </div>
                      {isNewSupplierFlow ? (
                        <>
                          <div className={parentStyles.inputWrapper}>
                            <input
                              type="text"
                              className={`${parentStyles.formInput} ${formErrors.registrationNumber
                                ? styles.inputError
                                : ''
                                }`}
                              value={effectiveForm.registrationNumber}
                              onChange={(e) =>
                                handleFormFieldChange(
                                  'registrationNumber',
                                  e.target.value
                                )
                              }
                              onBlur={async (e) => {
                                await handleFieldBlur(
                                  'registrationNumber',
                                  e.target.value
                                );
                              }}
                              placeholder="Enter registration number"
                            />
                          </div>
                          {formErrors.registrationNumber && (
                            <p className={styles.error}>
                              {formErrors.registrationNumber}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className={parentStyles.inputWrapper}>
                          <input
                            type="text"
                            className={parentStyles.formInput}
                            value={selectedSupplier.registrationNumber || ''}
                            disabled
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={parentStyles.twoColumnFields}>
                    <div className={parentStyles.formField}>
                      <label className={parentStyles.fieldLabel}>
                        Supplier Contact Name{' '}
                        <span className={parentStyles.required}>*</span>
                      </label>
                      {isNewSupplierFlow ? (
                        <>
                          <div className={parentStyles.inputWrapper}>
                            <input
                              type="text"
                              className={`${parentStyles.formInput} ${formErrors.contactName
                                ? styles.inputError
                                : ''
                                }`}
                              value={effectiveForm.contactName}
                              onChange={(e) =>
                                handleFormFieldChange(
                                  'contactName',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur('contactName', e.target.value)
                              }
                              placeholder="Enter contact name"
                            />
                          </div>
                          {formErrors.contactName && (
                            <p className={styles.error}>
                              {formErrors.contactName}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className={parentStyles.inputWrapper}>
                          <input
                            type="text"
                            className={parentStyles.formInput}
                            value={selectedSupplier.contactName}
                            disabled
                          />
                        </div>
                      )}
                    </div>

                    <div className={parentStyles.formField}>
                      <label className={parentStyles.fieldLabel}>
                        Supplier Contact Email{' '}
                        <span className={parentStyles.required}>*</span>
                      </label>
                      {isNewSupplierFlow ? (
                        <>
                          <div className={parentStyles.inputWrapper}>
                            <input
                              type="email"
                              className={`${parentStyles.formInput} ${formErrors.email ? styles.inputError : ''
                                }`}
                              value={effectiveForm.email}
                              onChange={(e) =>
                                handleFormFieldChange('email', e.target.value)
                              }
                              onBlur={(e) =>
                                handleFieldBlur('email', e.target.value)
                              }
                              placeholder="Enter email address"
                            />
                          </div>
                          {formErrors.email && (
                            <p className={styles.error}>{formErrors.email}</p>
                          )}
                        </>
                      ) : (
                        <div className={parentStyles.inputWrapper}>
                          <input
                            type="text"
                            className={parentStyles.formInput}
                            value={selectedSupplier.email}
                            disabled
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={parentStyles.formField}>
                    <div className={parentStyles.labelWithIcon}>
                      <label
                        className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
                      >
                        Select Role(s) for This Supplier{' '}
                        <span className={parentStyles.required}>*</span>
                        <Tooltip
                          text={TOOLTIP_TEXT.SELECT_ROLE_FOR_THIS_SUPPLIER}
                          noTruncate
                        >
                          <img
                            src={infoIcon}
                            alt="Info"
                            className={parentStyles.infoIcon}
                          />
                        </Tooltip>
                      </label>
                    </div>

                    <div
                      className={`${styles.roleDropdownWrapper} ${roleSelectionDisabled
                        ? styles.roleDropdownDisabled
                        : ''
                        }`}
                      ref={roleDropdownRef}
                    >
                      <div
                        className={styles.roleDropdownInput}
                        onClick={() => {
                          if (selectedSupplier && !roleSelectionDisabled) {
                            if (roleDropdownRef.current) {
                              const rect =
                                roleDropdownRef.current.getBoundingClientRect();
                              const dropdownHeight = 300;
                              const spaceBelow =
                                window.innerHeight - rect.bottom;

                              setOpenUpwards(spaceBelow < dropdownHeight);
                            }
                            setShowRoleDropdown((prev) => !prev);
                          }
                        }}
                      >
                        <span
                          className={
                            selectedRoles.length === 0
                              ? styles.rolePlaceholder
                              : styles.roleSelectedText
                          }
                        >
                          {roleSelectionDisabled
                            ? 'Enter a company registration number to select roles'
                            : selectedRoles.length === 0
                              ? 'Select roles...'
                              : 'Roles selected'}
                        </span>
                        <img
                          src={arrowDownIcon}
                          alt="Dropdown"
                          className={styles.roleDropdownIcon}
                        />
                      </div>

                      {showRoleDropdown && !roleSelectionDisabled && (
                        <div
                          className={`${styles.roleDropdownList} ${openUpwards ? styles.roleDropdownListUp : ''}`}
                        >
                          {supplierRoles.map((role) => {
                            const isSelected = selectedRoles.includes(
                              role.slug
                            );
                            return (
                              <div
                                key={role.id}
                                className={styles.roleOption}
                                onClick={() => handleToggleRole(role.slug)}
                              >
                                <img
                                  src={isSelected ? checkedIcon : checkIcon}
                                  alt={isSelected ? 'Checked' : 'Unchecked'}
                                  className={styles.roleCheckbox}
                                />
                                <span className={styles.roleOptionText}>
                                  {role.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedRoles.length > 0 && (
                      <div className={styles.selectedRolesContainer}>
                        {selectedRoles.map((roleSlug) => {
                          const role = supplierRoles.find(
                            (r) => r.slug === roleSlug
                          );
                          if (!role) return null;
                          return (
                            <div key={roleSlug} className={styles.roleChip}>
                              <span className={styles.roleChipText}>
                                {role.name}
                              </span>
                              <button
                                type="button"
                                className={styles.roleChipClose}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRole(roleSlug);
                                }}
                                aria-label={`Remove ${role.name}`}
                              >
                                <img
                                  src={closeCircleIcon}
                                  alt="Remove"
                                  className={styles.roleChipCloseIcon}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className={parentStyles.footerActions}>
          {isNewSupplierFlow ? (
            <button
              type="button"
              className={parentStyles.secondaryButton}
              onClick={handleCancelAddNew}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className={parentStyles.secondaryButton}
              onClick={handleBack}
            >
              Go Back
            </button>
          )}
          <button
            type="button"
            className={parentStyles.primaryButton}
            onClick={() => handleSaveAndContinue()}
            disabled={!canSaveContinue}
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);

SelectSupplierWithRole.displayName = 'SelectSupplierWithRole';

export default SelectSupplierWithRole;
