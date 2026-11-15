import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/SelectDataSource/SelectDataSource.module.scss';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import UpArrowIcon from '@assets/icons/arrow-up.svg';
import DownArrowIcon from '@assets/icons/arrow-down.svg';
import { dataSourceOptions } from '@constants/mockData';
import { SearchDatabaseComponent } from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddIndustryBenchmarking/SearchDatabaseComponent/SearchDatabaseComponent';
import type {
  CarbonImpactData,
  WaterLandImpactData,
  SearchDatabaseFormData,
} from '@type/built-enviromental-profile';
import type { ImpactDatabaseSearchResultRow } from '@type/built-enviromental-profile';
import { validateImpactValue } from '@utils/validation';
import { ERROR_MESSAGES } from '@constants/messages';
import {
  useDatabaseSearch,
  SEARCH_RESULTS_PAGE_SIZE,
} from '@hooks/useDatabaseSearch';
import DatabaseResultsSection from '@components/AddImpactCategoryForms/DatabaseResultsSection';
import { compareWithBenchmark } from '@utils/industryAvgComparison';
import IndustryAvgPlaceholderStatus from '@components/IndustryAvgPlaceholderStatus';
import { formatFetchedValue } from '@utils/formatters';
import { saveImpactCategoryDatabaseValue } from '@service/built-enviromental-profile.service';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useAlertStore } from '@store/useAlertStore';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { DATASOURSE } from '@common/ImpactCategoryCard/types';
import type { ImpactCategoryType } from '@common/ImpactCategoryCard/types';

type AnyImpactData = Partial<CarbonImpactData & WaterLandImpactData>;

export interface ImpactDatabaseFormConfig {
  impactType: ImpactCategoryType;
  componentName: string;
  title: string;
  description: string;
  unitSuffix: string;
  radioName: string;
  showOffsetting?: boolean;
  showNoImpact?: boolean;
}

interface ImpactDatabaseFormProps {
  formData: AnyImpactData;
  setFormData: (data: AnyImpactData) => void;
  supplierRoleSlug: string;
  roleDetailsId?: string;
  onSearchStatusChange?: (status: 'idle' | 'no-results' | 'error') => void;
  getSavedData?: () => AnyImpactData | null;
  benchmarkValue?: number;
  searchResetToken?: number;
  suppressSavedAuditPrefill?: boolean;
  config: ImpactDatabaseFormConfig;
}

const OFFSET_MESSAGES = {
  required: ERROR_MESSAGES.OFFSETVALUE_REQUIRED,
  min: ERROR_MESSAGES.IMPACT_MIN_OFFSETVALUE_REQUIRED,
  max: ERROR_MESSAGES.IMPACT_MAX_OFFSETVALUE_REQUIRED,
  decimal: ERROR_MESSAGES.IMPACT_DECIMAL_OFFSETVALUE_REQUIRED,
} as const;

const CHECKBOX_STYLE = { marginTop: 4 } as const;
const OFFSET_GROUP_STYLE = { width: '100%', gap: 12 } as const;
const DROPDOWN_ARROW_STYLE = { marginRight: 16 } as const;
const ZERO_VALUE_DISABLED_STYLE = { opacity: 0.5, pointerEvents: 'none' } as const;
const FETCHED_PLACEHOLDER = '-----------------------------------------';

const sanitizeNumericInput = (value: string) => value.replace(/[^0-9.]/g, '');

