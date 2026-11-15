import { ERROR_MESSAGES } from '@constants/messages';

export const isValidEmail = (email: string): boolean => {
  const emailRegex =
    /^(?!\.)(?!.*\.\.)(?=[A-Za-z0-9._%+-]+@)(?!.*\.$)([A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  return emailRegex.test(email);
};

export const isNonEmptyString = (value: string): boolean => {
  return value.trim().length > 0;
};

// Name validation (only letters and spaces, max 100 chars)
export const isValidContactName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name) && name.trim().length <= 100;
};

// Company Name length validation (max 100 chars)
export const isValidCompanyName = (value: string): boolean => {
  return value.length <= 100;
};

// Company Registration Number (alphanumeric, max 30 chars)
export const isValidRegistrationNumber = (value: string): boolean => {
  const alphanumericRegex = /^[A-Za-z0-9]+$/;
  return alphanumericRegex.test(value) && value.length <= 30;
};

// Company Address (non-empty, max 150 chars)
export const isValidAddress = (address: string): boolean => {
  return isNonEmptyString(address) && address.length <= 150;
};

// Website (optional but valid if present)
export const isValidWebsite = (website: string): boolean => {
  if (!website.trim()) return true;
  // const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
  const urlRegex =
    /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,10}(\/.*)?$/;

  return urlRegex.test(website);
};

// DUNS Number (optional but must be valid if filled)
export const isValidDUNSNumber = (duns: string): boolean => {
  if (!duns.trim()) return true;
  const dunsRegex = /^[0-9-]+$/;
  return dunsRegex.test(duns) && duns.replace(/-/g, '').length === 9;
};

export interface PasswordRequirements {
  minLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export const validatePassword = (password: string): PasswordRequirements => ({
  minLength: password.length >= 12,
  hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

export const isPasswordValid = (requirements: PasswordRequirements): boolean =>
  Object.values(requirements).every(Boolean);

// OTP validation (single digit 0-9)
export const isValidOtpDigit = (value: string): boolean => {
  return /^\d$/.test(value);
};

// Extract valid digits from pasted text
export const extractOtpDigits = (text: string, maxLength = 4): string[] => {
  return text
    .split('')
    .filter((char) => isValidOtpDigit(char))
    .slice(0, maxLength);
};

// Check for leading or trailing spaces
export const hasLeadingOrTrailingSpaces = (value: string): boolean => {
  return value !== value.trim();
};

//validation for supplier name
export const isValidSupplierName = (name: string): boolean => {
  if (!name) return false;
  return /^(?!\s)(?!.*\s$)(?!\d+$)[A-Za-z0-9\s.,\-_/()&+'"]{3,150}$/.test(name);
};

export const isValidinternalSku = (internalSku: string): boolean => {
  if (!internalSku) return false;
  return /^[A-Za-z0-9 _-]+$/i.test(internalSku);
};

export const isValidBatchNumber = (batchNumber: string): boolean => {
  return /^[A-Za-z0-9]+$/.test(batchNumber);
};
export const isValidunitOfMeasurement = (
  unit: string,
  isCustomUnit: boolean
): boolean => {
  if (!unit) return false;
  const trimmed = unit.trim();
  // return /^[A-Za-z]+(\s[A-Za-z]+)*$/.test(unit);
  if (isCustomUnit) {
    // Custom unit: letters only, no spaces, no underscores
    return /^[A-Za-z]+$/.test(trimmed);
  }

  // Dropdown unit: allow letters, spaces, underscores
  return /^[A-Za-z_]+(\s[A-Za-z_]+)*$/.test(trimmed);
};

// Search query validation: only a-z, A-Z, spaces (no trailing/leading spaces, min 3 chars)
export const isValidSearchQuery = (query: string): boolean => {
  if (!query) return false;

  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return false;
  }

  const validPattern = /^[A-Za-z\s]+$/;
  if (!validPattern.test(trimmed)) {
    return false;
  }

  if (hasLeadingOrTrailingSpaces(query)) {
    return false;
  }

  return true;
};

export const isValidNumericField = (value: string): boolean => {
  if (!value || hasLeadingOrTrailingSpaces(value)) return false;

  // Require at least one digit before optional decimal, allow 1-3 decimal places
  // Rejects: leading decimal (.001), trailing decimal (1.), multiple decimals (0.0.1)
  const numberRegex = /^\d+(\.\d{1,3})?$/;
  if (!numberRegex.test(value)) return false;

  const num = Number(value);

  // Reject NaN, zero, negative values, and enforce range: 0.001 to 99999
  if (isNaN(num) || num < 0.001 || num > 99999) return false;

  return true;
};

export const isValidTemperature = (
  value: string,
  min: number,
  max: number
): boolean => {
  if (!value || hasLeadingOrTrailingSpaces(value)) return false;

  // Require at least one digit before optional decimal, allow up to 1 decimal place
  // Allows optional leading '-' based on min/max usage.
  // Rejects: leading decimal (.1), trailing decimal (1.), multiple decimals (0.0.1)
  const tempRegex = /^-?\d+(\.\d{1})?$/;
  if (!tempRegex.test(value)) return false;

  const num = Number(value);

  // Reject NaN and enforce inclusive range
  if (isNaN(num) || Object.is(num, -0) || num < min || num > max) return false;

  return true;
};

export const isvalidIntegerField = (
  value: string,
  min: number = 1,
  max: number = 100
): boolean => {
  if (!value || hasLeadingOrTrailingSpaces(value)) return false;

  // Integers only (no decimals, no signs). Rejects: -1, 0, 1.5, .5, 01? (allowed by regex)
  const intRegex = /^\d+$/;
  if (!intRegex.test(value)) return false;

  const num = Number(value);

  // Reject NaN, zero/negative, and enforce inclusive range
  if (isNaN(num) || num < min || num > max) return false;

  return true;
};

export const sanitizeCustomUnit = (val: string) =>
  val.replace(/[^A-Za-z]/g, '');

export const sanitizeNumericInput = (value: string): string => {
  // Keep only digits, '-', and '.'
  let sanitized = value.replace(/[^0-9.-]/g, '');

  // Handle '-': allow only one and only at the start
  if (sanitized.includes('-')) {
    sanitized =
      (sanitized.startsWith('-') ? '-' : '') + sanitized.replace(/-/g, '');
  }

  // Handle '.': allow only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  return sanitized;
};

export const sanitizeAlphaNumericWithSpace = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9\s]/g, '');
};

