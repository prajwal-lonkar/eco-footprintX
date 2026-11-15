import type { ReactNode } from 'react';

import ShowIcon from '@assets/icons/Show.svg';
import ClearIcon from '@assets/icons/Clear.svg';
import HideIcon from '@assets/icons/hide.svg';
import CheckmarkIcon from '@assets/icons/checkmark.svg';

interface PasswordInputFieldProps {
  value: string;
  showPassword: boolean;
  onToggleShow: () => void;
  onClear: () => void;
  error?: string;
  /** When true, shows the checkmark icon instead of clear + eye */
  showCheckmark?: boolean;
  children: ReactNode;
  containerClassName: string;
  iconClearClassName: string;
  iconEyeClassName: string;
  errorClassName: string;
  iconCheckmarkClassName?: string;
}

const PasswordInputField = ({
  value,
  showPassword,
  onToggleShow,
  onClear,
  error,
  showCheckmark,
  children,
  containerClassName,
  iconClearClassName,
  iconEyeClassName,
  errorClassName,
  iconCheckmarkClassName,
}: PasswordInputFieldProps) => (
  <>
    <div className={containerClassName}>
      {children}
      {value && (
        <>
          {showCheckmark ? (
            <img
              src={CheckmarkIcon}
              alt="Password valid"
              className={iconCheckmarkClassName}
            />
          ) : (
            <>
              <img
                src={ClearIcon}
                alt="Clear"
                className={iconClearClassName}
                onClick={onClear}
                onMouseDown={(e) => e.preventDefault()}
              />
              <img
                src={showPassword ? HideIcon : ShowIcon}
                alt="Toggle password visibility"
                className={iconEyeClassName}
                onClick={onToggleShow}
                onMouseDown={(e) => e.preventDefault()}
              />
            </>
          )}
        </>
      )}
    </div>
    {error && <p className={errorClassName}>{error}</p>}
  </>
);

export default PasswordInputField;
