import { useState, useRef, useEffect, useCallback } from 'react';
import { ERROR_MESSAGES } from '@constants/messages';
import { isValidunitOfMeasurement, hasLeadingOrTrailingSpaces } from '@utils/validation';
import { unitOptions } from '@constants/mockData';

interface UseUnitSelectorOptions {
  value: string;
  onValueChange: (value: string) => void;
  onErrorChange?: (error: string) => void;
  initialIsCustom?: boolean;
  allowedUnits?: string[];
  allowCustom?: boolean;
}

interface UseUnitSelectorReturn {
  isCustom: boolean;
  showDropdown: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  customInputRef: React.RefObject<HTMLInputElement | null>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  selectUnit: (unitValue: string) => void;
  // handleCustomInput: (inputValue: string) => void;
  validateUnit: (customUnitFlag?: boolean) => void;
  filteredUnitOptions: typeof unitOptions;
}

// const sanitizeCustomUnitInput = (value: string): string => {
//   return value.replace(/[^A-Za-z]/g, '');
// };

export const useUnitSelector = ({
  value,
  onValueChange,
  onErrorChange,
  initialIsCustom = false,
  allowedUnits,
  allowCustom = true,
}: UseUnitSelectorOptions): UseUnitSelectorReturn => {
  const [isCustom, setIsCustom] = useState(initialIsCustom);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const filteredUnitOptions = allowedUnits
    ? unitOptions.filter((opt) => allowedUnits.includes(opt.value))
    : unitOptions;

  useEffect(() => {
    if (!allowCustom && isCustom) setIsCustom(false);
  }, [allowCustom, isCustom]);

  useEffect(() => {
    if (!value) return;

    const inAllowedList = filteredUnitOptions.some((opt) => opt.value === value);

    if (!allowCustom) {
      if (!inAllowedList) {
        onValueChange(''); // force user to select kg/g
      }
      if (isCustom) setIsCustom(false);
      return;
    }

  }, [value, filteredUnitOptions, allowCustom, onValueChange]);

  useEffect(() => {
    if (isCustom && allowCustom) {
      setTimeout(() => customInputRef.current?.focus(), 0);
    }
  }, [isCustom, allowCustom]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  const selectUnit = useCallback(
    (unitValue: string) => {
      if (!allowCustom && unitValue === 'other') return;

      if (unitValue === 'other') {
        setIsCustom(true);
        setShowDropdown(false);
        onValueChange('');
      } else {
        setIsCustom(false);
        onValueChange(unitValue);
        setShowDropdown(false);
      }
      onErrorChange?.('');
    },
    [onValueChange, onErrorChange, allowCustom],
  );  

  // const handleCustomInput = useCallback(
  //   (inputValue: string) => {
  //     if (!allowCustom) return;
  //     const lettersOnly = sanitizeCustomUnitInput(inputValue);
  //     onValueChange(lettersOnly);
  //   },
  //   [onValueChange, allowCustom],
  // );

  const validateUnit = useCallback(
    (customUnitFlag?: boolean) => {
      if (!onErrorChange) return;

      const effectiveIsCustom = allowCustom && (customUnitFlag !== undefined ? customUnitFlag : isCustom);

        if (hasLeadingOrTrailingSpaces(value)) {
          onErrorChange(ERROR_MESSAGES.LEADING_TRAILING_SPACES);
          return;
        }
        
      const trimmed = value.trim();
      if (!trimmed) {
        onErrorChange(ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE);
        return;
      }
    
      if (!allowCustom) {
        const inAllowedList = filteredUnitOptions.some((opt) => opt.value === trimmed);
        if (!inAllowedList) {
          onErrorChange(ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE);
          return;
        }
        onErrorChange('');
        return;
      }
  
      if (effectiveIsCustom && (trimmed.length < 1 || trimmed.length > 5)) {
        onErrorChange(ERROR_MESSAGES.CUSTOM_UNIT_OF_MEASUREMENT_TOO_LONG);
        return;
      }

      if (!isValidunitOfMeasurement(trimmed, effectiveIsCustom)) {
        onErrorChange(ERROR_MESSAGES.UNIT_OF_MEASUREMENT_INVALID);
        return;
      }
      onErrorChange('');
    },
    [value, isCustom, onErrorChange, allowCustom, filteredUnitOptions],
  );

  return {
    isCustom: allowCustom ? isCustom : false,
    showDropdown,
    dropdownRef,
    wrapperRef,
    customInputRef,
    toggleDropdown,
    closeDropdown,
    selectUnit,
    // handleCustomInput,
    validateUnit,
    filteredUnitOptions,
  };
};

