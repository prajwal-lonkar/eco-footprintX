import { useEffect, useRef, useState, useCallback, type FC } from 'react';
import CarbonSupplierRequest from './steps/CarbonSupplierRequest';
import WaterSupplierRequest from './steps/WaterSupplierRequest';
import LandSupplierRequest from './steps/LandSupplierRequest';
import styles from './RequestFromSupplier.module.scss';

import parentStyles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/SelectDataSource/SelectDataSource.module.scss';
import type { BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS } from '@constants/built-environmental-profile-flow';
import { saveImpactCategory } from '@service/built-enviromental-profile.service';
import { useParams } from 'react-router-dom';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';

import type { ImpactOption } from '@type/built-enviromental-profile';
import Bugsnag from '@utils/bugsnag';
import { useSpinnerStore } from '@store/useSpinnerStore';
import type { BenchmarkingData } from '@utils/industryAvgComparison';
export type ImpactType = 'carbon' | 'water' | 'land';
type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS;
type Impact = 'CARBON' | 'WATER' | 'LAND';
type ImpactData = {
  value: string;
  lciaMethod: string;
  dataSource: string;
  confirmAccuracy: boolean;
  isRequested?: boolean;
};

interface RequestFromSupplierProps {
  onNext: () => void;
  onPrevious: () => void;
  selectedOption: string | null;

  setActiveImpactSubStep: any;
  handleBackFromSelect: () => void;
  componentData?: {
    supplierContactEmail?: string;
    supplierContactName?: string;
    supplierName?: string;
  };
  setCompletedImpactSubSteps: React.Dispatch<
    React.SetStateAction<Partial<Record<ImpactSubSteps, boolean>>>
  >;
  impactData: any;
  setImpactData: any;
  hideRequestFields: {
    CARBON: boolean;
    WATER: boolean;
    LAND: boolean;
  };
  setActiveIndex: (index: number) => void;

  setSelectedOption: React.Dispatch<React.SetStateAction<ImpactOption | null>>;
  completedFromApi?: Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>;
  setCompletedFromApi?: any;
  impactSourceRef: React.MutableRefObject<
    Record<'CARBON' | 'WATER' | 'LAND', ImpactOption | null>
  >;

  confirmAccuracy: boolean;
  setConfirmAccuracy: React.Dispatch<React.SetStateAction<boolean>>;
  roleDetailsId?: string;
  benchmarkingData?: BenchmarkingData | null;
  handleRedirectToComponentDetails?: () => void;
  onRefreshImpactData?: () => void;
  savedImpactSource?: Partial<
    Record<'CARBON' | 'WATER' | 'LAND', 'database' | 'request'>
  >;
}

