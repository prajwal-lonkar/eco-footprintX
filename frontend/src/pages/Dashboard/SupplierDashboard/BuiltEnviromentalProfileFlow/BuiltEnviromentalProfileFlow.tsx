import { useEffect, useCallback, useMemo, memo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Introduction from './steps/Introduction/Introduction';
import AddImpactCategory from './steps/AddImpactCategory/AddImpactCategory';
import Summary from './steps/Summary/Summary';
import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow.module.scss';
import arrowLeftIcon from '@assets/icons/arrow-left.svg';
import recordIcon from '@assets/icons/record.svg';
import recordGreyIcon from '@assets/icons/record-grey.svg';
import circleCheck from '@assets/icons/circle-check.svg';
import {
  BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS,
  BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS,
} from '@constants/built-environmental-profile-flow';
import { useAlertStore } from '@store/useAlertStore';
import Bugsnag from '@utils/bugsnag';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '@constants/routes';
import ComponentOrServiceDetailsCard from './ComponentOrServiceDetailsCard/ComponentOrServiceDetailsCard';
import type {
  DatabaseAuditData,
  Impact,
  ManualImpactDataMap,
} from '@type/built-enviromental-profile';
import type { SupplierComponentDetails } from '@type/supplier';
import type { ComponentDetails } from '@type/product-components';
import { ERROR_MESSAGES } from '@constants/messages';
import type { SupplierRole } from '@type/supplier';
import { useSpinnerStore } from '@store/useSpinnerStore';
import {
  getComponentDetails,
  getImpactCategoryRequests,
} from '@service/supplier.service';
import {
  getImpactCategorySupplierSummary,
  getIndustryBenchmarkingDetails,
  saveImpactCategory,
} from '@service/built-enviromental-profile.service';
import { getRoleDetailsId } from '@utils/getRoleDetailsId';
import { useBuiltEnvironmentalProfileFlowSupplierStore } from '@store/useBuiltEnvironmentalProfileFlowSupplierStore';
import { USER_ROLES } from '@constants/auth';
import useAuthStore from '@store/useAuthStore';
import type { BenchmarkingData } from '@utils/industryAvgComparison';

// Step configuration - moved outside component to prevent recreation on every render

type ImpactSubSteps =
  typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS;

interface StepConfig {
  step: number;
  label: string;
  description?: string;
  subSteps?: ImpactSubSteps;
}
const STEP_CONFIG: StepConfig[] = [
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION,
    label: 'Introduction',
    description: undefined,
  },

  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY,
    label: 'Add Impact Category Data',
    description: 'Enter environmental impact data for this component',

    subSteps: BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS,
  },
  {
    step: BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.SUMMARY,
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
    const isActive = !stepCompleted && currentStep === step;
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
                      setActiveImpactSubStep?.(key as keyof ImpactSubSteps);
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
  const { productId, componentId, supplierRoleSlug } = useParams<{
    productId: string;
    componentId?: string;
    supplierRoleSlug?: string;
  }>();

  const {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
    setProductId,
    setComponentId,
    setRoleSlug,
    setComponentDetails,
    setSelectedRole,
    setSummaryCompletedForContext,
    setRequestedImpactCategoriesForContext,
    setCompletedImpactSubStepsForContext,
    completedImpactSubStepsByContext,
    setLastStepReachedForContext,
    setIntroductionCompletedForContext,
    resetFlow,
    componentDetails,
    selectedRole,
    summaryCompletedByContext,
    introductionCompletedByContext,
    requestedImpactCategoriesByContext,
  } = useBuiltEnvironmentalProfileFlowSupplierStore(
    useShallow((s) => ({
      currentStep: s.currentStep,
      goToNextStep: s.goToNextStep,
      goToPreviousStep: s.goToPreviousStep,
      setCurrentStep: s.setCurrentStep,
      setProductId: s.setProductId,
      setComponentId: s.setComponentId,
      setRoleSlug: s.setRoleSlug,
      setComponentDetails: s.setComponentDetails,
      setSelectedRole: s.setSelectedRole,
      setSummaryCompletedForContext: s.setSummaryCompletedForContext,
      resetFlow: s.resetFlow,
      componentDetails: s.componentDetails as
        | ComponentDetails
        | SupplierComponentDetails
        | null,
      selectedRole: s.selectedRole,
      summaryCompletedByContext: s.summaryCompletedByContext,
      introductionCompletedByContext: s.introductionCompletedByContext,
      requestedImpactCategoriesByContext: s.requestedImpactCategoriesByContext,
      setRequestedImpactCategoriesForContext:
        s.setRequestedImpactCategoriesForContext,
      completedImpactSubStepsByContext: s.completedImpactSubStepsByContext,
      setCompletedImpactSubStepsForContext:
        s.setCompletedImpactSubStepsForContext,
      setLastStepReachedForContext: s.setLastStepReachedForContext,
      setIntroductionCompletedForContext: s.setIntroductionCompletedForContext,
    }))
  );

  const flowContextKey =
    componentId && supplierRoleSlug
      ? `${componentId}:${supplierRoleSlug}`
      : null;

  // Restore Summary completion when user comes back to edit flow
  useEffect(() => {
    if (!flowContextKey) return;
    setSummaryCompleted(Boolean(summaryCompletedByContext?.[flowContextKey]));
  }, [flowContextKey, summaryCompletedByContext]);

  // When coming to edit: always start with Introduction (do not restore to Add Impact Category)
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  useEffect(() => {
    setCurrentStep(
      BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION
    );
  }, [setCurrentStep]);

  useEffect(() => {
    setProductId(productId || null);
    setComponentId(componentId || null);
    setRoleSlug(supplierRoleSlug || null);
  }, [
    productId,
    componentId,
    supplierRoleSlug,
    setProductId,
    setComponentId,
    setRoleSlug,
  ]);

  useEffect(() => {
    const fetchComponentDetails = async () => {
      if (!supplierRoleSlug) {
        showAlert(ERROR_MESSAGES.ROLE_SLUG_REQUIRED, 'danger');
        navigate(-1);
        return;
      }

      showSpinner();
      try {
        if (!productId || !componentId || !supplierRoleSlug) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          navigate(-1);
          return;
        }

        const response = await getComponentDetails(
          productId,
          componentId,
          supplierRoleSlug,
          USER_ROLES.SUPPLIER
        );

        if (response.success && response.data) {
          setComponentDetails(response.data);

          if (response.data.supplierRole) {
            const matchedRole: SupplierRole = {
              _id: response.data._id || componentId,
              role: response.data.supplierRole,
              comment: null,
              supplierRoleSlug: supplierRoleSlug,
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
            supplierRoleSlug,
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
    supplierRoleSlug,
    showSpinner,
    hideSpinner,
    showAlert,
    setComponentDetails,
    setSelectedRole,
  ]);

  // Track active substep for Add Impact Category (no Overview substep per Figma)
  const [activeImpactSubStep, setActiveImpactSubStep] = useState<
    keyof ImpactSubSteps | Array<keyof ImpactSubSteps> | null
  >('CARBON');
  // Track completed substeps - restore from cache when returning so sidebar shows completed state
  const cachedCompletedSubSteps = flowContextKey
    ? completedImpactSubStepsByContext?.[flowContextKey]
    : undefined;
  const [completedImpactSubSteps, setCompletedImpactSubStepsState] = useState<
    Partial<Record<Impact, boolean>>
  >(cachedCompletedSubSteps ?? {});
  const setCompletedImpactSubSteps = useCallback(
    (
      update:
        | Partial<Record<Impact, boolean>>
        | ((
            prev: Partial<Record<Impact, boolean>>
          ) => Partial<Record<Impact, boolean>>)
    ) => {
      setCompletedImpactSubStepsState((prev) => {
        const next =
          typeof update === 'function' ? update(prev) : { ...prev, ...update };
        return next;
      });
    },
    []
  );

  // Sync completed substeps to store (in effect to avoid "update during render")
  useEffect(() => {
    if (!flowContextKey) return;
    setCompletedImpactSubStepsForContext(
      flowContextKey,
      completedImpactSubSteps
    );
  }, [
    flowContextKey,
    completedImpactSubSteps,
    setCompletedImpactSubStepsForContext,
  ]);

  // Only database option (no Request from Supplier per Figma)
  const [lastVisitedSubStep, setLastVisitedSubStep] = useState<
    keyof ImpactSubSteps | null
  >(null);
  const [activeIndex, setActiveIndex] = useState<number>(1);
  const userRole = useAuthStore.getState().getRoleSlug();

  // For edit flow: restore requested categories f
  const cachedCategories = flowContextKey
    ? requestedImpactCategoriesByContext?.[flowContextKey]
    : undefined;
  const [requestedImpactCategories, setRequestedImpactCategories] = useState<
    Record<'CARBON' | 'WATER' | 'LAND', boolean>
  >(
    () =>
      cachedCategories ?? {
        CARBON: false,
        WATER: false,
        LAND: false,
      }
  );
  const [requestedCategoriesLoaded, setRequestedCategoriesLoaded] =
    useState(!!cachedCategories);

  const requestedSteps = useMemo(
    () =>
      (['CARBON', 'WATER', 'LAND'] as const).filter(
        (c) => requestedImpactCategories[c]
      ) as readonly ('CARBON' | 'WATER' | 'LAND')[],
    [requestedImpactCategories]
  );

  // Restore completed substeps from cache when returning to flow (shows completed state on sidebar immediately)
  const hasRestoredCompletedRef = useRef(false);
  useEffect(() => {
    if (
      !flowContextKey ||
      !cachedCompletedSubSteps ||
      hasRestoredCompletedRef.current
    )
      return;
    const hasCachedCompleted = Object.values(cachedCompletedSubSteps).some(
      (v) => v === true
    );
    if (hasCachedCompleted) {
      hasRestoredCompletedRef.current = true;
      setCompletedImpactSubStepsState((prev) => ({
        ...prev,
        ...cachedCompletedSubSteps,
      }));
    }
  }, [flowContextKey, cachedCompletedSubSteps]);

  // Fetch requested categories: use getImpactCategoryRequests API, match by componentId + supplierLinkedRole (sidebar & tabs)
  useEffect(() => {
    if (!componentId || !supplierRoleSlug) return;
    const fetchRequestedCategoriesAndCompletion = async () => {
      try {
        // Supplier impact category requests API: find component matching componentId + supplierRoleSlug
        const requestsRes = await getImpactCategoryRequests(100, 1);
        const resultsData = requestsRes?.data?.results ?? [];
        const matchingRequests = resultsData.filter(
          (c) =>
            c.componentId === componentId &&
            c.supplierRoleSlug === supplierRoleSlug
        );
        // Merge impacts from all matches (OR: show if any request has it)
        const categories = {
          CARBON: matchingRequests.some((r) => !!r.impacts?.carbon),
          WATER: matchingRequests.some((r) => !!r.impacts?.water),
          LAND: matchingRequests.some((r) => !!r.impacts?.land),
        };
        setRequestedImpactCategories(categories);
        if (flowContextKey) {
          setRequestedImpactCategoriesForContext(flowContextKey, categories);
        }
        setRequestedCategoriesLoaded(true);

        // Supplier API: completion state and other logic (unchanged)
        const res = await getImpactCategorySupplierSummary(
          componentId,
          supplierRoleSlug,
          {
            productRequested: userRole === USER_ROLES.COMPANY,
          }
        );
        if (!res?.data || (res.statusCode !== 200 && res.statusCode !== 201))
          return;

        // If GET API returns _id, impact category exists — mark Introduction as completed on sidebar
        const hasId =
          (res as { data?: { _id?: string }; _id?: string })?.data?._id ??
          (res as { data?: { _id?: string }; _id?: string })?._id;
        if (hasId && flowContextKey) {
          setIntroductionCompletedForContext(flowContextKey, true);
        }

        const d = res.data as {
          carbon?: {
            isRequested?: boolean;
            dataConsent?: boolean;
            isSubmitted?: boolean;
            quantity?: number;
            offsetCarbonImpact?: boolean;
            offsetQuantity?: number;
          };
          water?: {
            isRequested?: boolean;
            dataConsent?: boolean;
            isSubmitted?: boolean;
            isImpactPresent?: boolean;
            quantity?: number;
            lciaMethodology?: string;
          };
          land?: {
            isRequested?: boolean;
            dataConsent?: boolean;
            isSubmitted?: boolean;
            isImpactPresent?: boolean;
            quantity?: number;
            lciaMethodology?: string;
          };
        };
        const hasCarbonData = (c: NonNullable<typeof d.carbon>) =>
          c.quantity != null ||
          (Boolean(c.offsetCarbonImpact) && c.offsetQuantity != null);
        const hasWaterLandData = (
          w: { quantity?: number; isImpactPresent?: boolean } | undefined
        ) => w != null && (w.quantity != null || w.isImpactPresent === false);
        const requestedKeys = (['CARBON', 'WATER', 'LAND'] as const).filter(
          (c) => categories[c]
        );
        const isCategoryCompleted = (
          key: 'CARBON' | 'WATER' | 'LAND',
          data: (typeof d)['carbon'] | (typeof d)['water'] | (typeof d)['land']
        ): boolean => {
          if (!data) return false;
          if (key === 'CARBON') {
            const c = data as (typeof d)['carbon'];
            return (
              c?.dataConsent === true ||
              c?.isSubmitted === true ||
              (c != null && hasCarbonData(c))
            );
          }
          const wl = data as (typeof d)['water'] | (typeof d)['land'];
          return (
            wl?.dataConsent === true ||
            wl?.isSubmitted === true ||
            wl?.isImpactPresent === false ||
            hasWaterLandData(wl)
          );
        };
        const completed: Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>> =
          {};
        requestedKeys.forEach((key) => {
          const data =
            d[key === 'CARBON' ? 'carbon' : key === 'WATER' ? 'water' : 'land'];
          completed[key] = isCategoryCompleted(key, data);
        });
        setCompletedImpactSubSteps((prev) => ({ ...prev, ...completed }));
        const allRequestedCompleted = requestedKeys.every((key) => {
          const data =
            d[key === 'CARBON' ? 'carbon' : key === 'WATER' ? 'water' : 'land'];
          return isCategoryCompleted(key, data);
        });
        if (allRequestedCompleted && requestedKeys.length > 0) {
          setMaxStepReached(
            BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.SUMMARY
          );
        }
      } catch {
        // On error show all categories so flow is still usable
        setRequestedImpactCategories({
          CARBON: true,
          WATER: true,
          LAND: true,
        });
        setRequestedCategoriesLoaded(true);
      }
    };
    fetchRequestedCategoriesAndCompletion();
  }, [
    componentId,
    supplierRoleSlug,
    flowContextKey,
    setRequestedImpactCategoriesForContext,
    setIntroductionCompletedForContext,
  ]);

  const handleBackFromSelect = useCallback(() => {
    setActiveIndex(1);
  }, []);

  // When navigating to Add Impact Category: restore last visited tab
  useEffect(() => {
    if (
      currentStep !==
      BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY
    ) {
      return;
    }
    const last = lastVisitedSubStep;
    const isLastInRequested =
      last && requestedSteps.includes(last as 'CARBON' | 'WATER' | 'LAND');
    if (isLastInRequested) {
      const idx = requestedSteps.indexOf(last as 'CARBON' | 'WATER' | 'LAND');
      setActiveImpactSubStep(last);
      setActiveIndex(idx >= 0 ? idx + 1 : 1);
    } else {
      const first = requestedSteps[0];
      setActiveImpactSubStep(first ?? 'CARBON');
      setActiveIndex(1);
    }
  }, [currentStep, requestedSteps, lastVisitedSubStep]);

  // Track last visited substep
  useEffect(() => {
    if (!activeImpactSubStep) return;
    const key = Array.isArray(activeImpactSubStep)
      ? activeImpactSubStep[activeImpactSubStep.length - 1]
      : activeImpactSubStep;
    setLastVisitedSubStep(key);
  }, [activeImpactSubStep]);

  // Navigation handlers using store actions
  const handleRedirectToComponentDetails = useCallback(() => {
    // Save last step reached so when user returns, Introduction shows as completed and they land on correct step
    if (
      flowContextKey &&
      currentStep > BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION
    ) {
      setLastStepReachedForContext(flowContextKey, currentStep);
    }
    resetFlow();
    if (userRole === USER_ROLES.COMPANY) {
      navigate(
        `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCT_REQUEST_COMPONENT_DETAIL}/${productId}/${componentId}/${supplierRoleSlug}`
      );
      return;
    }
    navigate(
      `${ROUTES.SUPPLIER.BASE}${ROUTES.SUPPLIER.COMPONENT_AND_SERVICES}/${productId}/${componentId}/${supplierRoleSlug}`
    );
  }, [
    productId,
    componentId,
    supplierRoleSlug,
    flowContextKey,
    currentStep,
    setLastStepReachedForContext,
    resetFlow,
    navigate,
  ]);

  const handleNext = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  // On Introduction Proceed: call saveImpactCategory, then mark Introduction completed and advance to Add Impact Category
  const handleIntroductionProceed = useCallback(async () => {
    if (!componentId || !supplierRoleSlug) return;

    const roleDetailsId = getRoleDetailsId(
      componentDetails,
      supplierRoleSlug ?? undefined
    );
    const impactCategoryId = roleDetailsId ?? productId;
    if (!impactCategoryId) return;

    const payload = {
      supplierLinkedRole: supplierRoleSlug,
      carbon: null,
      water: null,
      land: null,
      isSaveAndExit: true,
    };
    showSpinner();
    try {
      await saveImpactCategory(impactCategoryId, componentId, payload, {
        productRequested: userRole === USER_ROLES.COMPANY,
      });
      if (flowContextKey) {
        setIntroductionCompletedForContext(flowContextKey, true);
      }
      goToNextStep();
    } catch (err) {
      Bugsnag.notify(err as Error, (event) => {
        event.addMetadata('context', {
          component: 'BuiltEnviromentalProfileFlow',
          method: 'handleIntroductionProceed',
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
    } finally {
      hideSpinner();
    }
  }, [
    productId,
    componentId,
    supplierRoleSlug,
    componentDetails,
    flowContextKey,
    goToNextStep,
    setIntroductionCompletedForContext,
    showSpinner,
    hideSpinner,
    showAlert,
  ]);

  const handlePrevious = useCallback(() => {
    if (
      currentStep <=
      BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION
    ) {
      handleRedirectToComponentDetails();
      return;
    }
    goToPreviousStep();
  }, [currentStep, goToPreviousStep, handleRedirectToComponentDetails]);

  // Add impact category flow: only require completion for requested categories
  // const isAddImpactCategoryStepCompleted = useMemo(() => {
  //   return requestedSteps.every((s) => !!completedImpactSubSteps[s]);
  // }, [completedImpactSubSteps, requestedSteps]);
  const isAddImpactCategoryStepCompleted = useMemo(() => {
    if (!requestedCategoriesLoaded) return false;

    if (requestedSteps.length === 0) return false;

    return requestedSteps.every((s) => !!completedImpactSubSteps[s]);
  }, [completedImpactSubSteps, requestedSteps, requestedCategoriesLoaded]);

  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [completedFromApi, setCompletedFromApi] = useState<
    Partial<Record<any, boolean>>
  >({});

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

  const [summaryCompleted, setSummaryCompleted] = useState(false);

  // Benchmarking data for industry average comparison (like Company dashboard)
  const [benchmarkingData, setBenchmarkingData] =
    useState<BenchmarkingData | null>(null);

  useEffect(() => {
    const fetchBenchmarkingDetails = async () => {
      if (!componentId || !supplierRoleSlug) return;
      showSpinner();
      try {
        const response = await getIndustryBenchmarkingDetails(
          componentId,
          supplierRoleSlug
        );

        let benchData = response?.success
          ? response.data?.benchmarkingData
          : null;

        // Fallback: some roles (e.g. retailer) may return benchmarking nested under role details
        if (!benchData && response?.success && response.data) {
          const detailsKey =
            `${supplierRoleSlug}Details` as keyof typeof response.data;
          const roleDetails = response.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }

        if (benchData) {
          setBenchmarkingData(benchData);
        }
      } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        // 404: benchmarking optional
        if (axiosError.response?.status === 404) {
          return;
        }
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'BuiltEnviromentalProfileFlow',
            method: 'fetchBenchmarkingDetails',
            componentId,
            supplierRoleSlug,
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      } finally {
        hideSpinner();
      }
    };
    void fetchBenchmarkingDetails();
  }, [componentId, supplierRoleSlug, showSpinner, hideSpinner, showAlert]);

  // Fallback: derive benchmarking from componentDetails when API doesn't return it

  useEffect(() => {
    if (!supplierRoleSlug || !componentDetails) return;

    setBenchmarkingData((prev) => {
      if (prev) return prev;
      const detailsKey =
        `${supplierRoleSlug}Details` as keyof typeof componentDetails;
      const roleDetails = componentDetails[detailsKey] as
        | { benchmarkingData?: BenchmarkingData }
        | undefined;
      // Nested: transportFreightDetails.benchmarkingData
      const nested = roleDetails?.benchmarkingData;
      // Flat: API returns role details as root (componentDetails.benchmarkingData)
      const flat = (componentDetails as { benchmarkingData?: BenchmarkingData })
        ?.benchmarkingData;
      return nested ?? flat ?? null;
    });
  }, [supplierRoleSlug, componentDetails]);

  // Re-fetch componentDetails and benchmarking when entering Add Impact Category
  // so the average placeholder has fresh data
  useEffect(() => {
    if (
      currentStep !==
        BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY ||
      !productId ||
      !componentId ||
      !supplierRoleSlug
    ) {
      return;
    }

    const refreshForImpactCategory = async () => {
      try {
        const [compRes, benchRes] = await Promise.all([
          getComponentDetails(
            productId,
            componentId,
            supplierRoleSlug,
            USER_ROLES.SUPPLIER
          ),
          getIndustryBenchmarkingDetails(componentId, supplierRoleSlug),
        ]);

        if (compRes?.success && compRes.data) {
          setComponentDetails(compRes.data);
        }

        let benchData = benchRes?.success
          ? benchRes.data?.benchmarkingData
          : null;
        if (!benchData && benchRes?.success && benchRes.data) {
          const detailsKey =
            `${supplierRoleSlug}Details` as keyof typeof benchRes.data;
          const roleDetails = benchRes.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }
        if (!benchData && compRes?.success && compRes.data) {
          const detailsKey =
            `${supplierRoleSlug}Details` as keyof typeof compRes.data;
          const roleDetails = compRes.data?.[detailsKey] as
            | { benchmarkingData?: BenchmarkingData }
            | undefined;
          benchData = roleDetails?.benchmarkingData ?? null;
        }
        if (benchData) {
          setBenchmarkingData(benchData);
        }
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
  }, [
    currentStep,
    productId,
    componentId,
    supplierRoleSlug,
    setComponentDetails,
  ]);

  // Track max step reached so when user goes back, earlier steps still show as completed
  const [maxStepReached, setMaxStepReached] = useState(currentStep);
  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  const isAnyStepCompleted = useMemo(
    () =>
      isAddImpactCategoryStepCompleted ||
      summaryCompleted ||
      currentStep >
        BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION,
    [isAddImpactCategoryStepCompleted, summaryCompleted, currentStep]
  );

  // Load saved impact data from same API as Summary when on Add Impact Category step
  useEffect(() => {
    const loadSavedImpactData = async () => {
      if (
        !componentId ||
        !supplierRoleSlug ||
        currentStep !==
          BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY
      ) {
        return;
      }
      showSpinner();
      try {
        const res = await getImpactCategorySupplierSummary(
          componentId,
          supplierRoleSlug,
          {
            productRequested: userRole === USER_ROLES.COMPANY,
          }
        );
        if (!res?.data || (res.statusCode !== 200 && res.statusCode !== 201)) {
          return;
        }
        const d = res.data as {
          carbon?: {
            isRequested?: boolean;
            isSubmitted?: boolean;
            quantity?: number;
            lciaMethodology?: string;
            dataSource?: string;
            unit?: string;
            offsetCarbonImpact?: boolean;
            offsetQuantity?: number;
            audit?: {
              query?: Record<string, string>;
              result?: Record<string, unknown>;
            };
          };
          water?: {
            isRequested?: boolean;
            isSubmitted?: boolean;
            quantity?: number;
            lciaMethodology?: string;
            dataSource?: string;
            unit?: string;
            isImpactPresent?: boolean;
            audit?: {
              query?: Record<string, string>;
              result?: Record<string, unknown>;
            };
          };
          land?: {
            isRequested?: boolean;
            isSubmitted?: boolean;
            quantity?: number;
            lciaMethodology?: string;
            dataSource?: string;
            unit?: string;
            isImpactPresent?: boolean;
            audit?: {
              query?: Record<string, string>;
              result?: Record<string, unknown>;
            };
          };
        };

        const hasCarbonData = (c: NonNullable<typeof d.carbon>) =>
          c.quantity != null ||
          (Boolean(c.offsetCarbonImpact) && c.offsetQuantity != null);
        const hasWaterLandData = (
          w: { quantity?: number; isImpactPresent?: boolean } | undefined
        ) => (w?.quantity != null || w?.isImpactPresent === false) ?? false;

        const normalizeAudit = (
          a:
            | {
                query?: Record<string, string>;
                result?: Record<string, unknown>;
              }
            | undefined
        ): DatabaseAuditData | undefined =>
          a?.result
            ? {
                query: a.query ?? {},
                result: a.result,
              }
            : undefined;

        //  infer confirmAccuracy when dataSource is 'manual' (user confirmed to save)
        const mapToManualImpactData = (): ManualImpactDataMap => ({
          CARBON: d.carbon
            ? {
                active: hasCarbonData(d.carbon),
                value:
                  d.carbon.quantity != null ? String(d.carbon.quantity) : '',
                lciaMethod: d.carbon.lciaMethodology ?? '',
                dataSource: d.carbon.dataSource ?? '',
                confirmAccuracy:
                  (d.carbon.dataSource === 'manual' || d.carbon.isSubmitted) ??
                  false,
                offsetting:
                  Boolean(d.carbon.offsetCarbonImpact) &&
                  d.carbon.offsetQuantity != null,
                offsetValue:
                  d.carbon.offsetQuantity != null
                    ? String(d.carbon.offsetQuantity)
                    : '',
                audit: normalizeAudit(d.carbon.audit),
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                offsetting: false,
                offsetValue: '',
              },
          WATER: d.water
            ? {
                active: hasWaterLandData(d.water),
                value: d.water.quantity != null ? String(d.water.quantity) : '',
                lciaMethod: d.water.lciaMethodology ?? '',
                dataSource: d.water.dataSource ?? '',
                confirmAccuracy:
                  (d.water.dataSource === 'manual' || d.water.isSubmitted) ??
                  false,
                noImpact: d.water.isImpactPresent === false,
                audit: normalizeAudit(d.water.audit),
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                noImpact: false,
              },
          LAND: d.land
            ? {
                active: hasWaterLandData(d.land),
                value: d.land.quantity != null ? String(d.land.quantity) : '',
                lciaMethod: d.land.lciaMethodology ?? '',
                dataSource: d.land.dataSource ?? '',
                confirmAccuracy:
                  (d.land.dataSource === 'manual' || d.land.isSubmitted) ??
                  false,
                noImpact: d.land.isImpactPresent === false,
                audit: normalizeAudit(d.land.audit),
              }
            : {
                active: false,
                value: '',
                lciaMethod: '',
                dataSource: '',
                confirmAccuracy: false,
                noImpact: false,
              },
        });

        setManualImpactData(mapToManualImpactData());

        const carbonCompleted =
          d.carbon?.isSubmitted === true ||
          (d.carbon != null && hasCarbonData(d.carbon));
        const waterCompleted =
          d.water?.isSubmitted === true ||
          d.water?.isImpactPresent === false ||
          (d.water != null &&
            d.water.quantity != null &&
            d.water.lciaMethodology != null);
        const landCompleted =
          d.land?.isSubmitted === true ||
          d.land?.isImpactPresent === false ||
          (d.land != null &&
            d.land.quantity != null &&
            d.land.lciaMethodology != null);
        setCompletedImpactSubSteps((prev) => ({
          ...prev,
          CARBON: d.carbon !== undefined ? carbonCompleted : prev.CARBON,
          WATER: d.water !== undefined ? waterCompleted : prev.WATER,
          LAND: d.land !== undefined ? landCompleted : prev.LAND,
        }));

        setCompletedFromApi((prev) => ({
          ...prev,
          CARBON: d.carbon !== undefined ? carbonCompleted : prev.CARBON,
          WATER: d.water !== undefined ? waterCompleted : prev.WATER,
          LAND: d.land !== undefined ? landCompleted : prev.LAND,
        }));
      } catch (err) {
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
  }, [componentId, supplierRoleSlug, currentStep, showSpinner, hideSpinner]);

  const handleSummaryExit = () => {
    setSummaryCompleted(true);
    if (flowContextKey) {
      setSummaryCompletedForContext(flowContextKey, true);
    }
    if (userRole === USER_ROLES.COMPANY) {
      navigate(
        `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCT_REQUEST_COMPONENT_DETAIL}/${productId}/${componentId}/${supplierRoleSlug}`
      );
      return;
    }
    handleRedirectToComponentDetails();
  };

  // Memoize current step content to prevent unnecessary re-renders
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY:
        return (
          <AddImpactCategory
            onNext={handleNext}
            onPrevious={handlePrevious}
            setActiveImpactSubStep={setActiveImpactSubStep}
            selectedOption="database"
            stage="select"
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
              supplierRoleSlug ?? undefined
            )}
            handleRedirectToComponentDetails={handleRedirectToComponentDetails}
            manualImpactData={manualImpactData}
            confirmAccuracy={confirmAccuracy}
            setManualImpactData={setManualImpactData}
            setConfirmAccuracy={setConfirmAccuracy}
            completedFromApi={completedFromApi}
            setCompletedFromApi={setCompletedFromApi}
            supplierRoleSlug={supplierRoleSlug ?? undefined}
            requestedImpactCategories={requestedImpactCategories}
            requestedSteps={requestedSteps}
            benchmarkingData={benchmarkingData ?? undefined}
          />
        );

      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.SUMMARY:
        return (
          <Summary onPrevious={handlePrevious} onExit={handleSummaryExit} />
        );
      case BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION:
      default:
        return (
          <Introduction
            onRedirectToProductDetails={handleRedirectToComponentDetails}
            onProceed={handleIntroductionProceed}
            requestedBy={
              componentDetails && 'requestSentBy' in componentDetails
                ? componentDetails.requestSentBy
                : undefined
            }
          />
        );
    }
  }, [
    currentStep,
    componentDetails,
    selectedRole,
    benchmarkingData,
    handleNext,
    handlePrevious,
    handleRedirectToComponentDetails,
    handleIntroductionProceed,
    activeIndex,
    completedImpactSubSteps,
    manualImpactData,
    confirmAccuracy,
    completedFromApi,
    supplierRoleSlug,
    requestedImpactCategories,
    requestedSteps,
  ]);

  // Memoize step navigation list to prevent unnecessary re-renders
  const stepNavigationList = useMemo(() => {
    return STEP_CONFIG.map((config) => {
      const isImpactStep = !!config.subSteps;

      const filteredSubSteps =
        isImpactStep && config.subSteps
          ? requestedCategoriesLoaded
            ? (Object.fromEntries(
                requestedSteps.map((s) => [
                  s,
                  (config.subSteps as Record<string, number>)[s],
                ])
              ) as typeof config.subSteps)
            : ({} as typeof config.subSteps)
          : config.subSteps;

      const activeSubStep =
        isImpactStep &&
        currentStep ===
          BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY
          ? (lastVisitedSubStep ?? activeImpactSubStep)
          : undefined;
      const completedSubSteps = isImpactStep
        ? {
            ...completedImpactSubSteps,
          }
        : completedImpactSubSteps;

      const isStepCompleted =
        config.step ===
        BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION
          ? Boolean(
              flowContextKey && introductionCompletedByContext?.[flowContextKey]
            ) ||
            isAnyStepCompleted ||
            currentStep > config.step
          : config.step ===
              BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.ADD_IMPACT_CATEGORY
            ? (requestedCategoriesLoaded && isAddImpactCategoryStepCompleted) ||
              maxStepReached >=
                BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.SUMMARY
            : config.step ===
                BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.SUMMARY
              ? summaryCompleted
              : currentStep > config.step || maxStepReached > config.step;

      return (
        <StepItem
          key={`built-env-supplier-step-${config.step}`}
          step={config.step}
          label={config.label}
          description={config.description}
          currentStep={currentStep}
          subSteps={filteredSubSteps}
          activeImpactSubStep={activeSubStep}
          setActiveImpactSubStep={
            isImpactStep
              ? (key) => {
                  setActiveImpactSubStep(key as keyof ImpactSubSteps);
                  setLastVisitedSubStep(key as keyof ImpactSubSteps);
                  const idx = requestedSteps.indexOf(
                    key as 'CARBON' | 'WATER' | 'LAND'
                  );
                  setActiveIndex(idx >= 0 ? idx + 1 : 1);
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
    activeImpactSubStep,
    flowContextKey,
    introductionCompletedByContext,
    isAddImpactCategoryStepCompleted,
    isAnyStepCompleted,
    summaryCompleted,
    maxStepReached,
    requestedSteps,
    requestedCategoriesLoaded,
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
              <h3 className={styles.stepTitle}>
                Build Your Environmental Profile
              </h3>

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
