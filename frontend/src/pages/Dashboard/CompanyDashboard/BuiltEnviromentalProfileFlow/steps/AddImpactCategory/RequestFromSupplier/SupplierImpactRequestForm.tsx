import { useState } from 'react';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import UpArrowIcon from '@assets/icons/arrow-up.svg';
import DownArrowIcon from '@assets/icons/arrow-down.svg';
import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/RequestFromSupplier/RequestFromSupplier.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import {
  sanitizeNumericImpactInput,
  validateImpactValue,
} from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { lciaOptions } from '@constants/mockData';
import { compareWithBenchmark } from '@utils/industryAvgComparison';
import IndustryAvgPlaceholderStatus from '@components/IndustryAvgPlaceholderStatus';

type ImpactForm = {
  value: string;
  lciaMethod: string;
};

interface SupplierImpactRequestFormProps {
  data: ImpactForm;
  onChange: (field: keyof ImpactForm, value: string) => void;
  benchmarkValue?: number;
  title: string;
  description: string;
  unitSuffix: string;
}

const SupplierImpactRequestForm = ({
  data,
  onChange,
  benchmarkValue,
  title,
  description,
  unitSuffix,
}: SupplierImpactRequestFormProps) => {
  const [errors, setErrors] = useState<{ value?: string }>({});
  const [touched, setTouched] = useState({
    value: false,
  });

  const handleFocus = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateValue = (value: string) => {
    const error = validateImpactValue(value, {
      required: ERROR_MESSAGES.IMPACTVALUE_REQUIRED,
      min: ERROR_MESSAGES.IMPACT_MIN_VALUE_REQUIRED,
      max: ERROR_MESSAGES.IMPACT_MAX_VALUE_REQUIRED,
      decimal: ERROR_MESSAGES.IMPACT_DECIMAL_VALUE_REQUIRED,
    });
  
    setErrors((prev) => ({
      ...prev,
      value: error,
    }));
  
    return !error;
  };

  const handleBlur = (field: keyof typeof touched, value?: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const currentValue = value ?? data.value ?? '';

    if (!currentValue) {
      // Clear error on blur if user hasn't typed anything
      setErrors((prev) => ({ ...prev, value: '' }));
      return;
    }

    validateValue(currentValue);
  };

  const handleChangeValue = (value: string) => {
    onChange('value', value);

    // Only validate if the user touched the field
    if (touched.value) {
      validateValue(value);
    }
  };

  return (
    <div className={styles.subStep}>
      <div className={styles.tempDataCard}>
        <h4>{title}</h4>

        <p className={styles.subText}>{description}</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label>Value</label>
              {benchmarkValue != null && benchmarkValue > 0 && (
                <IndustryAvgPlaceholderStatus
                  status={compareWithBenchmark(data.value, benchmarkValue)}
                />
              )}
            </div>

            <div className={styles.inputWrapper}>
              <input
                value={data.value}
                placeholder="Enter here..."
                onChange={(e) =>
                  handleChangeValue(sanitizeNumericImpactInput(e.target.value))
                }
                onFocus={() => handleFocus('value')}
                onBlur={() => handleBlur('value')}
              />
              <span className={styles.inputSuffix}>{unitSuffix}</span>
            </div>

            {errors.value && (
              <span className={styles.error}>{errors.value}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <div className={styles.dropdownWrapper}>
              <div className={styles.tooltipWrap}>
                <DropdownComponent
                  title="LCIA Methodology Used"
                  options={lciaOptions}
                  value={data.lciaMethod}
                  onChange={(val: string) => onChange('lciaMethod', val)}
                  truncateLabel={false}
                  arrowRenderer={(isOpen) => (
                    <img
                      src={isOpen ? UpArrowIcon : DownArrowIcon}
                      alt="Dropdown"
                      style={{ marginRight: '16px' }}
                    />
                  )}
                  className={`${styles.dropdown} ${styles.labelColor}`}
                  required={!!data.value}
                  placeholder="Select"
                  disabled={!data.value || !!errors.value}
                  disableLabel={false}
                />

                <div className={styles.infoIcon}>
                  <Tooltip
                    text={TOOLTIP_TEXT.LCIA_METHODOLOGY}
                    noTruncate
                    position="right"
                  >
                    <img
                      src={infoIcon}
                      alt="info"
                      width={12}
                      height={12}
                      style={{
                        verticalAlign: 'baseline',
                        marginTop: '3px',
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierImpactRequestForm;