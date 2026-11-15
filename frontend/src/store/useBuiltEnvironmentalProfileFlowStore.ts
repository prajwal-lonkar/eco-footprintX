import { create } from 'zustand';
import type { SupplierRole } from '@type/supplier';
import { BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS } from '@constants/built-environmental-profile-flow';
import type { ComponentDetails } from '@type/product-components';
import type {
  BenchmarkingAuditItemDetails,
  SearchDatabaseFormData,
  SupplierDetailsFormData,
} from '@type/built-enviromental-profile';
import type { ImpactOption } from '@type/built-enviromental-profile';

// Flow state interface
interface BuiltEnvironmentalProfileFlowState {
  // Navigation
  currentStep: number;

  // URL params (stored for easy access across components)
  productId: string | null;
  componentId: string | null;
  roleSlug: string | null;

  // Component data (loaded in CompleteSupplierDetails, used across steps)
  componentDetails: ComponentDetails | null;

  // Industry benchmarking audit data
  audit: BenchmarkingAuditItemDetails | null;

  // Selected supplier role (set in CompleteSupplierDetails, used across steps)
  selectedRole: SupplierRole | null;

  // Supplier details form data (set in CompleteSupplierDetails, used across steps)
  supplierDetailsFormData: SupplierDetailsFormData;

  // Search Database form data stored per role (so it repopulates on revisit)
  searchDatabaseFormDataByRole: Record<string, SearchDatabaseFormData>;
  // Add Impact Category search form data stored per role
  impactCategorySearchDatabaseFormDataByRole: Record<
    string,
    SearchDatabaseFormData
  >;

  // Actions - Navigation
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Actions - URL params
  setProductId: (productId: string | null) => void;
  setComponentId: (componentId: string | null) => void;
  setRoleSlug: (roleSlug: string | null) => void;

  // Actions - Component
  setComponentDetails: (details: ComponentDetails | null) => void;
  setAudit: (audit: BenchmarkingAuditItemDetails | null) => void;

  // Actions - Supplier role
  setSelectedRole: (role: SupplierRole | null) => void;

  // Actions - Supplier details form data
  setSupplierDetailsFormData: (formData: SupplierDetailsFormData) => void;
  updateSupplierDetailsField: <
    S extends keyof SupplierDetailsFormData,
    F extends keyof SupplierDetailsFormData[S],
  >(
    section: S,
    field: F,
    value: SupplierDetailsFormData[S][F]
  ) => void;

  //  Search Database actions
  getSearchDatabaseFormData: (
    supplierRoleSlug?: string
  ) => SearchDatabaseFormData;
  setSearchDatabaseFormData: (
    supplierRoleSlug: string,
    formData: SearchDatabaseFormData
  ) => void;
  updateSearchDatabaseField: (
    supplierRoleSlug: string,
    field: keyof SearchDatabaseFormData,
    value: string
  ) => void;
  resetSearchDatabaseFormData: (supplierRoleSlug?: string) => void;
  getImpactCategorySearchDatabaseFormData: (
    supplierRoleSlug?: string
  ) => SearchDatabaseFormData;
  setImpactCategorySearchDatabaseFormData: (
    supplierRoleSlug: string,
    formData: SearchDatabaseFormData
  ) => void;
  updateImpactCategorySearchDatabaseField: (
    supplierRoleSlug: string,
    field: keyof SearchDatabaseFormData,
    value: string
  ) => void;
  resetImpactCategorySearchDatabaseFormData: (supplierRoleSlug?: string) => void;

  // Actions - Flow control
  resetFlow: () => void;
  productName: string | null;
  setProductName: (name: string | null) => void;

  // Remember last selected data-source option per component+role
  lastSelectedImpactOptionByContext: Record<string, ImpactOption>;
  setLastSelectedImpactOptionForContext: (
    contextKey: string,
    option: ImpactOption
  ) => void;

  // Remember if Summary was completed (Complete & Exit) per component+role
  summaryCompletedByContext: Record<string, boolean>;
  setSummaryCompletedForContext: (
    contextKey: string,
    completed: boolean
  ) => void;

