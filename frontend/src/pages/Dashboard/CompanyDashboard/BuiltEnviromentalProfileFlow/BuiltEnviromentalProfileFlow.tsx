import { useEffect, useCallback, useMemo, memo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Introduction from './steps/Introduction/Introduction';
import CompleteSupplierDetails from './steps/CompleteSupplierDetails/CompleteSupplierDetails';
import AddIndustryBenchmarking from './steps/AddIndustryBenchmarking/AddIndustryBenchmarking';
import AddImpactCategory from './steps/AddImpactCategory/AddImpactCategory';
import Summary from './steps/Summary/Summary';
import styles from './BuiltEnviromentalProfileFlow.module.scss';
import arrowLeftIcon from '@assets/icons/arrow-left.svg';
import recordIcon from '@assets/icons/record.svg';
import recordGreyIcon from '@assets/icons/record-grey.svg';
import circleCheck from '@assets/icons/circle-check.svg';
import {
  BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS,
  BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS,
} from '@constants/built-environmental-profile-flow';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import { ERROR_MESSAGES } from '@constants/messages';
import { getComponent } from '@service/product-components.service';
import { useShallow } from 'zustand/react/shallow';
import type { SupplierRole } from '@type/supplier';
import { ROUTES } from '@constants/routes';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import ComponentOrServiceDetailsCard from './ComponentOrServiceDetailsCard/ComponentOrServiceDetailsCard';
import type {
  Impact,
  ImpactOption,
  ManualImpactDataMap,
  RequestImpactDataMap,
} from '@type/built-enviromental-profile';
import type { AxiosError } from 'axios';
import {
  getImpactCategorySummary,
  getIndustryBenchmarkingDetails,
} from '@service/built-enviromental-profile.service';
import { getRoleDetailsId } from '@utils/getRoleDetailsId';
import type { BenchmarkingData } from '@utils/industryAvgComparison';
import { USER_ROLES } from '@constants/auth';


// Step configuration - moved outside component to prevent recreation on every render

type ImpactSubSteps = typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS;

interface StepConfig {
  step: number;
  label: string;
  description?: string;
  subSteps?: ImpactSubSteps;
}
const STEP_CONFIG: StepConfig[] = [
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION,
    label: 'Introduction',
    description: undefined,
  },
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.COMPLETE_SUPPLIER_DETAILS,
    label: 'Complete Supplier Details',
    description: 'Add supplier and component or service details',
  },
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_INDUSTRY_BENCHMARKING,
    label: 'Add Industry Benchmarking Data',
    description: 'Choose similar components or services for comparison',
  },
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_IMPACT_CATEGORY,
    label: 'Add Impact Category Data',
    description: 'Enter environmental impact data for this component',

    subSteps: BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS,
  },
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.SUMMARY,
    label: 'Summary',
    description: undefined,
  },
] as const;

// Memoized step item component to prevent unnecessary re-renders
interface StepItemProps {
  step: number;
  label: string;
  description: string | undefined;
  currentStep: number;

  subSteps?: ImpactSubSteps;

  activeImpactSubStep?:
    | keyof ImpactSubSteps
    | Array<keyof ImpactSubSteps>
    | null;
  setActiveImpactSubStep?: React.Dispatch<
    React.SetStateAction<keyof ImpactSubSteps | null>
  >;
  completedImpactSubSteps?: Partial<Record<keyof ImpactSubSteps, boolean>>;
  stepCompleted?: boolean;
}