const ImpactDatabaseForm = ({
  formData,
  setFormData,
  supplierRoleSlug,
  roleDetailsId,
  onSearchStatusChange,
  getSavedData,
  benchmarkValue,
  searchResetToken,
  suppressSavedAuditPrefill = false,
  config,
}: ImpactDatabaseFormProps) => {
  const [touchedOffset, setTouchedOffset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSpinner, hideSpinner } = useSpinnerStore();
  const { showAlert } = useAlertStore();
  const { componentId } = useParams<{ componentId?: string }>();

  const {
    results,
    setResults,
    selectedRowId,
    setSelectedRowId,
    searchStatus,
    lastSearchedFormData,
    handleSearch,
    handlePageChange,
    resultColumns,
    totalCount,
    skip,
    paginatedResults,
    resetSearch,
    getStoredSearchDatabaseFormData,
    setStoredSearchDatabaseFormData,
  } = useDatabaseSearch({
    supplierRoleSlug,
    impactType: config.impactType,
    componentName: config.componentName,
    onSearchStatusChange,
  });

  const safeFormData = useMemo(
    () => ({
      dataSource: formData.dataSource || DATASOURSE.DATABASE,
      value: formData.value || '',
      lciaMethod: formData.lciaMethod || '',
      noImpact: formData.noImpact ?? false,
      offsetting: formData.offsetting ?? false,
      offsetValue: String(formData.offsetValue ?? ''),
    }),
    [formData]
  );

  const isValueZero =
    config.showOffsetting &&
    safeFormData.value !== '' &&
    parseFloat(safeFormData.value) === 0;

  const valueAvgStatus = useMemo(
    () => compareWithBenchmark(safeFormData.value, benchmarkValue),
    [safeFormData.value, benchmarkValue]
  );

  const tableAvgStatus = useMemo(
    () =>
      selectedRowId
        ? compareWithBenchmark(safeFormData.value, benchmarkValue)
        : null,
    [selectedRowId, safeFormData.value, benchmarkValue]
  );

  const formattedFetchedValue = formatFetchedValue(safeFormData.value);
  const savedAuditFormDataRef = useRef<SearchDatabaseFormData | null>(null);
  const previousSearchResetTokenRef = useRef<number | undefined>(
    searchResetToken
  );

  const isDisabled = config.showNoImpact && safeFormData.noImpact;
  const isFetchedValueInactive =
    (!selectedRowId && !safeFormData.value) || !!isDisabled;

  const clearFetchedSelection = useCallback(() => {
    const hasFetchedValue = String(formData.value ?? '') !== '';
    if (!selectedRowId && !hasFetchedValue && !formData.audit) return;

    setSelectedRowId(null);
    setFormData({
      ...formData,
      value: '',
      audit: undefined,
    });
  }, [formData, selectedRowId, setFormData, setSelectedRowId]);

  useEffect(() => {
    if (searchResetToken === undefined) return;

    if (searchResetToken === previousSearchResetTokenRef.current) {
      return;
    }

    previousSearchResetTokenRef.current = searchResetToken;
    resetSearch();
    setResults([]);
    clearFetchedSelection();
    savedAuditFormDataRef.current = null;
    onSearchStatusChange?.('idle');
  }, [
    clearFetchedSelection,
    onSearchStatusChange,
    resetSearch,
    searchResetToken,
    setResults,
  ]);

  // Unmark selection and clear fetched value when search params change
  const storedImpactFormData = useBuiltEnvironmentalProfileFlowStore(
    (s) => s.impactCategorySearchDatabaseFormDataByRole[supplierRoleSlug ?? '']
  );

  useEffect(() => {
    if (!lastSearchedFormData || !storedImpactFormData) return;

    const hasChanged = (
      Object.keys(lastSearchedFormData) as Array<keyof SearchDatabaseFormData>
    ).some((key) => storedImpactFormData[key] !== lastSearchedFormData[key]);

    if (hasChanged) {
      clearFetchedSelection();
    }
  }, [storedImpactFormData, lastSearchedFormData, clearFetchedSelection]);

  useLayoutEffect(() => {
    if (suppressSavedAuditPrefill) return;

    const audit = (formData as any)?.audit;

    if (formData.dataSource === DATASOURSE.DATABASE && audit?.result) {
      const savedRow: ImpactDatabaseSearchResultRow = {
        id: audit.result.id || audit.result._id || 'saved-row',
        componentOrServiceName: audit.result.componentOrServiceName || '-',
        activityDescription:
          audit.result.activityDescription || audit.result.activityName || '-',
        supplierLocation:
          audit.result.supplierLocation || audit.result.geography || '-',
        lciaMethodology: audit.result.lciaMethodology || '-',
        value: audit.result.value ?? '-',
        transportMethod: audit.result.transportMethod || '-',
        transportDescription: audit.result.transportDescription || '-',
        transportRegion: audit.result.transportRegion || '-',
        casNumber: audit.result.casNumber || '-',
        industryComparison: audit.result.industryComparison || '-',
      };

      if (results.length === 0) {
        setResults([savedRow]);
        setSelectedRowId(savedRow.id);
      }

      if (audit.query && supplierRoleSlug && results.length === 0) {
        const auditFormData: SearchDatabaseFormData = {
          componentName: audit.query.componentOrServiceName || '',
          casNumber: audit.query.casNumber || '',
          supplierLocation: audit.query.supplierLocation || '',
          lciaMethodology: audit.query.lciaMethodology || '',
          industry: audit.query.industry || '',
          transportMethod: audit.query.transportMethod || '',
          transportRegion:
            audit.query.transportRegion || audit.query.supplierLocation || '',
        };

        setStoredSearchDatabaseFormData(auditFormData);
        savedAuditFormDataRef.current = auditFormData;
      }
    }
  }, [
    formData.dataSource,
    formData.audit,
    supplierRoleSlug,
    results.length,
    setResults,
    setSelectedRowId,
    setStoredSearchDatabaseFormData,
    suppressSavedAuditPrefill,
  ]);

  const validateOffset = useCallback((value: string) => {
    const err = validateImpactValue(value, OFFSET_MESSAGES);
    setErrors((prev) => ({ ...prev, offsetValue: err }));
    return !err;
  }, []);

  const handleSelectRow = useCallback(
    async (row: ImpactDatabaseSearchResultRow) => {
      setSelectedRowId(row.id);
      const fallbackValue = row.value != null ? String(row.value) : '';

      const searchFormData =
        lastSearchedFormData ?? getStoredSearchDatabaseFormData();

      const audit = {
        query: {
          supplierLocation: searchFormData.supplierLocation || undefined,
          lciaMethodology: searchFormData.lciaMethodology || undefined,
          transportMethod: searchFormData.transportMethod || undefined,
          transportRegion: searchFormData.transportRegion || undefined,
          industry: searchFormData.industry || undefined,
          componentOrServiceName: searchFormData.componentName || undefined,
          casNumber: searchFormData.casNumber || undefined,
        },
        result: { ...row },
      };

      let resolvedValue = fallbackValue;
      const numericValue = Number(row.value);

      if (
        componentId &&
        roleDetailsId &&
        supplierRoleSlug &&
        Number.isFinite(numericValue)
      ) {
        showSpinner();
        try {
          const saveResponse = await saveImpactCategoryDatabaseValue(
            componentId,
            roleDetailsId,
            {
              value: numericValue,
              supplierRoleSlug,
              rowSelected: { ...row },
            }
          );

          const responseValue = saveResponse?.data;
          if (responseValue != null && responseValue !== '') {
            resolvedValue = String(responseValue);
          }
        } catch {
          showAlert(ERROR_MESSAGES.FAILED_TO_FETCH_VALUE_AFTER_SAVE, 'danger');
        } finally {
          hideSpinner();
        }
      }

      const isZero = parseFloat(resolvedValue) === 0;

      setFormData({
        ...formData,
        value: resolvedValue,
        lciaMethod: row.lciaMethodology || safeFormData.lciaMethod || '',
        dataSource: DATASOURSE.DATABASE,
        audit,
        ...(config.showNoImpact ? { noImpact: false } : {}),
        ...(config.showOffsetting && isZero
          ? { offsetting: false, offsetValue: '' }
          : {}),
      });
    },
    [
      componentId,
      config.showNoImpact,
      config.showOffsetting,
      formData,
      getStoredSearchDatabaseFormData,
      hideSpinner,
      lastSearchedFormData,
      roleDetailsId,
      safeFormData.lciaMethod,
      setFormData,
      setSelectedRowId,
      showAlert,
      showSpinner,
      supplierRoleSlug,
    ]
  );

  const handleSearchWithValueReset = useCallback(
    (formDataFromSearch: SearchDatabaseFormData, pageSkip = 0) => {
      if (pageSkip === 0) {
        setSelectedRowId(null);
        setFormData({
          ...formData,
          value: '',
          audit: undefined,
        });
      }

      handleSearch(formDataFromSearch, pageSkip);
    },
    [formData, handleSearch, setFormData, setSelectedRowId]
  );

  const handleDataSourceChange = useCallback(
    (newSource: string) => {
      onSearchStatusChange?.('idle');
      resetSearch();

      const savedData = getSavedData?.();
      const base = config.showOffsetting ? { ...formData } : {};
      const noImpactField = config.showNoImpact
        ? { noImpact: formData.noImpact ?? false }
        : {};

      if (newSource === DATASOURSE.MANUAL) {
        const hasManualData =
          savedData?.dataSource === DATASOURSE.MANUAL &&
          savedData?.value != null &&
          String(savedData.value) !== '';

        if (hasManualData) {
          setFormData({
            ...base,
            dataSource: DATASOURSE.MANUAL,
            value: String(savedData.value),
            lciaMethod: savedData.lciaMethod || '',
            confirmAccuracy: savedData.confirmAccuracy ?? false,
            ...noImpactField,
            ...(config.showOffsetting
              ? {
                offsetting: savedData.offsetting ?? false,
                offsetValue: String(savedData.offsetValue ?? ''),
              }
              : {}),
          });
        } else {
          setFormData({
            ...base,
            dataSource: DATASOURSE.MANUAL,
            value: '',
            lciaMethod: '',
            confirmAccuracy: false,
            ...noImpactField,
            ...(config.showOffsetting
              ? { offsetting: false, offsetValue: '' }
              : {}),
          });
        }
      } else {
        const hasDbData =
          savedData?.dataSource === DATASOURSE.DATABASE &&
          savedData?.value != null &&
          String(savedData.value) !== '';

        if (hasDbData) {
          setFormData({
            ...base,
            dataSource: DATASOURSE.DATABASE,
            value: String(savedData.value),
            lciaMethod: savedData.lciaMethod || '',
            ...noImpactField,
            ...(config.showOffsetting
              ? {
                offsetting: savedData.offsetting ?? false,
                offsetValue: String(savedData.offsetValue ?? ''),
              }
              : {}),
          });
        } else {
          setFormData({
            ...base,
            dataSource: newSource,
            value: '',
            lciaMethod: '',
            ...noImpactField,
          });
        }
      }

      if (config.showOffsetting) {
        setErrors({});
      }
    },
    [
      config.showNoImpact,
      config.showOffsetting,
      formData,
      getSavedData,
      onSearchStatusChange,
      resetSearch,
      setFormData,
    ]
  );

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      if (config.showOffsetting && key === 'offsetting' && value === false) {
        setFormData({ ...formData, offsetting: false, offsetValue: '' });
        setErrors((prev) => ({ ...prev, offsetValue: '' }));
        return;
      }

      if (key === 'dataSource') {
        handleDataSourceChange(value as string);
        return;
      }

      setFormData({ ...formData, [key]: value });
    },
    [config.showOffsetting, formData, handleDataSourceChange, setFormData]
  );

  const renderDropdownArrow = (isOpen: boolean) => (
    <img
      src={isOpen ? UpArrowIcon : DownArrowIcon}
      alt=""
      style={DROPDOWN_ARROW_STYLE}
    />
  );

  const renderValueStatus = () =>
    valueAvgStatus && !isDisabled ? (
      <IndustryAvgPlaceholderStatus status={valueAvgStatus} />
    ) : null;

  const renderNoImpactSection = () => {
    if (!config.showNoImpact) return null;

    return (
      <div className={styles.offsettingCarbonImpactWrapper}>
        <div className={styles.offsetCarbonWrapper}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={safeFormData.noImpact}
              onChange={(e) => handleChange('noImpact', e.target.checked)}
              className={styles.checkboxInput}
            />
            <span className={styles.customCheckbox} style={CHECKBOX_STYLE} />
          </label>
          <div className={styles.offsetWrap}>
            <h3>No Impact</h3>
            <p>
              Select this option if your component or service has no
              environmental impact in this category. No data input will be
              required for this impact category.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderOffsettingSection = () => {
    if (!config.showOffsetting) return null;

    return (
      <div
        className={styles.offsettingCarbonImpactWrapper}
        style={isValueZero ? ZERO_VALUE_DISABLED_STYLE : undefined}
      >
        <div className={styles.offsetCarbonWrapper}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!isValueZero && safeFormData.offsetting}
              onChange={(e) => {
                if (isValueZero) return;
                handleChange('offsetting', e.target.checked);
              }}
              className={styles.checkboxInput}
            />
            <span className={styles.customCheckbox} style={CHECKBOX_STYLE} />
          </label>
          <div className={styles.offsetWrap}>
            <h3>Offsetting Carbon Impact</h3>
            <p>
              Select this option if you have offset the carbon emissions
              generated by this component or service
            </p>
          </div>
        </div>

        {safeFormData.offsetting && (
          <div className={styles.offsetValueWrapper}>
            <div className={styles.formGroup} style={OFFSET_GROUP_STYLE}>
              <label>
                Carbon Emissions Offset Value{' '}
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={safeFormData.offsetValue}
                  placeholder="Enter value..."
                  onChange={(e) => {
                    const sanitized = sanitizeNumericInput(e.target.value);
                    handleChange('offsetValue', sanitized);
                    if (touchedOffset) validateOffset(sanitized);
                  }}
                  onFocus={() => setTouchedOffset(true)}
                  onBlur={() => validateOffset(safeFormData.offsetValue)}
                />
                <span className={styles.inputSuffix}>kg CO₂-eq/unit</span>
              </div>

              {errors.offsetValue && (
                <p className={styles.error}>{errors.offsetValue}</p>
              )}
            </div>
          </div>
        )}
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
        <div className={styles.formGroup}>
          <div
            className={`${styles.dropdownWrapper} ${isDisabled ? styles.disabledLabel : ''}`}
          >
            <DropdownComponent
              title={config.showNoImpact ? ' Data Source' : 'Data Source'}
              options={dataSourceOptions}
              value={safeFormData.dataSource}
              onChange={(val: string) => handleChange('dataSource', val)}
              truncateLabel={false}
              arrowRenderer={renderDropdownArrow}
              className={`${styles.dropdown} ${styles.labelColor}`}
              placeholder="Select"
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={isDisabled ? styles.disabledLabel : undefined}>
              Value (will be fetched):
            </label>
            {renderValueStatus()}
          </div>

          <div
            className={`${styles.inputWrapper} ${isFetchedValueInactive ? styles.valueFetchedInactiveWrapper : ''}`}
          >
            <input
              type="text"
              value={
                isFetchedValueInactive
                  ? FETCHED_PLACEHOLDER
                  : formattedFetchedValue
              }
              readOnly
              disabled={isFetchedValueInactive}
              className={isFetchedValueInactive ? styles.valueFetchedInactive : ''}
              aria-label="Value will be populated from search results"
            />
            <span
              className={`${styles.inputSuffix} ${isDisabled ? styles.disabledLabel : ''}`}
            >
              {config.unitSuffix}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.databaseFormSection}>
        <h4
          className={`${styles.searchDatabaseTitle} ${isDisabled ? styles.disabledLabel : ''}`}
        >
          Search Database
        </h4>

        <div
          className={`${styles.searchFilterGridWrapper} ${isDisabled ? styles.disabledSection : ''}`}
        >
          <SearchDatabaseComponent
            supplierRoleSlug={supplierRoleSlug}
            isImpactCategoryForm
            onSearch={handleSearchWithValueReset}
            lastSearchedFormData={
              suppressSavedAuditPrefill
                ? lastSearchedFormData
                : (lastSearchedFormData ?? savedAuditFormDataRef.current)
            }
            hasResults={results.length > 0}
          />
        </div>

        <DatabaseResultsSection
          searchStatus={searchStatus}
          results={results}
          paginatedResults={paginatedResults}
          resultColumns={resultColumns}
          selectedRowId={selectedRowId}
          onSelectRow={handleSelectRow}
          radioName={config.radioName}
          onPageChange={handlePageChange}
          totalCount={totalCount}
          skip={skip}
          pageSize={SEARCH_RESULTS_PAGE_SIZE}
          disabled={safeFormData.noImpact}
          industryAvgStatus={
            !isDisabled ? (tableAvgStatus ?? undefined) : undefined
          }
        />
      </div>

      {renderNoImpactSection()}
      {renderOffsettingSection()}
    </div>
  );
};

export default ImpactDatabaseForm;
