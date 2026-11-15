import { useMemo, useEffect, useState, useCallback, type FC } from 'react';

import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/SelectDataSource/SelectDataSource.module.scss';
import { saveImpactCategory } from '@service/built-enviromental-profile.service';
import { useParams } from 'react-router-dom';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';
import Bugsnag from '@utils/bugsnag';
import {
  isValidImpactFieldValue,
  isValidDatabaseValue,
} from '@utils/validation';
import { useBuiltEnvironmentalProfileFlowSupplierStore } from '@store/useBuiltEnvironmentalProfileFlowSupplierStore';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import type { BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS } from '@constants/built-environmental-profile-flow';
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
import type { BenchmarkingData } from '@utils/industryAvgComparison';
import useAuthStore from '@store/useAuthStore';
import { USER_ROLES } from '@constants/auth';
import { useSpinnerStore } from '@store/useSpinnerStore';
type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS;
interface SelectDataSourceProps {
  onNext: () => void;
  onPrevious: () => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  setActiveImpactSubStep: (step: 'CARBON' | 'WATER' | 'LAND' | null) => void;
  handleBackFromSelect: () => void;
  roleDetailsId?: string;
  supplierRoleSlug?: string;
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
  requestedImpactCategories?: Record<'CARBON' | 'WATER' | 'LAND', boolean>;
  requestedSteps?: readonly ('CARBON' | 'WATER' | 'LAND')[];
  benchmarkingData?: BenchmarkingData;
}

