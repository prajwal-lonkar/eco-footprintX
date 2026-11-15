import React, { useEffect, useRef, useState } from 'react';
import styles from './AddProductModal.module.scss';
import { IoCloseOutline } from 'react-icons/io5';
import infoicon from '@assets/images/info icon.svg';
import Tooltip from '@common/Tooltip/Tooltip';
import ImageUpload from './ImageUpload/ImageUpload';
import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import { uploadImageFile } from '@service/imageupload.service';
import { SlArrowDown, SlArrowUp } from 'react-icons/sl';
import { unitOptions } from '@constants/mockData';
import { useAlertStore } from '@store/useAlertStore';
import { useAddProductForm } from '@hooks/useAddProductForm';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@constants/routes';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';
import { sanitizeComponentSearchInput } from '@utils/validation';
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'add' | 'edit';

  productDetails?: any;
  productId: string;
  setProductDetails?: any;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  productDetails,
  productId,
  setProductDetails,
}) => {
  const {
    errors,
    focusedField,
    isCustomUnit,
    isSubmitDisabled,
    setIsCustomUnit,
    onChange,
    validateField,
    showUnitDropdown,
    setIsSubmitDisabled,
    isFormInvalid,
    formData,
    resetForm,
    handleFocus,
    handleBlur,
    handleChange,
    setShowUnitDropdown,
    handleImageUpload,
    imageError,
    imageFile,
    setErrors,

    setImageFile,
  } = useAddProductForm();

  const { showAlert } = useAlertStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const unitDropdownRef = useRef<HTMLDivElement | null>(null);
  const customUnitInputRef = useRef<HTMLInputElement | null>(null);

  const unitWrapperRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAddAndFirst, setLoadingAddAndFirst] = useState(false);
  const [skipBlurValidation, setSkipBlurValidation] = useState(false);
  const [unitActive, setUnitActive] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [isEdited, setIsEdited] = useState(false);
  const navigate = useNavigate();
  // HANDLE SUBMIT

  useEffect(() => {
    if (mode === 'edit' && productDetails) {
      resetForm();
      const formattedUnit = (
        productDetails.customUnit ||
        productDetails.unit ||
        ''
      ).replace(/_/g, ' ');
      onChange('productName', productDetails.name || '');
      onChange('internalSku', productDetails.internalSku || '');
      onChange(
        'gtin',
        productDetails.gstin ? String(productDetails.gstin) : ''
      );
      onChange('netUnitSize', String(productDetails.netSize || ''));
      onChange('unitOfMeasurement', formattedUnit);
      setIsCustomUnit(productDetails.unit === 'Other');
      onChange('productCategory', productDetails.category || '');
      onChange('batchNumber', productDetails.batchNumber || '');
      onChange('productDescription', productDetails.description || '');
      onChange(
        'comparisonProductDescription',
        productDetails.comparisonProductDescription || ''
      );

      // Image

      if (productDetails.image) {
        setImageFile(productDetails.image);
      }
      // Save initial form state for dirty-check
      setInitialValues({
        productName: productDetails.name || '',
        internalSku: productDetails.internalSku || '',
        gtin: productDetails.gstin ? String(productDetails.gstin) : '',
        netUnitSize: String(productDetails.netSize || ''),
        unitOfMeasurement:
          productDetails.customUnit || productDetails.unit || '',
        isCustomUnit: productDetails.unit === 'Other',
        productCategory: productDetails.category || '',
        batchNumber: productDetails.batchNumber || '',
        productDescription: productDetails.description || '',
        comparisonProductDescription:
          productDetails.comparisonProductDescription || '',
        image: productDetails.image || '',
      });
    }
  }, [mode, productDetails]);
const normalizeImage = (img: any) => {
  if (!img) return '';
  return img;
};

  useEffect(() => {
    if (mode !== 'edit' || !initialValues) return;

    const modified =
      formData.productName !== initialValues.productName ||
      formData.internalSku !== initialValues.internalSku ||
      formData.gtin !== initialValues.gtin ||
      formData.netUnitSize !== initialValues.netUnitSize ||
      formData.unitOfMeasurement !== initialValues.unitOfMeasurement ||
      isCustomUnit !== initialValues.isCustomUnit ||
      formData.productCategory !== initialValues.productCategory ||
      formData.batchNumber !== initialValues.batchNumber ||
      formData.productDescription !== initialValues.productDescription ||
      formData.comparisonProductDescription !==
        initialValues.comparisonProductDescription ||
      normalizeImage(imageFile) !== normalizeImage(initialValues.image);

    setIsEdited(modified);
  }, [formData, isCustomUnit, imageFile, initialValues, mode]);
  const unitApiMap: Record<string, string> = {
    'fl oz': 'fl_oz',
  };

  const handleSubmit = async (
    actionType:
      | 'ADD_PRODUCT'
      | 'ADD_PRODUCT_AND_FIRST_COMPONENT'
      | 'EDIT_PRODUCT'
  ) => {
    setLoading(false);
    setLoadingAddAndFirst(false);
    if (actionType === 'ADD_PRODUCT' || actionType === 'EDIT_PRODUCT') {
      setLoading(true);
    } else {
      setLoadingAddAndFirst(true);
    }
    let imageKey = '';
    if (imageFile instanceof File) {
      try {
        const { key } = await uploadImageFile(imageFile, formData.productName);
        imageKey = key;
      } catch (error) {
        console.error(error);

        showAlert(ERROR_MESSAGES.IMAGE_UPLOAD_FAILED, 'danger');
        if (actionType === 'ADD_PRODUCT' || actionType === 'EDIT_PRODUCT') {
          setLoading(false);
        } else {
          setLoadingAddAndFirst(false);
        }
        return;
      }
    } else if (typeof imageFile === 'string') {
      // It's an existing image URL/key, use as-is
      imageKey = imageFile;
    }

    const payload = {
      name: formData.productName,
      internalSku: formData.internalSku,
      gstin: Number(formData.gtin),
      netSize: Number(formData.netUnitSize),
      // unit: isCustomUnit ? 'Other' : formData.unitOfMeasurement,

      unit: isCustomUnit
        ? 'Other'
        : (unitApiMap[formData.unitOfMeasurement] ??
          formData.unitOfMeasurement),
      customUnit: isCustomUnit ? formData.unitOfMeasurement : '',

      category: formData.productCategory,
      batchNumber: formData.batchNumber,
      description: formData.productDescription,
      comparisonProductDescription: formData.comparisonProductDescription,
      image: imageKey || '',
    };

    try {
      let response;

      //  EDIT PRODUCT FLOW

      if (mode === 'edit') {
        response = await axiosInstance.put(
          `${ENDPOINTS.PRODUCTS.EDIT_PRODUCT}/${productId}`,
          payload
        );

        if (response.data.statusCode === 200) {
          showAlert(SUCCESS_MESSAGES.PRODUCT_UPDATED_SUCCESSFULLY);
          if (setProductDetails) {
            setProductDetails((prev: any) => ({
              ...prev,
              ...payload, // updated product info
              image: imageKey === '' ? null : imageKey,
            }));
          }

          if (actionType === 'EDIT_PRODUCT') {
            // Normal edit button flow
            onClose();
            onSuccess();
            resetForm();
          }
        }
      }

      //  ADD PRODUCT FLOW
      else {
        response = await axiosInstance.post(
          `${ENDPOINTS.PRODUCTS.ADD_PRODUCT}`,
          payload
        );

        if (response.data.statusCode === 201) {
          const createdProductId = response.data.data?.productDetails?._id;
          showAlert(SUCCESS_MESSAGES.PRODUCT_ADDED_SUCCESSFULLY);

          if (actionType === 'ADD_PRODUCT') {
            onClose();
            onSuccess();
            resetForm();
          } else {
            // Add product + add component/service

            navigate(
              `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${createdProductId}${ROUTES.COMPONENT.BASE}/new`
            );

            onClose();
            onSuccess();
            resetForm();
          }
        }
      }
    } catch (error) {
      const err = error as any;

      const status = err?.response?.status;
      const msg =
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        'Something went wrong';

      if (status === 409) {
        if (msg.toLowerCase().includes('sku')) {
          setErrors((prev: any) => ({
            ...prev,
            internalSku: ERROR_MESSAGES.INTERNAL_SKU_EXISTS,
          }));
        }

        if (msg.toLowerCase().includes('gstin')) {
          setErrors((prev: any) => ({
            ...prev,
            gtin: ERROR_MESSAGES.GTIN_EXISTS,
          }));
        }
        if (actionType === 'ADD_PRODUCT' || actionType === 'EDIT_PRODUCT') {
          setLoading(false);
        } else {
          setLoadingAddAndFirst(false);
        }
        return;
      }

      showAlert(
        mode === 'edit'
          ? ERROR_MESSAGES.PRODUCT_UPDATE_FAILED
          : ERROR_MESSAGES.PRODUCT_ADD_FAILED,
        'danger'
      );
      onClose();
      resetForm();
    }

    if (actionType === 'ADD_PRODUCT' || actionType === 'EDIT_PRODUCT') {
      setLoading(false);
    } else {
      setLoadingAddAndFirst(false);
    }
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUnitDropdown(false);
        setUnitActive(false);
      }
    }

    if (showUnitDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUnitDropdown]);

  React.useEffect(() => {
    setIsSubmitDisabled(isFormInvalid());
  }, [formData, errors, isCustomUnit]);
  useEffect(() => {
    if (isCustomUnit) {
      setTimeout(() => {
        customUnitInputRef.current?.focus();
      }, 0);
    }
  }, [isCustomUnit]);
  useEffect(() => {
    if (
      focusedField !== 'netUnitSize' &&
      focusedField !== 'unitOfMeasurement'
    ) {
      setUnitActive(false);
      setShowUnitDropdown(false);
    }
  }, [focusedField]);
  const handleCancelEdit = () => {
    if (mode === 'edit' && initialValues) {
      resetForm();

      onChange('productName', initialValues.productName);
      onChange('internalSku', initialValues.internalSku);
      onChange('gtin', initialValues.gtin);
      onChange('netUnitSize', initialValues.netUnitSize);
      onChange('unitOfMeasurement', initialValues.unitOfMeasurement);
      setIsCustomUnit(initialValues.isCustomUnit);
      onChange('productCategory', initialValues.productCategory);
      onChange('batchNumber', initialValues.batchNumber);
      onChange('productDescription', initialValues.productDescription);
      onChange(
        'comparisonProductDescription',
        initialValues.comparisonProductDescription
      );

      setImageFile(initialValues.image);
    }

    setIsEdited(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalScrollbar}>
          <div className={styles.modalHeader}>
            <h2>
              {mode === 'add' ? 'Add Product Details' : 'Edit Product Details'}
            </h2>

            <IoCloseOutline
              className={styles.closeIcon}
              onClick={() => {
                onClose();
                resetForm();
              }}
            />
          </div>

          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              {/* Product Name */}
              <div className={styles.formGroup}>
                <label>
                  Product Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  placeholder="Enter here..."
                  onChange={(e) => {
                    const sanitizedValue = sanitizeComponentSearchInput(
                      e.target.value
                    );

                    onChange('productName', sanitizedValue);
                    validateField('productName', sanitizedValue, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    const sanitizedValue = sanitizeComponentSearchInput(
                      pastedText
                    );
                    validateField('productName', sanitizedValue, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('productName')}
                  onBlur={() => {
                    handleBlur();
                    validateField('productName', formData.productName);
                  }}
                  className={`${styles.inputDefault} ${
                    errors.productName
                      ? styles.inputError
                      : focusedField === 'productName'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.productName && (
                  <p className={styles.error}>{errors.productName}</p>
                )}
              </div>

              {/* Internal SKU */}
              <div className={styles.formGroup}>
                <label>
                  Internal SKU <span className={styles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.INTERNAL_SKU}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  name="internalSku"
                  value={formData.internalSku}
                  placeholder="Enter here..."
                  onChange={(e) => {
                    onChange('internalSku', e.target.value);
                    validateField('internalSku', e.target.value, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    validateField('internalSku', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('internalSku')}
                  onBlur={() => {
                    handleBlur();
                    validateField('internalSku', formData.internalSku);
                  }}
                  className={`${styles.inputDefault} ${
                    errors.internalSku
                      ? styles.inputError
                      : focusedField === 'internalSku'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.internalSku && (
                  <p className={styles.error}>{errors.internalSku}</p>
                )}
              </div>

              {/* GTIN */}
              <div className={styles.formGroup}>
                <label>
                  GTIN <span className={styles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.GTIN}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  name="gtin"
                  value={formData.gtin}
                  placeholder="Enter here..."
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '');
                    onChange('gtin', onlyDigits);
                    validateField('gtin', onlyDigits, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');

                    validateField('gtin', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('gtin')}
                  onBlur={() => {
                    handleBlur();
                    validateField('gtin', formData.gtin);
                  }}
                  className={`${styles.inputDefault} ${
                    errors.gtin
                      ? styles.inputError
                      : focusedField === 'gtin'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.gtin && <p className={styles.error}>{errors.gtin}</p>}
              </div>

              {/* Net Unit Size */}

              <div className={styles.formGroup}>
                <label>
                  Net Unit Size <span className={styles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.NET_UNIT_SIZE}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>

                <div
                  className={styles.netUnitWrapper}
                  ref={unitWrapperRef}
                  tabIndex={-1}
                  onBlur={() => {
                    handleBlur();

                    setTimeout(() => {
                      //  Skip validation if user clicked dropdown
                      if (skipBlurValidation) {
                        setSkipBlurValidation(false); // reset
                        return;
                      }

                      if (
                        unitWrapperRef.current &&
                        unitWrapperRef.current.contains(document.activeElement)
                      ) {
                        return;
                      }

                      const unitSelected =
                        (isCustomUnit &&
                          formData.unitOfMeasurement.trim().length > 0) ||
                        (!isCustomUnit &&
                          formData.unitOfMeasurement.trim().length > 0);

                      if (formData.netUnitSize && !unitSelected) {
                        setErrors((prev: any) => ({
                          ...prev,
                          unitOfMeasurement:
                            ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
                        }));
                      } else {
                        setErrors((prev: any) => {
                          const updated = { ...prev };
                          delete updated.unitOfMeasurement;
                          return updated;
                        });
                      }
                    }, 0);
                  }}
                >
                  {/* Net Unit Size */}
                  <input
                    type="text"
                    name="netUnitSize"
                    value={formData.netUnitSize}
                    placeholder="Enter here..."
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      let val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val.startsWith('.')) {
                        val = val.slice(1);
                      }
                      // Prevent multiple dots
                      const parts = val.split('.');
                      if (parts.length > 2) {
                        val = parts[0] + '.' + parts.slice(1).join('');
                      }
                      onChange('netUnitSize', val);
                      validateField('netUnitSize', val, {
                        includeLeadingTrailingSpaceValidation: false,
                      });
                    }}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      validateField('netUnitSize', pastedText, {
                        includeLeadingTrailingSpaceValidation: false,
                      });
                    }}
                    onFocus={() => handleFocus('netUnitSize')}
                    // onBlur={() => handleBlur()}
                    onBlur={() => {
                      handleBlur();
                      validateField('netUnitSize', formData.netUnitSize);

                      // Delay execution to allow clicks inside dropdown/custom input
                      setTimeout(() => {
                        // If the currently focused element is inside the wrapper, do nothing
                        if (
                          unitWrapperRef.current &&
                          unitWrapperRef.current.contains(
                            document.activeElement
                          )
                        ) {
                          return;
                        }

                        // Show error only if net unit size exists and no unit selected
                        const unitSelected =
                          (isCustomUnit &&
                            formData.unitOfMeasurement.trim().length > 0) ||
                          (!isCustomUnit &&
                            formData.unitOfMeasurement.trim().length > 0);

                        if (formData.netUnitSize && !unitSelected) {
                          setErrors((prev: any) => ({
                            ...prev,
                            unitOfMeasurement:
                              ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
                          }));
                        } else {
                          // Clear error if unit selected or no net unit size
                          setErrors((prev: any) => {
                            const updated = { ...prev };
                            delete updated.unitOfMeasurement;
                            return updated;
                          });
                        }
                      }, 0);
                    }}
                    className={`${styles.inputDefault} ${
                      errors.netUnitSize
                        ? styles.inputError
                        : focusedField === 'netUnitSize'
                          ? styles.inputValid
                          : ''
                    }`}
                  />

                  {/* UNIT DROPDOWN / EDITABLE FIELD */}
                  <div
                    className={`${styles.customDropdown} ${
                      errors.unitOfMeasurement
                        ? styles.inputError
                        : unitActive
                          ? styles.dropdownActive
                          : ''
                    } `}
                    style={{ padding: '0px 12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnitActive(true);
                      setSkipBlurValidation(true);

                      // Clear error
                      setErrors((prev: any) => {
                        const updated = { ...prev };
                        delete updated.unitOfMeasurement;
                        return updated;
                      });

                      setShowUnitDropdown((prev) => !prev);
                    }}
                  >
                    {!isCustomUnit ? (
                      // DEFAULT DROPDOWN TEXT
                      <span>
                        {formData.unitOfMeasurement
                          ? `${
                              unitOptions.find(
                                (u) => u.value === formData.unitOfMeasurement
                              )?.labelShort
                            }/unit`
                          : '-/unit'}
                      </span>
                    ) : (
                      // EDITABLE INPUT WHEN "OTHER" SELECTED
                      <input
                        type="text"
                        value={formData.unitOfMeasurement}
                        placeholder="Other"
                        ref={customUnitInputRef}
                        onChange={(e) => {
                          const lettersOnly = e.target.value.replace(
                            /[^A-Za-z]/g,
                            ''
                          );
                          handleChange({
                            name: 'unitOfMeasurement',
                            value: lettersOnly,
                          });
                          validateField('unitOfMeasurement', lettersOnly, {
                            includeLeadingTrailingSpaceValidation: false,
                          });
                        }}
                        onBlur={() => {
                          validateField(
                            'unitOfMeasurement',
                            formData.unitOfMeasurement
                          );
                          setTimeout(() => {
                            if (
                              unitWrapperRef.current &&
                              !unitWrapperRef.current.contains(
                                document.activeElement
                              )
                            ) {
                              setUnitActive(false);
                            }
                          }, 0);
                        }}
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                        // className={styles.customUnitInput}
                        className={`${styles.customUnitInput} ${
                          errors.unitOfMeasurement
                            ? styles.inputErrorUnit
                            : unitActive
                              ? styles.inputValidUnit
                              : ''
                        }`}
                      />
                    )}
                    <span className={styles.dropdownIcon}>
                      {showUnitDropdown ? <SlArrowUp /> : <SlArrowDown />}
                    </span>
                  </div>
                </div>

                {/* DROPDOWN LIST */}
                {showUnitDropdown && (
                  <div className={styles.dropdownMenu} ref={unitDropdownRef}>
                    <div className={styles.dropdownScrollbar}>
                      {unitOptions.map((opt) => (
                        <div
                          key={opt.value}
                          className={styles.dropdownItem}
                          onClick={() => {
                            if (opt.value === 'other') {
                              setIsCustomUnit(true);
                              setShowUnitDropdown(false);
                              handleChange({
                                name: 'unitOfMeasurement',
                                value: '',
                              });
                            } else {
                              setIsCustomUnit(false);
                              handleChange({
                                name: 'unitOfMeasurement',
                                value: opt.value,
                              });
                              setShowUnitDropdown(false);
                            }
                            setErrors((prev: any) => {
                              const updated = { ...prev };
                              delete updated.unitOfMeasurement;
                              return updated;
                            });
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(errors.netUnitSize || errors.unitOfMeasurement) && (
                  <p className={styles.error}>
                    {errors.netUnitSize || errors.unitOfMeasurement}
                  </p>
                )}
              </div>

              {/* Product Category */}
              <div className={styles.formGroup}>
                <label>
                  Product Category <span className={styles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.PRODUCT_CATEGORY}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  name="productCategory"
                  value={formData.productCategory}
                  placeholder="Enter here..."
                  onChange={(e) => {
                    onChange('productCategory', e.target.value);
                    validateField('productCategory', e.target.value, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    validateField('productCategory', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('productCategory')}
                  onBlur={() => {
                    handleBlur();
                    validateField('productCategory', formData.productCategory);
                  }}
                  className={`${styles.inputDefault} ${
                    errors.productCategory
                      ? styles.inputError
                      : focusedField === 'productCategory'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.productCategory && (
                  <p className={styles.error}>{errors.productCategory}</p>
                )}
              </div>

              {/* Batch Number */}
              <div className={styles.formGroup}>
                <label>Batch Number</label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  placeholder="Enter here..."
                  onChange={(e) => {
                    onChange('batchNumber', e.target.value);
                    validateField('batchNumber', e.target.value, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    validateField('batchNumber', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('batchNumber')}
                  onBlur={() => {
                    handleBlur();
                    validateField('batchNumber', formData.batchNumber);
                  }}
                  className={`${styles.inputDefault} ${
                    errors.batchNumber
                      ? styles.inputError
                      : focusedField === 'batchNumber'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.batchNumber && (
                  <p className={styles.error}>{errors.batchNumber}</p>
                )}
              </div>

              {/* Comparison Product Category Description */}
              <div className={styles.fullField}>
                <label>
                  Comparison Product Category Description{' '}
                  <span className={styles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.COMPARISON_PRODUCT_DESCRIPTION}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>

                <input
                  type="text"
                  name="comparisonProductDescription"
                  value={formData.comparisonProductDescription}
                  onChange={(e) => {
                    onChange('comparisonProductDescription', e.target.value);
                    validateField('comparisonProductDescription', e.target.value, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    validateField('comparisonProductDescription', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('comparisonProductDescription')}
                  onBlur={() => {
                    handleBlur();
                    validateField(
                      'comparisonProductDescription',
                      formData.comparisonProductDescription
                    );
                  }}
                  placeholder="Enter here..."
                  className={`${styles.inputDefault} ${
                    errors.comparisonProductDescription
                      ? styles.inputError
                      : focusedField === 'comparisonProductDescription'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.comparisonProductDescription && (
                  <p className={styles.error}>
                    {errors.comparisonProductDescription}
                  </p>
                )}
              </div>

              {/* Product Description */}
              <div className={styles.fullField}>
                <label>
                  Product Description{' '}
                  <Tooltip
                    text={TOOLTIP_TEXT.PRODUCT_DESCRIPTION}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoicon}
                      alt="info"
                      className={styles.infoIcon}
                      width={14}
                      height={14}
                    />
                  </Tooltip>
                </label>

                <input
                  type="text"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={(e) => {
                    onChange('productDescription', e.target.value);
                    validateField('productDescription', e.target.value, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    validateField('productDescription', pastedText, {
                      includeLeadingTrailingSpaceValidation: false,
                    });
                  }}
                  onFocus={() => handleFocus('productDescription')}
                  onBlur={() => {
                    handleBlur();
                    validateField(
                      'productDescription',
                      formData.productDescription
                    );
                  }}
                  placeholder="Enter here..."
                  className={`${styles.inputDefault} ${
                    errors.productDescription
                      ? styles.inputError
                      : focusedField === 'productDescription'
                        ? styles.inputValid
                        : ''
                  }`}
                />
                {errors.productDescription && (
                  <p className={styles.error}>{errors.productDescription}</p>
                )}
              </div>


              {/* Image Upload */}
              <div className={styles.imageUploadSection}>
                <label>Attach Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpeg,.jpg,.png,.webp"
                  style={{ display: 'none' }}
                />

                <ImageUpload
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  onUpload={handleImageUpload}
                  previewWidth={120}
                  previewHeight={120}
                  className={`${styles.inputDefault} ${
                    imageError ? styles.inputError : ''
                  }`}
                  existingImageUrl={productDetails?.image || undefined}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.importBtn}
                disabled={isSubmitDisabled || (mode === 'edit' && !isEdited)}
                onClick={
                  mode === 'edit'
                    ? handleCancelEdit
                    : () => handleSubmit('ADD_PRODUCT_AND_FIRST_COMPONENT')
                }
              >
                {loadingAddAndFirst ? (
                  <SpinnerLoader inline={true} />
                ) : mode === 'add' ? (
                  'Add Product & Add First Component or Service'
                ) : (
                  'Cancel'
                )}
              </button>
              <button
                className={styles.addProductBtn}
                disabled={isSubmitDisabled || (mode === 'edit' && !isEdited)}
                onClick={() =>
                  handleSubmit(mode === 'add' ? 'ADD_PRODUCT' : 'EDIT_PRODUCT')
                }
              >
                {loading ? (
                  <SpinnerLoader inline={true} />
                ) : mode === 'add' ? (
                  'Add Product'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
