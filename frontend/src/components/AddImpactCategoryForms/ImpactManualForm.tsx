import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/SelectDataSource/SelectDataSource.module.scss';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import UpArrowIcon from '@assets/icons/arrow-up.svg';
import DownArrowIcon from '@assets/icons/arrow-down.svg';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { validateImpactValue, sanitizeNumericImpactInput } from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { dataSourceOptions, lciaOptions } from '@constants/mockData';
import { compareWithBenchmark } from '@utils/industryAvgComparison';
import IndustryAvgPlaceholderStatus from '@components/IndustryAvgPlaceholderStatus';
import type { ImpactCategoryType } from '@common/ImpactCategoryCard/types';
import { DATASOURSE } from '@common/ImpactCategoryCard/types';

export type ImpactManualFormData = {
  dataSource: string;
  value: string;
  lciaMethod: string;
  confirmAccuracy: boolean;
  offsetting?: boolean;
  offsetValue?: string;
  noImpact?: boolean;
};

export interface ImpactManualFormConfig {
  impactType: ImpactCategoryType;
  title: string;
  description: string;
  unitSuffix: string;
  showOffsetting?: boolean;
  showNoImpact?: boolean;
}

interface ImpactManualFormProps {
  formData: ImpactManualFormData;
  setFormData: (data: Partial<ImpactManualFormData>) => void;
  onClearSearchDatabaseForm?: () => void;
  getSavedData?: () => Record<string, any> | null;
  benchmarkValue?: number;
  config: ImpactManualFormConfig;
}

const FIELD_ERROR_MESSAGES = {
  value: {
    required: ERROR_MESSAGES.IMPACTVALUE_REQUIRED,
    min: ERROR_MESSAGES.IMPACT_MIN_VALUE_REQUIRED,
    max: ERROR_MESSAGES.IMPACT_MAX_VALUE_REQUIRED,
    decimal: ERROR_MESSAGES.IMPACT_DECIMAL_VALUE_REQUIRED,
  },
  offsetValue: {
    required: ERROR_MESSAGES.OFFSETVALUE_REQUIRED,
    min: ERROR_MESSAGES.IMPACT_MIN_OFFSETVALUE_REQUIRED,
    max: ERROR_MESSAGES.IMPACT_MAX_OFFSETVALUE_REQUIRED,
    decimal: ERROR_MESSAGES.IMPACT_DECIMAL_OFFSETVALUE_REQUIRED,
  },
} as const;

const DROPDOWN_ARROW_STYLE = { marginRight: '16px' } as const;
const INFO_ICON_STYLE = {
  verticalAlign: 'baseline',
  marginTop: '3px',
  cursor: 'pointer',
} as const;
const OFFSET_CHECKBOX_STYLE = { marginTop: '4px' } as const;
const OFFSET_FORM_GROUP_STYLE = { width: '100%', gap: '12px' } as const;