const SelectDataSource: FC<SelectDataSourceProps> = ({
  onNext,
  onPrevious,
  roleDetailsId,
  activeIndex,
  setActiveIndex,
  handleBackFromSelect: _handleBackFromSelect,
  supplierRoleSlug,
  impactData,
  setImpactData,
  initialImpactData,
  setCompletedImpactSubSteps,
  setActiveImpactSubStep,
  completedFromApi,
  handleRedirectToComponentDetails,
  setCompletedFromApi,
  impactSourceRef,
  requestedImpactCategories: _requestedImpactCategories,
  requestedSteps: requestedStepsProp,
  benchmarkingData,
}) => {
  const carbonData = impactData.CARBON;
  const waterData = impactData.WATER;
  const landData = impactData.LAND;

  const params = useParams<{
    productId?: string;
    componentId?: string;
    roleSlug?: string;
    supplierRoleSlug?: string;
  }>();

  const componentId = params.componentId;
  const roleSlug =
    supplierRoleSlug ?? params.supplierRoleSlug ?? params.roleSlug;

  // Use supplier store as source of truth for requested steps (tabs) - ensures tabs match sidebar even if prop is stale
  const flowContextKey =
    componentId && roleSlug ? `${componentId}:${roleSlug}` : null;
  const requestedImpactCategoriesFromStore =
    useBuiltEnvironmentalProfileFlowSupplierStore((s) =>
      flowContextKey
        ? s.requestedImpactCategoriesByContext?.[flowContextKey]
        : undefined
    );
  const requestedSteps: readonly ('CARBON' | 'WATER' | 'LAND')[] =
    useMemo(() => {
      if (requestedImpactCategoriesFromStore) {
        return (['CARBON', 'WATER', 'LAND'] as const).filter(
          (c) => requestedImpactCategoriesFromStore[c] === true
        );
      }
      return requestedStepsProp ?? (['CARBON', 'WATER', 'LAND'] as const);
    }, [requestedImpactCategoriesFromStore, requestedStepsProp]);

  const currentCategory = requestedSteps[activeIndex - 1];

  const { showAlert } = useAlertStore();
  const userRole = useAuthStore((s) => s.getRoleSlug());

  // When "Use our Database" last search was no-results or error, keep Save buttons disabled
  const [searchStatusByImpact, setSearchStatusByImpact] = useState<
    Partial<
      Record<'CARBON' | 'WATER' | 'LAND', 'idle' | 'no-results' | 'error'>
    >
  >({});

  // Context for saved impact data
  const contextKey =
    componentId && roleSlug ? `${componentId}_${roleSlug}` : '';
  const setSavedImpactDataToStore =
    useBuiltEnvironmentalProfileFlowSupplierStore((s) => s.setSavedImpactData);
  const getSavedImpactDataFromStore =
    useBuiltEnvironmentalProfileFlowSupplierStore((s) => s.getSavedImpactData);
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
  const clearSearchDatabaseFormForCurrentRole = useCallback(() => {
    if (!roleSlug) return;
    resetImpactCategorySearchDatabaseFormData(roleSlug);
  }, [roleSlug, resetImpactCategorySearchDatabaseFormData]);

  // Initialize compare baseline from current API/store-backed form state.
  useEffect(() => {
    if (!contextKey || contextKey === 'undefined_undefined') return;

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
      const activeType = currentCategory;
      if (
        type === activeType &&
        apiData?.dataSource === 'database' &&
        apiData?.audit?.query &&
        roleSlug
      ) {
        const auditQuery = apiData.audit.query as Record<string, string>;
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
    currentCategory,
    carbonData,
    waterData,
    landData,
    getSavedImpactDataFromStore,
    setSavedImpactDataToStore,
    roleSlug,
    setImpactCategorySearchDatabaseFormData,
  ]);

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

  // Tabs: only show requested categories
  const SUB_STEPS = requestedSteps.map(
    (s) => s.charAt(0) + s.slice(1).toLowerCase()
  );
  const tabWidths = requestedSteps.map(() => 90);
  const TAB_GAP = 4;

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
    const category = requestedSteps[step - 1];
    setActiveImpactSubStep(category ?? null);
  };

  const toNumberOrNull = (value?: string, disabled?: boolean) => {
    if (disabled) return null;
    if (value === undefined || value === '') return null;
    return Number(value);
  };

  const isCarbonCompleted = (data: Partial<CarbonImpactData>) => {
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';
    if (isDatabase) {
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
    } else {
      if (!data.value) return false;
      if (!isValidImpactFieldValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (!data.confirmAccuracy) return false;
      if (data.offsetting) {
        if (!data.offsetValue) return false;
        if (!isValidImpactFieldValue(String(data.offsetValue))) return false;
      }
    }
    return true;
  };

  const isWaterCompleted = (data: Partial<WaterLandImpactData>) => {
    if (data.noImpact === true) return true;
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';
    if (isDatabase) {
      if (!data.value) return false;
      if (!isValidDatabaseValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (
        searchStatusByImpact.WATER === 'no-results' ||
        searchStatusByImpact.WATER === 'error'
      )
        return false;
    } else {
      if (!data.value) return false;
      if (!isValidImpactFieldValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (!data.confirmAccuracy) return false;
    }
    return true;
  };

  const isLandCompleted = (data: Partial<WaterLandImpactData>) => {
    if (data.noImpact === true) return true;
    if (!data.dataSource) return false;
    const isDatabase = data.dataSource === 'database';
    if (isDatabase) {
      if (!data.value) return false;
      if (!isValidDatabaseValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (
        searchStatusByImpact.LAND === 'no-results' ||
        searchStatusByImpact.LAND === 'error'
      )
        return false;
    } else {
      if (!data.value) return false;
      if (!isValidImpactFieldValue(String(data.value))) return false;
      if (!data.lciaMethod) return false;
      if (!data.confirmAccuracy) return false;
    }
    return true;
  };

  const mapCarbonPayload = (data: Partial<CarbonImpactData>) => {
    const quantity = toNumberOrNull(data.value);
    const hasData = Boolean(quantity !== null || data.offsetting);
    const hasOffset = Boolean(data.offsetting && data.offsetValue);
    const base = {
      dataSource: data.dataSource === 'manually' ? 'manual' : data.dataSource,
      quantity: quantity,
      unit: 'kg CO2-eq/unit',
      lciaMethodology: data.lciaMethod || null,
      offsetCarbonImpact: hasOffset,
      // Explicit null when no offset — clears previous database offset when switching to manual
      offsetQuantity: hasOffset ? Number(data.offsetValue) : null,
      offsetUnit: hasOffset ? 'kg CO2-eq/unit' : null,
      dataConsent: hasData,
    };
    // Include audit for database, or explicitly null for manual — ensures API replaces previous data source
    if (data.dataSource === 'database' && data.audit) {
      return { ...base, audit: data.audit };
    }
    return { ...base, audit: null };
  };

  const mapWaterPayload = (data: Partial<WaterLandImpactData>) => {
    if (!data) return null;

    if (data.noImpact) {
      return {
        dataConsent: true,
        isImpactPresent: false,
        dataSource: null,
        quantity: null,
        unit: null,
        lciaMethodology: null,
        audit: null,
      };
    }

    const quantity = toNumberOrNull(data.value);
    const hasData = Boolean(quantity !== null || data.dataSource);
    const base = {
      dataSource: data.dataSource === 'manually' ? 'manual' : data.dataSource,
      quantity: quantity,
      unit: quantity === null ? null : 'm3/unit',
      lciaMethodology: data.lciaMethod ? data.lciaMethod : null,
      dataConsent: hasData,
      isImpactPresent: true,
    };
    // Include audit for database, or explicitly null for manual — ensures API replaces previous data source
    if (data.dataSource === 'database' && data.audit) {
      return { ...base, audit: data.audit };
    }
    return { ...base, audit: null };
  };

  const mapLandPayload = (data: Partial<WaterLandImpactData>) => {
    if (!data) return null;

    if (data.noImpact) {
      return {
        dataConsent: true,
        isImpactPresent: false,
        dataSource: null,
        quantity: null,
        unit: null,
        lciaMethodology: null,
        audit: null,
      };
    }

    const quantity = toNumberOrNull(data.value);
    const hasData = Boolean(quantity !== null || data.dataSource);
    const base = {
      dataSource: data.dataSource === 'manually' ? 'manual' : data.dataSource,
      quantity: quantity,
      unit: quantity === null ? null : 'm2/unit',
      lciaMethodology: data.lciaMethod ? data.lciaMethod : null,
      dataConsent: hasData,
      isImpactPresent: true,
    };
    // Include audit for database, or explicitly null for manual — ensures API replaces previous data source
    if (data.dataSource === 'database' && data.audit) {
      return { ...base, audit: data.audit };
    }
    return { ...base, audit: null };
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

      if (impact?.noImpact) {
        // Treat no-impact as a stable state regardless of confirmation flag/value remnants.
        return {
          dataSource: '',
          value: '',
          lciaMethod: '',
          confirmAccuracy: false,
          audit: null,
          noImpact: true,
        };
      }

      return {
        ...base,
        noImpact: Boolean(impact?.noImpact),
      };
    },
    []
  );

  const hasCurrentCategoryChanges = useCallback(() => {
    if (!currentCategory) return false;

    const currentData =
      currentCategory === 'CARBON'
        ? carbonData
        : currentCategory === 'WATER'
          ? waterData
          : landData;

    const savedData =
      getSavedData(currentCategory) ?? initialImpactData?.[currentCategory];

    if (!savedData) return true;

    const normalizedCurrent = normalizeImpactForCompare(
      currentData,
      currentCategory
    );
    const normalizedSaved = normalizeImpactForCompare(
      savedData,
      currentCategory
    );

    return (
      JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedSaved)
    );
  }, [
    currentCategory,
    carbonData,
    waterData,
    landData,
    getSavedData,
    initialImpactData,
    normalizeImpactForCompare,
  ]);

  const completeCurrentStepAndNavigate = useCallback(
    (isSaveAndExit: boolean) => {
      if (!currentCategory) return;

      setCompletedImpactSubSteps((prev) => ({
        ...prev,
        ...(currentCategory === 'CARBON' && {
          CARBON: isCarbonCompleted(carbonData),
        }),
        ...(currentCategory === 'WATER' && {
          WATER: waterData.noImpact ? true : isWaterCompleted(waterData),
        }),
        ...(currentCategory === 'LAND' && {
          LAND: landData.noImpact ? true : isLandCompleted(landData),
        }),
      }));

      const nextCompletedFromApi = {
        ...completedFromApi,
        ...(currentCategory === 'CARBON' && { CARBON: true }),
        ...(currentCategory === 'WATER' && { WATER: true }),
        ...(currentCategory === 'LAND' && { LAND: true }),
      };

      setCompletedFromApi(nextCompletedFromApi);

      const areAllStepsSaved = requestedSteps.every(
        (step) => nextCompletedFromApi?.[step] === true
      );
      if (areAllStepsSaved) {
        onNext();
        return;
      }

      if (isSaveAndExit) return;

      const firstIncomplete = requestedSteps.findIndex(
        (step) => !nextCompletedFromApi?.[step]
      );

      if (firstIncomplete >= 0) {
        const nextIndex = firstIncomplete + 1;
        setActiveIndex(nextIndex);
        setActiveImpactSubStep(requestedSteps[firstIncomplete] ?? null);
        return;
      }

      onNext();
    },
    [
      currentCategory,
      carbonData,
      waterData,
      landData,
      completedFromApi,
      requestedSteps,
      setCompletedImpactSubSteps,
      setCompletedFromApi,
      onNext,
      setActiveIndex,
      setActiveImpactSubStep,
    ]
  );

  const handleSaveAndContinue = async (isSaveAndExit: boolean) => {
    const impactCategoryId = roleDetailsId;
    if (!impactCategoryId || !componentId || !roleSlug) return;
    if (!hasCurrentCategoryChanges()) {
      completeCurrentStepAndNavigate(isSaveAndExit);
      return;
    }

    const payload = {
      supplierLinkedRole: roleSlug,
      carbon:
        currentCategory === 'CARBON' ? mapCarbonPayload(carbonData) : null,
      water: currentCategory === 'WATER' ? mapWaterPayload(waterData) : null,
      land: currentCategory === 'LAND' ? mapLandPayload(landData) : null,
      isSaveAndExit: isSaveAndExit,
    };

    showSpinner();
    try {
      const response = await saveImpactCategory(
        impactCategoryId,
        componentId,
        payload,
        {
          productRequested: userRole === USER_ROLES.COMPANY,
        }
      );

      const ok = response?.statusCode === 201 || response?.statusCode === 200;
      if (ok) {
        // Save impact data to Zustand store for restoration when switching data sources (manual ↔ database)
        if (currentCategory === 'CARBON') {
          const savedCarbonData = { ...carbonData };
          if (carbonData?.dataSource === 'manual') {
            delete savedCarbonData.audit;
            // Clear offset when saving manual — does not persist from previous database save
            savedCarbonData.offsetting = false;
            savedCarbonData.offsetValue = '';
            clearSearchDatabaseFormForCurrentRole();
            setImpactData((prev: any) => ({
              ...prev,
              CARBON: {
                ...prev.CARBON,
                audit: undefined,
                offsetting: false,
                offsetValue: '',
              },
            }));
          }
          setSavedImpactDataToStore(contextKey, 'CARBON', savedCarbonData);
        } else if (currentCategory === 'WATER') {
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
        } else if (currentCategory === 'LAND') {
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

        if (currentCategory === 'WATER' && waterData.noImpact) {
          setImpactData((prev: any) => ({
            ...prev,
            WATER: {
              ...prev.WATER,
              value: '',
              dataSource: '',
              lciaMethod: '',
              noImpact: true,
              confirmAccuracy: true,
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
        if (currentCategory === 'LAND' && landData.noImpact) {
          setImpactData((prev: any) => ({
            ...prev,
            LAND: {
              ...prev.LAND,
              value: '',
              dataSource: '',
              lciaMethod: '',
              noImpact: true,
              confirmAccuracy: true,
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
    if (!currentCategory) return false;
    switch (currentCategory) {
      case 'CARBON':
        return isCarbonCompleted(carbonData);
      case 'WATER':
        return isWaterCompleted(waterData);
      case 'LAND':
        return isLandCompleted(landData);
      default:
        return false;
    }
  }, [currentCategory, carbonData, waterData, landData]);

  return (
    <div className={styles.wrapper}>
      {/* Tabs - only requested categories */}
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
            const category = requestedSteps[step - 1];
            const isCompleted = category
              ? completedFromApi?.[category] === true
              : false;
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

      {/* Render Selected Form (Manual or Database based on dataSource) */}
      <div className={styles.databaseForm}>
        {currentCategory === 'CARBON' &&
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

        {currentCategory === 'WATER' &&
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
        {currentCategory === 'LAND' &&
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
        <button className={styles.secondaryButton} onClick={onPrevious}>
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
