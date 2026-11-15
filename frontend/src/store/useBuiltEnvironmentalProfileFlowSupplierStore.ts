import { create } from 'zustand';
import type { SupplierRole, SupplierComponentDetails } from '@type/supplier';
import type { ComponentDetails } from '@type/product-components';
import type { SearchDatabaseFormData } from '@type/built-enviromental-profile';
import { BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS } from '@constants/built-environmental-profile-flow';

// Minimal supplier dashboard flow state
interface BuiltEnvironmentalProfileFlowSupplierState {
  // Navigation
  currentStep: number;

  // URL params (stored for easy access across components)
  productId: string | null;
  componentId: string | null;
  roleSlug: string | null;

  // Component data loaded for this flow
  componentDetails: ComponentDetails | SupplierComponentDetails | null;

  // Selected supplier role
  selectedRole: SupplierRole | null;

  // Remember if Summary was completed (Complete & Exit) per component+role (like company dashboard)
  summaryCompletedByContext: Record<string, boolean>;

  // Cache requested impact categories per context so edit flow shows correct substeps from first paint
  requestedImpactCategoriesByContext: Record<
    string,
    Record<'CARBON' | 'WATER' | 'LAND', boolean>
  >;
  setRequestedImpactCategoriesForContext: (
    contextKey: string,
    categories: Record<'CARBON' | 'WATER' | 'LAND', boolean>
  ) => void;

  // Cache completed impact substeps per context so sidebar shows completed state when user returns
  completedImpactSubStepsByContext: Record<
    string,
    Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>
  >;
  setCompletedImpactSubStepsForContext: (
    contextKey: string,
    completed: Partial<Record<'CARBON' | 'WATER' | 'LAND', boolean>>
  ) => void;

  // Cache last step reached per context so user lands on correct step and Introduction shows as completed on return
  lastStepReachedByContext: Record<string, number>;
  setLastStepReachedForContext: (contextKey: string, step: number) => void;

  // Search Database form data stored per role (repopulates on revisit)
  searchDatabaseFormDataByRole: Record<string, SearchDatabaseFormData>;
  setSearchDatabaseFormData: (
    supplierRoleSlug: string,
    formData: SearchDatabaseFormData
  ) => void;
  resetSearchDatabaseFormData: (supplierRoleSlug?: string) => void;

  // Saved impact data per context for restoring when switching data sources
  savedImpactDataByContext: Record<string, Record<string, unknown>>;
  setSavedImpactData: (
    contextKey: string,
    impactType: 'CARBON' | 'WATER' | 'LAND',
    data: Record<string, unknown>
  ) => void;
  getSavedImpactData: (
    contextKey: string,
    impactType: 'CARBON' | 'WATER' | 'LAND'
  ) => Record<string, unknown> | null;

  // Navigation actions
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // URL param actions
  setProductId: (productId: string | null) => void;
  setComponentId: (componentId: string | null) => void;
  setRoleSlug: (roleSlug: string | null) => void;

  // Component / role actions
  setComponentDetails: (
    details: ComponentDetails | SupplierComponentDetails | null
  ) => void;
  setSelectedRole: (role: SupplierRole | null) => void;

  setSummaryCompletedForContext: (
    contextKey: string,
    completed: boolean
  ) => void;

  // Introduction completed per context (when Proceed saved or GET returns _id)
  introductionCompletedByContext: Record<string, boolean>;
  setIntroductionCompletedForContext: (
    contextKey: string,
    completed: boolean
  ) => void;

  // Flow control
  resetFlow: () => void;
}

const initialState: Omit<
  BuiltEnvironmentalProfileFlowSupplierState,
  | 'setCurrentStep'
  | 'goToNextStep'
  | 'goToPreviousStep'
  | 'setProductId'
  | 'setComponentId'
  | 'setRoleSlug'
  | 'setComponentDetails'
  | 'setSelectedRole'
  | 'setSummaryCompletedForContext'
  | 'setIntroductionCompletedForContext'
  | 'setRequestedImpactCategoriesForContext'
  | 'setCompletedImpactSubStepsForContext'
  | 'setLastStepReachedForContext'
  | 'setSearchDatabaseFormData'
  | 'resetSearchDatabaseFormData'
  | 'setSavedImpactData'
  | 'getSavedImpactData'
  | 'resetFlow'