  // Saved impact data per context for restoring when switching data sources

  savedImpactDataByContext: Record<string, Record<string, any>>;
  setSavedImpactData: (
    contextKey: string,
    impactType: 'CARBON' | 'WATER' | 'LAND',

    data: Record<string, any>
  ) => void;
  getSavedImpactData: (
    contextKey: string,
    impactType: 'CARBON' | 'WATER' | 'LAND'
  ) => Record<string, any> | null;

  // One-time flag to indicate benchmarking was reset due to supplier details changes
  benchmarkingResetBySupplierDetailsContext: Record<string, boolean>;
  setBenchmarkingResetBySupplierDetails: (
    contextKey: string,
    value: boolean
  ) => void;
  consumeBenchmarkingResetBySupplierDetails: (contextKey: string) => boolean;

  // One-time flag to indicate impact-category database search should reset
  // because benchmarking was changed and saved.
  impactCategorySearchResetByBenchmarkingContext: Record<string, boolean>;
  setImpactCategorySearchResetByBenchmarking: (
    contextKey: string,
    value: boolean
  ) => void;
  consumeImpactCategorySearchResetByBenchmarking: (
    contextKey: string
  ) => boolean;

  // One-time flag for BuiltEnviromentalProfileFlow to suppress restoring saved
  // impact values when supplier details changed (separate from the SelectDataSource flag).
  impactValueClearBySupplierDetailsContext: Record<string, boolean>;
  setImpactValueClearBySupplierDetails: (
    contextKey: string,
    value: boolean
  ) => void;
  consumeImpactValueClearBySupplierDetails: (contextKey: string) => boolean;
}

const initialSearchDatabaseFormData: SearchDatabaseFormData = {
  componentName: '',
  supplierLocation: '',
  transportMethod: '',
  transportRegion: '',
  lciaMethodology: '',
  casNumber: '',
  industry: '',
};

// Initial supplier details form data
const initialSupplierDetailsFormData: SupplierDetailsFormData = {
  rawMaterialSupplier: {
    netWeight: '',
    unitOfMeasurement: '',
    supplierLocation: '',
  },
  transportFreight: {
    transportNetWeight: '',
    transportUnitOfMeasurement: '',
    transportRegion: '',
  },
  storageSection: {
    storageDays: '',
    volumePerSku: '',
    floorAreaPerSku: '',
  },
  packagingManufacturer: {
    netWeight: '',
    unitOfMeasurement: '',
    supplierLocation: '',
  },
  contractManufacturer: {},
};

// Initial state
const initialState = {
  currentStep: BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION,
  productId: null,
  componentId: null,
  roleSlug: null,
  componentDetails: null,
  audit: null,
  selectedRole: null,
  supplierDetailsFormData: initialSupplierDetailsFormData,
  productName: null as string | null,
  lastSelectedImpactOptionByContext: {} as Record<string, ImpactOption>,
  summaryCompletedByContext: {} as Record<string, boolean>,
  searchDatabaseFormDataByRole: {} as Record<string, SearchDatabaseFormData>,
  impactCategorySearchDatabaseFormDataByRole:
    {} as Record<string, SearchDatabaseFormData>,

  savedImpactDataByContext: {} as Record<string, Record<string, any>>,
  benchmarkingResetBySupplierDetailsContext: {} as Record<string, boolean>,
  impactCategorySearchResetByBenchmarkingContext: {} as Record<string, boolean>,
  impactValueClearBySupplierDetailsContext: {} as Record<string, boolean>,
};

