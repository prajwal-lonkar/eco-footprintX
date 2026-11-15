import { useMemo, useEffect, useState, useCallback, type FC } from 'react';

import styles from './SelectDataSource.module.scss';
import { saveImpactCategory } from '@service/built-enviromental-profile.service';
import { useParams } from 'react-router-dom';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';
import Bugsnag from '@utils/bugsnag';
import {
  isValidImpactFieldValue,
  isValidDatabaseValue,
} from '@utils/validation';
import type { BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS } from '@constants/built-environmental-profile-flow';
import {
  CarbonManual,
  WaterManual,
  LandManual,
  CarbonDatabase,
  WaterDatabase,
  LandDatabase,
} from '@components/AddImpactCategoryForms';
import type {
  CarbonImpactData,
  ImpactDataMap,
  ImpactOption,
  WaterLandImpactData,
} from '@type/built-enviromental-profile';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import type { BenchmarkingData } from '@utils/industryAvgComparison';
type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS;
interface SelectDataSourceProps {
  onNext: () => void;
  onPrevious: () => void;
  roleDetailsId?: string;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  setActiveImpactSubStep: (step: 'CARBON' | 'WATER' | 'LAND' | null) => void;
  handleBackFromSelect: () => void;
  initialCompleted?: Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>;
  impactData: any;
  setImpactData: React.Dispatch<React.SetStateAction<any>>;
  initialImpactData: ImpactDataMap | null;
  setCompletedImpactSubSteps: React.Dispatch<
    React.SetStateAction<Partial<Record<ImpactSubSteps, boolean>>>
  >;
  completedFromApi?: Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>;
  handleRedirectToComponentDetails?: () => void;
  setCompletedFromApi: React.Dispatch<
    React.SetStateAction<Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>>
  >;
  impactSourceRef: React.MutableRefObject<
    Record<'CARBON' | 'WATER' | 'LAND', ImpactOption | null>
  >;
  benchmarkingData?: BenchmarkingData;
  componentData?: {
    supplierContactEmail?: string;
    supplierContactName?: string;
    supplierName?: string;
  };
}

