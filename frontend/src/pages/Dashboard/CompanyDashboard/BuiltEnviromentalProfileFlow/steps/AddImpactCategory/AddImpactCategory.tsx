import { memo, useCallback, useRef, type ReactNode } from 'react';
import styles from './AddImpactCategory.module.scss';
import Overview from './Overview/Overview';
import SelectDataSource from './SelectDataSource/SelectDataSource';
import RequestFromSupplier from './RequestFromSupplier/RequestFromSupplier';
import type { BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS } from '@constants/built-environmental-profile-flow';
import { useParams } from 'react-router-dom';
import Bugsnag from '@utils/bugsnag';
import { saveImpactCategory } from '@service/built-enviromental-profile.service';
import type {
  ImpactOption,
  ManualImpactDataMap,
  RequestImpactDataMap,
} from '@type/built-enviromental-profile';
import type { ComponentDetails } from '@type/product-components';
import { ERROR_MESSAGES } from '@constants/messages';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import type { BenchmarkingData } from '@utils/industryAvgComparison';

type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUBSTEPS;

type Impact = 'CARBON' | 'WATER' | 'LAND';
interface AddImpactCategoryProps {
  onNext: () => void;
  onPrevious: () => void;

  markOverviewCompleted: () => void;
  setActiveImpactSubStep: React.Dispatch<
    React.SetStateAction<ImpactSubSteps | ImpactSubSteps[] | null>
  >;
  selectedOption: string | null;
  setSelectedOption: React.Dispatch<React.SetStateAction<ImpactOption | null>>;
  stage: 'intro' | 'select';
  setStage: React.Dispatch<React.SetStateAction<'intro' | 'select'>>;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleBackFromSelect: any;
  setCompletedImpactSubSteps: React.Dispatch<
    React.SetStateAction<Partial<Record<ImpactSubSteps, boolean>>>
  >;
  completedImpactSubSteps: Partial<Record<ImpactSubSteps, boolean>>;
  detailsCard?: ReactNode;
  componentDetails: ComponentDetails | null;
  roleDetailsId?: string;
  handleRedirectToComponentDetails?: () => void;
  requestImpactData: RequestImpactDataMap;
  setRequestImpactData: React.Dispatch<
    React.SetStateAction<RequestImpactDataMap>
  >;

  manualImpactData: ManualImpactDataMap;

  setManualImpactData: React.Dispatch<
    React.SetStateAction<ManualImpactDataMap>
  >;
  confirmAccuracy: boolean;
  setConfirmAccuracy: React.Dispatch<React.SetStateAction<boolean>>;

  completedFromApi: Partial<Record<Impact, boolean>>;

  setCompletedFromApi: React.Dispatch<
    React.SetStateAction<Partial<Record<Impact, boolean>>>
  >;
  onRefreshImpactData?: () => void;
  savedImpactSource?: Partial<Record<Impact, 'database' | 'request'>>;
  benchmarkingData?: BenchmarkingData;
}