// Create the store
export const useBuiltEnvironmentalProfileFlowStore =
  create<BuiltEnvironmentalProfileFlowState>((set, get) => ({
    ...initialState,

    // Navigation actions
    setCurrentStep: (step) => set({ currentStep: step }),

    goToNextStep: () =>
      set((state) => ({ currentStep: state.currentStep + 1 })),

    goToPreviousStep: () =>
      set((state) => {
        if (
          state.currentStep <=
          BUILT_ENVIRONMENTAL_PROFILE_FLOW_STEPS.INTRODUCTION
        ) {
          return state;
        }
        return { currentStep: state.currentStep - 1 };
      }),

    // URL params actions
    setProductId: (productId) => set({ productId }),
    setComponentId: (componentId) => set({ componentId }),
    setRoleSlug: (roleSlug) => set({ roleSlug }),

    // Component actions
    setComponentDetails: (details) => set({ componentDetails: details }),
    setAudit: (audit) => set({ audit }),

    // Supplier role actions
    setSelectedRole: (role) => set({ selectedRole: role }),

    // Supplier details form data actions
    setSupplierDetailsFormData: (formData) =>
      set({ supplierDetailsFormData: formData }),

    updateSupplierDetailsField: (section, field, value) =>
      set((state) => ({
        supplierDetailsFormData: {
          ...state.supplierDetailsFormData,
          [section]: {
            ...state.supplierDetailsFormData[section],
            [field]: value,
          },
        },
      })),

    // Product name
    setProductName: (productName) => set({ productName }),

    setLastSelectedImpactOptionForContext: (contextKey, option) =>
      set((state) => ({
        lastSelectedImpactOptionByContext: {
          ...state.lastSelectedImpactOptionByContext,
          [contextKey]: option,
        },
      })),

    setSummaryCompletedForContext: (contextKey, completed) =>
      set((state) => ({
        summaryCompletedByContext: {
          ...state.summaryCompletedByContext,
          [contextKey]: completed,
        },
      })),

    //  Search Database: get
    getSearchDatabaseFormData: (supplierRoleSlug) => {
      if (!supplierRoleSlug) return initialSearchDatabaseFormData;
      return (
        get().searchDatabaseFormDataByRole[supplierRoleSlug] ??
        initialSearchDatabaseFormData
      );
    },

    // Search Database: set whole form
    setSearchDatabaseFormData: (supplierRoleSlug, formData) =>
      set((state) => ({
        searchDatabaseFormDataByRole: {
          ...state.searchDatabaseFormDataByRole,
          [supplierRoleSlug]: formData,
        },
      })),

    // Search Database: update single field
    updateSearchDatabaseField: (supplierRoleSlug, field, value) =>
      set((state) => ({
        searchDatabaseFormDataByRole: {
          ...state.searchDatabaseFormDataByRole,
          [supplierRoleSlug]: {
            ...(state.searchDatabaseFormDataByRole[supplierRoleSlug] ??
              initialSearchDatabaseFormData),
            [field]: value,
          },
        },
      })),

    // Search Database: reset (one role or all)
    resetSearchDatabaseFormData: (supplierRoleSlug) =>
      set((state) => {
        if (!supplierRoleSlug) return { searchDatabaseFormDataByRole: {} };

        const next = { ...state.searchDatabaseFormDataByRole };
        delete next[supplierRoleSlug];
        return { searchDatabaseFormDataByRole: next };
      }),

    // Add Impact Category Search Database: get
    getImpactCategorySearchDatabaseFormData: (supplierRoleSlug) => {
      if (!supplierRoleSlug) return initialSearchDatabaseFormData;
      return (
        get().impactCategorySearchDatabaseFormDataByRole[supplierRoleSlug] ??
        initialSearchDatabaseFormData
      );
    },

    // Add Impact Category Search Database: set whole form
    setImpactCategorySearchDatabaseFormData: (supplierRoleSlug, formData) =>
      set((state) => ({
        impactCategorySearchDatabaseFormDataByRole: {
          ...state.impactCategorySearchDatabaseFormDataByRole,
          [supplierRoleSlug]: formData,
        },
      })),

    // Add Impact Category Search Database: update single field
    updateImpactCategorySearchDatabaseField: (supplierRoleSlug, field, value) =>
      set((state) => ({
        impactCategorySearchDatabaseFormDataByRole: {
          ...state.impactCategorySearchDatabaseFormDataByRole,
          [supplierRoleSlug]: {
            ...(state.impactCategorySearchDatabaseFormDataByRole[
              supplierRoleSlug
            ] ?? initialSearchDatabaseFormData),
            [field]: value,
          },
        },
      })),

    // Add Impact Category Search Database: reset (one role or all)
    resetImpactCategorySearchDatabaseFormData: (supplierRoleSlug) =>
      set((state) => {
        if (!supplierRoleSlug) {
          return { impactCategorySearchDatabaseFormDataByRole: {} };
        }

        const next = { ...state.impactCategorySearchDatabaseFormDataByRole };
        delete next[supplierRoleSlug];
        return { impactCategorySearchDatabaseFormDataByRole: next };
      }),

    // Saved Impact Data actions
    setSavedImpactData: (contextKey, impactType, data) =>
      set((state) => {
        const contextData = state.savedImpactDataByContext[contextKey] ?? {};
        return {
          savedImpactDataByContext: {
            ...state.savedImpactDataByContext,
            [contextKey]: {
              ...contextData,
              [impactType]: { ...data },
            },
          },
        };
      }),

    getSavedImpactData: (contextKey, impactType) => {
      const contextData = get().savedImpactDataByContext[contextKey];
      if (!contextData) return null;
      return contextData[impactType] ?? null;
    },

    setBenchmarkingResetBySupplierDetails: (contextKey, value) =>
      set((state) => {
        const next = { ...state.benchmarkingResetBySupplierDetailsContext };
        if (value) {
          next[contextKey] = true;
        } else {
          delete next[contextKey];
        }
        return { benchmarkingResetBySupplierDetailsContext: next };
      }),

    consumeBenchmarkingResetBySupplierDetails: (contextKey) => {
      const shouldReset =
        get().benchmarkingResetBySupplierDetailsContext[contextKey] === true;

      if (shouldReset) {
        set((state) => {
          const next = { ...state.benchmarkingResetBySupplierDetailsContext };
          delete next[contextKey];
          return { benchmarkingResetBySupplierDetailsContext: next };
        });
      }

      return shouldReset;
    },

    setImpactCategorySearchResetByBenchmarking: (contextKey, value) =>
      set((state) => {
        const next = {
          ...state.impactCategorySearchResetByBenchmarkingContext,
        };
        if (value) {
          next[contextKey] = true;
        } else {
          delete next[contextKey];
        }
        return { impactCategorySearchResetByBenchmarkingContext: next };
      }),

    consumeImpactCategorySearchResetByBenchmarking: (contextKey) => {
      const shouldReset =
        get().impactCategorySearchResetByBenchmarkingContext[contextKey] ===
        true;

      if (shouldReset) {
        set((state) => {
          const next = {
            ...state.impactCategorySearchResetByBenchmarkingContext,
          };
          delete next[contextKey];
          return { impactCategorySearchResetByBenchmarkingContext: next };
        });
      }

      return shouldReset;
    },

    setImpactValueClearBySupplierDetails: (contextKey, value) =>
      set((state) => {
        const next = { ...state.impactValueClearBySupplierDetailsContext };
        if (value) {
          next[contextKey] = true;
        } else {
          delete next[contextKey];
        }
        return { impactValueClearBySupplierDetailsContext: next };
      }),

    consumeImpactValueClearBySupplierDetails: (contextKey) => {
      const shouldClear =
        get().impactValueClearBySupplierDetailsContext[contextKey] === true;

      if (shouldClear) {
        set((state) => {
          const next = { ...state.impactValueClearBySupplierDetailsContext };
          delete next[contextKey];
          return { impactValueClearBySupplierDetailsContext: next };
        });
      }

      return shouldClear;
    },

    // Flow control actions
    resetFlow: () =>
      set((state) => ({
        ...initialState,
        productName: state.productName,
        lastSelectedImpactOptionByContext:
          state.lastSelectedImpactOptionByContext,
        summaryCompletedByContext: state.summaryCompletedByContext,
        savedImpactDataByContext: state.savedImpactDataByContext,
      })),
  }));