> = {
  currentStep: BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION,
  productId: null,
  componentId: null,
  roleSlug: null,
  componentDetails: null,
  selectedRole: null,
  summaryCompletedByContext: {},
  introductionCompletedByContext: {},
  requestedImpactCategoriesByContext: {},
  completedImpactSubStepsByContext: {},
  lastStepReachedByContext: {},
  searchDatabaseFormDataByRole: {},
  savedImpactDataByContext: {},
};

export const useBuiltEnvironmentalProfileFlowSupplierStore =
  create<BuiltEnvironmentalProfileFlowSupplierState>((set, get) => ({
    ...initialState,

    // Navigation actions
    setCurrentStep: (step) => set({ currentStep: step }),

    goToNextStep: () =>
      set((state) => ({ currentStep: state.currentStep + 1 })),

    goToPreviousStep: () =>
      set((state) => {
        if (
          state.currentStep <=
          BUILT_ENVIRONMENTAL_PROFILE_FLOW_SUPPLIER_STEPS.INTRODUCTION
        ) {
          return state;
        }
        return { currentStep: state.currentStep - 1 };
      }),

    // URL params actions
    setProductId: (productId) => set({ productId }),
    setComponentId: (componentId) => set({ componentId }),
    setRoleSlug: (roleSlug) => set({ roleSlug }),

    // Component / role actions
    setComponentDetails: (details) => set({ componentDetails: details }),
    setSelectedRole: (role) => set({ selectedRole: role }),

    setSummaryCompletedForContext: (contextKey, completed) =>
      set((state) => ({
        summaryCompletedByContext: {
          ...state.summaryCompletedByContext,
          [contextKey]: completed,
        },
      })),

    setIntroductionCompletedForContext: (contextKey, completed) =>
      set((state) => ({
        introductionCompletedByContext: {
          ...state.introductionCompletedByContext,
          [contextKey]: completed,
        },
      })),

    setRequestedImpactCategoriesForContext: (contextKey, categories) =>
      set((state) => ({
        requestedImpactCategoriesByContext: {
          ...state.requestedImpactCategoriesByContext,
          [contextKey]: categories,
        },
      })),

    setCompletedImpactSubStepsForContext: (contextKey, completed) =>
      set((state) => ({
        completedImpactSubStepsByContext: {
          ...state.completedImpactSubStepsByContext,
          [contextKey]: {
            ...state.completedImpactSubStepsByContext[contextKey],
            ...completed,
          },
        },
      })),

    setLastStepReachedForContext: (contextKey, step) =>
      set((state) => ({
        lastStepReachedByContext: {
          ...state.lastStepReachedByContext,
          [contextKey]: step,
        },
      })),

    setSearchDatabaseFormData: (supplierRoleSlug, formData) =>
      set((state) => ({
        searchDatabaseFormDataByRole: {
          ...state.searchDatabaseFormDataByRole,
          [supplierRoleSlug]: formData,
        },
      })),

    resetSearchDatabaseFormData: (supplierRoleSlug) =>
      set((state) => {
        if (!supplierRoleSlug) return { searchDatabaseFormDataByRole: {} };
        const next = { ...state.searchDatabaseFormDataByRole };
        delete next[supplierRoleSlug];
        return { searchDatabaseFormDataByRole: next };
      }),

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
      return (contextData[impactType] ?? null) as Record<
        string,
        unknown
      > | null;
    },

    // Flow control actions (preserve context caches like company store)
    resetFlow: () =>
      set((state) => ({
        ...initialState,
        summaryCompletedByContext: state.summaryCompletedByContext,
        introductionCompletedByContext: state.introductionCompletedByContext,
        requestedImpactCategoriesByContext:
          state.requestedImpactCategoriesByContext,
        completedImpactSubStepsByContext:
          state.completedImpactSubStepsByContext,
        lastStepReachedByContext: state.lastStepReachedByContext,
        searchDatabaseFormDataByRole: state.searchDatabaseFormDataByRole,
        savedImpactDataByContext: state.savedImpactDataByContext,
      })),
  }));