const ImpactManualForm = ({
  formData,
  setFormData,
  getSavedData,
  benchmarkValue,
  config,
}: ImpactManualFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState({
    value: false,
    lciaMethod: false,
    offsetValue: false,
  });
  const prevValidRef = useRef(false);

  const safeFormData = {
    dataSource: formData.dataSource || '',
    value: formData.value || '',
    lciaMethod: formData.lciaMethod || '',
    confirmAccuracy: formData.confirmAccuracy || false,
    offsetting: formData.offsetting || false,
    offsetValue: formData.offsetValue || '',
    noImpact: formData.noImpact ?? (config.showNoImpact ? true : false),
  };

  const isManualEntry = safeFormData.dataSource === DATASOURSE.MANUAL;
  const isNoImpactSelected = config.showNoImpact ? safeFormData.noImpact : false;

  const lciaOptionsList = config.showOffsetting
    ? lciaOptions.filter((opt) => opt.value !== '')
    : lciaOptions;

  const averagePlaceholderStatus = useMemo(
    () => compareWithBenchmark(safeFormData.value, benchmarkValue),
    [safeFormData.value, benchmarkValue]
  );

  const validateValue = (value: string, field: 'value' | 'offsetValue') => {
    const error = validateImpactValue(value, FIELD_ERROR_MESSAGES[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleFocus = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: 'value' | 'offsetValue') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldValue = safeFormData[field];

    if (fieldValue) {
      validateValue(fieldValue, field);
      return;
    }

    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleDataSourceChange = (value: string) => {
    const savedData = getSavedData?.();
    const currentNoImpact = formData.noImpact ?? false;

    if (value === DATASOURSE.DATABASE) {
      const hasDbData =
        savedData?.dataSource === DATASOURSE.DATABASE &&
        savedData?.value != null &&
        String(savedData.value) !== '';

      if (hasDbData) {
        setFormData({
          dataSource: DATASOURSE.DATABASE,
          value: String(savedData.value),
          lciaMethod: savedData.lciaMethod || '',
          confirmAccuracy: false,
          ...(config.showNoImpact && { noImpact: currentNoImpact }),
          ...(config.showOffsetting && {
            offsetting: savedData.offsetting ?? false,
            offsetValue: String(savedData.offsetValue ?? ''),
          }),
        });
      } else {
        setFormData({
          ...safeFormData,
          dataSource: value,
          value: '',
          lciaMethod: '',
          confirmAccuracy: false,
          ...(config.showNoImpact && { noImpact: currentNoImpact }),
          ...(config.showOffsetting && { offsetting: false, offsetValue: '' }),
        });
      }

      setErrors({});
      return;
    }

    const hasManualData =
      savedData?.dataSource === DATASOURSE.MANUAL &&
      savedData?.value != null &&
      String(savedData.value) !== '';

    if (hasManualData) {
      setFormData({
        dataSource: DATASOURSE.MANUAL,
        value: String(savedData.value),
        lciaMethod: savedData.lciaMethod || '',
        confirmAccuracy: savedData.confirmAccuracy ?? false,
        ...(config.showNoImpact && { noImpact: currentNoImpact }),
        ...(config.showOffsetting && {
          offsetting: savedData.offsetting ?? false,
          offsetValue: String(savedData.offsetValue ?? ''),
        }),
      });
    } else {
      setFormData({
        ...safeFormData,
        dataSource: value,
        value: '',
        lciaMethod: '',
        confirmAccuracy: false,
        ...(config.showNoImpact && { noImpact: currentNoImpact }),
        ...(config.showOffsetting && { offsetting: false, offsetValue: '' }),
      });
    }

    setErrors({});
  };

  const handleChange = (key: keyof ImpactManualFormData, value: any) => {
    if (key === 'offsetting' && value === false && config.showOffsetting) {
      setFormData({ ...safeFormData, offsetting: false, offsetValue: '' });
      setErrors((prev) => ({ ...prev, offsetValue: '' }));
      return;
    }

    if (key === 'dataSource') {
      handleDataSourceChange(value);
      return;
    }

    setFormData({ ...safeFormData, [key]: value });
  };

  const handleNumericInputChange = (
    field: 'value' | 'offsetValue',
    rawValue: string
  ) => {
    const sanitized = sanitizeNumericImpactInput(rawValue);

    handleChange(field, sanitized);

    if (touched[field]) {
      validateValue(sanitized, field);
    }
  };

  const isValid = useMemo(() => {
    if (!safeFormData.dataSource) return false;
    if (!safeFormData.value) return false;
    if (!safeFormData.lciaMethod) return false;
    if (!safeFormData.confirmAccuracy) return false;

    if (config.showOffsetting && safeFormData.offsetting) {
      if (!safeFormData.offsetValue) return false;
      if (errors.offsetValue) return false;
    }

    return true;
  }, [safeFormData, errors.offsetValue, config.showOffsetting]);

  useEffect(() => {
    if (prevValidRef.current !== isValid) {
      prevValidRef.current = isValid;
    }
  }, [isValid]);

  const renderDropdownArrow = (isOpen: boolean) => (
    <img
      src={isOpen ? UpArrowIcon : DownArrowIcon}
      alt="Dropdown"
      style={DROPDOWN_ARROW_STYLE}
    />
  );

  const renderError = (error?: string) =>
    error ? <p className={styles.error}>{error}</p> : null;

  const renderDropdown = ({
    title,
    options,
    value,
    onChange,
    placeholder = 'Select',
    disabled = false,
    wrapperClassName = '',
    dropdownClassName = `${styles.dropdown} ${styles.labelColor}`,
  }: {
    title: string;
    options: typeof dataSourceOptions;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
    wrapperClassName?: string;
    dropdownClassName?: string;
  }) => (
    <div className={wrapperClassName}>
      <DropdownComponent
        title={title}
        options={options}
        value={value}
        onChange={onChange}
        truncateLabel={false}
        arrowRenderer={renderDropdownArrow}
        className={dropdownClassName}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );

  const renderTextInput = ({
    label,
    value,
    placeholder,
    disabled,
    suffix,
    error,
    field,
    onChange,
    labelClassName = '',
    suffixClassName = '',
    inputWrapperClassName = styles.inputWrapper,
    extraLabelContent,
  }: {
    label: React.ReactNode;
    value: string;
    placeholder: string;
    disabled?: boolean;
    suffix: string;
    error?: string;
    field: 'value' | 'offsetValue';
    onChange: (value: string) => void;
    labelClassName?: string;
    suffixClassName?: string;
    inputWrapperClassName?: string;
    extraLabelContent?: React.ReactNode;
  }) => (
    <>
      <div className={styles.labelRow}>
        <label className={labelClassName}>{label}</label>
        {extraLabelContent}
      </div>

      <div className={inputWrapperClassName}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => handleFocus(field)}
          onBlur={() => handleBlur(field)}
        />
        <span className={`${styles.inputSuffix} ${suffixClassName}`}>
          {suffix}
        </span>
      </div>

      {renderError(error)}
    </>
  );

  const renderSectionCheckbox = ({
    checked,
    onChange,
    title,
    description,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    title: string;
    description: string;
  }) => (
    <div className={styles.offsetCarbonWrapper}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.checkboxInput}
        />
        <span
          className={styles.customCheckbox}
          style={OFFSET_CHECKBOX_STYLE}
        ></span>
      </label>
      <div className={styles.offsetWrap}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );

  const renderDataSourceField = () => (
    <div className={styles.formGroup}>
      <div
        className={`${styles.dropdownWrapper} ${isNoImpactSelected ? styles.disabledLabel : ''}`}
      >
        {renderDropdown({
          title: ' Data Source',
          options: dataSourceOptions,
          value: safeFormData.dataSource,
          onChange: (val) => handleChange('dataSource', val),
          disabled: isNoImpactSelected,
        })}
        {renderError(errors.dataSource)}
      </div>
    </div>
  );

  const renderValueField = () => (
    <div className={styles.formGroup}>
      {renderTextInput({
        label: (
          <>
            Value <span className={styles.required}>*</span>
          </>
        ),
        value: safeFormData.value || '',
        placeholder: isManualEntry ? 'Enter here...' : '',
        disabled: isNoImpactSelected || !isManualEntry,
        suffix: config.unitSuffix,
        error: errors.value,
        field: 'value',
        onChange: (value) => handleNumericInputChange('value', value),
        labelClassName: isNoImpactSelected ? styles.disabledLabel : '',
        suffixClassName: isNoImpactSelected ? styles.disabledLabel : '',
        extraLabelContent: averagePlaceholderStatus ? (
          <IndustryAvgPlaceholderStatus status={averagePlaceholderStatus} />
        ) : null,
      })}
    </div>
  );

  const renderLciaField = () => {
    if (!isManualEntry) return null;

    return (
      <div className={`${styles.formGroup} ${styles.formGroupFullWidth}`}>
        <div
          className={`${styles.dropdownWrapper} ${isNoImpactSelected ? styles.disabledLabel : ''}`}
        >
          <div className={styles.tooltipWrap}>
            {renderDropdown({
              title: 'LCIA Methodology Used',
              options: lciaOptionsList,
              value: safeFormData.lciaMethod,
              onChange: (val) => handleChange('lciaMethod', val),
              disabled: isNoImpactSelected,
            })}

            <div
              className={`${styles.infoIcon} ${isNoImpactSelected ? styles.disabledIcon : ''}`}
            >
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
                  style={INFO_ICON_STYLE}
                />
              </Tooltip>
            </div>
          </div>

          {renderError(errors.lciaMethod)}
        </div>
      </div>
    );
  };

  const renderConfirmAccuracy = () => {
    if (!isManualEntry) return null;

    return (
      <div className={styles.confirmWrapper}>
        <label
          className={`${styles.checkboxLabel} ${isNoImpactSelected ? styles.disabledLabel : ''}`}
        >
          <input
            type="checkbox"
            checked={safeFormData.confirmAccuracy}
            onChange={(e) => handleChange('confirmAccuracy', e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.customCheckbox}></span>
        </label>
        <p className={isNoImpactSelected ? styles.disabledLabel : ''}>
          {' '}
          I confirm that the data provided is accurate to the best of my
          knowledge
          <span className={styles.required}>*</span>
        </p>
      </div>
    );
  };

  const renderOffsettingSection = () => {
    if (!config.showOffsetting) return null;

    return (
      <div className={styles.offsettingCarbonImpactWrapper}>
        {renderSectionCheckbox({
          checked: safeFormData.offsetting,
          onChange: (checked) => handleChange('offsetting', checked),
          title: ' Offsetting Carbon Impact',
          description:
            'Select this option if you have offset the carbon emissions generated by this component or service',
        })}

        {safeFormData.offsetting && (
          <div
            className={`${styles.offsetValueWrapper} ${safeFormData.offsetting ? 'open' : ''}`}
          >
            <div className={styles.formGroup} style={OFFSET_FORM_GROUP_STYLE}>
              <label>
                Carbon Emissions Offset Value{' '}
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={safeFormData.offsetValue}
                  placeholder="Enter value..."
                  onChange={(e) =>
                    handleNumericInputChange('offsetValue', e.target.value)
                  }
                  onFocus={() => handleFocus('offsetValue')}
                  onBlur={() => handleBlur('offsetValue')}
                />
                <span className={styles.inputSuffix}>kg CO₂-eq/unit</span>
              </div>

              {renderError(errors.offsetValue)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNoImpactSection = () => {
    if (!config.showNoImpact) return null;

    return (
      <div className={styles.offsettingCarbonImpactWrapper}>
        {renderSectionCheckbox({
          checked: isNoImpactSelected,
          onChange: (checked) => handleChange('noImpact', checked),
          title: 'No Impact',
          description:
            'Select this option if your component or service has no environmental impact in this category. No data input will be required for this impact category',
        })}
      </div>
    );
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.headerWrapper}>
        <h3>{config.title}</h3>
        <p>{config.description}</p>
      </div>

      <div className={styles.formGrid}>
        {renderDataSourceField()}
        {renderValueField()}
        {renderLciaField()}
      </div>

      {renderConfirmAccuracy()}
      {renderOffsettingSection()}
      {renderNoImpactSection()}
    </div>
  );
};

export default ImpactManualForm;