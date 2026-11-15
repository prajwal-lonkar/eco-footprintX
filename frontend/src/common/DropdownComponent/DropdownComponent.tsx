import React, { useEffect, useRef, useState } from 'react';
import styles from './DropdownComponent.module.scss';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';
import type { DropdownOption } from '@type/dropdown';

interface DropdownProps {
  title: string;
  options: DropdownOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
  truncateLabel: boolean;

  arrowRenderer?: (isOpen: boolean) => React.ReactNode;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  disableLabel?: boolean;
}

const DropdownComponent: React.FC<DropdownProps> = ({
  title,
  options,
  value,
  onChange,
  className,
  truncateLabel = true,
  arrowRenderer,
  required = true,
  placeholder,
  disabled = false,
  disableLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownMenuRef = useRef<HTMLUListElement | null>(null);
  // const toggleDropdown = () => {
  //   setIsOpen(!isOpen);
  // };

  const selectOption = (option: string) => {
    if (disabled) return;
    onChange(option);

    setIsOpen(false);
    setOpenUpwards(false); // reset position for next open
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Helper function to truncate the label
  const getDisplayLabel = (label: string) => {
    if (!truncateLabel) return label; // show full
    if (label.length <= 10) return label; // no need to truncate
    return `${label.slice(0, 10)}...`;
  };

  // Helper: find label for current value
  const selectedLabel: string = value
    ? (options.find((opt) => opt.value === value)?.label ?? '')
    : (placeholder ?? '');

  const [isActive, setIsActive] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsActive(true); // show green border when clicked
    setIsOpen(!isOpen);
  };

  // Calculate position after dropdown menu is rendered
  useEffect(() => {
    if (isOpen && dropdownRef.current && dropdownMenuRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const menuHeight =
        dropdownMenuRef.current.offsetHeight ||
        dropdownMenuRef.current.scrollHeight;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if there's not enough space below but enough space above
      setOpenUpwards(spaceBelow < menuHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Close dropdown and remove green border when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsActive(false); // remove green border
        setShowTooltip(false);
        setOpenUpwards(false); // reset position for next open
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isActuallyTruncated = truncateLabel && selectedLabel.length > 10;
  return (
    <div
      className={`${styles.dropdownContainer} ${className}`}
      ref={dropdownRef}
    >
      {title && (
        <label
          className={`${styles.label} ${
            disabled && disableLabel ? styles.disabled : ''
          }`}
          data-required="true"
        >
          {title}{' '}
          {required && <span className={styles.requiredAsterisk}>*</span>}
        </label>
      )}
      <div onClick={toggleDropdown} className={`${styles.dropdown}`}>
        <button
          className={`
    ${styles.dropdownToggle}
    ${isActive ? styles.dropdownActive : ''}
    ${!value ? styles.notSelected : ''}
     ${disabled ? styles.disabledButton : ''}
  `}
          disabled={disabled}
        >
          {/* {selectedOption} */}
          <span
            className={`${styles.labelText} ${!value ? styles.placeholder : ''} ${className}`}
            onMouseEnter={() => {
              if (!disabled && isActuallyTruncated) setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {getDisplayLabel(selectedLabel)}
          </span>
          {arrowRenderer ? (
            arrowRenderer(isOpen && !disabled)
          ) : isOpen ? (
            <FaAngleUp className={styles.arrowIcon} />
          ) : (
            <FaAngleDown className={styles.arrowIcon} />
          )}
        </button>
        {/* Tooltip (only when truncated text) */}
        {showTooltip && selectedLabel.length > 10 && (
          <div className={styles.tooltipBox}>
            <span>{selectedLabel}</span>
            <div className={styles.arrow}></div>
          </div>
        )}

        {isOpen && !disabled && (
          <ul
            ref={dropdownMenuRef}
            className={`${styles.dropdownMenu} ${openUpwards ? styles.dropdownMenuUp : ''}`}
          >
            <div className={styles.dropdownScrollbar}>
              {options.map((option, index) => (
                <li
                  key={option.value || index}
                  className={styles.dropdownOption}
                  onClick={() => selectOption(option.value || option.label)}
                >
                  {option.label}
                </li>
              ))}
            </div>
          </ul>
        )}
      </div>
    </div>
  );
};

export default DropdownComponent;

