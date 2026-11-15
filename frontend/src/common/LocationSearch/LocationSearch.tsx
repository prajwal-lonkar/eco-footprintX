import { memo } from 'react';
import styles from './LocationSearch.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import SearchIcon from '@assets/icons/search.svg';
import type { useGeographyAutocomplete } from '@hooks/useGeographyAutocomplete';

interface LocationSearchProps {
  field: string;
  value: string;
  geographyHook: ReturnType<typeof useGeographyAutocomplete>;
  label: string;
  placeholder: string;
  tooltipText?: string;
  error?: string;
  onFocus?: (field: string) => void;
  required?: boolean;
}

const LocationSearch = memo(
  ({
    field,
    value,
    geographyHook,
    label,
    placeholder,
    tooltipText,
    error,
    onFocus,
    required = true,
  }: LocationSearchProps) => {
    return (
      <div className={styles.formField}>
        {tooltipText ? (
          <div className={styles.labelWithIcon}>
            <label
              className={`${styles.fieldLabel} ${styles.fieldLabelWithTooltip}`}
            >
              {label} {required && <span className={styles.required}>*</span>}
              <Tooltip text={tooltipText} noTruncate position="right">
                <img src={infoIcon} alt="Info" className={styles.infoIcon} />
              </Tooltip>
            </label>
          </div>
        ) : (
          <label className={styles.fieldLabel}>
            {label} {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.searchWrapper} ref={geographyHook.wrapperRef}>
          <div
            className={`${styles.searchInputContainer} ${error ? styles.inputError : ''}`}
          >
            <div className={styles.searchIconWrapper}>
              <img
                src={SearchIcon}
                alt="Search"
                className={styles.searchIcon}
              />
            </div>
            <input
              type="text"
              className={styles.searchInput}
              value={value}
              onChange={(e) => geographyHook.handleInputChange(e.target.value)}
              onFocus={() => {
                geographyHook.handleInputFocus();
                if (onFocus) onFocus(field);
              }}
              placeholder={placeholder}
              autoComplete="off"
            />
          </div>
          {geographyHook.showResults && (
            <div className={styles.searchResults}>
              {geographyHook.predictions.length > 0 &&
                geographyHook.predictions.map((prediction, index) => (
                  <div
                    key={`${prediction.geography}-${index}`}
                    className={styles.searchResultItem}
                    onClick={() =>
                      geographyHook.handleGeographySelect(prediction.geography)
                    }
                  >
                    <span className={styles.resultName}>
                      {prediction.geography}
                    </span>
                  </div>
                ))}

              {value.trim().length > 0 &&
                geographyHook.predictions.length === 0 &&
                geographyHook.searchCompleted &&
                !geographyHook.isLoading && (
                  <div className={styles.noResults}>
                    No places found. Please try a different search term.
                  </div>
                )}
            </div>
          )}
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }
);

LocationSearch.displayName = 'LocationSearch';

export default LocationSearch;
