import { memo, useRef, type ReactNode } from 'react';
import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/AddImpactCategory.module.scss';
import SelectDataSource from './SelectDataSource/SelectDataSource';
import type { BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS } from '@constants/built-environmental-profile-flow';
import type {
  ImpactOption,
  ManualImpactDataMap,
} from '@type/built-enviromental-profile';
import type { BenchmarkingData } from '@utils/industryAvgComparison';
import type { ComponentDetails } from '@type/product-components';
import type { SupplierComponentDetails } from '@type/supplier';

type ImpactSubSteps =
  keyof typeof BUILT_ENVIRONMENTAL_ADD_IMPACT_CATEGORY_SUPPLIER_SUBSTEPS;

type Impact = 'CARBON' | 'WATER' | 'LAND';
interface AddImpactCategoryProps {
  onNext: () => void;
  onPrevious: () => void;
  setActiveImpactSubStep: React.Dispatch<
    React.SetStateAction<ImpactSubSteps | ImpactSubSteps[] | null>
  >;

  selectedOption: string | null;
  stage: 'select';
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleBackFromSelect: () => void;
  setCompletedImpactSubSteps: React.Dispatch<
    React.SetStateAction<Partial<Record<ImpactSubSteps, boolean>>>
  >;
  completedImpactSubSteps: Partial<Record<ImpactSubSteps, boolean>>;
  detailsCard?: ReactNode;
  componentDetails: ComponentDetails | SupplierComponentDetails | null | any;
  roleDetailsId?: string;
  handleRedirectToComponentDetails?: () => void;
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
  supplierRoleSlug?: string;
  requestedImpactCategories?: Record<'CARBON' | 'WATER' | 'LAND', boolean>;
  requestedSteps?: readonly ('CARBON' | 'WATER' | 'LAND')[];
  benchmarkingData?: BenchmarkingData;
}

const AddImpactCategory = memo<AddImpactCategoryProps>(
  ({
    onNext,
    onPrevious,
    setActiveImpactSubStep,
    activeIndex,
    selectedOption,
    setActiveIndex,
    handleBackFromSelect,
    setCompletedImpactSubSteps,
    detailsCard,
    componentDetails: _componentDetails,
    roleDetailsId,
    handleRedirectToComponentDetails,
    manualImpactData,
    setConfirmAccuracy: _setConfirmAccuracy,
    confirmAccuracy: _confirmAccuracy,
    setManualImpactData,
    setCompletedFromApi,
    completedFromApi,
    supplierRoleSlug,
    requestedImpactCategories = { CARBON: true, WATER: true, LAND: true },
    requestedSteps = ['CARBON', 'WATER', 'LAND'] as const,
    benchmarkingData,
  }) => {
    const initialDatabaseImpactRef = useRef<ManualImpactDataMap | null>(null);
    const impactSourceRef = useRef<Record<Impact, ImpactOption | null>>({
      CARBON: null,
      WATER: null,
      LAND: null,
    });
    const activeImpact = requestedSteps[activeIndex - 1];
    const isUsingDatabaseForActiveImpact =
      selectedOption === 'database' &&
      activeImpact != null &&
      manualImpactData?.[activeImpact]?.dataSource === 'database';
    const titleDescription = isUsingDatabaseForActiveImpact
      ? 'Search and select an impact category value from a comparable component or service in our database'
      : 'Provide the impact category value you have measured or estimated for this component or service';

    return (
      <div className={styles.wrapper}>
        <div className={styles.mainTitle}>
          <h3>Add Impact Category Data</h3>
          <p>{titleDescription}</p>
        </div>

        <div className={styles.impactCategoryWrapper}>
          {detailsCard}

          {selectedOption === 'database' && (
            <SelectDataSource
              onPrevious={onPrevious}
              onNext={onNext}
              roleDetailsId={roleDetailsId}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              setActiveImpactSubStep={setActiveImpactSubStep}
              handleBackFromSelect={handleBackFromSelect}
              supplierRoleSlug={supplierRoleSlug}
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
              requestedImpactCategories={requestedImpactCategories}
              requestedSteps={requestedSteps}
              benchmarkingData={benchmarkingData}
            />
          )}
        </div>
      </div>
    );
  }
);

AddImpactCategory.displayName = 'AddImpactCategory';

export default AddImpactCategory;
