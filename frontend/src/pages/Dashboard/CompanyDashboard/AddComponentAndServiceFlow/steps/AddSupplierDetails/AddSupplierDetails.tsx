import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styles from './AddSupplierDetails.module.scss';
import parentStyles from '../../AddComponentAndServiceFlow.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import SearchIcon from '@assets/icons/search.svg';
import closeCircleIcon from '@assets/icons/close-circle.svg';
import arrowDownIcon from '@assets/icons/arrow-down.svg';
import checkIcon from '@assets/icons/check.svg';
import checkedIcon from '@assets/icons/checked.svg';
import DropdownComponent from '@common/DropdownComponent/DropdownComponent';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import Bugsnag from '@utils/bugsnag';
import { saveSupplier } from '@service/supplier.service';
import { calculateComponentDistance } from '@service/product-components.service';
import {
  hasLeadingOrTrailingSpaces,
  hasLeadingOrTrailingHyphen,
  sanitizeCasNumberStrict,
  sanitizeComponentSearchInput,
} from '@utils/validation';
import type { SaveSupplierPayload, RawMaterialSupplier } from '@type/supplier';
import type { CalculateDistanceRequestParams } from '@type/product-components';
import {
  SUPPLIER_ROLE_NAMES,
  SUPPLIER_ROLE_SLUGS,
  TRANSPORT_METHOD_LABELS,
  TRANSPORT_METHODS,
  MANUFACTURING_ACTIVITY_TYPES,
  MANUFACTURING_ACTIVITY_TYPE_LIST,
} from '@constants/component-service-flow';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@type/auth';

interface AddSupplierDetailsProps {
  onRedirectToProductDetails?: () => void;
}

const STORAGE_TYPES = ['Ambient', 'Chilled', 'Frozen'] as const;

const [TRAIN, AIRCRAFT, LIGHT_COMMERCIAL_VEHICLE, LORRY, SEA] = TRANSPORT_METHODS;

type DropdownKey =
  | 'transportMethod'
  | 'cpgBrandStorageType'
  | 'retailerStorageType'
  | 'storageFulfilmentStorageType'
  | 'transportOrigin'
  | 'transportDestination';

type TransportField = 'transportOrigin' | 'transportDestination';

const INITIAL_FORM_ERRORS = {
  supplierSku: '',
  casNumber: '',
  rowMaterialActivityDescription: '',
  transportMethod: '',
  transportActivityDescription: '',
  cpgBrandStorageType: '',
  cpgBrandActivityDescription: '',
  retailerStorageType: '',
  retailerActivityDescription: '',
  storageFulfilmentStorageType: '',
  storageFulfilmentActivityDescription: '',
  packagingActivityDescription: '',
  contractManufacturerActivityTypes: '',
  contractManufacturerActivityDescription: '',
};

type ErrorKey = keyof typeof INITIAL_FORM_ERRORS;

const STORE_FIELDS = new Set([
  'supplierSku',
  'casNumber',
  'rowMaterialActivityDescription',
  'transportMethod',
  'transportOrigin',
  'transportDestination',
  'transportActivityDescription',
  'cpgBrandStorageType',
  'cpgBrandActivityDescription',
  'retailerStorageType',
  'retailerActivityDescription',
  'storageFulfilmentStorageType',
  'storageFulfilmentActivityDescription',
  'packagingActivityDescription',
  'contractManufacturerActivityDescription',
  'calculatedDistanceKm',
  'selectedManufacturingActivityTypes',
] as const);

type StoreField = typeof STORE_FIELDS extends Set<infer T> ? T : never;