const SelectDataSource: FC<SelectDataSourceProps> = ({
  onNext,
  roleDetailsId,
  activeIndex,
  setActiveIndex,
  handleBackFromSelect,
  impactData,
  setImpactData,
  initialImpactData,
  setCompletedImpactSubSteps,
  setActiveImpactSubStep,
  completedFromApi,
  handleRedirectToComponentDetails,
  setCompletedFromApi,
  impactSourceRef,
  benchmarkingData,

  componentData,
}) => {
  const carbonData = impactData.CARBON;
  const waterData = impactData.WATER;
  const landData = impactData.LAND;

  const { showAlert } = useAlertStore();

  // When "Use our Database" last search was no-results or error, keep Save buttons disabled
  const [searchStatusByImpact, setSearchStatusByImpact] = useState<
    Partial<
      Record<'CARBON' | 'WATER' | 'LAND', 'idle' | 'no-results' | 'error'>
    >
  >({});
  const [databaseSearchResetToken, setDatabaseSearchResetToken] = useState(0);
  const [suppressSavedAuditPrefill, setSuppressSavedAuditPrefill] =
    useState(false);

  // For Carbon
  const setCarbonDataFromForm = (data: Partial<CarbonImpactData>) => {
    impactSourceRef.current.CARBON ??= 'database';

    setImpactData((prev: any) => ({
      ...prev,
      CARBON: {
        ...prev.CARBON,
        ...data,
      },
    }));
  };

  // For Water
  const setWaterDataFromForm = (data: Partial<WaterLandImpactData>) => {
    impactSourceRef.current.WATER ??= 'database';

    setImpactData((prev: any) => ({
      ...prev,
      WATER: {
        ...prev.WATER,
        ...data,
      },
    }));
  };

  // For Land
  const setLandDataFromForm = (data: Partial<WaterLandImpactData>) => {
    impactSourceRef.current.LAND ??= 'database';

    setImpactData((prev: any) => ({
      ...prev,
      LAND: {
        ...prev.LAND,
        ...data,
      },
    }));
  };

  //slider

  const tabWidths = [90, 90, 90];
  const TAB_GAP = 4;
  const SUB_STEPS = ['Carbon', 'Water', 'Land'];

  // Calculate slider position
  const sliderIndex =
    activeIndex <= 1
      ? 0
      : activeIndex >= tabWidths.length
        ? tabWidths.length - 1
        : activeIndex - 1;

  const leftPosition =
    sliderIndex === 0
      ? 0
      : tabWidths.slice(0, sliderIndex).reduce((acc, w) => acc + w, 0) +
        TAB_GAP * sliderIndex;

  const onTabClick = (step: number) => {
    setActiveIndex(step);
    switch (step) {
      case 1:
        setActiveImpactSubStep('CARBON');
        break;
      case 2:
        setActiveImpactSubStep('WATER');
        break;
      case 3:
        setActiveImpactSubStep('LAND');
        break;
      default:
        setActiveImpactSubStep(null);
    }
  };

  const { productId, componentId, roleSlug } = useParams<{
    productId: string;
    componentId: string;
    roleSlug: string;
  }>();

  // for saved impact data - persists across component mounts/unmounts
  const contextKey = `${componentId}_${roleSlug}`;
  const setSavedImpactDataToStore = useBuiltEnvironmentalProfileFlowStore(
    (s) => s.setSavedImpactData
  );
  const getSavedImpactDataFromStore = useBuiltEnvironmentalProfileFlowStore(
    (s) => s.getSavedImpactData
  );

  // Callback to get saved data - reads from Zustand store
  const getSavedData = useCallback(
    (type: 'CARBON' | 'WATER' | 'LAND') => {
      return getSavedImpactDataFromStore(contextKey, type);
    },
    [contextKey, getSavedImpactDataFromStore]
  );
  const resetImpactCategorySearchDatabaseFormData =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.resetImpactCategorySearchDatabaseFormData
    );
  const setImpactCategorySearchDatabaseFormData =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.setImpactCategorySearchDatabaseFormData
    );
  const consumeImpactCategorySearchResetByBenchmarking =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.consumeImpactCategorySearchResetByBenchmarking
    );

  const clearDatabaseImpactSelection = useCallback(() => {
    const impactTypes: Array<'CARBON' | 'WATER' | 'LAND'> = [
      'CARBON',
      'WATER',
      'LAND',
    ];
    const currentImpactData = {
      CARBON: carbonData,
      WATER: waterData,
      LAND: landData,
    };
    const clearedImpactData = { ...currentImpactData };

    impactTypes.forEach((type) => {
      const impact = currentImpactData[type];
      if (impact?.dataSource !== 'database') return;

      const nextImpact = {
        ...impact,
        value: '',
        audit: undefined,
      };

      clearedImpactData[type] = nextImpact;

      if (contextKey && contextKey !== 'undefined_undefined') {
        setSavedImpactDataToStore(contextKey, type, nextImpact);
      }
    });

    setImpactData((prev: ImpactDataMap) => ({
      ...prev,
      ...clearedImpactData,
    }));
  }, [
    carbonData,
    contextKey,
    landData,
    setImpactData,
    setSavedImpactDataToStore,
    waterData,
  ]);

  useEffect(() => {
    if (!componentId || !roleSlug) {
      setSuppressSavedAuditPrefill(false);
      return;
    }

    const resetContextKey = `${componentId}:${roleSlug}`;
    const shouldReset =
      consumeImpactCategorySearchResetByBenchmarking(resetContextKey);

    if (shouldReset) {
      setSearchStatusByImpact({});
      setSuppressSavedAuditPrefill(true);
      setDatabaseSearchResetToken((prev) => prev + 1);

      clearDatabaseImpactSelection();
      return;
    }

    setSuppressSavedAuditPrefill(false);
  }, [
    clearDatabaseImpactSelection,
    componentId,
    roleSlug,
    consumeImpactCategorySearchResetByBenchmarking,
  ]);

  useEffect(() => {
    if (!contextKey || contextKey === 'undefined_undefined') return;
    if (suppressSavedAuditPrefill) return;

    // Only initialize if there's no saved data in store yet
    const impactTypes: Array<'CARBON' | 'WATER' | 'LAND'> = [
      'CARBON',
      'WATER',
      'LAND',
    ];
    const impactDataMap = {
      CARBON: carbonData,
      WATER: waterData,
      LAND: landData,
    };

    impactTypes.forEach((type) => {
      const existingStoreData = getSavedImpactDataFromStore(contextKey, type);
      const apiData = impactDataMap[type];

      // Initialize compare baseline from API/store state for every category,
      // even when value is empty (e.g., requested/no-impact paths).
      if (!existingStoreData && apiData) {
        setSavedImpactDataToStore(contextKey, type, { ...apiData });
      }

      // This ensures the SearchDatabaseComponent has data in the store before it mounts
      // Only populate for the currently active tab to avoid cross-contamination between Carbon/Water/Land
      const activeType =
        activeIndex === 1 ? 'CARBON' : activeIndex === 2 ? 'WATER' : 'LAND';
      if (
        type === activeType &&
        apiData?.dataSource === 'database' &&
        apiData?.audit?.query &&
        roleSlug
      ) {
        const auditQuery = apiData.audit.query;
        setImpactCategorySearchDatabaseFormData(roleSlug, {
          componentName: auditQuery.componentOrServiceName || '',
          casNumber: auditQuery.casNumber || '',
          supplierLocation: auditQuery.supplierLocation || '',
          lciaMethodology: auditQuery.lciaMethodology || '',
          industry: auditQuery.industry || '',
          transportMethod: auditQuery.transportMethod || '',
          transportRegion:
            auditQuery.transportRegion || auditQuery.supplierLocation || '',
        });
      }
    });
  }, [
    contextKey,
    activeIndex,
    roleSlug,
    setImpactCategorySearchDatabaseFormData,
    suppressSavedAuditPrefill,
  ]);

  const clearSearchDatabaseFormForCurrentRole = useCallback(() => {
    if (!roleSlug) return;
    resetImpactCategorySearchDatabaseFormData(roleSlug);
  }, [roleSlug, resetImpactCategorySearchDatabaseFormData]);

  useEffect(() => {
    if (activeIndex === 0 || activeIndex < 1 || activeIndex > 3) {
      // Default to Carbon (1) if no valid index
      setActiveIndex(1);
      setActiveImpactSubStep('CARBON');
    }
  }, [activeIndex, setActiveIndex, setActiveImpactSubStep]);

  const toNumberOrNull = (value?: string, disabled?: boolean) => {
    if (disabled) return null;
    if (value === undefined || value === '') return null;
    return Number(value);
  };

  // Centralised validation helpers (imported from @utils/validation):

  const isCarbonCompleted = (data: Partial<CarbonImpactData>) => {
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';

    if (isDatabase) {
      // Use our Database
      if (!data.value) return false;
      if (!isValidDatabaseValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (data.offsetting) {
        if (!data.offsetValue) return false;
        if (!isValidImpactFieldValue(String(data.offsetValue))) return false;
      }

      if (
        searchStatusByImpact.CARBON === 'no-results' ||
        searchStatusByImpact.CARBON === 'error'
      )
        return false;
      return true;
    }

    // Manual entry
    if (!data.value) return false;
    if (!isValidImpactFieldValue(String(data.value))) return false;
    if (!data.lciaMethod) return false;
    if (!data.confirmAccuracy) return false;
    if (data.offsetting) {
      if (!data.offsetValue) return false;
      if (!isValidImpactFieldValue(String(data.offsetValue))) return false;
    }
    return true;
  };

  const isWaterCompleted = (data: Partial<WaterLandImpactData>) => {
    if (data.noImpact === true) return true;
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';

    if (isDatabase) {
      // Use our Database: require value (from row selection), lciaMethod only
      if (!data.value) return false;
      if (!isValidDatabaseValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (
        searchStatusByImpact.WATER === 'no-results' ||
        searchStatusByImpact.WATER === 'error'
      )
        return false;
      return true;
    }

    // Manual entry: require value, lciaMethod, confirmAccuracy
    if (!data.value) return false;
    if (!isValidImpactFieldValue(String(data.value))) return false;
    if (!data.lciaMethod) return false;
    if (!data.confirmAccuracy) return false;
    return true;
  };

  const isLandCompleted = (data: Partial<WaterLandImpactData>) => {
    if (data.noImpact === true) return true;
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';

    if (isDatabase) {
      // Use our Database
      if (!data.value) return false;
      if (!isValidDatabaseValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (
        searchStatusByImpact.LAND === 'no-results' ||
        searchStatusByImpact.LAND === 'error'
      )
        return false;
      return true;
    }

    // Manual entry
    if (!data.value) return false;
    if (!isValidImpactFieldValue(String(data.value))) return false;
    if (!data.lciaMethod) return false;
    if (!data.confirmAccuracy) return false;
    return true;
  };

  const mapCarbonPayload = (data: Partial<CarbonImpactData>) => {
    const quantity = toNumberOrNull(data.value);

    const basePayload = {
      dataSource: data.dataSource, // 'manual' or 'database'
      quantity: quantity,
      unit: 'kg CO2-eq/unit',
      lciaMethodology: data.lciaMethod || null,
      offsetCarbonImpact: data.offsetting,
      offsetQuantity: data.offsetting ? Number(data.offsetValue) : undefined,
      offsetUnit: data.offsetting ? 'kg CO2-eq/unit' : undefined,
    };

    // Include audit data for database option, or set to null for manual
    if (data.dataSource === 'database' && data.audit) {
      return {
        ...basePayload,
        audit: data.audit,
      };
    }

    return {
      ...basePayload,
      audit: null,
    };
  };

  const mapWaterPayload = (data: Partial<WaterLandImpactData>) => {
    if (!data) return null;

    if (data.noImpact) {
      return {
        isImpactPresent: false,
        dataSource: null,
        quantity: null,
        unit: null,
        lciaMethodology: null,
        audit: null,
      };
    }

    const quantity = toNumberOrNull(data.value);

    const basePayload = {
      dataSource: data.dataSource, // 'manual' or 'database'
      quantity,
      unit: quantity === null ? null : 'm3/unit',
      lciaMethodology: data.lciaMethod ? data.lciaMethod : null,
      isImpactPresent: true,
    };

    // Include audit data for database option, or set to null for manual
    if (data.dataSource === 'database' && data.audit) {
      return {
        ...basePayload,
        audit: data.audit,
      };
    }

    return {
      ...basePayload,
      audit: null,
    };
  };

  const mapLandPayload = (data: Partial<WaterLandImpactData>) => {
    if (!data) return null;

    if (data.noImpact) {
      return {
        isImpactPresent: false,
        dataSource: null,
        quantity: null,
        unit: null,
        lciaMethodology: null,
        audit: null,
      };
    }

    const quantity = toNumberOrNull(data.value);

    const basePayload = {
      dataSource: data.dataSource, // 'manual' or 'database'
      quantity,
      unit: quantity === null ? null : 'm2/unit',
      lciaMethodology: data.lciaMethod ? data.lciaMethod : null,
      isImpactPresent: true,
    };

    // Include audit data for database option, or set to null for manual
    if (data.dataSource === 'database' && data.audit) {
      return {
        ...basePayload,
        audit: data.audit,
      };
    }

    return {
      ...basePayload,
      audit: null,
    };
  };

  const { showSpinner, hideSpinner } = useSpinnerStore();
  const normalizeImpactForCompare = useCallback(
    (impact: any, type: 'CARBON' | 'WATER' | 'LAND') => {
      const base = {
        dataSource: impact?.dataSource ?? '',
        value: String(impact?.value ?? ''),
        lciaMethod: impact?.lciaMethod ?? '',
        confirmAccuracy: Boolean(impact?.confirmAccuracy),
        audit:
          impact?.dataSource === 'database' ? (impact?.audit ?? null) : null,
      };

      if (type === 'CARBON') {
        return {
          ...base,
          offsetting: Boolean(impact?.offsetting),
          offsetValue: String(impact?.offsetValue ?? ''),
        };
      }

      return {
        ...base,
        noImpact: Boolean(impact?.noImpact),
      };
    },
    []
  );

  const hasActiveImpactChanges = useCallback(() => {
    const activeType =
      activeIndex === 1 ? 'CARBON' : activeIndex === 2 ? 'WATER' : 'LAND';
    const currentData =
      activeType === 'CARBON'
        ? carbonData
        : activeType === 'WATER'
          ? waterData
          : landData;
    const savedData =
      getSavedData(activeType) ?? initialImpactData?.[activeType];

    if (!savedData) return true;

    const normalizedCurrent = normalizeImpactForCompare(
      currentData,
      activeType
    );
    const normalizedSaved = normalizeImpactForCompare(savedData, activeType);

    return (
      JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedSaved)
    );
  }, [
    activeIndex,
    carbonData,
    waterData,
    landData,
    getSavedData,
    initialImpactData,
    normalizeImpactForCompare,
  ]);

  const completeCurrentStepAndNavigate = useCallback(
    (isSaveAndExit: boolean) => {
      setCompletedImpactSubSteps((prev) => ({
        ...prev,
        ...(activeIndex === 1 && { CARBON: isCarbonCompleted(carbonData) }),
        ...(activeIndex === 2 && { WATER: isWaterCompleted(waterData) }),
        ...(activeIndex === 3 && { LAND: isLandCompleted(landData) }),
      }));

      const nextCompletedFromApi = {
        ...completedFromApi,
        ...(activeIndex === 1 && { CARBON: true }),
        ...(activeIndex === 2 && { WATER: true }),
        ...(activeIndex === 3 && { LAND: true }),
      };

      setCompletedFromApi(nextCompletedFromApi);
      const areAllStepsSaved =
        nextCompletedFromApi?.CARBON &&
        nextCompletedFromApi?.WATER &&
        nextCompletedFromApi?.LAND;

      if (areAllStepsSaved) {
        onNext();
        return;
      }

      if (isSaveAndExit) return;

      const firstIncomplete = !nextCompletedFromApi?.CARBON
        ? 1
        : !nextCompletedFromApi?.WATER
          ? 2
          : !nextCompletedFromApi?.LAND
            ? 3
            : null;

      if (firstIncomplete !== null) {
        setActiveIndex(firstIncomplete);
        setActiveImpactSubStep(
          firstIncomplete === 1
            ? 'CARBON'
            : firstIncomplete === 2
              ? 'WATER'
              : 'LAND'
        );
        return;
      }

      onNext();
    },
    [
      activeIndex,
      carbonData,
      waterData,
      landData,
      completedFromApi,
      setCompletedImpactSubSteps,
      setCompletedFromApi,
      setActiveIndex,
      setActiveImpactSubStep,
      onNext,
    ]
  );

  const handleSaveAndContinue = async (isSaveAndExit: boolean) => {
    const impactCategoryId = roleDetailsId ?? productId;
    if (!impactCategoryId || !componentId) return;

    if (!hasActiveImpactChanges()) {
      completeCurrentStepAndNavigate(isSaveAndExit);
      return;
    }

    const payload = {
      supplierLinkedRole: String(roleSlug),
      supplierContactName: componentData?.supplierContactName || '',
      supplierContactEmail: componentData?.supplierContactEmail || '',
      carbon: activeIndex === 1 ? mapCarbonPayload(carbonData) : null,
      water: activeIndex === 2 ? mapWaterPayload(waterData) : null,
      land: activeIndex === 3 ? mapLandPayload(landData) : null,

      isSaveAndExit,
    };
    showSpinner();
    try {
      const response = await saveImpactCategory(
        impactCategoryId,
        componentId,
        payload
      );

      if (response.statusCode === 201) {
        // Save impact data to Zustand store for restoration when switching data sources
        if (activeIndex === 1) {
          const savedCarbonData = { ...carbonData };
          // If saved as manual, clear audit data from local state
          if (carbonData?.dataSource === 'manual') {
            delete savedCarbonData.audit;
            clearSearchDatabaseFormForCurrentRole();
            // Also clear audit from impactData so switching to database won't show stale data
            setImpactData((prev: any) => ({
              ...prev,
              CARBON: { ...prev.CARBON, audit: undefined },
            }));
          }
          setSavedImpactDataToStore(contextKey, 'CARBON', savedCarbonData);
        } else if (activeIndex === 2) {
          const savedWaterData = { ...waterData };
          if (waterData?.dataSource === 'manual') {
            delete savedWaterData.audit;
            clearSearchDatabaseFormForCurrentRole();
            setImpactData((prev: any) => ({
              ...prev,
              WATER: { ...prev.WATER, audit: undefined },
            }));
          }
          setSavedImpactDataToStore(contextKey, 'WATER', savedWaterData);
        } else if (activeIndex === 3) {
          const savedLandData = { ...landData };
          if (landData?.dataSource === 'manual') {
            delete savedLandData.audit;
            clearSearchDatabaseFormForCurrentRole();
            setImpactData((prev: any) => ({
              ...prev,
              LAND: { ...prev.LAND, audit: undefined },
            }));
          }
          setSavedImpactDataToStore(contextKey, 'LAND', savedLandData);
        }

        // Update local state to reflect "No Impact" if selected
        // This ensures UI updates immediately without needing to refresh
        if (activeIndex === 2 && waterData?.noImpact) {
          setImpactData((prev: any) => ({
            ...prev,
            WATER: {
              ...prev.WATER,
              value: '',
              lciaMethod: '',
              dataSource: '',
              confirmAccuracy: false,
              noImpact: true,
              audit: undefined,
            },
          }));
          setSavedImpactDataToStore(contextKey, 'WATER', {
            noImpact: true,
            value: '',
            dataSource: '',
            lciaMethod: '',
            confirmAccuracy: false,
          });
          clearSearchDatabaseFormForCurrentRole();
        }
        if (activeIndex === 3 && landData?.noImpact) {
          setImpactData((prev: any) => ({
            ...prev,
            LAND: {
              ...prev.LAND,
              value: '',
              lciaMethod: '',
              dataSource: '',
              confirmAccuracy: false,
              noImpact: true,
              audit: undefined,
            },
          }));
          setSavedImpactDataToStore(contextKey, 'LAND', {
            noImpact: true,
            value: '',
            dataSource: '',
            lciaMethod: '',
            confirmAccuracy: false,
          });
          clearSearchDatabaseFormForCurrentRole();
        }

        completeCurrentStepAndNavigate(isSaveAndExit);
      }
    } catch (error: any) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'SelectDataSource',
          method: 'handleSaveAndContinue',
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
    } finally {
      hideSpinner();
    }
  };

  const isStepValid = useMemo(() => {
    switch (activeIndex) {
      case 1:
        return isCarbonCompleted(carbonData);
      case 2:
        return isWaterCompleted(waterData);
      case 3:
        return isLandCompleted(landData);
      default:
        return false;
    }
  }, [activeIndex, carbonData, waterData, landData, searchStatusByImpact]);

  return (
    <div className={styles.wrapper}>
      {/* Tabs */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <div
            className={styles.slider}
            style={{
              width: tabWidths[sliderIndex],
              transform: `translateX(${leftPosition}px)`,
            }}
          />
          {SUB_STEPS.map((tab, index) => {
            const step = index + 1;
            const isCompleted =
              (step === 1 && completedFromApi?.CARBON === true) ||
              (step === 2 && completedFromApi?.WATER === true) ||
              (step === 3 && completedFromApi?.LAND === true);
            const isActive = activeIndex === step;
            const dotClass = isActive
              ? styles.activeDot
              : isCompleted
                ? styles.greenDot
                : styles.yellowDot;
            return (
              <button
                key={tab}
                className={`${styles.tab}`}
                style={{ width: `${tabWidths[step - 1]}px` }}
                onClick={() => onTabClick(step)}
              >
                <div className={dotClass} />
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Database Form */}
      <div className={styles.databaseForm}>
        {activeIndex === 1 &&
          (carbonData?.dataSource === 'database' ? (
            <CarbonDatabase
              formData={carbonData}
              setFormData={setCarbonDataFromForm}
              supplierRoleSlug={roleSlug ?? ''}
              roleDetailsId={roleDetailsId}
              onSearchStatusChange={(status) =>
                setSearchStatusByImpact((prev) => ({ ...prev, CARBON: status }))
              }
              getSavedData={() => getSavedData('CARBON')}
              benchmarkValue={benchmarkingData?.carbonBenchmarkingData}
              searchResetToken={databaseSearchResetToken}
              suppressSavedAuditPrefill={suppressSavedAuditPrefill}
            />
          ) : (
            <CarbonManual
              formData={carbonData}
              setFormData={setCarbonDataFromForm}
              onClearSearchDatabaseForm={clearSearchDatabaseFormForCurrentRole}
              getSavedData={() => getSavedData('CARBON')}
              benchmarkValue={benchmarkingData?.carbonBenchmarkingData}
            />
          ))}
        {activeIndex === 2 &&
          (waterData?.dataSource === 'database' ? (
            <WaterDatabase
              formData={waterData}
              setFormData={setWaterDataFromForm}
              supplierRoleSlug={roleSlug ?? ''}
              roleDetailsId={roleDetailsId}
              onSearchStatusChange={(status) =>
                setSearchStatusByImpact((prev) => ({ ...prev, WATER: status }))
              }
              getSavedData={() => getSavedData('WATER')}
              benchmarkValue={benchmarkingData?.waterBenchmarkingData}
              searchResetToken={databaseSearchResetToken}
              suppressSavedAuditPrefill={suppressSavedAuditPrefill}
            />
          ) : (
            <WaterManual
              formData={waterData}
              setFormData={setWaterDataFromForm}
              onClearSearchDatabaseForm={clearSearchDatabaseFormForCurrentRole}
              getSavedData={() => getSavedData('WATER')}
              benchmarkValue={benchmarkingData?.waterBenchmarkingData}
            />
          ))}
        {activeIndex === 3 &&
          (landData?.dataSource === 'database' ? (
            <LandDatabase
              formData={landData}
              setFormData={setLandDataFromForm}
              supplierRoleSlug={roleSlug ?? ''}
              roleDetailsId={roleDetailsId}
              onSearchStatusChange={(status) =>
                setSearchStatusByImpact((prev) => ({ ...prev, LAND: status }))
              }
              getSavedData={() => getSavedData('LAND')}
              benchmarkValue={benchmarkingData?.landBenchmarkingData}
              searchResetToken={databaseSearchResetToken}
              suppressSavedAuditPrefill={suppressSavedAuditPrefill}
            />
          ) : (
            <LandManual
              formData={landData}
              setFormData={setLandDataFromForm}
              onClearSearchDatabaseForm={clearSearchDatabaseFormForCurrentRole}
              getSavedData={() => getSavedData('LAND')}
              benchmarkValue={benchmarkingData?.landBenchmarkingData}
            />
          ))}
      </div>

      {/* Footer Actions */}
      <div className={styles.footerActions}>
        <button
          className={styles.secondaryButton}
          onClick={handleBackFromSelect}
        >
          Go Back
        </button>
        <button
          className={styles.tertiaryButton}
          disabled={!isStepValid}
          onClick={async () => {
            await handleSaveAndContinue(true);
            handleRedirectToComponentDetails?.();
          }}
        >
          Save and Exit
        </button>
        <button
          className={styles.primaryButton}
          disabled={!isStepValid}
          onClick={() => handleSaveAndContinue(false)}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
};

export default SelectDataSource;
