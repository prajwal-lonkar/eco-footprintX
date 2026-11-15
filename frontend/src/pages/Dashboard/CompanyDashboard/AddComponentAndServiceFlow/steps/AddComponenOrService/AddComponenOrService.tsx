import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import type { AxiosError } from 'axios';
import styles from './AddComponenOrService.module.scss';
import parentStyles from '../../AddComponentAndServiceFlow.module.scss';
import {
  searchComponents,
  addComponent,
} from '@service/product-components.service';
import type { Component } from '@type/product-components';
import type { ApiResponse } from '@type/auth';
import { ERROR_MESSAGES } from '@constants/messages';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import {
  isValidinternalSku,
  hasLeadingOrTrailingSpaces,
  sanitizeComponentSearchInput,
} from '@utils/validation';
import Bugsnag from '@utils/bugsnag';
import SearchIcon from '@assets/icons/search.svg';
import PlusIcon from '@assets/icons/plus.svg';
import DownArrowIcon from '@assets/icons/down-arrow.svg';
import { API_ERROR_CODES } from '@constants/mockData';

interface AddComponenOrServiceProps {
  productId?: string;
  onRedirectToProductDetails?: () => void;
}

const AddComponenOrService: React.FC<AddComponenOrServiceProps> = memo(({
  productId,
  onRedirectToProductDetails,
}) => {
  // Zustand store
  const selectedComponent = useAddComponentAndServiceFlowStore((state) => state.selectedComponent);
  const setSelectedComponent = useAddComponentAndServiceFlowStore((state) => state.setSelectedComponent);
  const goToNextStep = useAddComponentAndServiceFlowStore((state) => state.goToNextStep);
  const goToPreviousStep = useAddComponentAndServiceFlowStore((state) => state.goToPreviousStep);
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner, visible: isSpinnerVisible } = useSpinnerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Component[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchComplete, setIsSearchComplete] = useState(false);

  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentSku, setNewComponentSku] = useState('');
  const [skuError, setSkuError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const resetNewComponentForm = useCallback(() => {
    setNewComponentName('');
    setNewComponentSku('');
    setSkuError('');
    setNameError('');
  }, []);

  const checkNameValidation = useCallback(
    (
      name: string,
      showRequired = false,
      includeLeadingTrailingSpaceValidation = true
    ) => {
      if (
        includeLeadingTrailingSpaceValidation &&
        hasLeadingOrTrailingSpaces(name)
      ) {
        setNameError(ERROR_MESSAGES.LEADING_TRAILING_SPACES);
        return;
      }
      const trimmed = name.trim();
      if (!trimmed) {
        setNameError(showRequired ? ERROR_MESSAGES.COMPONENT_NAME_REQUIRED : '');
        return;
      }
      setNameError('');
    },
    []
  );

  const checkSkuValidation = useCallback(
    (
      sku: string,
      showRequired = false,
      includeLeadingTrailingSpaceValidation = true
    ) => {
      if (
        includeLeadingTrailingSpaceValidation &&
        hasLeadingOrTrailingSpaces(sku)
      ) {
        setSkuError(ERROR_MESSAGES.LEADING_TRAILING_SPACES);
        return;
      }
      const trimmed = sku.trim();
      if (!trimmed) {
        setSkuError(showRequired ? ERROR_MESSAGES.COMPONENT_SKU_REQUIRED : '');
        return;
      }
      if (!isValidinternalSku(trimmed)) {
        setSkuError(ERROR_MESSAGES.COMPONENT_SKU_INVALID);
        return;
      }
      setSkuError('');
    },
    []
  );

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
        const response = await searchComponents({ query: trimmed });

        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          setSearchResults([]);
          showAlert(ERROR_MESSAGES.COMPONENT_SEARCH_FAILED, 'danger');
        }

        setShowSearchResults(true);
        setIsSearchComplete(true);
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddComponenOrService',
            method: 'performSearch',
          });
        });
        showAlert(ERROR_MESSAGES.COMPONENT_SEARCH_FAILED, 'danger');
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearchComplete(true);
      } finally {
        hideSpinner();
      }
    },
    [showAlert, showSpinner, hideSpinner]
  );

  // Populate search query and form fields when selectedComponent is available (e.g., when navigating back)
  useEffect(() => {
    if (selectedComponent) {
      setSearchQuery((prevQuery) => {
        // Only update search query if it's empty or doesn't match the selected component
        if (!prevQuery.trim() || prevQuery !== selectedComponent.name) {
          return selectedComponent.name;
        }
        return prevQuery;
      });
      // Populate form fields when not in add new form mode
      if (!showAddNewForm) {
        setNewComponentName(selectedComponent.name);
        setNewComponentSku(selectedComponent.internalSku);
      }
      setShowSearchResults(false);
      setIsSearchComplete(false);
    }
  }, [selectedComponent, showAddNewForm]);

  useEffect(() => {
    if (selectedComponent) return;

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
  }, [searchQuery, performSearch, selectedComponent]);

  useEffect(() => {
    if (!showSearchResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = sanitizeComponentSearchInput(value);
    setSearchQuery(sanitizedValue);
    setSelectedComponent(null);
    setIsSearchComplete(false);

    if (!sanitizedValue.trim()) {
      setSearchResults([]);
    }

    setShowSearchResults(true);
  }, [setSelectedComponent]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSpinnerVisible) {
      e.preventDefault();
    }
  }, [isSpinnerVisible]);

  const handleSelectComponent = useCallback((component: Component) => {
    setSelectedComponent(component);
    setNewComponentName(component.name);
    setNewComponentSku(component.internalSku);
    setShowSearchResults(false);
    setSearchQuery(component.name);
    setIsSearchComplete(false);
  }, [setSelectedComponent]);

  const handleAddNew = useCallback(() => {
    if (!productId) {
      showAlert(ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 'danger');
      return;
    }

    const trimmedSearchQuery = searchQuery.trim();
    const sanitizedSearchQuery = sanitizeComponentSearchInput(trimmedSearchQuery);
    const prefillName = sanitizedSearchQuery.trim();
    const hasInvalidCharacters = sanitizedSearchQuery !== trimmedSearchQuery;

    setShowSearchResults(false);
    setShowAddNewForm(true);
    setSelectedComponent(null);
    setSearchQuery('');
    setIsSearchComplete(false);
    resetNewComponentForm();
    if (trimmedSearchQuery) {
      setNewComponentName(prefillName);
      if (hasInvalidCharacters) {
        setNameError(ERROR_MESSAGES.COMPONENT_NAME_INVALID);
      }
    }
  }, [productId, showAlert, resetNewComponentForm, searchQuery, setSelectedComponent]);

  const handleCancelAddNew = useCallback(() => {
    setShowAddNewForm(false);
    setSelectedComponent(null);
    setSearchQuery('');
    setIsSearchComplete(false);
    resetNewComponentForm();
  }, [resetNewComponentForm, setSelectedComponent]);

  const handleCreateComponent = useCallback(async (shouldCallOnNext = true) => {
    if (!productId) {
      showAlert(ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 'danger');
      return;
    }

    checkNameValidation(newComponentName, true, true);
    checkSkuValidation(newComponentSku, true, true);

    const trimmedName = newComponentName.trim();
    const trimmedSku = newComponentSku.trim();

    if (!trimmedName || !trimmedSku || !isValidinternalSku(trimmedSku)) {
      return;
    }

    setIsCreating(true);
    showSpinner();
    try {
      const response = await addComponent(productId, {
        name: trimmedName,
        internalSku: trimmedSku,
        isNewComponent: showAddNewForm,
      });

      if (response.success && response.data?.component) {
        // Update parent state with the newly created component
        const newComponent = response.data.component;
        setSelectedComponent(newComponent);
        setSearchQuery(newComponent.name);
        setShowAddNewForm(false);
        resetNewComponentForm();

        if (shouldCallOnNext) {
          goToNextStep();
        }
        return true;
      } else {
        showAlert(ERROR_MESSAGES.COMPONENT_CREATE_FAILED, 'danger');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<Component>>;
      const statusCode = axiosError.response?.status;

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'AddComponenOrService',
          method: 'handleCreateComponent',
          action: 'createComponent',
        });
      });
      const apiMessage = axiosError.response?.data?.message;
      const code = axiosError.response?.data?.code;
      if(code == API_ERROR_CODES.PRODUCT_ALREADY_EXISTS){
        showAlert(apiMessage || ERROR_MESSAGES.COMPONENT_CREATE_FAILED, 'danger');
      }else if (statusCode === 409) {
        setSkuError(ERROR_MESSAGES.COMPONENT_SKU_EXISTS);      
      } else {
        showAlert(apiMessage || ERROR_MESSAGES.COMPONENT_CREATE_FAILED, 'danger');
      }

    } finally {
      setIsCreating(false);
      hideSpinner();
    }
  }, [productId, newComponentName, newComponentSku, checkNameValidation, checkSkuValidation, showSpinner, hideSpinner, showAlert, setSelectedComponent, resetNewComponentForm, goToNextStep]);

  const handleSaveAndContinue = useCallback(async (exit = false) => {
    try {

      if (!newComponentName || !newComponentSku) {
        showAlert(ERROR_MESSAGES.COMPONENT_SELECTION_REQUIRED, 'danger');
        return;
      }

      const success = await handleCreateComponent(!exit);

      if (exit && success && onRedirectToProductDetails) {
        onRedirectToProductDetails();
      }



    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'AddComponenOrService',
          method: 'handleSaveAndContinue',
          action: exit ? 'saveAndExit' : 'saveAndContinue',
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
    }
  }, [showAddNewForm, handleCreateComponent, selectedComponent, onRedirectToProductDetails, goToNextStep, showAlert]);

  const canSaveContinue = useMemo(
    () =>
      selectedComponent !== null ||
      (showAddNewForm &&
        newComponentName.trim() !== '' &&
        newComponentSku.trim() !== '' &&
        !skuError &&
        !nameError),
    [selectedComponent, showAddNewForm, newComponentName, newComponentSku, skuError, nameError]
  );

  const handleToggleSearchResults = useCallback(() => {
    setShowSearchResults((prev) => !prev);
  }, []);

  const handleSearchInputClick = useCallback(() => {
    setShowSearchResults(true);
  }, []);

  const handleSaveAndExit = useCallback(() => {
    handleSaveAndContinue(true);
  }, [handleSaveAndContinue]);

  const handleSaveAndContinueClick = useCallback(() => {
    handleSaveAndContinue(false);
  }, [handleSaveAndContinue]);


  return (
    <div className={parentStyles.container}>

      <div className={parentStyles.header}>
        <h2 className={parentStyles.pageTitle}>
          Add or Select a Component or Service
        </h2>
        <p className={parentStyles.helperText}>
          Start by adding a new component or service used in your product, or
          select one you have previously created.
        </p>
      </div>
      <div className={parentStyles.formCard}>
        {!showAddNewForm ? (
          <div className={styles.selectCard}>
            <label className={parentStyles.fieldLabel}>
              Component, Service, or SKU Code{' '}
              <span className={parentStyles.required}>*</span>
            </label>

            <div className={parentStyles.searchWrapper} ref={searchWrapperRef}>
              <div className={parentStyles.searchInputContainer}>
                <div className={parentStyles.searchIconWrapper}>
                  <img
                    src={SearchIcon}
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
                  placeholder="Search by component, service or SKU code..."
                />
                <div className={parentStyles.dropdownIconWrapper}>
                  <img
                    src={DownArrowIcon}
                    alt="Dropdown"
                    className={parentStyles.dropdownIcon}
                    onClick={handleToggleSearchResults}
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
                        src={PlusIcon}
                        alt="Add New"
                        className={parentStyles.addNewIcon}
                      />
                    </div>
                    <span className={parentStyles.addNewText}>Add New</span>
                  </div>

                  {searchResults.length > 0 &&
                    searchResults.map((component) => (
                      <div
                        key={component._id}
                        className={`${parentStyles.searchResultItem} ${selectedComponent?._id === component._id
                            ? styles.selected
                            : ''
                          }`}
                        onClick={() => handleSelectComponent(component)}
                      >
                        <span className={styles.resultName}>
                          {component.name}
                        </span>
                        <span className={styles.resultSku}>
                          {component.internalSku}
                        </span>
                      </div>
                    ))}

                  {searchQuery.trim() && searchResults.length === 0 && isSearchComplete && (
                    <div className={styles.noResults}>
                      No components found. Click &quot;Add New&quot; to create
                      one.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.addNewFormCard}>
            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>
                Component or Service Name{' '}
                <span className={parentStyles.required}>*</span>
              </label>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={`${parentStyles.formInput} ${nameError ? styles.inputError : ''
                    }`}
                  value={newComponentName}
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitizedValue = sanitizeComponentSearchInput(value);
                    setNewComponentName(sanitizedValue);
                    checkNameValidation(sanitizedValue, false, false);
                  }}
                  onBlur={() => checkNameValidation(newComponentName, true)}
                  placeholder="Enter component or service name"
                />
              </div>
              {nameError && (
                <p className={parentStyles.errorText}>{nameError}</p>
              )}
            </div>

            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>
                Internal SKU <span className={parentStyles.required}>*</span>
              </label>
              <p className={styles.helpText}>
                SKU codes are a unique identifier used to track a specific
                product for inventory management. If you are adding a service
                (e.g. transportation), enter the SKU of the component being
                transported instead.
              </p>
              <div
                className={`${styles.skuInputWrapper} ${skuError ? styles.inputError : ''
                  }`}
              >
                <input
                  type="text"
                  className={styles.skuInput}
                  value={newComponentSku}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewComponentSku(value);
                    checkSkuValidation(value, false, false);
                  }}
                  onBlur={() =>
                    checkSkuValidation(newComponentSku, true)
                  }
                  placeholder="Enter SKU code"
                />
              </div>
              {skuError && (
                <p className={parentStyles.errorText}>{skuError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={parentStyles.footerActions}>
        {showAddNewForm ? (
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
            onClick={goToPreviousStep}
          >
            Go Back
          </button>
        )}
        <button
          type="button"
          className={parentStyles.tertiaryButton}
          onClick={handleSaveAndExit}
          disabled={!canSaveContinue || isCreating}
        >
          Save and Exit
        </button>
        <button
          type="button"
          className={parentStyles.primaryButton}
          onClick={handleSaveAndContinueClick}
          disabled={!canSaveContinue || isCreating}
        >
          Save &amp; Continue
        </button>
      </div>
    </div>
  );
});

AddComponenOrService.displayName = 'AddComponenOrService';

export default AddComponenOrService;
