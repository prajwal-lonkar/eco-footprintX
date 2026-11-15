import { create } from 'zustand';
import type { ProductDetails } from '@type/product';
import type { Component } from '@type/product-components';
import { FLOW_STEPS } from '@constants/component-service-flow';

// Supplier data structure shared across steps
export interface FlowSupplierData {
  id: string;
  name: string;
  registrationNumber: string;
  contactName: string;
  contactEmail: string;
  roles: string[];
}

// Supplier details form data
export interface SupplierDetailsFormData {
  supplierSku: string;
  casNumber: string;
  rowMaterialActivityDescription: string;
  transportMethod: string;
  transportOrigin: string;
  transportDestination: string;
  transportActivityDescription: string;
  cpgBrandStorageType: string;
  cpgBrandActivityDescription: string;
  retailerStorageType: string;
  retailerActivityDescription: string;
  storageFulfilmentStorageType: string;
  storageFulfilmentActivityDescription: string;
  packagingActivityDescription: string;
  contractManufacturerActivityDescription: string;
  calculatedDistanceKm: number;
  selectedManufacturingActivityTypes: string[];
}

// Supplier role lookup data
export interface SupplierRoleOption {
  id: string;
  name: string;
  slug: string;
}

// Flow state interface
interface AddComponentAndServiceFlowState {
  // Navigation
  currentStep: number;

  // Product data (loaded once, shared across all steps)
  productDetails: ProductDetails | null;
  isLoadingProduct: boolean;

  // Component data (set in step 2, used in steps 2-5)
  selectedComponent: Component | null;

  // Supplier data (set in step 3, used in steps 3-5)
  assignedSupplier: FlowSupplierData | null;

  // Supplier details form data (set in step 4, used in step 4)
  supplierDetails: SupplierDetailsFormData | null;

  // Metadata (loaded once, shared across steps)
  supplierRoles: SupplierRoleOption[];
  currentUserEmail: string;

  // Actions - Navigation
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Actions - Product
  setProductDetails: (product: ProductDetails | null) => void;
  setIsLoadingProduct: (isLoading: boolean) => void;

  // Actions - Component
  setSelectedComponent: (component: Component | null) => void;

  // Actions - Supplier
  setAssignedSupplier: (supplier: FlowSupplierData | null) => void;

  // Actions - Supplier Details
  setSupplierDetails: (details: SupplierDetailsFormData | null) => void;
  updateSupplierDetailsField: <K extends keyof SupplierDetailsFormData>(
    field: K,
    value: SupplierDetailsFormData[K]
  ) => void;

  // Actions - Metadata
  setSupplierRoles: (roles: SupplierRoleOption[]) => void;
  setCurrentUserEmail: (email: string) => void;

  // Actions - Flow control
  resetFlow: () => void;
  clearSupplierDetails: () => void;
}

// Initial supplier details state
const initialSupplierDetails: SupplierDetailsFormData = {
  supplierSku: '',
  casNumber: '',
  rowMaterialActivityDescription: '',
  transportMethod: '',
  transportOrigin: '',
  transportDestination: '',
  transportActivityDescription: '',
  cpgBrandStorageType: '',
  cpgBrandActivityDescription: '',
  retailerStorageType: '',
  retailerActivityDescription: '',
  storageFulfilmentStorageType: '',
  storageFulfilmentActivityDescription: '',
  packagingActivityDescription: '',
  contractManufacturerActivityDescription: '',
  calculatedDistanceKm: 0,
  selectedManufacturingActivityTypes: [],
};

// Initial state
const initialState = {
  currentStep: FLOW_STEPS.INTRODUCTION,
  productDetails: null,
  isLoadingProduct: true,
  selectedComponent: null,
  assignedSupplier: null,
  supplierDetails: null,
  supplierRoles: [],
  currentUserEmail: '',
};

// Create the store
export const useAddComponentAndServiceFlowStore = create<AddComponentAndServiceFlowState>(
  (set) => ({
    ...initialState,

    // Navigation actions
    setCurrentStep: (step) => set({ currentStep: step }),

    goToNextStep: () =>
      set((state) => ({ currentStep: state.currentStep + 1 })),

    goToPreviousStep: () =>
      set((state) => {
        if (state.currentStep <= FLOW_STEPS.INTRODUCTION) {
          return state;
        }

        return { currentStep: state.currentStep - 1 };
      }),

    // Product actions
    setProductDetails: (product) => set({ productDetails: product }),

    setIsLoadingProduct: (isLoading) => set({ isLoadingProduct: isLoading }),

    // Component actions
    setSelectedComponent: (component) =>
      set((state) => {
        // Only clear assignedSupplier if the component is actually changing
        const isChanging =
          (!state.selectedComponent && component) ||
          (state.selectedComponent && !component) ||
          (state.selectedComponent &&
            component &&
            state.selectedComponent?.name !== component?.name ||
            state.selectedComponent?.internalSku !== component?.internalSku);

        if (isChanging) {
          return {
            selectedComponent: component,
            assignedSupplier: null,
            supplierDetails: null,
          };
        }

        return { selectedComponent: component };
      }),

    // Supplier actions
    setAssignedSupplier: (supplier) =>
      set((state) => {
        // Clear supplier details when supplier changes
        const isChanging =
          (!state.assignedSupplier && supplier) ||
          (state.assignedSupplier && !supplier) ||
          (state.assignedSupplier &&
            supplier &&
            state.assignedSupplier.id !== supplier.id);

        if (isChanging) {
          return {
            assignedSupplier: supplier,
            supplierDetails: null,
          };
        }

        return { assignedSupplier: supplier };
      }),

    // Supplier details actions
    setSupplierDetails: (details) => set({ supplierDetails: details }),
    updateSupplierDetailsField: (field, value) =>
      set((state) => {
        if (!state.supplierDetails) {
          return {
            supplierDetails: { ...initialSupplierDetails, [field]: value },
          };
        }
        return {
          supplierDetails: { ...state.supplierDetails, [field]: value },
        };
      }),

    // Metadata actions
    setSupplierRoles: (roles) => set({ supplierRoles: roles }),

    setCurrentUserEmail: (email) => set({ currentUserEmail: email }),

    // Flow control actions
    resetFlow: () => set(initialState),
    
    // Clear supplier details when component or supplier changes
    clearSupplierDetails: () => set({ supplierDetails: null }),
  })
);