const AddImpactCategory = memo(
  ({
    onNext,
    onPrevious,
    markOverviewCompleted,
    setActiveImpactSubStep,

    activeIndex,
    selectedOption,
    setSelectedOption,
    stage,
    setStage,
    setActiveIndex,

    handleBackFromSelect,
    setCompletedImpactSubSteps,
    detailsCard,
    componentDetails,
    roleDetailsId,
    handleRedirectToComponentDetails,
    requestImpactData,
    setRequestImpactData,

    manualImpactData,

    setConfirmAccuracy,
    confirmAccuracy,
    setManualImpactData,
    setCompletedFromApi,
    completedFromApi,
    onRefreshImpactData,
    savedImpactSource,

    benchmarkingData,
  }: AddImpactCategoryProps) => {
    const { showAlert } = useAlertStore();

    const { showSpinner, hideSpinner } = useSpinnerStore();

    const { componentId, roleSlug } = useParams<{
      productId: string;
      componentId: string;
      roleSlug: string;
    }>();
    const handleProceed = useCallback(async () => {
      if (!componentId || !roleSlug) return;

      const impactCategoryId = roleDetailsId;
      if (!impactCategoryId) return;

      const payload = {
        supplierLinkedRole: roleSlug,
        carbon: null,
        water: null,
        land: null,

        isSaveAndExit: true,
      };
      showSpinner();
      try {
        await saveImpactCategory(impactCategoryId, componentId, payload);

        // UI flow only after backend success
        setStage('select');
        setActiveImpactSubStep(null);
        markOverviewCompleted();
      } catch (err) {
        Bugsnag.notify(err as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddImpactCategory',
            method: 'handleProceed',
          });
        });
        showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
      } finally {
        hideSpinner();
      }
    }, [
      componentId,
      roleSlug,
      roleDetailsId,
      showSpinner,
      hideSpinner,
      showAlert,
      markOverviewCompleted,
      setStage,
      setActiveImpactSubStep,
    ]);

    const onImpactOptionSelect = useCallback(
      (option: ImpactOption) => {
        showSpinner();
        setSelectedOption(option);

        if (option === 'database') {
          setActiveImpactSubStep('CARBON');
          setActiveIndex(1);
        } else {
          setActiveImpactSubStep(null);
        }
        hideSpinner();
      },
      [
        setSelectedOption,
        setActiveImpactSubStep,
        setActiveIndex,
        showSpinner,
        hideSpinner,
      ]
    );

    const isOptionSelected = Boolean(selectedOption);

    const canProceed = isOptionSelected;
    const activeImpact = (['CARBON', 'WATER', 'LAND'] as const)[activeIndex - 1];
    const isUsingDatabaseForActiveImpact =
      selectedOption === 'database' &&
      manualImpactData?.[activeImpact]?.dataSource === 'database';
    const titleDescription = isUsingDatabaseForActiveImpact
      ? 'Search and select an impact category value from a comparable component or service in our database'
      : 'Please select how you would like to collect impact category data for this component or service';

    const initialDatabaseImpactRef = useRef<ManualImpactDataMap | null>(null);

    const impactSourceRef = useRef<Record<Impact, ImpactOption | null>>({
      CARBON: null,
      WATER: null,
      LAND: null,
    });

    const shouldHideRequestFields = (
      impact: Impact,
      _manualImpactData: ManualImpactDataMap,
      requestImpactData: Record<Impact, any>
    ) => {
      const source = impactSourceRef.current[impact];

      // If any request data exists → never hide
      if (
        requestImpactData[impact]?.value ||
        requestImpactData[impact]?.lciaMethod
      ) {
        return false;
      }

      // If source is 'request', never hide
      if (source === 'request') return false;

      // Only hide when this impact was *saved* via Select Data Source (database).
      // Unsaved manual data must not block Request from Supplier.
      if (
        completedFromApi?.[impact] &&
        savedImpactSource?.[impact] === 'database'
      ) {
        return true;
      }

      return false;
    };

    return (
      <div className={styles.wrapper}>
        <div className={styles.mainTitle}>
          <h3>Add Impact Category Data</h3>
          <p>{titleDescription}</p>
        </div>
        {stage === 'intro' && (
          <Overview onOverviewProceed={handleProceed} onPrevious={onPrevious} />
        )}

        {stage === 'select' && (
          <>
            <div className={styles.impactCategoryWrapper}>
              {detailsCard}
              {/* Radio Buttons */}
              <div className={styles.sourceWrapper}>
                <div className={styles.source}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="overviewOption"
                      value="request"
                      checked={selectedOption === 'request'}
                      onChange={() => onImpactOptionSelect('request')}
                    />
                    <span className={styles.customRadio} />

                    <div className={styles.sourceContent}>
                      <h2>Request Data from Supplier</h2>
                      <p>
                        Request data from your supplier by sending an email for
                        one or more selected impact categories
                      </p>
                    </div>
                  </label>
                </div>

                <div className={styles.source}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="overviewOption"
                      value="database"
                      checked={selectedOption === 'database'}
                      onChange={() => onImpactOptionSelect('database')}
                    />
                    <span className={styles.customRadio} />
                    <div className={styles.sourceContent}>
                      <h2>Select Data Source</h2>
                      <p>
                        Select a data source yourself. Either enter data
                        manually or use our database
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {selectedOption === 'request' && (
                <RequestFromSupplier
                  onPrevious={onPrevious}
                  onNext={onNext}
                  selectedOption={selectedOption}
                  roleDetailsId={roleDetailsId}
                  benchmarkingData={benchmarkingData}
                  setActiveImpactSubStep={setActiveImpactSubStep}
                  handleBackFromSelect={handleBackFromSelect}
                  componentData={
                    componentDetails
                      ? {
                          supplierContactEmail:
                            componentDetails.supplierContactEmail,
                          supplierContactName:
                            componentDetails.supplierContactName,
                          supplierName: componentDetails.supplierName,
                        }
                      : undefined
                  }
                  impactData={requestImpactData}
                  setImpactData={setRequestImpactData}
                  setCompletedImpactSubSteps={setCompletedImpactSubSteps}
                  hideRequestFields={{
                    CARBON: shouldHideRequestFields(
                      'CARBON',
                      manualImpactData,
                      requestImpactData
                    ),
                    WATER: shouldHideRequestFields(
                      'WATER',
                      manualImpactData,
                      requestImpactData
                    ),
                    LAND: shouldHideRequestFields(
                      'LAND',
                      manualImpactData,
                      requestImpactData
                    ),
                  }}
                  setSelectedOption={setSelectedOption}
                  setActiveIndex={setActiveIndex}
                  completedFromApi={completedFromApi}
                  setCompletedFromApi={setCompletedFromApi}
                  impactSourceRef={impactSourceRef}
                  confirmAccuracy={confirmAccuracy}
                  setConfirmAccuracy={setConfirmAccuracy}
                  handleRedirectToComponentDetails={
                    handleRedirectToComponentDetails
                  }
                  onRefreshImpactData={onRefreshImpactData}
                  savedImpactSource={savedImpactSource}
                />
              )}
              {selectedOption === 'database' && (
                <SelectDataSource
                  onPrevious={onPrevious}
                  onNext={onNext}
                  roleDetailsId={roleDetailsId}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  setActiveImpactSubStep={setActiveImpactSubStep}
                  handleBackFromSelect={handleBackFromSelect}
                  impactData={manualImpactData}
                  setImpactData={setManualImpactData}
                  initialImpactData={initialDatabaseImpactRef.current}
                  setCompletedImpactSubSteps={setCompletedImpactSubSteps}
                  completedFromApi={completedFromApi}
                  handleRedirectToComponentDetails={
                    handleRedirectToComponentDetails
                  }
                  setCompletedFromApi={setCompletedFromApi}
                  impactSourceRef={impactSourceRef}
                  benchmarkingData={benchmarkingData}
                  componentData={
                    componentDetails
                      ? {
                          supplierContactEmail:
                            componentDetails.supplierContactEmail,
                          supplierContactName:
                            componentDetails.supplierContactName,
                          supplierName: componentDetails.supplierName,
                        }
                      : undefined
                  }
                />
              )}
            </div>
          </>
        )}

        {!selectedOption && stage !== 'intro' && (
          <div className={styles.footerActions}>
            <button
              className={styles.secondaryButton}
              onClick={handleBackFromSelect}
            >
              Go Back
            </button>

            <button className={styles.tertiaryButton} disabled={!canProceed}>
              Save and Exit
            </button>

            <button
              className={styles.primaryButton}
              onClick={onNext}
              disabled={!canProceed}
            >
              Save & Continue
            </button>
          </div>
        )}
      </div>
    );
  }
);

AddImpactCategory.displayName = 'AddImpactCategory';

export default AddImpactCategory;