const RequestFromSupplier: FC<RequestFromSupplierProps> = ({
  onNext,
  selectedOption,
  setActiveImpactSubStep,
  handleBackFromSelect,
  componentData,
  impactData,
  setImpactData,

  hideRequestFields,
  setActiveIndex,
  setSelectedOption,
  completedFromApi,

  setCompletedImpactSubSteps,

  setCompletedFromApi,
  impactSourceRef,
  confirmAccuracy,

  setConfirmAccuracy,
  roleDetailsId,
  benchmarkingData,
  handleRedirectToComponentDetails,
  onRefreshImpactData,
  savedImpactSource,
}) => {
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();
  // Track which checkboxes are selected
  const [selectedImpacts, setSelectedImpacts] = useState<ImpactType[]>([]);

  const [dirtyMap, setDirtyMap] = useState<Record<Impact, boolean>>({
    CARBON: false,
    WATER: false,
    LAND: false,
  });
  // Used to prevent initial hydration effects from overriding user actions (fixes flicker on unselect).
  const hasUserInteractedRef = useRef(false);
  const initialSelectedImpactsRef = useRef<ImpactType[] | null>(null);
  const initialRequestDataRef = useRef<
    Record<Impact, { value: string; lciaMethod: string; isRequested: boolean }>
  >({
    CARBON: { value: '', lciaMethod: '', isRequested: false },
    WATER: { value: '', lciaMethod: '', isRequested: false },
    LAND: { value: '', lciaMethod: '', isRequested: false },
  });

  const toggleRequestImpact = (impact: ImpactType) => {
    const key = impact.toUpperCase() as Impact;
    hasUserInteractedRef.current = true;

    const isCurrentlySelected = selectedImpacts.includes(impact);
    const updatedSelectedImpacts = isCurrentlySelected
      ? selectedImpacts.filter((i) => i !== impact)
      : [...selectedImpacts, impact];

    // Update selected impacts
    setSelectedImpacts(updatedSelectedImpacts);

    // Update impact data
    setImpactData((prevData: Record<Impact, ImpactData>) => {
      const current = prevData[key];
      const hasApiData = completedFromApi?.[key] === true;

      // UNCHECKING
      if (isCurrentlySelected) {
        if (hasApiData) {
          return {
            ...prevData,
            [key]: {
              ...current,
              confirmAccuracy: false,
            },
          };
        }

        return {
          ...prevData,
          [key]: {
            value: '',
            lciaMethod: '',
            dataSource: '',
            confirmAccuracy: false,
            isRequested: false,
          },
        };
      }

      // CHECKING
      return {
        ...prevData,
        [key]: {
          ...current,
          confirmAccuracy: false,
        },
      };
    });

    // Update confirm accuracy based on updated selected impacts
    const hasTempData = updatedSelectedImpacts.some((i) => {
      const k = i.toUpperCase() as Impact;
      const data = impactData[k];
      return Boolean(data?.value || data?.lciaMethod);
    });
    setConfirmAccuracy(hasTempData);
  };
  const updateImpactField = (
    impact: Impact,
    field: keyof ImpactData,
    value: string
  ) => {
    impactSourceRef.current[impact] ??= 'request';
    hasUserInteractedRef.current = true;

    //  Editing invalidates confirmation
    setConfirmAccuracy(false);
    setDirtyMap((prev) => ({ ...prev, [impact]: true }));
    setImpactData((prev: Record<Impact, ImpactData>) => ({
      ...prev,
      [impact]: {
        ...prev[impact],
        [field]: value,
        confirmAccuracy: false,
      },
    }));
  };

  useEffect(() => {
    if (selectedImpacts.length === 0) {
      setActiveImpactSubStep(null);
      return;
    }
    const last = selectedImpacts[selectedImpacts.length - 1];
    setActiveImpactSubStep(last.toUpperCase() as 'CARBON' | 'WATER' | 'LAND');
  }, [selectedImpacts, setActiveImpactSubStep]);

  const hasHydratedRef = useRef(false);
  // initially loaded temp values from backend (Request flow),

  const initialTempRequestRef = useRef<
    Partial<Record<'WATER' | 'LAND', { value: string; lciaMethod: string }>>
  >({});
  const prevSelectedImpactsRef = useRef<ImpactType[]>([]);
  const [hasPendingUnselectOfSaved, setHasPendingUnselectOfSaved] =
    useState(false);

  useEffect(() => {
    const prev = prevSelectedImpactsRef.current;
    const unselectedSaved = (['CARBON', 'WATER', 'LAND'] as Impact[]).some(
      (key) => {
        const lower = key.toLowerCase() as ImpactType;
        return (
          Boolean(completedFromApi?.[key]) &&
          prev.includes(lower) &&
          !selectedImpacts.includes(lower)
        );
      }
    );
    if (unselectedSaved) setHasPendingUnselectOfSaved(true);
    prevSelectedImpactsRef.current = selectedImpacts;
  }, [selectedImpacts, completedFromApi]);

  useEffect(() => {
    if (hasUserInteractedRef.current) return;

    const selected: ImpactType[] = [];

    if (
      impactData.CARBON?.value ||
      impactData.CARBON?.lciaMethod ||
      impactData.CARBON?.isRequested
    )
      selected.push('carbon');

    if (
      impactData.WATER?.value ||
      impactData.WATER?.lciaMethod ||
      impactData.WATER?.isRequested
    )
      selected.push('water');

    if (
      impactData.LAND?.value ||
      impactData.LAND?.lciaMethod ||
      impactData.LAND?.isRequested
    )
      selected.push('land');

    // Sync when impactData has request data (initial load or API data arrived after mount)
    if (selected.length > 0) {
      setSelectedImpacts(selected);
      initialTempRequestRef.current.WATER = {
        value: impactData.WATER?.value ?? '',
        lciaMethod: impactData.WATER?.lciaMethod ?? '',
      };
      initialTempRequestRef.current.LAND = {
        value: impactData.LAND?.value ?? '',
        lciaMethod: impactData.LAND?.lciaMethod ?? '',
      };
      hasHydratedRef.current = true;
    }

    if (initialSelectedImpactsRef.current === null) {
      initialSelectedImpactsRef.current = [...selected];
      initialRequestDataRef.current = {
        CARBON: {
          value: impactData.CARBON?.value ?? '',
          lciaMethod: impactData.CARBON?.lciaMethod ?? '',
          isRequested: Boolean(impactData.CARBON?.isRequested),
        },
        WATER: {
          value: impactData.WATER?.value ?? '',
          lciaMethod: impactData.WATER?.lciaMethod ?? '',
          isRequested: Boolean(impactData.WATER?.isRequested),
        },
        LAND: {
          value: impactData.LAND?.value ?? '',
          lciaMethod: impactData.LAND?.lciaMethod ?? '',
          isRequested: Boolean(impactData.LAND?.isRequested),
        },
      };
    }
  }, [impactData]);

  const hasRequestChanges = useCallback(() => {
    const initialSelected = initialSelectedImpactsRef.current ?? [];
    const currentSelectedSorted = [...selectedImpacts].sort();
    const initialSelectedSorted = [...initialSelected].sort();

    const selectionChanged =
      JSON.stringify(currentSelectedSorted) !==
      JSON.stringify(initialSelectedSorted);

    const valueChanged = (['CARBON', 'WATER', 'LAND'] as Impact[]).some(
      (key) => {
        const current = impactData[key];
        const initial = initialRequestDataRef.current[key];
        return (
          (current?.value ?? '') !== initial.value ||
          (current?.lciaMethod ?? '') !== initial.lciaMethod ||
          Boolean(
            currentSelectedSorted.includes(key.toLowerCase() as ImpactType)
          ) !== initial.isRequested
        );
      }
    );

    const dirtyChanged = Object.values(dirtyMap).some(Boolean);
    return selectionChanged || valueChanged || dirtyChanged;
  }, [selectedImpacts, impactData, dirtyMap]);

  const shouldSendIsUpdated = (impactKey: 'WATER' | 'LAND') => {
    const initial = initialTempRequestRef.current[impactKey];
    if (!initial) return false;

    // Only when there were previously-saved temp values
    const hadInitialTemp = Boolean(initial.value || initial.lciaMethod);
    if (!hadInitialTemp) return false;

    // Only for the step that was actually edited
    if (!dirtyMap[impactKey]) return false;

    const current = impactData[impactKey];
    const currentValue = current?.value ?? '';
    const currentLcia = current?.lciaMethod ?? '';

    return currentValue !== initial.value || currentLcia !== initial.lciaMethod;
  };

  useEffect(() => {
    const allSelectedSubSteps = selectedImpacts.map(
      (i) => i.toUpperCase() as ImpactSubSteps
    );

    setActiveImpactSubStep(
      allSelectedSubSteps.length > 0 ? allSelectedSubSteps : []
    );
  }, [selectedImpacts, setActiveImpactSubStep]);

  const { componentId, roleSlug } = useParams<{
    componentId: string;
    roleSlug: string;
  }>();

  const mapImpactPayload = (impact: ImpactType) => {
    const key = impact.toUpperCase() as Impact;
    const data = impactData[key];

    // If impact is not selected → skip
    if (!selectedImpacts.includes(impact)) {
      return {
        tempQuantity: null,
        tempUnit: null,
        tempLciaMethodology: null,
        isRequested: false,
        isSaveAndExit: false,
      };
    }

    // If user confirmed but didn’t fill data → mark isRequested true
    if (!data.value || !data.lciaMethod) {
      return {
        tempQuantity: data.value ? Number(data.value) : null,
        tempUnit: data.unit || null,
        tempLciaMethodology: data.lciaMethod || null,
        isRequested: true,
        isSaveAndExit: false,
      };
    }

    // Normal payload
    switch (impact) {
      case 'carbon':
        return {
          tempQuantity: Number(data.value),
          tempUnit: 'kg CO2-eq/unit',
          tempLciaMethodology: data.lciaMethod,
          isRequested: true,
          isSaveAndExit: false,
        };
      case 'water':
        return {
          tempQuantity: Number(data.value),
          tempUnit: 'm3/unit',
          tempLciaMethodology: data.lciaMethod,
          ...(shouldSendIsUpdated('WATER') ? { isUpdated: true } : {}),
          isRequested: true,
          isSaveAndExit: false,
        };
      case 'land':
        return {
          tempQuantity: Number(data.value),
          tempUnit: 'm2/unit',
          tempLciaMethodology: data.lciaMethod,
          ...(shouldSendIsUpdated('LAND') ? { isUpdated: true } : {}),
          isRequested: true,
          isSaveAndExit: false,
        };
    }
  };
  const mapImpactPayloadWithSaveExit = (
    impact: ImpactType,
    isSaveAndExit: boolean
  ) => {
    const payload = mapImpactPayload(impact);

    // For Save & Exit: keep isRequested true for selected impacts so backend persists
    // the request state. isSaveAndExit tells backend not to send the email.
    if (isSaveAndExit) {
      return {
        ...payload,
        // Preserve isRequested for selected impacts; backend needs it to persist state
        isRequested: selectedImpacts.includes(impact)
          ? true
          : payload.isRequested,
        isSaveAndExit: true,
      };
    }

    return payload;
  };

  const handleSaveAndContinue = async (isSaveAndExit: boolean) => {
    const impactCategoryId = roleDetailsId;
    if (!impactCategoryId || !componentId) return;

    if (!hasRequestChanges()) {
      if (isSaveAndExit) {
        onRefreshImpactData?.();
        handleRedirectToComponentDetails?.();
        return;
      }
      showAlert(ERROR_MESSAGES.EMAIL_REQUEST_ALREADY_SENT);
      onNext();
      return;
    }

    const payload = {
      supplierLinkedRole: roleSlug,
      supplierContactName: componentData?.supplierContactName || '',
      supplierContactEmail: componentData?.supplierContactEmail || '',
      supplierName: componentData?.supplierName || '',
      carbon: mapImpactPayloadWithSaveExit('carbon', isSaveAndExit),
      water: mapImpactPayloadWithSaveExit('water', isSaveAndExit),
      land: mapImpactPayloadWithSaveExit('land', isSaveAndExit),

      isSaveAndExit,
    };

    showSpinner();
    try {
      const response = await saveImpactCategory(
        impactCategoryId,
        componentId,
        payload
      );

      const hadPreviousRequest =
        (initialSelectedImpactsRef.current?.length ?? 0) > 0;

      if (
        !isSaveAndExit &&
        response.statusCode === 201 &&
        !hadPreviousRequest &&
        response.data.mailTriggeredMessage === 'mail sent'
      ) {
        showAlert(
          SUCCESS_MESSAGES.REQUESTDATA_EMAIL_TO_SUPPLIER_SENT_SUCCESSFULLY
        );
      } else if (
        !isSaveAndExit &&
        response.statusCode === 201 && 
        !response.data.mailTriggeredMessage
      ) {
        showAlert(
          SUCCESS_MESSAGES.REQUESTDATA_UPDATED_EMAIL_TO_SUPPLIER_SENT_SUCCESSFULLY
        );
      }

      if (response.statusCode === 201) {
        setHasPendingUnselectOfSaved(false);

        setImpactData((prev: Record<Impact, ImpactData>) => {
          const updated = { ...prev };

          (['CARBON', 'WATER', 'LAND'] as Impact[]).forEach((key) => {
            const isSelected = selectedImpacts.includes(
              key.toLowerCase() as ImpactType
            );

            updated[key] = {
              ...updated[key],
              isRequested: isSelected ? !isSaveAndExit : false,
              confirmAccuracy: isSelected ? true : false,
            };
          });

          return updated;
        });

        // keep checkboxes selected
        setSelectedImpacts((prev) => [...prev]);

        // confirm stays checked
        setConfirmAccuracy(true);
        const updatedImpactData: Record<Impact, ImpactData> = { ...impactData };
        selectedImpacts.forEach((impact) => {
          const key = impact.toUpperCase() as Impact;
          updatedImpactData[key] = {
            ...updatedImpactData[key],

            confirmAccuracy: true,
            isRequested: isSaveAndExit ? false : true,
          };
        });
        if (isSaveAndExit) {
          onRefreshImpactData?.();
          return handleRedirectToComponentDetails?.();
        }

        const savedImpacts = selectedImpacts.map(
          (i) => i.toUpperCase() as Impact
        );

        setDirtyMap((prev) => {
          const updated = { ...prev };
          savedImpacts.forEach((impact) => {
            updated[impact] = false;
          });
          return updated;
        });

        // Store previous completedFromApi before updating, to use in redirect logic
        const prevCompletedFromApi = completedFromApi;

        // Store previous source information before refresh (capture current state)
        const getPrevSource = (
          impactKey: Impact
        ): 'database' | 'request' | undefined => {
          const saved = savedImpactSource?.[impactKey];
          if (saved === 'database' || saved === 'request') return saved;
          const refValue = impactSourceRef.current[impactKey];
          if (refValue === 'database' || refValue === 'request')
            return refValue;
          return undefined;
        };

        const prevSavedImpactSource: Partial<
          Record<Impact, 'database' | 'request'>
        > = {
          CARBON: getPrevSource('CARBON'),
          WATER: getPrevSource('WATER'),
          LAND: getPrevSource('LAND'),
        };

        setCompletedImpactSubSteps((prev) => ({
          ...prev,
          CARBON: selectedImpacts.includes('carbon'),
          WATER: selectedImpacts.includes('water'),
          LAND: selectedImpacts.includes('land'),
        }));
        setCompletedFromApi((prev: any) => ({
          ...prev,
          CARBON: selectedImpacts.includes('carbon'),
          WATER: selectedImpacts.includes('water'),
          LAND: selectedImpacts.includes('land'),
        }));

        onRefreshImpactData?.();

        const getFirstIncompleteStep = (
          completed?: Partial<Record<Impact, boolean>>
        ): Impact | null => {
          if (!completed?.CARBON) return 'CARBON';
          if (!completed?.WATER) return 'WATER';
          if (!completed?.LAND) return 'LAND';
          return null;
        };

        const isImpactComplete = (
          impact: 'carbon' | 'water' | 'land',
          impactKey: Impact
        ): boolean => {
          // If in selectedImpacts, it's being saved from Request → complete
          if (selectedImpacts.includes(impact)) return true;

          const prevSource = prevSavedImpactSource[impactKey];

          if (
            prevCompletedFromApi?.[impactKey] === true &&
            !selectedImpacts.includes(impact)
          ) {
            // If it was from Request and now unselected → incomplete
            if (prevSource === 'request') {
              return false;
            }
            // If it was from database, treat as complete (from Select Data Source)
            if (prevSource === 'database') {
              return true;
            }

            if (prevSource === undefined) {
              return false;
            }
          }

          // If explicitly saved from Select Data Source → complete
          if (savedImpactSource?.[impactKey] === 'database') return true;

          // If saved from Request and not in selectedImpacts → incomplete
          if (savedImpactSource?.[impactKey] === 'request') return false;

          // Fallback: if previously completed and not from Request → assume Select Data Source → complete
          return (
            prevCompletedFromApi?.[impactKey] === true &&
            prevSource !== 'request'
          );
        };

        const nextCompleted = {
          CARBON: isImpactComplete('carbon', 'CARBON'),
          WATER: isImpactComplete('water', 'WATER'),
          LAND: isImpactComplete('land', 'LAND'),
        };
        const nextIncomplete = getFirstIncompleteStep(nextCompleted);

        if (!nextIncomplete) {
          onNext();
          return;
        }

        const tabIndexMap: Record<Impact, number> = {
          CARBON: 1,
          WATER: 2,
          LAND: 3,
        };

        setSelectedOption('database');
        setActiveIndex(tabIndexMap[nextIncomplete]);
        setActiveImpactSubStep(nextIncomplete);
      }
    } catch (error: any) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'RequestFromSupplier',
          method: 'handleSaveAndContinue',
        });
      });

      showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
    } finally {
      hideSpinner();
    }
  };

  const areAllSelectedImpactsAlreadyCompleted =
    selectedImpacts.length > 0 &&
    selectedImpacts.every((impact) => {
      const key = impact.toUpperCase() as Impact;
      return completedFromApi?.[key] === true;
    });
  const hasUserEditedAnything = selectedImpacts.some((impact) => {
    const key = impact.toUpperCase() as Impact;
    return dirtyMap[key];
  });
  const needsReconfirmation = hasUserEditedAnything && !confirmAccuracy;

  const hasAnyTempDataInSelection =
    selectedImpacts.length > 0 &&
    selectedImpacts.some((impact) => {
      const key = impact.toUpperCase() as Impact;
      const data = impactData[key];

      return Boolean(data?.value) || Boolean(data?.lciaMethod);
    });

  const areSelectedImpactsValid =
    selectedImpacts.length > 0 &&
    selectedImpacts.every((impact) => {
      const key = impact.toUpperCase() as Impact;
      const data = impactData[key];

      const hasValue = Boolean(data?.value);
      const hasLcia = Boolean(data?.lciaMethod);

      // request-only (no value AND no LCIA) → valid, enable Save & Continue

      if (!hasValue && !hasLcia) {
        return true;
      }

      // partial manual data (only value OR only LCIA) → invalid
      if (hasValue !== hasLcia) {
        return false;
      }

      // full manual data (both value AND LCIA) → confirm required
      return data.confirmAccuracy === true;
    });

  // Check if current state has invalid partial data

  const hasInvalidPartialData = selectedImpacts.some((impact) => {
    const key = impact.toUpperCase() as Impact;
    const data = impactData[key];
    const hasValue = Boolean(data?.value);
    const hasLcia = Boolean(data?.lciaMethod);
    // Invalid if only one field exists (partial data)
    return hasValue !== hasLcia;
  });

  const isFormValid =
    !(hasAnyTempDataInSelection && !confirmAccuracy) &&
    !hasInvalidPartialData &&
    ((!needsReconfirmation && areAllSelectedImpactsAlreadyCompleted) ||
      areSelectedImpactsValid ||
      hasPendingUnselectOfSaved);

  useEffect(() => {
    if (!impactData) return;
    if (hasUserInteractedRef.current) return;

    const selected: ImpactType[] = [];
    const updatedImpactData: Record<Impact, ImpactData> = { ...impactData };
    const completedSubSteps: Partial<Record<Impact, boolean>> = {};
    let shouldAutoConfirm = false;

    (['CARBON', 'WATER', 'LAND'] as Impact[]).forEach((key) => {
      const data = impactData[key];

      const hasValue = Boolean(data?.value);
      const hasLcia = Boolean(data?.lciaMethod);
      const isRequested = Boolean(data?.isRequested);

      const hasFullTemp = hasValue && hasLcia;

      if (hasFullTemp) shouldAutoConfirm = true;
      updatedImpactData[key] = {
        value: data?.value || '',
        lciaMethod: data?.lciaMethod || '',
        dataSource: data?.dataSource || '',

        confirmAccuracy: hasFullTemp,
        isRequested,
      };

      // THIS is the missing piece
      if (isRequested || data?.value || data?.lciaMethod) {
        selected.push(key.toLowerCase() as ImpactType);
      }
    });

    setImpactData(updatedImpactData);
    setSelectedImpacts(selected);

    setCompletedImpactSubSteps((prev) => ({ ...prev, ...completedSubSteps }));
    setCompletedFromApi?.((prev: any) => ({ ...prev, ...completedSubSteps }));

    setConfirmAccuracy(shouldAutoConfirm);
  }, []);

  const hasStartedTyping = selectedImpacts.some((impact) => {
    const key = impact.toUpperCase() as Impact;
    const data = impactData[key];
    return Boolean(data?.value || data?.lciaMethod);
  });

  const showConfirmRequired = hasStartedTyping || confirmAccuracy;

  const areAllSelectedRequestFieldsHidden =
    selectedImpacts.length > 0 &&
    selectedImpacts.every((impact) => {
      const key = impact.toUpperCase() as Impact;
      return hideRequestFields[key];
    });

  return (
    <div className={styles.wrapper}>
      <div className={styles.supplierForm}>
        {/* Supplier Info */}
        <div className={styles.inputGroup}>
          <div className={styles.formGroup}>
            <label>
              Supplier Contact Name <span className={styles.required}>*</span>
            </label>
            <input
              disabled
              value={componentData?.supplierContactName ?? ''}
              className={styles.disabledInputBox}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              Supplier Contact Email <span className={styles.required}>*</span>
            </label>
            <input
              disabled
              value={componentData?.supplierContactEmail ?? ''}
              className={styles.disabledInputBox}
            />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <p className={styles.helperText}>
            Email request will be sent to your supplier requesting impact
            category data for this specific component or service
          </p>
          <div className={styles.checkboxWrap}>
            {(['carbon', 'water', 'land'] as const).map((impact) => (
              <div key={impact} className={styles.multiselectWrap}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedImpacts.includes(impact)}
                    onChange={() => {
                      toggleRequestImpact(impact);
                    }}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.Checkbox}></span>
                </label>
                <p>{impact.charAt(0).toUpperCase() + impact.slice(1)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.compoWrapper}>
          {selectedImpacts.length > 0 && !areAllSelectedRequestFieldsHidden && (
            <p className={styles.requestText}>
              * While you are waiting for your supplier to respond to your data
              request, you can manually submit temporary data in the meantime.
            </p>
          )}

          {selectedImpacts.includes('carbon') && !hideRequestFields.CARBON && (
            <CarbonSupplierRequest
              data={impactData.CARBON}
              onChange={(f, v) =>
                updateImpactField('CARBON'.toUpperCase() as Impact, f, v)
              }
              benchmarkValue={benchmarkingData?.carbonBenchmarkingData}
            />
          )}

          {selectedImpacts.includes('water') && !hideRequestFields.WATER && (
            <WaterSupplierRequest
              data={impactData.WATER}
              onChange={(f, v) =>
                updateImpactField('WATER'.toUpperCase() as Impact, f, v)
              }
              benchmarkValue={benchmarkingData?.waterBenchmarkingData}
            />
          )}

          {selectedImpacts.includes('land') && !hideRequestFields.LAND && (
            <LandSupplierRequest
              data={impactData.LAND}
              onChange={(f, v) =>
                updateImpactField('LAND'.toUpperCase() as Impact, f, v)
              }
              benchmarkValue={benchmarkingData?.landBenchmarkingData}
            />
          )}

          {selectedImpacts.length > 0 &&
            !areAllSelectedRequestFieldsHidden &&
            hasStartedTyping && (
              <>
                {/* Accuracy Confirmation */}
                <div className={styles.confirmWrapper}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={confirmAccuracy}
                      onChange={(e) => {
                        const checked = e.target.checked;

                        setConfirmAccuracy(checked);

                        setImpactData((prev: Record<Impact, ImpactData>) => {
                          const updated = { ...prev };
                          selectedImpacts.forEach((i) => {
                            const key = i.toUpperCase() as Impact;

                            updated[key] = {
                              ...updated[key],
                              confirmAccuracy: checked,
                            };
                          });
                          return updated;
                        });
                      }}
                      className={styles.checkboxInput}
                    />
                    <span
                      className={styles.Checkbox}
                      style={{ marginTop: '3px' }}
                    ></span>
                  </label>

                  <p>
                    {' '}
                    I confirm that the data provided is accurate to the best of
                    my knowledge{' '}
                    {showConfirmRequired && (
                      <span className={styles.required}> *</span>
                    )}
                  </p>
                </div>
              </>
            )}
          {/* Footer */}
        </div>
        {selectedOption === 'request' && (
          <div className={parentStyles.footerActions}>
            <button
              className={parentStyles.secondaryButton}
              onClick={handleBackFromSelect}
            >
              Go Back
            </button>
            <button
              className={parentStyles.tertiaryButton}
              disabled={!isFormValid}
              onClick={() => handleSaveAndContinue(true)}
            >
              Save and Exit
            </button>
            <button
              className={parentStyles.primaryButton}
              onClick={() => handleSaveAndContinue(false)}
              disabled={!isFormValid}
            >
              Save & Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestFromSupplier;