function useDebouncedEffect(effect: () => void, delay: number, deps: any[]) {
  useEffect(() => {
    const t = setTimeout(effect, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const AddSupplierDetails = ({ onRedirectToProductDetails }: AddSupplierDetailsProps) => {
  // Zustand store
  const selectedComponent = useAddComponentAndServiceFlowStore((state) => state.selectedComponent);
  const productDetails = useAddComponentAndServiceFlowStore((state) => state.productDetails);
  const assignedSupplier = useAddComponentAndServiceFlowStore((state) => state.assignedSupplier);
  const supplierRoles = useAddComponentAndServiceFlowStore((state) => state.supplierRoles);
  const supplierDetails = useAddComponentAndServiceFlowStore((state) => state.supplierDetails);
  const updateSupplierDetailsField = useAddComponentAndServiceFlowStore((state) => state.updateSupplierDetailsField);
  const setSupplierDetails = useAddComponentAndServiceFlowStore((state) => state.setSupplierDetails);
  const goToNextStep = useAddComponentAndServiceFlowStore((state) => state.goToNextStep);
  const goToPreviousStep = useAddComponentAndServiceFlowStore((state) => state.goToPreviousStep);

  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);

  const [isManufacturingActivityDropdownOpen, setIsManufacturingActivityDropdownOpen] = useState(false);
  const [manufacturingActivityDropdownOpenUpwards, setManufacturingActivityDropdownOpenUpwards] = useState(false);
  const manufacturingActivityDropdownRef = useRef<HTMLDivElement | null>(null);
  const manufacturingActivityDropdownMenuRef = useRef<HTMLDivElement | null>(null);

  const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);

  // Initialize supplier details in store if not present
  useEffect(() => {
    if (!supplierDetails && assignedSupplier) {
      setSupplierDetails({
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
      });
    }
  }, [supplierDetails, assignedSupplier, setSupplierDetails]);

  // Derived form data combining store data with assignedSupplier and productDetails
  const formData = useMemo(() => {
    const sd = supplierDetails;
    return {
      supplierName: assignedSupplier?.name || '',
      companyRegistrationNumber: assignedSupplier?.registrationNumber || '',
      internalSku: productDetails?.internalSku || '',
      supplierSku: sd?.supplierSku || '',
      casNumber: sd?.casNumber || '',
      rowMaterialActivityDescription: sd?.rowMaterialActivityDescription || '',
      transportMethod: sd?.transportMethod || '',
      transportOrigin: sd?.transportOrigin || '',
      transportDestination: sd?.transportDestination || '',
      transportActivityDescription: sd?.transportActivityDescription || '',
      cpgBrandStorageType: sd?.cpgBrandStorageType || '',
      cpgBrandActivityDescription: sd?.cpgBrandActivityDescription || '',
      retailerStorageType: sd?.retailerStorageType || '',
      retailerActivityDescription: sd?.retailerActivityDescription || '',
      storageFulfilmentStorageType: sd?.storageFulfilmentStorageType || '',
      storageFulfilmentActivityDescription: sd?.storageFulfilmentActivityDescription || '',
      packagingActivityDescription: sd?.packagingActivityDescription || '',
      contractManufacturerActivityDescription: sd?.contractManufacturerActivityDescription || '',
      calculatedDistanceKm: sd?.calculatedDistanceKm || 0,
    };
  }, [assignedSupplier, productDetails, supplierDetails]);

  const selectedManufacturingActivityTypes = supplierDetails?.selectedManufacturingActivityTypes || [];

  // Google Places search state
  const [placePredictions, setPlacePredictions] = useState<{
    transportOrigin: google.maps.places.AutocompletePrediction[];
    transportDestination: google.maps.places.AutocompletePrediction[];
  }>({
    transportOrigin: [],
    transportDestination: [],
  });

  const [showSearchResults, setShowSearchResults] = useState<{
    transportOrigin: boolean;
    transportDestination: boolean;
  }>({
    transportOrigin: false,
    transportDestination: false,
  });

  const [isSearchComplete, setIsSearchComplete] = useState<{
    transportOrigin: boolean;
    transportDestination: boolean;
  }>({
    transportOrigin: false,
    transportDestination: false,
  });

  // Google Places services refs
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const distanceMatrixServiceRef = useRef<google.maps.DistanceMatrixService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const searchWrapperRefs = useRef<{
    transportOrigin: HTMLDivElement | null;
    transportDestination: HTMLDivElement | null;
  }>({
    transportOrigin: null,
    transportDestination: null,
  });

  // Store place geometry for distance calculation
  const placeGeometryRef = useRef<{
    transportOrigin: google.maps.places.PlaceResult | null;
    transportDestination: google.maps.places.PlaceResult | null;
  }>({
    transportOrigin: null,
    transportDestination: null,
  });

  // Track when we're programmatically setting a value from place selection
  const isSettingFromSelectionRef = useRef<{
    transportOrigin: boolean;
    transportDestination: boolean;
  }>({
    transportOrigin: false,
    transportDestination: false,
  });

  // Track input focus state
  const isInputFocusedRef = useRef<{
    transportOrigin: boolean;
    transportDestination: boolean;
  }>({
    transportOrigin: false,
    transportDestination: false,
  });

  useEffect(() => {
    if (assignedSupplier && assignedSupplier.roles && supplierRoles.length > 0) {
      const roleNames = assignedSupplier.roles
        .map((roleSlug) => {
          const role = supplierRoles.find((r) => r.slug === roleSlug);
          return role?.name || '';
        })
        .filter((name) => name !== '');
      setSelectedRoleNames(roleNames);
    }
  }, [assignedSupplier, supplierRoles]);

  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

      // Create a dummy div for PlacesService (it needs a map or div element)
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

      // Initialize DistanceMatrixService for calculating distance
      distanceMatrixServiceRef.current = new window.google.maps.DistanceMatrixService();

      // Initialize Geocoder for converting address strings to place results
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const hasRole = useCallback(
    (roleName: (typeof SUPPLIER_ROLE_NAMES)[keyof typeof SUPPLIER_ROLE_NAMES]): boolean => {
      return selectedRoleNames.some((name) => name.toLowerCase() === roleName.toLowerCase());
    },
    [selectedRoleNames],
  );

  const setField = useCallback(
    (field: keyof typeof formData | 'selectedManufacturingActivityTypes', value: string | number | string[]) => {
      if (STORE_FIELDS.has(field as StoreField)) {
        updateSupplierDetailsField(field as any, value as any);
      }
    },
    [updateSupplierDetailsField],
  );

  const clearTransportRouteError = useCallback(() => {
    setFormErrors((prev) => {
      if (
        prev.transportMethod !==
        ERROR_MESSAGES.INVALID_TRANSPORT_METHOD_FOR_SELECTED_ROUTE
      ) {
        return prev;
      }

      return { ...prev, transportMethod: '' };
    });
  }, []);

  const setTransportRouteError = useCallback(() => {
    setFormErrors((prev) => ({
      ...prev,
      transportMethod: ERROR_MESSAGES.INVALID_TRANSPORT_METHOD_FOR_SELECTED_ROUTE,
    }));
  }, []);

  // Handle place search predictions
  const handlePlaceSearch = useCallback(async (field: TransportField, query: string) => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 1) {
      setPlacePredictions((prev) => ({ ...prev, [field]: [] }));
      setShowSearchResults((prev) => ({ ...prev, [field]: false }));
      setIsSearchComplete((prev) => ({ ...prev, [field]: false }));
      return;
    }

    if (!autocompleteServiceRef.current) return;

    setIsSearchComplete((prev) => ({ ...prev, [field]: false }));

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: trimmed,
        types: ['geocode'],
      },
      (predictions, status) => {
        const shouldShow = isInputFocusedRef.current[field];

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPlacePredictions((prev) => ({ ...prev, [field]: predictions }));
          setShowSearchResults((prev) => ({ ...prev, [field]: shouldShow }));
        } else {
          setPlacePredictions((prev) => ({ ...prev, [field]: [] }));
          setShowSearchResults((prev) => ({ ...prev, [field]: shouldShow }));
        }

        setIsSearchComplete((prev) => ({ ...prev, [field]: true }));
      },
    );
  }, []);

  // Calculate distance between origin and destination with transport-method strategy
  const calculateDistance = useCallback(async () => {
    const origin = placeGeometryRef.current.transportOrigin;
    const destination = placeGeometryRef.current.transportDestination;
    const componentId = selectedComponent?._id;
    const originLocation = origin?.geometry?.location;
    const destinationLocation = destination?.geometry?.location;
    const transportMethod = formData.transportMethod.trim();

    if (!originLocation || !destinationLocation || !transportMethod) {
      updateSupplierDetailsField('calculatedDistanceKm', 0);
      clearTransportRouteError();
      return;
    }

    if (transportMethod === TRAIN || transportMethod === AIRCRAFT || transportMethod === SEA) {
      if (!componentId) {
        updateSupplierDetailsField('calculatedDistanceKm', 0);
        setTransportRouteError();
        return;
      }

      const params: CalculateDistanceRequestParams = {
        roleSlug: SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT,
        originLatitude: originLocation.lat(),
        originLongitude: originLocation.lng(),
        destinationLatitude: destinationLocation.lat(),
        destinationLongitude: destinationLocation.lng(),
        transportMethod,
      };

      try {
        showSpinner();
        const response = await calculateComponentDistance(componentId, params);
        const distanceKm = response.data?.distanceKm ?? 0;

        if (response.success && distanceKm > 0) {
          updateSupplierDetailsField('calculatedDistanceKm', distanceKm);
          clearTransportRouteError();
        } else {
          updateSupplierDetailsField('calculatedDistanceKm', 0);
          setTransportRouteError();
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddSupplierDetails',
            method: 'calculateDistanceOpenAIFallback',
          });
        });
        updateSupplierDetailsField('calculatedDistanceKm', 0);
        setTransportRouteError();
      } finally {
        hideSpinner();
      }

      return;
    }

    if (transportMethod === LIGHT_COMMERCIAL_VEHICLE || transportMethod === LORRY) {
      if (!distanceMatrixServiceRef.current) {
        updateSupplierDetailsField('calculatedDistanceKm', 0);
        setTransportRouteError();
        return;
      }

      showSpinner();
      try {
        distanceMatrixServiceRef.current.getDistanceMatrix(
          {
            origins: [originLocation],
            destinations: [destinationLocation],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            const distanceMeters = response?.rows?.[0]?.elements?.[0]?.distance?.value ?? 0;

            if (
              status === google.maps.DistanceMatrixStatus.OK &&
              distanceMeters > 0
            ) {
              updateSupplierDetailsField('calculatedDistanceKm', distanceMeters / 1000);
              clearTransportRouteError();
            } else {
              updateSupplierDetailsField('calculatedDistanceKm', 0);
              setTransportRouteError();
            }
            hideSpinner();
          },
        );
      } catch {
        updateSupplierDetailsField('calculatedDistanceKm', 0);
        setTransportRouteError();
        hideSpinner();
      }
      return;
    }

    updateSupplierDetailsField('calculatedDistanceKm', 0);
    setTransportRouteError();
  }, [
    clearTransportRouteError,
    formData.transportMethod,
    hideSpinner,
    selectedComponent,
    setTransportRouteError,
    showSpinner,
    updateSupplierDetailsField,
  ]);

  // Geocode an address string to get place geometry
  const geocodeAddress = useCallback(
    (field: TransportField, address: string) => {
      if (!geocoderRef.current || !address.trim()) return;

      geocoderRef.current.geocode({ address: address.trim() }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const placeResult: google.maps.places.PlaceResult = {
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            name: result.formatted_address,
          };

          placeGeometryRef.current[field] = placeResult;

          if (
            placeGeometryRef.current.transportOrigin?.geometry?.location &&
            placeGeometryRef.current.transportDestination?.geometry?.location
          ) {
            void calculateDistance();
          }
        }
      });
    },
    [calculateDistance],
  );

  // Handle place selection
  const handlePlaceSelect = useCallback(
    (field: TransportField, prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesServiceRef.current) return;

      isSettingFromSelectionRef.current[field] = true;

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['formatted_address', 'geometry', 'name'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const address = place.formatted_address || place.name || '';

            placeGeometryRef.current[field] = place;

            updateSupplierDetailsField(field, address);
            clearTransportRouteError();
            updateSupplierDetailsField('calculatedDistanceKm', 0);

            setShowSearchResults((prev) => ({ ...prev, [field]: false }));
            setPlacePredictions((prev) => ({ ...prev, [field]: [] }));

            setTimeout(() => {
              isSettingFromSelectionRef.current[field] = false;
            }, 100);

            if (
              (field === 'transportOrigin' && placeGeometryRef.current.transportDestination) ||
              (field === 'transportDestination' && placeGeometryRef.current.transportOrigin)
            ) {
              void calculateDistance();
            }
          } else {
            isSettingFromSelectionRef.current[field] = false;
            showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          }
        },
      );
    },
    [clearTransportRouteError, showAlert, calculateDistance, updateSupplierDetailsField],
  );

  // Debounced search effects (refactor: useDebouncedEffect)
  useDebouncedEffect(
    () => {
      if (!isSettingFromSelectionRef.current.transportOrigin) {
        handlePlaceSearch('transportOrigin', formData.transportOrigin);
      }
    },
    500,
    [formData.transportOrigin, handlePlaceSearch],
  );

  useDebouncedEffect(
    () => {
      if (!isSettingFromSelectionRef.current.transportDestination) {
        handlePlaceSearch('transportDestination', formData.transportDestination);
      }
    },
    500,
    [formData.transportDestination, handlePlaceSearch],
  );

  // Populate placeGeometryRef from prefilled data
  useEffect(() => {
    if (!geocoderRef.current) return;

    if (isSettingFromSelectionRef.current.transportOrigin || isSettingFromSelectionRef.current.transportDestination) {
      return;
    }

    if (formData.transportOrigin?.trim() && !placeGeometryRef.current.transportOrigin) {
      geocodeAddress('transportOrigin', formData.transportOrigin);
    }

    if (formData.transportDestination?.trim() && !placeGeometryRef.current.transportDestination) {
      geocodeAddress('transportDestination', formData.transportDestination);
    }
  }, [formData.transportOrigin, formData.transportDestination, geocodeAddress]);

  useEffect(() => {
    const originLocation = placeGeometryRef.current.transportOrigin?.geometry?.location;
    const destinationLocation = placeGeometryRef.current.transportDestination?.geometry?.location;

    if (!formData.transportMethod.trim()) {
      updateSupplierDetailsField('calculatedDistanceKm', 0);
      clearTransportRouteError();
      return;
    }

    if (originLocation && destinationLocation) {
      void calculateDistance();
    }
  }, [
    calculateDistance,
    clearTransportRouteError,
    formData.transportMethod,
    updateSupplierDetailsField,
  ]);

  // Click outside handler for search results
  useEffect(() => {
    const hasOpenSearchResults = Object.values(showSearchResults).some(Boolean);
    if (!hasOpenSearchResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(searchWrapperRefs.current).forEach(([key, ref]) => {
        const field = key as TransportField;
        if (showSearchResults[field] && ref && !ref.contains(event.target as Node)) {
          isInputFocusedRef.current[field] = false;
          setShowSearchResults((prev) => ({ ...prev, [field]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

  useEffect(() => {
    if (
      isManufacturingActivityDropdownOpen &&
      manufacturingActivityDropdownRef.current &&
      manufacturingActivityDropdownMenuRef.current
    ) {
      const rect = manufacturingActivityDropdownRef.current.getBoundingClientRect();
      const menuHeight =
        manufacturingActivityDropdownMenuRef.current.offsetHeight ||
        manufacturingActivityDropdownMenuRef.current.scrollHeight;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setManufacturingActivityDropdownOpenUpwards(spaceBelow < menuHeight && spaceAbove >= menuHeight);
    }
  }, [isManufacturingActivityDropdownOpen]);

  // Handle click outside for manufacturing activity dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (manufacturingActivityDropdownRef.current && !manufacturingActivityDropdownRef.current.contains(event.target as Node)) {
        setIsManufacturingActivityDropdownOpen(false);
        setManufacturingActivityDropdownOpenUpwards(false);
      }
    };

    if (isManufacturingActivityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isManufacturingActivityDropdownOpen]);

  const handleDropdownSelect = (key: DropdownKey, value: string) => {
    setField(key, value);

    if (key === 'transportMethod') {
      clearTransportRouteError();
      updateSupplierDetailsField('calculatedDistanceKm', 0);
    }

    const errorField = key as ErrorKey;
    if (errorField in INITIAL_FORM_ERRORS) {
      if (key === 'transportMethod') {
        validateTransportMethod(value);
      } else if (key === 'cpgBrandStorageType' || key === 'retailerStorageType' || key === 'storageFulfilmentStorageType') {
        validateStorageType(errorField, value);
      }
    }
  };

  // Validation helpers
  const validateSupplierSku = useCallback((value: string) => {
    if (hasLeadingOrTrailingSpaces(value)) {
      setFormErrors((prev) => ({ ...prev, supplierSku: ERROR_MESSAGES.LEADING_TRAILING_SPACES }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, supplierSku: '' }));
  }, []);

  const validateCasNumber = useCallback((value: string) => {
    if (hasLeadingOrTrailingSpaces(value)) {
      setFormErrors((prev) => ({ ...prev, casNumber: ERROR_MESSAGES.LEADING_TRAILING_SPACES }));
      return;
    }
    if (hasLeadingOrTrailingHyphen(value)) {
      setFormErrors((prev) => ({ ...prev, casNumber: ERROR_MESSAGES.LEADING_TRAILING_HYPHEN }));
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      setFormErrors((prev) => ({ ...prev, casNumber: '' }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, casNumber: '' }));
  }, []);

  const validateActivityDescription = useCallback((field: ErrorKey, value: string, isRequired: boolean = false) => {
    if (hasLeadingOrTrailingSpaces(value)) {
      setFormErrors((prev) => ({ ...prev, [field]: ERROR_MESSAGES.LEADING_TRAILING_SPACES }));
      return;
    }
    const trimmed = value.trim();
    if (!trimmed && isRequired) {
      setFormErrors((prev) => ({ ...prev, [field]: ERROR_MESSAGES.ACTIVITY_DESCRIPTION_REQUIRED }));
      return;
    }
    if (!trimmed && !isRequired) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    if (trimmed.length > 300) {
      setFormErrors((prev) => ({ ...prev, [field]: ERROR_MESSAGES.ACTIVITY_DESCRIPTION_TOO_LONG }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateTransportMethod = useCallback((value: string) => {
    if (!value.trim()) {
      setFormErrors((prev) => ({ ...prev, transportMethod: ERROR_MESSAGES.TRANSPORT_METHOD_REQUIRED }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, transportMethod: '' }));
  }, []);

  const validateStorageType = useCallback((field: ErrorKey, value: string) => {
    if (!value.trim()) {
      setFormErrors((prev) => ({ ...prev, [field]: 'Storage Type is required.' }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  // Refactor: validator map (removes switch)
  const validators: Partial<Record<ErrorKey, (v: string) => void>> = useMemo(
    () => ({
      supplierSku: validateSupplierSku,
      casNumber: validateCasNumber,
      rowMaterialActivityDescription: (v) => validateActivityDescription('rowMaterialActivityDescription', v, false),
      transportActivityDescription: (v) => validateActivityDescription('transportActivityDescription', v, false),
      cpgBrandActivityDescription: (v) => validateActivityDescription('cpgBrandActivityDescription', v, false),
      retailerActivityDescription: (v) => validateActivityDescription('retailerActivityDescription', v, false),
      storageFulfilmentActivityDescription: (v) => validateActivityDescription('storageFulfilmentActivityDescription', v, false),
      packagingActivityDescription: (v) => validateActivityDescription('packagingActivityDescription', v, false),
      contractManufacturerActivityDescription: (v) => validateActivityDescription('contractManufacturerActivityDescription', v, false),
      transportMethod: validateTransportMethod,
      cpgBrandStorageType: (v) => validateStorageType('cpgBrandStorageType', v),
      retailerStorageType: (v) => validateStorageType('retailerStorageType', v),
      storageFulfilmentStorageType: (v) => validateStorageType('storageFulfilmentStorageType', v),
    }),
    [validateSupplierSku, validateCasNumber, validateActivityDescription, validateTransportMethod, validateStorageType],
  );

  const handleFieldBlur = useCallback(
    (field: ErrorKey, value: string) => {
      validators[field]?.(value);
    },
    [validators],
  );

  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setField(field, value);

      const errorField = field as ErrorKey;
      if (errorField in INITIAL_FORM_ERRORS) {
        setFormErrors((prev) => (prev[errorField] ? { ...prev, [errorField]: '' } : prev));
      }
    },
    [setField],
  );

  // Refactor: role required fields config (removes large if ladder)
  const roleRequiredRules = useMemo(
    () => [
      {
        role: SUPPLIER_ROLE_NAMES.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR,
        ok: () => !!formData.internalSku?.trim(),
      },
      {
        role: SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT,
        ok: () =>
          !!formData.transportMethod?.trim() &&
          !!formData.transportOrigin?.trim() &&
          !!formData.transportDestination?.trim(),
      },
      {
        role: SUPPLIER_ROLE_NAMES.STORAGE_AND_FULFILMENT,
        ok: () => !!formData.storageFulfilmentStorageType?.trim(),
      },
      {
        role: SUPPLIER_ROLE_NAMES.PACKAGING_MANUFACTURER_AND_PROCESSOR,
        ok: () => true,
      },
      {
        role: SUPPLIER_ROLE_NAMES.CPG_BRAND,
        ok: () => !!formData.cpgBrandStorageType?.trim(),
      },
      {
        role: SUPPLIER_ROLE_NAMES.RETAILER,
        ok: () => !!formData.retailerStorageType?.trim(),
      },
      {
        role: SUPPLIER_ROLE_NAMES.CONTRACT_MANUFACTURER,
        ok: () => selectedManufacturingActivityTypes.length > 0,
      },
    ],
    [formData, selectedManufacturingActivityTypes.length],
  );

  const validateRequiredFields = useCallback((): boolean => {
    if (selectedRoleNames.length === 0) return false;

    for (const rule of roleRequiredRules) {
      if (hasRole(rule.role) && !rule.ok()) return false;
    }

    return true;
  }, [hasRole, roleRequiredRules, selectedRoleNames.length]);

  const buildPayload = useCallback((): SaveSupplierPayload => {
    const payload: SaveSupplierPayload = {
      supplierName: assignedSupplier?.name || '',
      companyRegistrationNumber: assignedSupplier?.registrationNumber || '',
      supplierRoles: assignedSupplier?.roles || [],
      supplierContactName: assignedSupplier?.contactName || '',
      supplierContactEmail: assignedSupplier?.contactEmail || '',
    };

    if (assignedSupplier?.id != null && assignedSupplier?.id !== '') {
      payload.supplierId = assignedSupplier.id;
    }

    const trim = (v: string) => v.trim();
    const sanitizeActivityDescription = (value: string) => sanitizeComponentSearchInput(value).trim();

    if (hasRole(SUPPLIER_ROLE_NAMES.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR)) {
      const ok = formData.internalSku?.trim();
      if (ok) {
        const rawMaterialSupplier: RawMaterialSupplier = {
          internalSku: trim(formData.internalSku),
        };
        const activityDescription = sanitizeActivityDescription(formData.rowMaterialActivityDescription);

        if (activityDescription) {
          rawMaterialSupplier.activityDescription = activityDescription;
        }

        if (formData.casNumber?.trim()) {
          rawMaterialSupplier.casNumber = trim(formData.casNumber);
        }

        if (formData.supplierSku?.trim()) {
          rawMaterialSupplier.supplierSku = trim(formData.supplierSku);
        }

        payload.rawMaterialSupplier = rawMaterialSupplier;
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT)) {
      const ok =
        formData.transportMethod?.trim() &&
        formData.transportOrigin?.trim() &&
        formData.transportDestination?.trim();

      if (ok && formData.calculatedDistanceKm > 0) {
        const activityDescription = sanitizeActivityDescription(formData.transportActivityDescription);
        payload.transportFreight = {
          transportMethod: trim(formData.transportMethod),
          transportOrigin: trim(formData.transportOrigin),
          transportDestination: trim(formData.transportDestination),
          calculatedDistanceKm: formData.calculatedDistanceKm,
        };

        if (activityDescription) {
          payload.transportFreight.activityDescription = activityDescription;
        }
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.RETAILER)) {
      const ok = formData.retailerStorageType?.trim();
      if (ok) {
        const activityDescription = sanitizeActivityDescription(formData.retailerActivityDescription);
        payload.retailer = {
          storageType: trim(formData.retailerStorageType).toLowerCase(),
        };

        if (activityDescription) {
          payload.retailer.activityDescription = activityDescription;
        }
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.CPG_BRAND)) {
      const ok = formData.cpgBrandStorageType?.trim();
      if (ok) {
        const activityDescription = sanitizeActivityDescription(formData.cpgBrandActivityDescription);
        payload.cpgBrand = {
          storageType: trim(formData.cpgBrandStorageType).toLowerCase(),
        };

        if (activityDescription) {
          payload.cpgBrand.activityDescription = activityDescription;
        }
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.STORAGE_AND_FULFILMENT)) {
      const ok = formData.storageFulfilmentStorageType?.trim();
      if (ok) {
        const activityDescription = sanitizeActivityDescription(formData.storageFulfilmentActivityDescription);
        payload.storageFulfilment = {
          storageType: trim(formData.storageFulfilmentStorageType).toLowerCase(),
        };

        if (activityDescription) {
          payload.storageFulfilment.activityDescription = activityDescription;
        }
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.PACKAGING_MANUFACTURER_AND_PROCESSOR)) {
      const activityDescription = sanitizeActivityDescription(formData.packagingActivityDescription);
      payload.packagingManufacturer = {};

      if (activityDescription) {
        payload.packagingManufacturer.activityDescription = activityDescription;
      }
    }

    if (hasRole(SUPPLIER_ROLE_NAMES.CONTRACT_MANUFACTURER)) {
      const ok = selectedManufacturingActivityTypes.length > 0;
      if (ok) {
        const activityDescription = sanitizeActivityDescription(formData.contractManufacturerActivityDescription);
        payload.contractManufacturer = {
          manufacturingActivityTypes: selectedManufacturingActivityTypes,
        };

        if (activityDescription) {
          payload.contractManufacturer.activityDescription = activityDescription;
        }
      }
    }

    return payload;
  }, [assignedSupplier, formData, hasRole, selectedManufacturingActivityTypes]);

  const handleSaveAndContinue = async (exit = false) => {
    if (!selectedComponent?._id) {
      showAlert(ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 'danger');
      return;
    }

    const hasTransportAndFreightRole = hasRole(SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT);
    const hasTransportFreightRequiredFields =
      !!formData.transportMethod?.trim() &&
      !!formData.transportOrigin?.trim() &&
      !!formData.transportDestination?.trim();

    if (
      hasTransportAndFreightRole &&
      hasTransportFreightRequiredFields &&
      formData.calculatedDistanceKm <= 0
    ) {
      setTransportRouteError();
      return;
    }

    showSpinner();
    try {
      const payload = buildPayload();
      const response = await saveSupplier(selectedComponent._id, payload);

      if (response.success) {
        if (exit) {
          onRedirectToProductDetails?.();
        } else {
          goToNextStep();
        }
      } else {
        showAlert(response.message || ERROR_MESSAGES.FAILED_TO_SAVE_SUPPLIER_DETAILS, 'danger');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const apiResponse = axiosError.response?.data;
      const apiMessage = apiResponse?.message;

      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'AddSupplierDetails',
          method: 'handleSaveAndContinue',
        });
      });

      if (apiMessage) {
        showAlert(apiMessage, 'danger');
        return;
      }

      showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_SUPPLIER_DETAILS, 'danger');
    } finally {
      hideSpinner();
    }
  };

  const hasFormErrors = Object.values(formErrors).some((error) => error !== '');
  const canSaveContinue = validateRequiredFields() && !hasFormErrors;

  // Render helpers
  const renderFormField = (
    field: keyof typeof formData,
    label: string,
    options?: {
      placeholder?: string;
      disabled?: boolean;
      tooltipText?: string;
      isRequired?: boolean;
    },
  ) => {
    const { placeholder, disabled = false, tooltipText, isRequired = true } = options || {};
    const errorField = field as ErrorKey;
    const hasError = errorField in INITIAL_FORM_ERRORS && formErrors[errorField];
    const showError = hasError && !disabled;

    return (
      <div className={parentStyles.formField}>
        {tooltipText ? (
          <div className={parentStyles.labelWithIcon}>
            <label className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}>
              {label} {isRequired && <span className={parentStyles.required}>*</span>}
              <Tooltip text={tooltipText} noTruncate>
                <img src={infoIcon} alt="Info" className={parentStyles.infoIcon} />
              </Tooltip>
            </label>
          </div>
        ) : (
          <label className={parentStyles.fieldLabel}>
            {label} {isRequired && <span className={parentStyles.required}>*</span>}
          </label>
        )}

        <div className={parentStyles.inputWrapper}>
          <input
            type="text"
            className={`${parentStyles.formInput} ${showError ? styles.inputError : ''}`}
            value={formData[field]}
            onChange={(e) => {
              if (field === 'casNumber') {
                e.target.value = sanitizeCasNumberStrict(e.target.value);
              }
              handleFieldChange(field, e.target.value)
            }}
            onBlur={(e) => {
              if (!disabled && errorField in INITIAL_FORM_ERRORS) {
                handleFieldBlur(errorField, e.target.value);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>

        {showError && <p className={styles.error}>{formErrors[errorField]}</p>}
      </div>
    );
  };

  const renderActivityDescriptionField = (field: keyof typeof formData, tooltipText: string, isRequired: boolean = false) => {
    const errorField = field as ErrorKey;
    const hasError = errorField in INITIAL_FORM_ERRORS && formErrors[errorField];

    return (
      <div className={parentStyles.formField}>
        <div className={parentStyles.labelWithIcon}>
          <label className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}>
            Activity Description {isRequired && <span className={parentStyles.required}>*</span>}
            <Tooltip text={tooltipText} noTruncate>
              <img src={infoIcon} alt="Info" className={parentStyles.infoIcon} />
            </Tooltip>
          </label>
        </div>

        <div className={parentStyles.inputWrapper}>
          <input
            type="text"
            className={`${parentStyles.formInput} ${hasError ? styles.inputError : ''}`}
            placeholder="Enter activity description..."
            value={formData[field]}
            onChange={(e) => {
              const sanitizedValue = sanitizeComponentSearchInput(e.target.value);
              handleFieldChange(field, sanitizedValue);
            }}
            onBlur={(e) => {
              if (errorField in INITIAL_FORM_ERRORS) {
                handleFieldBlur(errorField, e.target.value);
              }
            }}
          />
        </div>

        {hasError && <p className={styles.error}>{formErrors[errorField]}</p>}
      </div>
    );
  };

  const renderStorageTypeDropdown = (key: DropdownKey, label: string, tooltipText: string) => {
    const errorField = key as ErrorKey;
    const hasError = errorField in INITIAL_FORM_ERRORS && formErrors[errorField];

    const storageOptions = STORAGE_TYPES.map((type) => ({ value: type, label: type }));

    return (
      <div className={parentStyles.formField}>
        <div className={parentStyles.labelWithIcon}>
          <label className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}>
            {label} <span className={parentStyles.required}>*</span>
            <Tooltip text={tooltipText} noTruncate>
              <img src={infoIcon} alt="Info" className={parentStyles.infoIcon} />
            </Tooltip>
          </label>
        </div>

        <DropdownComponent
          title=""
          options={storageOptions}
          value={formData[key]}
          onChange={(value) => handleDropdownSelect(key, value)}
          truncateLabel={false}
          placeholder="Select..."
        />

        {hasError && <p className={styles.error}>{formErrors[errorField]}</p>}
      </div>
    );
  };

  const renderTransportMethodDropdown = () => {
    const errorField = 'transportMethod' as ErrorKey;
    const hasError = errorField in INITIAL_FORM_ERRORS && formErrors[errorField];

    const transportOptions = TRANSPORT_METHODS.map((method) => ({
      value: method,
      label: TRANSPORT_METHOD_LABELS[method],
    }));

    return (
      <div className={parentStyles.formField}>
        <div className={parentStyles.labelWithIcon}>
          <label className={parentStyles.fieldLabel}>
            Transport Method <span className={parentStyles.required}>*</span>
          </label>
        </div>

        <DropdownComponent
          title=""
          options={transportOptions}
          value={formData.transportMethod}
          onChange={(value) => handleDropdownSelect('transportMethod', value)}
          truncateLabel={false}
          placeholder="Select..."
        />
        {hasError && <p className={styles.error}>{formErrors[errorField]}</p>}
      </div>
    );
  };

  const renderManufacturingActivityDropdown = () => {
    const errorField = 'contractManufacturerActivityTypes' as ErrorKey;
    const hasError = errorField in INITIAL_FORM_ERRORS && formErrors[errorField];

    const handleToggleActivityType = (activityType: string) => {
      const currentTypes = selectedManufacturingActivityTypes;
      const newTypes = currentTypes.includes(activityType)
        ? currentTypes.filter((type) => type !== activityType)
        : [...currentTypes, activityType];

      setField('selectedManufacturingActivityTypes', newTypes);
    };

    const handleRemoveActivityType = (activityType: string) => {
      const newTypes = selectedManufacturingActivityTypes.filter((type) => type !== activityType);
      setField('selectedManufacturingActivityTypes', newTypes);
    };

    return (
      <div className={parentStyles.formField} ref={manufacturingActivityDropdownRef}>
        <div className={parentStyles.labelWithIcon}>
          <label className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}>
            Manufacturing Activity Type <span className={parentStyles.required}>*</span>
            <Tooltip text={TOOLTIP_TEXT.MANUFACTURING_ACTIVITY_TYPES} noTruncate>
              <img src={infoIcon} alt="Info" className={parentStyles.infoIcon} />
            </Tooltip>
          </label>
        </div>

        <div className={styles.roleDropdownWrapper}>
          <div
            className={styles.roleDropdownInput}
            onClick={() => {
              if (manufacturingActivityDropdownRef.current) {
                const rect = manufacturingActivityDropdownRef.current.getBoundingClientRect();
                const DROPDOWN_MAX_HEIGHT = 300;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const shouldOpenUpward = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove >= DROPDOWN_MAX_HEIGHT;
                setManufacturingActivityDropdownOpenUpwards(shouldOpenUpward);
              }
              setIsManufacturingActivityDropdownOpen((prev) => !prev);
            }}
          >
            <span
              className={
                selectedManufacturingActivityTypes.length === 0 ? styles.rolePlaceholder : styles.roleSelectedText
              }
            >
              {selectedManufacturingActivityTypes.length === 0 ? 'Select manufacturing activity types...' : 'Select Types...'}
            </span>
            <img src={arrowDownIcon} alt="Dropdown" className={styles.roleDropdownIcon} />
          </div>

          {isManufacturingActivityDropdownOpen && (
            <div
              ref={manufacturingActivityDropdownMenuRef}
              className={`${styles.roleDropdownList} ${manufacturingActivityDropdownOpenUpwards ? styles.roleDropdownListUp : ''
                }`}
            >
              {MANUFACTURING_ACTIVITY_TYPE_LIST.map((activityType) => {
                const isSelected = selectedManufacturingActivityTypes.includes(activityType);
                return (
                  <div
                    key={activityType}
                    className={styles.roleOption}
                    onClick={() => handleToggleActivityType(activityType)}
                  >
                    <img
                      src={isSelected ? checkedIcon : checkIcon}
                      alt={isSelected ? 'Checked' : 'Unchecked'}
                      className={styles.roleCheckbox}
                    />
                    <span className={styles.roleOptionText}>{MANUFACTURING_ACTIVITY_TYPES[activityType]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedManufacturingActivityTypes.length > 0 && (
          <div className={styles.selectedRolesContainer}>
            {selectedManufacturingActivityTypes.map((activityType) => (
              <div key={activityType} className={styles.roleChip}>
                <span className={styles.roleChipText}>{MANUFACTURING_ACTIVITY_TYPES[activityType]}</span>
                <button
                  type="button"
                  className={styles.roleChipClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveActivityType(activityType);
                  }}
                  aria-label={`Remove ${MANUFACTURING_ACTIVITY_TYPES[activityType]}`}
                >
                  <img src={closeCircleIcon} alt="Remove" className={styles.roleChipCloseIcon} />
                </button>
              </div>
            ))}
          </div>
        )}

        {hasError && <p className={styles.error}>{formErrors[errorField]}</p>}
      </div>
    );
  };

  const renderSearchDropdownField = (field: TransportField, label: string) => {
    const placeholder = field === 'transportOrigin' ? 'Enter transport origin...' : 'Enter transport destination...';

    return (
      <div className={parentStyles.formField}>
        <label className={parentStyles.fieldLabel}>
          {label} <span className={parentStyles.required}>*</span>
        </label>

        <div
          className={styles.searchWrapper}
          ref={(el) => {
            searchWrapperRefs.current[field] = el;
          }}
        >
          <div className={styles.searchInputContainer}>
            <div className={styles.searchIconWrapper}>
              <img src={SearchIcon} alt="Search" className={styles.searchIcon} />
            </div>

            <input
              type="text"
              className={styles.searchInput}
              value={formData[field]}
              onChange={(e) => {
                const value = e.target.value;

                isSettingFromSelectionRef.current[field] = false;

                setField(field, value);
                clearTransportRouteError();
                updateSupplierDetailsField('calculatedDistanceKm', 0);

                if (!value.trim()) {
                  placeGeometryRef.current[field] = null;
                } else {
                  placeGeometryRef.current[field] = null;
                  geocodeAddress(field, value);
                }

                if (value.trim().length >= 1) {
                  setShowSearchResults((prev) => ({ ...prev, [field]: isInputFocusedRef.current[field] }));
                } else {
                  setShowSearchResults((prev) => ({ ...prev, [field]: false }));
                  setPlacePredictions((prev) => ({ ...prev, [field]: [] }));
                }
              }}
              onFocus={() => {
                isInputFocusedRef.current[field] = true;
                if (formData[field].trim().length >= 1 && placePredictions[field].length > 0) {
                  setShowSearchResults((prev) => ({ ...prev, [field]: true }));
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  isInputFocusedRef.current[field] = false;
                  setShowSearchResults((prev) => ({ ...prev, [field]: false }));
                }, 200);
              }}
              placeholder={placeholder}
              autoComplete="off"
            />
          </div>

          {showSearchResults[field] && (
            <div className={styles.searchResults}>
              {placePredictions[field].length > 0 &&
                placePredictions[field].map((prediction) => (
                  <div
                    key={prediction.place_id}
                    className={styles.searchResultItem}
                    onClick={() => handlePlaceSelect(field, prediction)}
                  >
                    <span className={styles.resultName}>
                      {prediction.structured_formatting.main_text}
                      {prediction.structured_formatting.secondary_text && (
                        <>
                          {', '}
                          <span className={styles.resultSku}>{prediction.structured_formatting.secondary_text}</span>
                        </>
                      )}
                    </span>
                  </div>
                ))}

              {formData[field].trim().length > 0 && placePredictions[field].length === 0 && isSearchComplete[field] && (
                <div className={styles.noResults}>No places found. Please try a different search term.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNestedFormCard = (title: string, children: React.ReactNode, description?: string) => (
    <div className={styles.nestedFormCard}>
      <div className={styles.roleHeader}>
        <label className={styles.roleLabel}>{title}</label>
        {description && <p className={styles.roleLabelDescription}>{description}</p>}
      </div>
      <div className={styles.nestedFormCardContent}>{children}</div>
    </div>
  );

  return (
    <div className={parentStyles.container}>
      <div className={parentStyles.contentFrame}>
        <div className={parentStyles.header}>
          <h2 className={parentStyles.pageTitle}>Add Role-Specific Supplier Details</h2>
          <p className={parentStyles.helperText}>
            Enter supplier-specific details based on the selected role(s). This information will be used to calculate the
            environmental impact of the component or service
          </p>
        </div>

        <div className={parentStyles.formCard}>
          <div className={parentStyles.twoColumnFields}>
            {renderFormField('supplierName', 'Supplier Name', { disabled: true })}
            {renderFormField('companyRegistrationNumber', 'Company Registration Number', {
              disabled: true,
              tooltipText: TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER,
            })}
          </div>

          {/* Raw Materials Supplier and Processor */}
          {hasRole(SUPPLIER_ROLE_NAMES.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR) &&
            renderNestedFormCard(
              'Raw Materials Supplier and Processor',
              <>
                <div className={parentStyles.twoColumnFields}>
                  {renderFormField('internalSku', 'Internal SKU', {
                    disabled: true,
                    tooltipText: TOOLTIP_TEXT.INTERNAL_SKU,
                  })}
                  {renderFormField('supplierSku', 'Supplier SKU', {
                    placeholder: 'Enter code...',
                    isRequired: false,
                    tooltipText: TOOLTIP_TEXT.SUPPLIER_SKU,
                  })}
                </div>
                <div className={parentStyles.twoColumnFields}>
                  {renderFormField('casNumber', 'CAS Number', {
                    placeholder: 'Enter CAS number...',
                    isRequired: false,
                    tooltipText: TOOLTIP_TEXT.CAS_NUMBER,
                  })}
                  {renderActivityDescriptionField(
                    'rowMaterialActivityDescription',
                    TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                  )}
                </div>
              </>,
            )}

          {/* Transport and Freight */}
          {hasRole(SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT) &&
            renderNestedFormCard(
              'Transport and Freight',
              <>
                <div className={parentStyles.twoColumnFields}>
                  {renderTransportMethodDropdown()}
                  {renderActivityDescriptionField(
                    'transportActivityDescription',
                    TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                    false,
                  )}
                </div>
                <div className={parentStyles.twoColumnFields}>
                  {renderSearchDropdownField('transportOrigin', 'Transport Origin')}
                  {renderSearchDropdownField('transportDestination', 'Transport Destination')}
                </div>
              </>,
              '* If this component was part of a multi-leg journey, please provide details for the longest leg of the journey in terms of distance traveled.',
            )}

          {/* Storage and Fulfilment */}
          {hasRole(SUPPLIER_ROLE_NAMES.STORAGE_AND_FULFILMENT) &&
            renderNestedFormCard(
              'Storage and Fulfilment',
              <div className={parentStyles.twoColumnFields}>
                {renderStorageTypeDropdown(
                  'storageFulfilmentStorageType',
                  'Storage Type',
                  TOOLTIP_TEXT.STORAGE_TYPE,
                )}
                {renderActivityDescriptionField(
                  'storageFulfilmentActivityDescription',
                  TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                )}
              </div>,
            )}

          {/* Packaging Manufacturer and Processor */}
          {hasRole(SUPPLIER_ROLE_NAMES.PACKAGING_MANUFACTURER_AND_PROCESSOR) &&
            renderNestedFormCard(
              'Packaging Manufacturer and Processor',
              renderActivityDescriptionField(
                'packagingActivityDescription',
                TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
              ),
            )}

          {/* CPG Brand */}
          {hasRole(SUPPLIER_ROLE_NAMES.CPG_BRAND) &&
            renderNestedFormCard(
              'CPG Brand',
              <div className={parentStyles.twoColumnFields}>
                {renderStorageTypeDropdown('cpgBrandStorageType', 'Storage Type', TOOLTIP_TEXT.STORAGE_TYPE)}
                {renderActivityDescriptionField(
                  'cpgBrandActivityDescription',
                  TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                )}
              </div>,
            )}

          {/* Retailer */}
          {hasRole(SUPPLIER_ROLE_NAMES.RETAILER) &&
            renderNestedFormCard(
              'Retailer',
              <div className={parentStyles.twoColumnFields}>
                {renderStorageTypeDropdown('retailerStorageType', 'Storage Type', TOOLTIP_TEXT.STORAGE_TYPE)}
                {renderActivityDescriptionField(
                  'retailerActivityDescription',
                  TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                )}
              </div>,
            )}

          {/* Contract Manufacturer */}
          {hasRole(SUPPLIER_ROLE_NAMES.CONTRACT_MANUFACTURER) &&
            renderNestedFormCard(
              'Contract Manufacturer',
              <div className={parentStyles.twoColumnFields}>
                {renderManufacturingActivityDropdown()}
                {renderActivityDescriptionField(
                  'contractManufacturerActivityDescription',
                  TOOLTIP_TEXT.ACTIVITY_DESCRIPTION,
                )}
              </div>,
            )}
        </div>
      </div>

      <div className={parentStyles.footerActions}>
        <button type="button" className={parentStyles.secondaryButton} onClick={goToPreviousStep}>
          Go Back
        </button>
        <button
          type="button"
          className={parentStyles.tertiaryButton}
          onClick={() => handleSaveAndContinue(true)}
          disabled={!canSaveContinue}
        >
          Save and Exit
        </button>
        <button
          type="button"
          className={parentStyles.primaryButton}
          onClick={() => handleSaveAndContinue(false)}
          disabled={!canSaveContinue}
        >
          Save &amp; Continue
        </button>
      </div>
    </div>
  );
};

AddSupplierDetails.displayName = 'AddSupplierDetails';

export default AddSupplierDetails;