const StepItem = memo(
  ({
    step,
    label,
    description,
    currentStep,
    subSteps,
    activeImpactSubStep,
    setActiveImpactSubStep,
    completedImpactSubSteps,
    stepCompleted,
  }: StepItemProps) => {
    // const isActive = currentStep === step;
    const isActive = !stepCompleted && currentStep === step;

    //  const isCompleted =  currentStep > step;
    const isCompleted = stepCompleted || currentStep > step;

    const icon = isActive
      ? recordIcon
      : isCompleted
        ? circleCheck
        : recordGreyIcon;
    const iconAlt = isActive
      ? 'active'
      : isCompleted
        ? 'completed'
        : 'inactive';

    const stepClasses = isActive
      ? `${styles.stepItem} ${styles.activeStep}`
      : isCompleted
        ? `${styles.stepItem} ${styles.completedStep}`
        : styles.stepItem;

    return (
      <li className={stepClasses}>
        <img src={icon} alt={iconAlt} className={styles.stepIcon} />
        <div className={styles.stepText}>
          <div className={styles.stepLabel}>{label}</div>
          {description && (
            <p className={styles.stepDescription}>{description}</p>
          )}

          {subSteps && (
            <ul className={styles.subStepList}>
              {Object.entries(subSteps).map(([key]) => {
                const isSubCompleted =
                  !!completedImpactSubSteps?.[key as keyof ImpactSubSteps];

                const isSubActive = Array.isArray(activeImpactSubStep)
                  ? activeImpactSubStep.includes(key as keyof ImpactSubSteps) &&
                    !isSubCompleted
                  : activeImpactSubStep === key && !isSubCompleted;

                const subIcon = isSubActive
                  ? recordIcon
                  : isSubCompleted
                    ? circleCheck
                    : recordGreyIcon;

                const subStepClass = isSubActive
                  ? `${styles.stepItem} ${styles.activeStep}`
                  : isSubCompleted
                    ? `${styles.stepItem} ${styles.completedStep}`
                    : styles.stepItem;
                const subLabel = key.charAt(0) + key.slice(1).toLowerCase();

                return (
                  <li
                    key={key}
                    className={subStepClass}
                    onClick={() => {
                      if (key === 'OVERVIEW') {
                        setActiveImpactSubStep?.('OVERVIEW');
                      }
                    }}
                  >
                    <img src={subIcon} alt="" className={styles.stepIcon} />
                    <div className={styles.stepText}>
                      <div className={styles.stepLabel}>{subLabel}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </li>
    );
  }
);

StepItem.displayName = 'StepItem';

const BuiltEnviromentalProfileFlow = () => {
  const navigate = useNavigate();
  const { productId, componentId, roleSlug } = useParams<{
    productId: string;
    componentId?: string;
    roleSlug?: string;
  }>();

  const {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    setProductId,
    setComponentId,
    setRoleSlug,
    setComponentDetails,
    setAudit,
    setSelectedRole,
    resetFlow,
    audit,
    componentDetails,
    selectedRole,
    lastSelectedImpactOptionByContext,
    setLastSelectedImpactOptionForContext,
    summaryCompletedByContext,
    setSummaryCompletedForContext,
    setCurrentStep,
    resetImpactCategorySearchDatabaseFormData,
  } = useBuiltEnvironmentalProfileFlowStore(
    useShallow((s) => ({
      currentStep: s.currentStep,
      goToNextStep: s.goToNextStep,
      goToPreviousStep: s.goToPreviousStep,
      setProductId: s.setProductId,
      setCurrentStep: s.setCurrentStep,
      setComponentId: s.setComponentId,
      setRoleSlug: s.setRoleSlug,
      setComponentDetails: s.setComponentDetails,
      setAudit: s.setAudit,
      setSelectedRole: s.setSelectedRole,
      resetFlow: s.resetFlow,
      audit: s.audit,
      componentDetails: s.componentDetails,
      selectedRole: s.selectedRole,
      lastSelectedImpactOptionByContext: s.lastSelectedImpactOptionByContext,
      setLastSelectedImpactOptionForContext:
        s.setLastSelectedImpactOptionForContext,
      summaryCompletedByContext: s.summaryCompletedByContext,
      setSummaryCompletedForContext: s.setSummaryCompletedForContext,
      resetImpactCategorySearchDatabaseFormData:
        s.resetImpactCategorySearchDatabaseFormData,
    }))
  );
  const consumeImpactValueClearBySupplierDetails =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.consumeImpactValueClearBySupplierDetails
    );
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  useEffect(() => {
    setCurrentStep(BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION);
  }, [setCurrentStep]);

  useEffect(() => {
    setProductId(productId || null);
    setComponentId(componentId || null);
    setRoleSlug(roleSlug || null);
  }, [
    productId,
    componentId,
    roleSlug,
    setProductId,
    setComponentId,
    setRoleSlug,
  ]);

  useEffect(() => {
    const fetchComponentDetails = async () => {
      if (!roleSlug) {
        showAlert(ERROR_MESSAGES.ROLE_SLUG_REQUIRED, 'danger');
        navigate(-1);
        return;
      }

      showSpinner();
      try {
        if (!productId || !componentId || !roleSlug) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          navigate(-1);
          return;
        }

        const response = await getComponent(productId, componentId, roleSlug, USER_ROLES.COMPANY);

        if (response.success && response.data) {
          setComponentDetails(response.data);
          setAudit(response.data?.audit ?? null);

          if (response.data.supplierRole) {
            const matchedRole: SupplierRole = {
              // if SupplierRole type doesn't include _id, change to "id" or extend the type
              _id: response.data._id || componentId,
              role: response.data.supplierRole,
              comment: null,
              supplierRoleSlug: roleSlug,
            };
            setSelectedRole(matchedRole);
          }
        } else {
          showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_COMPONENT, 'danger');
          navigate(-1);
        }
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { status?: number; data?: unknown };
          message?: string;
        };
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'BuiltEnviromentalProfileFlow',
            method: 'fetchComponentDetails',
            productId,
            componentId,
            roleSlug,
            statusCode: axiosError.response?.status,
          });
        });

        if (axiosError.response?.status === 404) {
          showAlert(ERROR_MESSAGES.COMPONENT_NOT_FOUND, 'danger');
        } else {
          showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_COMPONENT, 'danger');
        }
        navigate(-1);
      } finally {
        hideSpinner();
      }
    };

    fetchComponentDetails();
  }, [
    productId,
    componentId,
    roleSlug,
    showSpinner,
    hideSpinner,
    showAlert,
    setComponentDetails,
    setSelectedRole,
  ]);

  // Benchmarking data for industry average comparison
  const [benchmarkingData, setBenchmarkingData] =
    useState<BenchmarkingData | null>(null);

  useEffect(() => {
    const fetchBenchmarkingDetails = async () => {
      if (!componentId || !roleSlug) {
        return;
      }

      showSpinner();
      try {
        const response = await getIndustryBenchmarkingDetails(
          componentId,
          roleSlug
        );

        let benchData = response?.success
          ? response.data?.benchmarkingData
          : null;

        // Fallback: some roles (e.g. retailer) may return benchmarking nested under role details
        if (!benchData && response?.success && response.data) {
          const detailsKey = `${roleSlug}Details` as keyof typeof response.data;
          const roleDetails = response.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }

        setBenchmarkingData(benchData ?? null);
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          return;
        }
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'BuiltEnviromentalProfileFlow',
            method: 'fetchBenchmarkingDetails',
            componentId,
            roleSlug,
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      } finally {
        hideSpinner();
      }
    };

    void fetchBenchmarkingDetails();
  }, [componentId, roleSlug, showSpinner, hideSpinner, showAlert]);

  // Fallback: derive benchmarking from componentDetails when API doesn't return it
  // Pattern: roleSlug + "Details" e.g. transportFreight -> transportFreightDetails.benchmarkingData
  useEffect(() => {
    if (!roleSlug || !componentDetails) return;

    setBenchmarkingData((prev) => {
      if (prev) return prev;
      const detailsKey = `${roleSlug}Details` as keyof typeof componentDetails;
      const roleDetails = componentDetails[detailsKey] as
        | { benchmarkingData?: BenchmarkingData }
        | undefined;
      const nested = roleDetails?.benchmarkingData;
      const flat = (componentDetails as { benchmarkingData?: BenchmarkingData })
        ?.benchmarkingData;
      return nested ?? flat ?? null;
    });
  }, [roleSlug, componentDetails]);

  // Re-fetch componentDetails and benchmarking when entering Add Impact Category
  // (e.g. after saving Industry Benchmarking) so the average placeholder has fresh data
  useEffect(() => {
    if (
      currentStep !==
        BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_IMPACT_CATEGORY ||
      !productId ||
      !componentId ||
      !roleSlug
    ) {
      return;
    }

    const refreshForImpactCategory = async () => {
      try {
        const [compRes, benchRes] = await Promise.all([
          getComponent(productId, componentId, roleSlug, USER_ROLES.COMPANY),
          getIndustryBenchmarkingDetails(componentId, roleSlug),
        ]);

        if (compRes?.success && compRes.data) {
          setComponentDetails(compRes.data);
        }

        let benchData = benchRes?.success
          ? benchRes.data?.benchmarkingData
          : null;
        if (!benchData && benchRes?.success && benchRes.data) {
          const detailsKey = `${roleSlug}Details` as keyof typeof benchRes.data;
          const roleDetails = benchRes.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }
        if (!benchData && compRes?.success && compRes.data) {
          const detailsKey = `${roleSlug}Details` as keyof typeof compRes.data;
          const roleDetails = compRes.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }
        setBenchmarkingData(benchData ?? null);
      } catch (err) {
        Bugsnag.notify(err as Error, (event) => {
          event.addMetadata('context', {
            component: 'BuiltEnviromentalProfileFlow',
            method: 'refreshForImpactCategory',
          });
        });
      }
    };

    void refreshForImpactCategory();
  }, [currentStep, productId, componentId, roleSlug, setComponentDetails]);
  // Track active substep for Add Impact Category
  const [activeImpactSubStep, setActiveImpactSubStep] = useState<
    keyof ImpactSubSteps | Array<keyof ImpactSubSteps> | null
  >('OVERVIEW');
  // Track completed substeps separately
  const [completedImpactSubSteps, setCompletedImpactSubSteps] = useState<
    Partial<Record<Impact | 'OVERVIEW', boolean>>
  >({});

  // Track completed substeps per option

  const [selectedOption, setSelectedOption] = useState<ImpactOption | null>(
    null
  );

  const [lastVisitedSubStep, setLastVisitedSubStep] = useState<{
    request: keyof ImpactSubSteps | null;
    database: keyof ImpactSubSteps | null;
  }>({
    request: null,
    database: null,
  });
  const [impactCategoryStage, setImpactCategoryStage] = useState<
    'intro' | 'select'
  >('intro');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [impactDataRefreshTrigger, setImpactDataRefreshTrigger] = useState(0);
  const refreshImpactData = useCallback(
    () => setImpactDataRefreshTrigger((t) => t + 1),
    []
  );

  //mark overview completed
  const markOverviewCompleted = () => {
    setCompletedImpactSubSteps((prev) => ({
      ...prev,
      OVERVIEW: true,
    }));
  };

  const handleBackFromSelect = useCallback(() => {
    // Go back to overview stage
    setImpactCategoryStage('intro');

    // Cleanup
    // setSelectedOption(null);
    setActiveIndex(0);
  }, []);
  useEffect(() => {
    if (!selectedOption || !activeImpactSubStep) return;

    setLastVisitedSubStep((prev) => ({
      ...prev,
      [selectedOption]: activeImpactSubStep,
    }));
  }, [activeImpactSubStep, selectedOption]);

  // Navigation handlers using store actions
  const handleRedirectToComponentDetails = useCallback(() => {
    // reset the store use the resetFlow action
    resetFlow();
    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${componentId}${ROUTES.ROLE.BASE}/${roleSlug}`
    );
  }, [productId, componentId, roleSlug, navigate, resetFlow]);

  const handleNext = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep <= BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION) {
      handleRedirectToComponentDetails();
      return;
    }

    // Clear search database form data when going back from Summary
    if (
      currentStep === BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.SUMMARY &&
      roleSlug
    ) {
      resetImpactCategorySearchDatabaseFormData(roleSlug);
    }

    goToPreviousStep();
  }, [
    currentStep,
    goToPreviousStep,
    handleRedirectToComponentDetails,
    roleSlug,
    resetImpactCategorySearchDatabaseFormData,
  ]);

  //Add impact category flow
  const isAddImpactCategoryStepCompleted = useMemo(() => {
    return (
      completedImpactSubSteps.OVERVIEW &&
      completedImpactSubSteps.CARBON &&
      completedImpactSubSteps.WATER &&
      completedImpactSubSteps.LAND
    );
  }, [completedImpactSubSteps]);

  const impactSourceRef = useRef<Record<Impact, ImpactOption | null>>({
    CARBON: null,
    WATER: null,
    LAND: null,
  });

  const isImpactCompleted = (manual?: any, request?: any): boolean => {
    if (!manual && !request) return false;

    // Check for "Use our Database" completion: dataSource = 'database' with quantity
    if (manual.dataSource === 'database' && manual.quantity != null) {
      return true;
    }

    if (
      (manual.dataSource === 'manual' && manual.value !== '') ||
      (request?.tempQuantity && request?.tempLciaMethodology)
    ) {
      return true;
    }

    if (
      manual.dataSource === 'manual' ||
      manual.isImpactPresent === false ||
      (request?.tempQuantity && request?.tempLciaMethodology)
    ) {
      return true;
    }

    return false;
  };
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [completedFromApi, setCompletedFromApi] = useState<
    Partial<Record<any, boolean>>
  >({});
  const [savedImpactSource, setSavedImpactSource] = useState<
    Partial<Record<Impact, 'database' | 'request'>>
  >({});

  const isDatabaseSource = (ds?: string) =>
    ds === 'manual' || ds === 'supplier' || ds === 'database';
  const mapApiImpactToDatabaseForm = (apiImpact: any) => ({
    active: true,

    dataSource: apiImpact?.dataSource ?? '',

    value: apiImpact?.quantity?.toString() ?? '',
    lciaMethod: apiImpact?.lciaMethodology ?? '',
    confirmAccuracy: apiImpact.dataSource === 'manual',

    offsetting: apiImpact?.offsetCarbonImpact === true,
    offsetValue:
      apiImpact?.offsetCarbonImpact === true
        ? (apiImpact?.offsetQuantity?.toString() ?? '')
        : '',
    // Include audit data if available (for database source)
    audit: apiImpact?.audit ?? undefined,
  });

  const mapApiImpactToWaterLandForm = (apiImpact: any) => {
    return {
      active: true,
      dataSource: apiImpact?.dataSource ?? '',

      value: apiImpact?.quantity?.toString() ?? '',
      lciaMethod: apiImpact?.lciaMethodology ?? '',
      confirmAccuracy: apiImpact.dataSource === 'manual',
      noImpact: !apiImpact?.isImpactPresent,
      // Include audit data if available (for database source)
      audit: apiImpact?.audit ?? undefined,
    };
  };

  const mapApiImpactLandForm = (apiImpact: any) => ({
    active: true,
    dataSource: apiImpact?.dataSource ?? '',

    value: apiImpact?.quantity?.toString() ?? '',
    lciaMethod: apiImpact?.lciaMethodology ?? '',
    confirmAccuracy: apiImpact.dataSource === 'manual',
    noImpact: !apiImpact?.isImpactPresent,
    // Include audit data if available (for database source)
    audit: apiImpact?.audit ?? undefined,
  });

  const initialDatabaseImpactRef = useRef<ManualImpactDataMap | null>(null);
  // Track previous selectedOption to detect option changes
  const prevSelectedOptionRef = useRef<ImpactOption | null>(null);
  // Track previous refresh trigger to detect explicit refreshes
  const prevRefreshTriggerRef = useRef<number>(0);

  const [manualImpactData, setManualImpactData] = useState<ManualImpactDataMap>(
    {
      CARBON: {
        active: false,
        value: '',
        lciaMethod: '',
        dataSource: '',
        confirmAccuracy: false,
        offsetting: false,
        offsetValue: '',
      },
      WATER: {
        active: false,
        value: '',
        lciaMethod: '',
        dataSource: '',
        confirmAccuracy: false,
        noImpact: false,
      },
      LAND: {
        active: false,
        value: '',
        lciaMethod: '',
        dataSource: '',
        confirmAccuracy: false,
        noImpact: false,
      },
    }
  );

  const [requestImpactData, setRequestImpactData] =
    useState<RequestImpactDataMap>({
      CARBON: {
        active: false,
        value: '',
        lciaMethod: '',

        isRequested: false,
      },
      WATER: {
        active: false,
        value: '',
        lciaMethod: '',
        isRequested: false,
      },
      LAND: {
        active: false,
        value: '',
        lciaMethod: '',
        isRequested: false,
      },
    });
  const [summaryCompleted, setSummaryCompleted] = useState(false);

  const flowContextKey =
    componentId && roleSlug ? `${componentId}:${roleSlug}` : null;

  const setSelectedOptionAndStore = useCallback(
    (
      next:
        | ImpactOption
        | null
        | ((prev: ImpactOption | null) => ImpactOption | null)
    ) => {
      setSelectedOption((prev) => {
        const computed = typeof next === 'function' ? next(prev) : next;
        return computed;
      });
    },
    []
  );

  useEffect(() => {
    if (flowContextKey && selectedOption) {
      setLastSelectedImpactOptionForContext(flowContextKey, selectedOption);
    }
  }, [flowContextKey, selectedOption, setLastSelectedImpactOptionForContext]);

  // Restore Summary completion when user comes back to edit flow
  useEffect(() => {
    if (!flowContextKey) return;
    setSummaryCompleted(Boolean(summaryCompletedByContext?.[flowContextKey]));
  }, [flowContextKey, summaryCompletedByContext]);
  const inferSelectedOption = (
    impactSourceRef: React.MutableRefObject<Record<Impact, ImpactOption | null>>
  ): ImpactOption | null => {
    const sources = Object.values(impactSourceRef.current);

    if (sources.includes('request')) return 'request';
    if (sources.includes('database')) return 'database';

    return null;
  };

  // "Options / Select data source" screen again.
  const savedSelectedOptionRef = useRef<ImpactOption | null>(null);

  //for add impact category
  useEffect(() => {
    // Capture synchronously before any async ops — child effects (SelectDataSource)
    // run before parent effects, so by the time we enter the async fn the flag may
    // already be consumed by SelectDataSource.  Capturing it here guarantees we see
    // the correct value before the API response arrives.
    const resetCtxKey =
      componentId && roleSlug ? `${componentId}:${roleSlug}` : null;
    const shouldClearImpactValues = resetCtxKey
      ? consumeImpactValueClearBySupplierDetails(resetCtxKey)
      : false;

    const loadSavedImpactData = async () => {
      if (!componentId || !roleSlug) return;
      showSpinner();
      try {
        const res = await getImpactCategorySummary(componentId, roleSlug);

        if (!res) return;
        //notify parent which substeps are completed
        const completedFromApi: Partial<Record<any, boolean>> = {
          CARBON: isImpactCompleted(res.data.carbon, res.data.carbon),
          WATER: isImpactCompleted(res.data.water, res.data.water),
          LAND: isImpactCompleted(res.data.land, res.data.land),
        };

        setCompletedFromApi(completedFromApi);
        const sourceByImpact: Partial<Record<Impact, 'database' | 'request'>> =
          {};
        (['CARBON', 'WATER', 'LAND'] as Impact[]).forEach((impact) => {
          const apiData = res.data?.[impact.toLowerCase()] ?? null;

          // Prioritize manual/database source over request - if impact has manual data, it's from Select Data Source
          // This ensures mixed scenarios work: e.g., Water from Select Data Source + Carbon/Land from Request
          if (apiData?.quantity || apiData?.isImpactPresent === false) {
            impactSourceRef.current[impact] = 'database';
            sourceByImpact[impact] = 'database';
          } else if (apiData?.tempQuantity || apiData?.tempLciaMethodology) {
            impactSourceRef.current[impact] = 'request';
            sourceByImpact[impact] = 'request';
          }
        });
        setSavedImpactSource(sourceByImpact);

        const overviewCompletedFromApi = Boolean(res.data?.componentId);
        if (overviewCompletedFromApi) {
          savedSelectedOptionRef.current = inferSelectedOption(impactSourceRef);
        } else {
          savedSelectedOptionRef.current = null;
        }

        setCompletedImpactSubSteps((prev) => ({
          ...prev,
          ...completedFromApi,
          OVERVIEW: overviewCompletedFromApi,
        }));

        //  Set confirmAccuracy from backend (DATABASE or REQUEST)
        // requestEmailSent is true when email was sent; for Save and Exit, we infer from saved temp data
        const hasRequestEmailSent = res.data.requestEmailSent === true;
        const hasSavedTempDataWithConfirmation = (
          ['carbon', 'water', 'land'] as const
        ).some((key) => {
          const d = res.data?.[key];
          return (
            d?.isRequested &&
            d?.tempQuantity != null &&
            d?.tempLciaMethodology != null
          );
        });
        const confirmedByBackend =
          hasRequestEmailSent || hasSavedTempDataWithConfirmation;

        setConfirmAccuracy(confirmedByBackend);

        //  DATABASE FLOW

        const mappedDatabaseData: ManualImpactDataMap = {
          CARBON: isDatabaseSource(res.data.carbon?.dataSource)
            ? mapApiImpactToDatabaseForm(res.data.carbon)
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                offsetting: false,
                offsetValue: '',
              },

          WATER: isDatabaseSource(res.data.water?.dataSource)
            ? {
                ...mapApiImpactToWaterLandForm(res.data.water),

                noImpact: !res.data.water?.isImpactPresent,
                active: true,
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                noImpact: false,
              },

          LAND: isDatabaseSource(res.data.land?.dataSource)
            ? mapApiImpactLandForm(res.data.land)
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                noImpact: false,
              },
        };
        if (res.data.water?.isImpactPresent === false) {
          mappedDatabaseData.WATER.noImpact = true;
        }

        if (res.data.land?.isImpactPresent === false) {
          mappedDatabaseData.LAND.noImpact = true;
        }

        // This preserves unsaved edits when user is already on 'database' option
        const prevOption = prevSelectedOptionRef.current;
        const prevTrigger = prevRefreshTriggerRef.current;
        const isFirstLoad = prevOption === null;
        const isExplicitRefresh = impactDataRefreshTrigger !== prevTrigger;
        const isSwitchingToDatabase =
          !isFirstLoad &&
          prevOption !== 'database' &&
          selectedOption === 'database';

        // If supplier details changed, clear value/audit so the user must re-search.
        // shouldClearImpactValues was captured synchronously at effect-start (before
        // child effects could consume the store flag).
        if (shouldClearImpactValues) {
          if (mappedDatabaseData.CARBON.dataSource === 'database') {
            mappedDatabaseData.CARBON = {
              ...mappedDatabaseData.CARBON,
              value: '',
              audit: undefined,
            };
          }

          if (mappedDatabaseData.WATER.dataSource === 'database') {
            mappedDatabaseData.WATER = {
              ...mappedDatabaseData.WATER,
              value: '',
              audit: undefined,
            };
          }

          if (mappedDatabaseData.LAND.dataSource === 'database') {
            mappedDatabaseData.LAND = {
              ...mappedDatabaseData.LAND,
              value: '',
              audit: undefined,
            };
          }
        }

        // Update manualImpactData only in these cases:
        if (isFirstLoad || isSwitchingToDatabase || isExplicitRefresh) {
          // First load, switching TO database, or explicit refresh - fetch fresh data
          setManualImpactData(mappedDatabaseData);
        } else {
          // Switching away from database or on request option - safe to update
          setManualImpactData(mappedDatabaseData);
        }

        // Update refs to track current state for next comparison
        prevSelectedOptionRef.current = selectedOption;
        prevRefreshTriggerRef.current = impactDataRefreshTrigger;

        // snapshot ONLY ONCE
        if (!initialDatabaseImpactRef.current) {
          initialDatabaseImpactRef.current = JSON.parse(
            JSON.stringify(mappedDatabaseData)
          );
        }

        // REQUEST FLOW —
        setRequestImpactData({
          CARBON: res.data.carbon?.isRequested
            ? {
                active: true,
                value: res.data.carbon?.tempQuantity?.toString() ?? '',
                lciaMethod: res.data.carbon?.tempLciaMethodology ?? '',
                isRequested: res.data.carbon.isRequested,
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                isRequested: false,
              },

          WATER: res.data.water?.isRequested
            ? {
                active: true,
                value: res.data.water?.tempQuantity?.toString() ?? '',
                lciaMethod: res.data.water?.tempLciaMethodology ?? '',
                isRequested: res.data.water.isRequested,
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                isRequested: false,
              },

          LAND: res.data.land?.isRequested
            ? {
                active: true,
                value: res.data.land?.tempQuantity?.toString() ?? '',
                lciaMethod: res.data.land?.tempLciaMethodology ?? '',
                isRequested: res.data.land.isRequested,
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                isRequested: false,
              },
        });
        if (overviewCompletedFromApi && savedSelectedOptionRef.current) {
          setSelectedOptionAndStore(
            (prev) => prev ?? savedSelectedOptionRef.current
          );
        }
      } catch (err) {
        const error = err as AxiosError;

        if (error.response?.status === 404) {
          return;
        }
        Bugsnag.notify(err as Error, (event) => {
          event.addMetadata('context', {
            component: 'BuiltEnviromentalProfileFlow',
            method: 'loadSavedImpactData',
          });
        });
      } finally {
        hideSpinner();
      }
    };

    loadSavedImpactData();
  }, [
    componentId,
    roleSlug,
    showSpinner,
    hideSpinner,
    impactDataRefreshTrigger,
    selectedOption,
    setSelectedOptionAndStore,
    consumeImpactValueClearBySupplierDetails,
  ]);

  useEffect(() => {
    // Only restore on the Options screen; do NOT preselect by default on first entry.
    if (impactCategoryStage !== 'select') return;
    if (selectedOption) return;

    // Prefer explicitly stored "last selected option" (handles mixed flows).
    const desired =
      (flowContextKey
        ? lastSelectedImpactOptionByContext?.[flowContextKey]
        : null) ?? savedSelectedOptionRef.current;

    if (!desired) return;

    setSelectedOptionAndStore(desired);

    // Ensure correct UI renders for restored option
    if (desired === 'database') {
      // Database flow needs activeIndex 1/2/3, otherwise forms won't render.
      const tabIndexMap: Record<Impact, number> = {
        CARBON: 1,
        WATER: 2,
        LAND: 3,
      };

      const last =
        lastVisitedSubStep.database &&
        (['CARBON', 'WATER', 'LAND'] as const).includes(
          lastVisitedSubStep.database as Impact
        )
          ? (lastVisitedSubStep.database as Impact)
          : 'CARBON';

      setActiveIndex(tabIndexMap[last]);
      setActiveImpactSubStep(last);
    } else {
      // Request flow doesn't use activeIndex; keep substep neutral.
      setActiveImpactSubStep(null);
    }
  }, [
    impactCategoryStage,
    selectedOption,
    flowContextKey,
    lastSelectedImpactOptionByContext,
    lastVisitedSubStep.database,
    setSelectedOptionAndStore,
  ]);

  const handleSummaryExit = () => {
    setSummaryCompleted(true);
    if (flowContextKey) {
      setSummaryCompletedForContext(flowContextKey, true);
    }
    handleRedirectToComponentDetails();
  };

  useEffect(() => {
    if (!requestImpactData) return;

    const completedSubSteps: Partial<
      Record<'CARBON' | 'WATER' | 'LAND', boolean>
    > = {};

    (['CARBON', 'WATER', 'LAND'] as const).forEach((impact) => {
      const data = requestImpactData[impact];
      if (data?.isRequested) completedSubSteps[impact] = true;
    });

    setCompletedImpactSubSteps((prev) => ({ ...prev, ...completedSubSteps }));
    setCompletedFromApi?.((prev: any) => ({ ...prev, ...completedSubSteps }));
  }, [requestImpactData]);

  // Check if supplier details step is completed based on selected role
  const isSupplierDetailsStepCompleted = useMemo(() => {
    if (!selectedRole?.supplierRoleSlug || !componentDetails) {
      return false;
    }

    const roleSlug = selectedRole.supplierRoleSlug;

    // Map role slugs to their corresponding details properties
    if (roleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR) {
      return !!componentDetails.rawMaterialSupplierDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
      return !!componentDetails.transportFreightDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT) {
      return !!componentDetails.storageFulfilmentDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR) {
      return !!componentDetails.packagingManufacturerDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND) {
      return !!componentDetails.cpgBrandDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.RETAILER) {
      return !!componentDetails.retailerDetails;
    }
    if (roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
      return !!componentDetails.contractManufacturerDetails;
    }

    return false;
  }, [selectedRole, componentDetails]);

  // Check if benchmarking step is completed based on query data
  const isBenchmarkingStepCompleted = useMemo(() => {
    if (!audit?.query) {
      return false;
    }
    // Check if query object has at least one key
    return Object.keys(audit.query).length > 0;
  }, [audit]);

  // Check if any step (other than INTRODUCTION) is completed
  const isAnyStepCompleted = useMemo(() => {
    return (
      isSupplierDetailsStepCompleted ||
      isAddImpactCategoryStepCompleted ||
      summaryCompleted ||
      currentStep > BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION
    );
  }, [
    isSupplierDetailsStepCompleted,
    isAddImpactCategoryStepCompleted,
    summaryCompleted,
    currentStep,
  ]);

  // Memoize current step content to prevent unnecessary re-renders
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.COMPLETE_SUPPLIER_DETAILS:
        return (
          <CompleteSupplierDetails
            onNext={handleNext}
            onPrevious={handlePrevious}
            handleRedirectToComponentDetails={handleRedirectToComponentDetails}
            detailsCard={
              <ComponentOrServiceDetailsCard
                componentDetails={componentDetails}
                selectedRole={selectedRole}
                defaultExpanded
              />
            }
          />
        );
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_INDUSTRY_BENCHMARKING:
        return (
          <AddIndustryBenchmarking
            onNext={handleNext}
            onPrevious={handlePrevious}
            handleRedirectToComponentDetails={handleRedirectToComponentDetails}
            detailsCard={
              <ComponentOrServiceDetailsCard
                componentDetails={componentDetails}
                selectedRole={selectedRole}
                defaultExpanded
              />
            }
          />
        );
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_IMPACT_CATEGORY:
        return (
          <AddImpactCategory
            onNext={handleNext}
            onPrevious={handlePrevious}
            markOverviewCompleted={markOverviewCompleted}
            setActiveImpactSubStep={setActiveImpactSubStep}
            setSelectedOption={setSelectedOptionAndStore}
            selectedOption={selectedOption}
            stage={impactCategoryStage}
            setStage={setImpactCategoryStage}
            setActiveIndex={setActiveIndex}
            activeIndex={activeIndex}
            handleBackFromSelect={handleBackFromSelect}
            setCompletedImpactSubSteps={setCompletedImpactSubSteps}
            completedImpactSubSteps={completedImpactSubSteps}
            detailsCard={
              <ComponentOrServiceDetailsCard
                componentDetails={componentDetails}
                selectedRole={selectedRole}
                defaultExpanded
              />
            }
            componentDetails={componentDetails}
            roleDetailsId={getRoleDetailsId(
              componentDetails,
              roleSlug ?? undefined
            )}
            handleRedirectToComponentDetails={handleRedirectToComponentDetails}
            requestImpactData={requestImpactData}
            setRequestImpactData={setRequestImpactData}
            manualImpactData={manualImpactData}
            confirmAccuracy={confirmAccuracy}
            setManualImpactData={setManualImpactData}
            setConfirmAccuracy={setConfirmAccuracy}
            completedFromApi={completedFromApi}
            setCompletedFromApi={setCompletedFromApi}
            onRefreshImpactData={refreshImpactData}
            savedImpactSource={savedImpactSource}
            benchmarkingData={benchmarkingData ?? undefined}
          />
        );

      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.SUMMARY:
        return (
          <Summary onPrevious={handlePrevious} onExit={handleSummaryExit} />
        );
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION:
      default:
        return (
          <Introduction
            onRedirectToProductDetails={handleRedirectToComponentDetails}
          />
        );
    }
  }, [
    currentStep,
    componentDetails,
    selectedRole,
    roleSlug,
    handleNext,
    handlePrevious,
    handleRedirectToComponentDetails,
    markOverviewCompleted,
    refreshImpactData,
    completedImpactSubSteps,
    completedFromApi,
    selectedOption,
    impactCategoryStage,
    activeIndex,
    requestImpactData,
    manualImpactData,
    confirmAccuracy,
    savedImpactSource,
  ]);

  // Helper function to determine if a step is completed
  const getStepCompletedStatus = (
    step: number,
    currentStep: number,
    isAnyStepCompleted: boolean,
    isBenchmarkingStepCompleted: boolean,
    isAddImpactCategoryStepCompleted: boolean | undefined,
    summaryCompleted: boolean,
    isSupplierDetailsStepCompleted: boolean
  ): boolean => {
    switch (step) {
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION:
        return isAnyStepCompleted || currentStep > step;
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_INDUSTRY_BENCHMARKING:
        return isBenchmarkingStepCompleted || currentStep > step;
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_IMPACT_CATEGORY:
        return Boolean(isAddImpactCategoryStepCompleted);
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.SUMMARY:
        return summaryCompleted;
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.COMPLETE_SUPPLIER_DETAILS:
        return isSupplierDetailsStepCompleted || currentStep > step;
      default:
        return currentStep > step;
    }
  };

  // Memoize step navigation list to prevent unnecessary re-renders
  const stepNavigationList = useMemo(() => {
    return STEP_CONFIG.map((config) => {
      const isImpactStep = !!config.subSteps;

      const activeSubStep =
        isImpactStep &&
        currentStep ===
          BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.ADD_IMPACT_CATEGORY
          ? selectedOption
            ? (lastVisitedSubStep[selectedOption] ?? 'OVERVIEW')
            : activeImpactSubStep
          : undefined;
      const completedSubSteps = isImpactStep
        ? {
            ...completedImpactSubSteps,
          }
        : completedImpactSubSteps;

      const isStepCompleted = getStepCompletedStatus(
        config.step,
        currentStep,
        isAnyStepCompleted,
        isBenchmarkingStepCompleted,
        isAddImpactCategoryStepCompleted,
        summaryCompleted,
        isSupplierDetailsStepCompleted
      );

      return (
        <StepItem
          key={config.step}
          step={config.step}
          label={config.label}
          description={config.description}
          currentStep={currentStep}
          subSteps={config.subSteps}
          activeImpactSubStep={activeSubStep}
          setActiveImpactSubStep={
            isImpactStep
              ? (key) => {
                  if (selectedOption === 'request') {
                    // multi-select
                    setActiveImpactSubStep((prev) => {
                      if (!prev) return [key as keyof ImpactSubSteps];
                      return Array.isArray(prev)
                        ? [...new Set([...prev, key as keyof ImpactSubSteps])]
                        : [prev, key as keyof ImpactSubSteps];
                    });
                  } else {
                    // single select (database)
                    setActiveImpactSubStep(key as keyof ImpactSubSteps);
                  }

                  if (selectedOption) {
                    setLastVisitedSubStep((prev) => ({
                      ...prev,
                      [selectedOption]: key as keyof ImpactSubSteps,
                    }));
                  }
                }
              : undefined
          }
          completedImpactSubSteps={completedSubSteps}
          stepCompleted={isStepCompleted}
        />
      );
    });
  }, [
    currentStep,
    completedImpactSubSteps,
    lastVisitedSubStep,
    selectedOption,
    activeImpactSubStep,
    isAddImpactCategoryStepCompleted,
    isSupplierDetailsStepCompleted,
    isBenchmarkingStepCompleted,
    summaryCompleted,
    isAnyStepCompleted,
  ]);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <button
            className={styles.breadcrumb}
            onClick={handleRedirectToComponentDetails}
          >
            <img src={arrowLeftIcon} alt="" className={styles.arrowIcon} />
            <span>{componentDetails?.name}</span>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.layout}>
            {/* LEFT STEPPER */}
            <aside className={styles.stepSidebar}>
              <h3 className={styles.stepTitle}>Build Environmental Profile</h3>

              <div className={styles.stepContainer}>
                <ul className={styles.stepList}>{stepNavigationList}</ul>
              </div>
            </aside>

            {/* RIGHT CONTENT */}
            <section className={styles.mainPanel}>{stepContent}</section>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuiltEnviromentalProfileFlow;
