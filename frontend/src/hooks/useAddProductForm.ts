import { ERROR_MESSAGES } from '@constants/messages';
import {
  hasLeadingOrTrailingSpaces,
  isValidBatchNumber,
  isValidinternalSku,
  isValidunitOfMeasurement,
} from '@utils/validation';
import { useState } from 'react';
type CustomChange = {
  name: string;
  value: string;
};
export const useAddProductForm = () => {
  const [formData, setFormData] = useState({
    productName: '',
    internalSku: '',
    gtin: '',
    netUnitSize: '',
    unitOfMeasurement: '',
    productCategory: '',
    batchNumber: '',
    productDescription: '',
    comparisonProductDescription: '',
    productImageKey: '',
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  //Image Upload
  const [imageError, setImageError] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const handleImageUpload = (files: File[]) => {
    const file = files[0];

    // Reset error
    setImageError('');

    if (!file) {
      setImageFile(null);
      return;
    }

    setImageFile(file);
  };
  const sanitizeNumber = (val: string) => {
    if (!/^\s*\d*\.?\d*\s*$/.test(val)) {
      return null;
    }

    if (['0', '0.', '00', '0.0', '+'].includes(val)) {
      return '';
    }

    return val;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | CustomChange
  ) => {
    // Detect if this is a custom event from dropdown
    const isCustom = !(e as any).target;

    const name = isCustom ? (e as CustomChange).name : (e as any).target.name;
    const value = isCustom
      ? (e as CustomChange).value
      : (e as any).target.value;

    // BLOCK ZERO FOR netUnitSize
    if (name === 'netUnitSize') {
      const sanitized = sanitizeNumber(value);

      if (sanitized === null) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        netUnitSize: sanitized,
      }));

      return;
    }

    // Default update
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateField = (
    field: string,
    value: string,
    options?: { includeLeadingTrailingSpaceValidation?: boolean }
  ) => {
    const includeLeadingTrailingSpaceValidation =
      options?.includeLeadingTrailingSpaceValidation ?? true;

    const isRequiredField = field === 'comparisonProductDescription';
    if (value === '' && !isRequiredField) {
      // Clear error if field is empty
      setErrors((prev: any) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      return;
    }
    let error = '';
    const validateDescriptionField = (
      descriptionValue: string,
      options?: { required?: boolean; tooLongMessage?: string }
    ) => {
      if (
        includeLeadingTrailingSpaceValidation &&
        hasLeadingOrTrailingSpaces(descriptionValue)
      ) {
        return ERROR_MESSAGES.LEADING_TRAILING_SPACES;
      }
      if (!descriptionValue) {
        return options?.required
          ? ERROR_MESSAGES.COMPARISON_PRODUCT_DESCRIPTION_REQUIRED
          : '';
      }
      if (descriptionValue.length > 500) {
        return (
          options?.tooLongMessage ?? ERROR_MESSAGES.PRODUCT_DESCRIPTION_TOO_LONG
        );
      }
      return '';
    };
    switch (field) {
      case 'productName':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length < 3 || value.length > 150) {
          error = ERROR_MESSAGES.PRODUCT_NAME_TOO_LONG;
        }
        break;

      case 'internalSku':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length < 3 || value.length > 50) {
          error = ERROR_MESSAGES.INTERNAL_SKU_TOO_LONG;
        } else if (!value) {
          error = ERROR_MESSAGES.INTERNAL_SKU_REQUIRED;
        } else if (!isValidinternalSku(value)) {
          error = ERROR_MESSAGES.INTERNAL_SKU_INVALID;
        }
        break;

      case 'gtin':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (!value) {
          error = ERROR_MESSAGES.GTIN_REQUIRED;
        } else if (value.length > 30) {
          error = ERROR_MESSAGES.GTIN_TOO_LONG;
        } else if (!/^\d+$/.test(value)) {
          error = ERROR_MESSAGES.INVALID_GTIN;
        }

        break;

      case 'netUnitSize':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (!value) {
          error = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        } else if (!/^\d*\.?\d+$/.test(value)) {
          error = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        } else if (parseFloat(value) <= 0) {
          error = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        } else if (value.length > 15) {
          error = ERROR_MESSAGES.NET_UNITSIZE_TOO_LONG;
        }
        break;

      case 'unitOfMeasurement':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (isCustomUnit) {
          if (value.length < 1 || value.length > 5)
            error = ERROR_MESSAGES.CUSTOM_UNIT_OF_MEASUREMENT_TOO_LONG;
        } else if (!isValidunitOfMeasurement(value,isCustomUnit)) {
          error = ERROR_MESSAGES.UNIT_OF_MEASUREMENT_INVALID;
        }
        break;

      case 'productCategory':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length > 50) {
          error = ERROR_MESSAGES.PRODUCT_CATEGORY_TOO_LONG;
        } else if (!value) {
          error = ERROR_MESSAGES.PRODUCT_CATEGORY_REQUIRED;
        }

        break;
      case 'batchNumber':
        if (
          includeLeadingTrailingSpaceValidation &&
          hasLeadingOrTrailingSpaces(value)
        ) {
          error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
        } else if (value.length < 1 || value.length > 20) {
          error = ERROR_MESSAGES.BATCH_NUMBER_TOO_LONG;
        } else if (!isValidBatchNumber(value)) {
          error = ERROR_MESSAGES.BATCH_NUMBER_INVALID;
        }
        break;

      case 'productDescription':
        error = validateDescriptionField(value);
        break;

      case 'comparisonProductDescription':
        error = validateDescriptionField(value, {
          required: true,
          tooLongMessage: ERROR_MESSAGES.COMPARISON_PRODUCT_DESCRIPTION_TOO_LONG,
        });
        break;
    }

    if (error) {
      setErrors((prev: any) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev: any) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };
  const resetForm = () => {
    setFormData({
      productName: '',
      internalSku: '',
      gtin: '',
      netUnitSize: '',
      unitOfMeasurement: '',
      productCategory: '',
      batchNumber: '',
      productDescription: '',
      comparisonProductDescription: '',
      productImageKey: '',
    });
    setShowUnitDropdown(false);
    setImageFile(null);
    setErrors({});
    setIsCustomUnit(false);
    setFocusedField(null);
  };

  const isFormInvalid = () => {
    const {
      productName,
      internalSku,
      gtin,
      netUnitSize,
      unitOfMeasurement,
      productCategory,
      comparisonProductDescription,
    } = formData;

    return !!(
      !productName.trim() ||
      !internalSku.trim() ||
      !gtin.trim() ||
      !netUnitSize.trim() ||
      !unitOfMeasurement.trim() ||
      !productCategory.trim() ||
      !comparisonProductDescription.trim() ||
      productName.length < 3 ||
      productName.length > 150 ||
      hasLeadingOrTrailingSpaces(productName) ||
      hasLeadingOrTrailingSpaces(internalSku) ||
      hasLeadingOrTrailingSpaces(gtin) ||
      hasLeadingOrTrailingSpaces(netUnitSize) ||
      hasLeadingOrTrailingSpaces(productCategory) ||
      hasLeadingOrTrailingSpaces(comparisonProductDescription) ||
      gtin.length > 30 ||
      !/^\d+$/.test(gtin) ||
      isNaN(Number(netUnitSize)) ||
      Number(netUnitSize) <= 0 ||
      comparisonProductDescription.length > 500 ||
      (isCustomUnit &&
        (unitOfMeasurement.length < 1 ||
          unitOfMeasurement.length > 5 ||
          !/^[A-Za-z]+$/.test(unitOfMeasurement))) ||
      (!isCustomUnit && !/^[A-Za-z_]+(\s[A-Za-z_]+)*$/.test(unitOfMeasurement)) ||
      Object.keys(errors).length > 0
    );
  };
  return {
    formData,
    setFormData,
    errors,
    focusedField,
    isCustomUnit,
    isSubmitDisabled,
    setIsCustomUnit,
    sanitizeNumber,
    onChange,
    validateField,
    setFocusedField,
    showUnitDropdown,
    setIsSubmitDisabled,
    isFormInvalid,

    resetForm,
    handleFocus,
    handleBlur,
    handleChange,
    setShowUnitDropdown,
    handleImageUpload,
    imageError,
    imageFile,
    setImageError,
    setErrors,

    setImageFile
  };
};