export const sanitizeComponentSearchInput = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9\s\-_\/&+.,:()%@£$^<>!']/g, '');
};

//collapse multiple hyphens + trim leading/trailing hyphens
export const sanitizeCasNumberStrict = (input: string): string => {
  return input
    .replace(/[^0-9-]/g, '') // allow only digits & hyphen
    .replace(/-+/g, '-') // --- => -
    .replace(/^-+/, '');
};

export const hasLeadingOrTrailingHyphen = (value: string): boolean => {
  return /^-|-$/g.test(value);
};

// Impact value / offset value validation for Carbon, Water, and Land manual forms

export type ImpactFieldMessages = {
  required: string;
  min: string;
  max: string;
  decimal: string;
};

// Impact value / offset value validation for Carbon, Water, and Land manual forms
export const validateImpactValue = (
  value: string,
  messages: ImpactFieldMessages
): string => {
  if (hasLeadingOrTrailingSpaces(value)) {
    return ERROR_MESSAGES.LEADING_TRAILING_SPACES;
  }
  if (!value) {
    return messages.required;
  }
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) {
    return messages.decimal;
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return messages.required;
  }
  if (num < 0.00000001) {
    return messages.min;
  }
  if (num > 1000000) {
    return messages.max;
  }
  return '';
};

/**
 * Boolean check: is the manual impact value/offset value valid
 * (up to 8 decimals, range 0.00000001–1000000)
 */
export const isValidImpactFieldValue = (value?: string): boolean => {
  if (!value) return false;
  if (hasLeadingOrTrailingSpaces(value)) return false;
  if (!/^\d*\.?\d{0,8}$/.test(value)) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (num < 0.00000001) return false;
  if (num > 1000000) return false;
  return true;
};

/**
 * Boolean check: is a database-sourced impact value valid.

 */
export const isValidDatabaseValue = (value?: string | number): boolean => {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  if (s === '') return false;
  if (hasLeadingOrTrailingSpaces(String(value))) return false;
  const num = parseFloat(s);
  if (isNaN(num) || !Number.isFinite(num)) return false;
  if (num < 0) return false;
  return true;
};

export const sanitizeNumericImpactInput = (value: string): string => {
  let sanitized = value.replace(/[^0-9.]/g, '');

  // remove leading dots
  sanitized = sanitized.replace(/^\.+/, '');

  const firstDotIndex = sanitized.indexOf('.');
  if (firstDotIndex !== -1) {
    sanitized =
      sanitized.slice(0, firstDotIndex + 1) +
      sanitized.slice(firstDotIndex + 1).replace(/\./g, '');
  }

  return sanitized;
};
