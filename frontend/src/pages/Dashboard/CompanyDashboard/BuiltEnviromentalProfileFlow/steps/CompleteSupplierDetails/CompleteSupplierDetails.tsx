import { useMemo, memo, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './CompleteSupplierDetails.module.scss';
import parentStyles from '../../BuiltEnviromentalProfileFlow.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { SlArrowDown, SlArrowUp } from 'react-icons/sl';
import { ERROR_MESSAGES } from '@constants/messages';
import { useShallow } from 'zustand/react/shallow';
import {
  hasLeadingOrTrailingSpaces,
  isValidNumericField,
  isValidTemperature,
  isvalidIntegerField,
  sanitizeNumericInput,
  sanitizeCustomUnit,
} from '@utils/validation';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import type { ComponentDetails } from '@type/product-components';
import {
  saveBuiltEnvironmentalProfile,
  saveIndustryBenchmarkingData,
} from '@service/built-enviromental-profile.service';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import {
  NUMERIC_FIELDS,
  INTEGER_FIELDS,
  UNIT_FIELDS,
  TEMPERATURE_FIELDS,
} from '@constants/built-environmental-profile-flow';
import { useGeographyAutocomplete } from '@hooks/useGeographyAutocomplete';
import { useUnitSelector } from '@hooks/useUnitSelector';
import { useMultipleClickOutside } from '@hooks/useClickOutside';
import { KG_G_UNITS, unitOptions } from '@constants/mockData';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import LocationSearch from '@common/LocationSearch/LocationSearch';
import type {
  BenchmarkingAuditQueryParams,
  SearchDatabaseFormData,
} from '@type/built-enviromental-profile';

interface CompleteSupplierDetailsProps {
  onNext?: () => void;
  onPrevious?: () => void;
  handleRedirectToComponentDetails?: () => void;
  detailsCard?: ReactNode;
}

type StoragePayloadKey =
  | 'storageFulfilmentDetails'
  | 'cpgBrandDetails'
  | 'retailerDetails';

type ContractActivityKey =
  | 'filling'
  | 'mixing'
  | 'heating'
  | 'homogenising'
  | 'labelling'
  | 'cooling'
  | 'fermenting'
  | 'packaging';

const STORAGE_ROLE_SLUG_MAP: Record<string, StoragePayloadKey> = {
  storageFulfilment: 'storageFulfilmentDetails',
  cpgBrand: 'cpgBrandDetails',
  retailer: 'retailerDetails',
};

const UNITS_EXCLUDING_OTHER = unitOptions
  .filter((opt) => opt.value !== 'other')
  .map((opt) => opt.value);

const NUMERIC_REQUIRED_MESSAGE: Record<string, string> = {
  netWeight: ERROR_MESSAGES.NET_WEIGHT_OF_COMPONENT_USED_PER_SKU_REQUIRED,
  transportNetWeight: ERROR_MESSAGES.NET_WEIGHT_PER_UNIT_TRANSPORTED_REQUIRED,
  packagingNetWeight:
    ERROR_MESSAGES.NET_WEIGHT_OF_COMPONENT_USED_PER_SKU_REQUIRED,
  storageDays: ERROR_MESSAGES.STORAGE_DAYS_REQUIRED,
  volumePerSku: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  floorAreaPerSku: ERROR_MESSAGES.FLOOR_AREA_REQUIRED,
  'filling.volumePerUnit': ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'mixing.volumePerUnit': ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'heating.volumePerUnit': ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'heating.currentTemperature': ERROR_MESSAGES.CURRENT_TEMPRETURE_REQUIRED,
  'heating.targetTemperature':
    ERROR_MESSAGES.TARGET_HEATING_TEMPRETURE_REQUIRED,
  'homogenising.volumePerUnit':
    ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'cooling.volumePerUnit': ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'cooling.currentTemperature': ERROR_MESSAGES.CURRENT_TEMPRETURE_REQUIRED,
  'cooling.targetTemperature':
    ERROR_MESSAGES.TARGET_COOLING_TEMPRETURE_REQUIRED,
  'fermenting.volumePerUnit':
    ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'packaging.volumePerUnit': ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
  'labelling.numberOfLabels': ERROR_MESSAGES.NUMBER_OF_LABELS_PER_SKU_REQUIRED,
};

const CONTRACT_SECTION_LABELS: Record<ContractActivityKey, string> = {
  filling: 'Filling',
  mixing: 'Mixing',
  heating: 'Heating',
  homogenising: 'Homogenising',
  labelling: 'Labelling',
  cooling: 'Cooling',
  fermenting: 'Fermenting',
  packaging: 'Packing',
};

const getStoragePayloadKey = (roleSlug?: string): StoragePayloadKey | null =>
  roleSlug && roleSlug in STORAGE_ROLE_SLUG_MAP
    ? STORAGE_ROLE_SLUG_MAP[roleSlug]
    : null;

const normalizeForComparison = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForComparison(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const normalizedValue = normalizeForComparison(
          (value as Record<string, unknown>)[key]
        );
        if (normalizedValue !== undefined) {
          acc[key] = normalizedValue;
        }
        return acc;
      }, {});
  }

  return value;
};

const areObjectsEqual = (a: unknown, b: unknown): boolean =>
  JSON.stringify(normalizeForComparison(a)) ===
  JSON.stringify(normalizeForComparison(b));

const getRoleDetailsPayloadFromComponent = (
  data: ComponentDetails | null,
  roleSlug?: string
) => {
  if (!data || !roleSlug) return {};

  if (roleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR) {
    const details = data.rawMaterialSupplierDetails;
    if (!details) return {};
    return {
      rawMaterialSupplierDetails: {
        netWeightUsedPerSku: details.netWeightUsedPerSku,
        netWeightUnit: details.netWeightUnit,
        supplierLocation: details.supplierLocation,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
    const details = data.transportFreightDetails;
    if (!details) return {};
    return {
      transportFreightDetails: {
        netWeightPerUnit: details.netWeightPerUnit,
        netWeightUnit: details.netWeightUnit,
        transportRegion: details.transportRegion,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT) {
    const details = data.storageFulfilmentDetails;
    if (!details) return {};
    return {
      storageFulfilmentDetails: {
        storageDays: details.storageDays,
        volumePerSku: details.volumePerSku,
        floorAreaPerSku: details.floorAreaPerSku,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND) {
    const details = data.cpgBrandDetails;
    if (!details) return {};
    return {
      cpgBrandDetails: {
        storageDays: details.storageDays,
        volumePerSku: details.volumePerSku,
        floorAreaPerSku: details.floorAreaPerSku,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.RETAILER) {
    const details = data.retailerDetails;
    if (!details) return {};
    return {
      retailerDetails: {
        storageDays: details.storageDays,
        volumePerSku: details.volumePerSku,
        floorAreaPerSku: details.floorAreaPerSku,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR) {
    const details = data.packagingManufacturerDetails;
    if (!details) return {};
    return {
      packagingManufacturerDetails: {
        netWeightUsedPerSku: details.netWeightUsedPerSku,
        netWeightUnit: details.netWeightUnit,
        supplierLocation: details.supplierLocation,
      },
    };
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
    const details = data.contractManufacturerDetails;
    if (!details) return {};

    const canonicalContractDetails: Record<string, unknown> = {};

    if (details.filling) {
      canonicalContractDetails.filling = {
        volumePerUnit: details.filling.volumePerUnit,
        volumeUnit: details.filling.volumeUnit,
      };
    }

    if (details.mixing) {
      canonicalContractDetails.mixing = {
        volumePerUnit: details.mixing.volumePerUnit,
        volumeUnit: details.mixing.volumeUnit,
      };
    }

    if (details.heating) {
      canonicalContractDetails.heating = {
        volumePerUnit: details.heating.volumePerUnit,
        volumeUnit: details.heating.volumeUnit,
        currentTemperature: details.heating.currentTemperature,
        targetTemperature: details.heating.targetTemperature,
      };
    }

    if (details.homogenising) {
      canonicalContractDetails.homogenising = {
        volumePerUnit: details.homogenising.volumePerUnit,
        volumeUnit: details.homogenising.volumeUnit,
      };
    }

    if (details.labelling) {
      canonicalContractDetails.labelling = {
        numberOfLabels: details.labelling.numberOfLabels,
      };
    }

    if (details.cooling) {
      canonicalContractDetails.cooling = {
        volumePerUnit: details.cooling.volumePerUnit,
        volumeUnit: details.cooling.volumeUnit,
        currentTemperature: details.cooling.currentTemperature,
        targetTemperature: details.cooling.targetTemperature,
      };
    }

    if (details.fermenting) {
      canonicalContractDetails.fermenting = {
        volumePerUnit: details.fermenting.volumePerUnit,
        volumeUnit: details.fermenting.volumeUnit,
      };
    }

    if (details.packaging) {
      canonicalContractDetails.packaging = {
        volumePerUnit: details.packaging.volumePerUnit,
        volumeUnit: details.packaging.volumeUnit,
      };
    }

    return Object.keys(canonicalContractDetails).length > 0
      ? { contractManufacturerDetails: canonicalContractDetails }
      : {};
  }

  return {};
};

const buildLabel = (
  label: string,
  tooltipText?: string,
  required: boolean = true
) => {
  if (!tooltipText) {
    return (
      <label className={parentStyles.fieldLabel}>
        {label} {required && <span className={parentStyles.required}>*</span>}
      </label>
    );
  }

  return (
    <div className={parentStyles.labelWithIcon}>
      <label
        className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
      >
        {label} {required && <span className={parentStyles.required}>*</span>}
        <Tooltip text={tooltipText} noTruncate>
          <img src={infoIcon} alt="Info" className={parentStyles.infoIcon} />
        </Tooltip>
      </label>
    </div>
  );
};

const CompleteSupplierDetails = memo(
  ({
    onNext,
    onPrevious,
    handleRedirectToComponentDetails: onRedirectToComponentDetails,
    detailsCard,
  }: CompleteSupplierDetailsProps) => {
    const {
      componentId,
      selectedRole,
      componentDetails,
      supplierDetailsFormData,
      setSupplierDetailsFormData,
      updateSupplierDetailsField,
      setComponentDetails,
      setAudit,
      setBenchmarkingResetBySupplierDetails,
      getSearchDatabaseFormData,
      setImpactCategorySearchResetByBenchmarking,
      setImpactValueClearBySupplierDetails,
    } = useBuiltEnvironmentalProfileFlowStore(
      useShallow((s) => ({
        componentId: s.componentId,
        selectedRole: s.selectedRole,
        componentDetails: s.componentDetails,
        supplierDetailsFormData: s.supplierDetailsFormData,
        setSupplierDetailsFormData: s.setSupplierDetailsFormData,
        updateSupplierDetailsField: s.updateSupplierDetailsField,
        setComponentDetails: s.setComponentDetails,
        setAudit: s.setAudit,
        setBenchmarkingResetBySupplierDetails:
          s.setBenchmarkingResetBySupplierDetails,
        getSearchDatabaseFormData: s.getSearchDatabaseFormData,
        setImpactCategorySearchResetByBenchmarking:
          s.setImpactCategorySearchResetByBenchmarking,
        setImpactValueClearBySupplierDetails:
          s.setImpactValueClearBySupplierDetails,
      }))
    );

    const { showAlert } = useAlertStore();
    const { showSpinner, hideSpinner } = useSpinnerStore();

    const hasPopulatedFormRef = useRef<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const roleSlug = selectedRole?.supplierRoleSlug;

    const shouldShowStorageSection = useMemo(
      () => !!getStoragePayloadKey(roleSlug),
      [roleSlug]
    );

    const shouldShowPackagingSection = useMemo(
      () =>
        roleSlug ===
        SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR,
      [roleSlug]
    );

    const shouldShowContractManufacturerSection = useMemo(
      () => roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER,
      [roleSlug]
    );

    const manufacturingActivityTypes = useMemo(() => {
      if (roleSlug !== SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
        return [];
      }

      return componentDetails?.manufacturingActivityTypes || [];
    }, [componentDetails, roleSlug]);

    const shouldShowActivityType = useCallback(
      (activityTypes: string | string[]) => {
        if (roleSlug !== SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
          return false;
        }

        const types = Array.isArray(activityTypes)
          ? activityTypes
          : [activityTypes];
        const savedKeys = Object.keys(
          componentDetails?.contractManufacturerDetails ?? {}
        );

        return types.some(
          (type) =>
            manufacturingActivityTypes.includes(type) || savedKeys.includes(type)
        );
      },
      [componentDetails, manufacturingActivityTypes, roleSlug]
    );

    const visibleContractActivities = useMemo(
      () => ({
        filling: shouldShowActivityType('filling'),
        mixing: shouldShowActivityType('mixing'),
        heating: shouldShowActivityType('heating'),
        homogenising: shouldShowActivityType('homogenising'),
        labelling: shouldShowActivityType(['labelling']),
        cooling: shouldShowActivityType('cooling'),
        fermenting: shouldShowActivityType('fermenting'),
        packaging: shouldShowActivityType(['packaging']),
      }),
      [shouldShowActivityType]
    );

    const setError = useCallback((field: string, message: string) => {
      setErrors((prev) => ({ ...prev, [field]: message }));
    }, []);

    const clearError = useCallback((field: string) => {
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, []);

    const updateContractManufacturerField = useCallback(
      (activityKey: ContractActivityKey, field: string, value: string) => {
        const currentFormData = supplierDetailsFormData;
        const contractManufacturer = {
          ...currentFormData.contractManufacturer,
        };
        const currentActivity = contractManufacturer[activityKey];

        if (activityKey === 'labelling') {
          contractManufacturer[activityKey] = {
            ...(currentActivity as any),
            numberOfLabels: value,
          };
        } else if (activityKey === 'heating' || activityKey === 'cooling') {
          const tempActivity = currentActivity as any;
          contractManufacturer[activityKey] = {
            volumePerUnit: tempActivity?.volumePerUnit || '',
            volumeUnit: tempActivity?.volumeUnit || '',
            currentTemperature: tempActivity?.currentTemperature || '',
            targetTemperature: tempActivity?.targetTemperature || '',
            ...tempActivity,
            [field]: value,
          };
        } else {
          const volActivity = currentActivity as any;
          contractManufacturer[activityKey] = {
            volumePerUnit: volActivity?.volumePerUnit || '',
            volumeUnit: volActivity?.volumeUnit || '',
            ...volActivity,
            [field]: value,
          };
        }

        setSupplierDetailsFormData({
          ...currentFormData,
          contractManufacturer,
        });
      },
      [setSupplierDetailsFormData, supplierDetailsFormData]
    );

    const validateNumericField = useCallback(
      (field: string, value: string) => {
        if (hasLeadingOrTrailingSpaces(value)) {
          setError(field, ERROR_MESSAGES.LEADING_TRAILING_SPACES);
          return;
        }

        const trimmed = value.trim();
        const requiredMsg =
          NUMERIC_REQUIRED_MESSAGE[field] ??
          ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;

        if (!trimmed) {
          setError(field, requiredMsg);
          return;
        }

        if (trimmed.includes('.')) {
          const decimalPart = trimmed.split('.')[1];
          if (decimalPart.length > 3) {
            setError(field, ERROR_MESSAGES.ONLY_THREE_DECIMAL_ALLOWED);
            return;
          }
        }

        if (!isValidNumericField(trimmed)) {
          setError(field, ERROR_MESSAGES.WEIGHT_VOLUME_RANGE_EXCEEDED);
          return;
        }

        clearError(field);
      },
      [clearError, setError]
    );

    const validateTemperature = useCallback(
      (field: string, value: string) => {
        if (hasLeadingOrTrailingSpaces(value)) {
          setError(field, ERROR_MESSAGES.LEADING_TRAILING_SPACES);
          return;
        }

        const trimmed = value.trim();
        const requiredMsg =
          NUMERIC_REQUIRED_MESSAGE[field] ??
          ERROR_MESSAGES.CURRENT_TEMPRETURE_REQUIRED;

        if (!trimmed) {
          setError(field, requiredMsg);
          return;
        }

        if (trimmed.includes('.')) {
          const decimalPart = trimmed.split('.')[1];
          if (decimalPart.length > 1) {
            setError(field, ERROR_MESSAGES.ONLY_ONE_DECIMAL_ALLOWED);
            return;
          }
        }

        let min: number;
        let max: number;
        let rangeErrorMsg: string;

        if (
          field === 'heating.currentTemperature' ||
          field === 'cooling.currentTemperature'
        ) {
          min = -50;
          max = 500;
          rangeErrorMsg = ERROR_MESSAGES.CURRENT_TEMPERATURE_RANGE_EXCEEDED;
        } else if (field === 'heating.targetTemperature') {
          min = 0;
          max = 500;
          rangeErrorMsg =
            ERROR_MESSAGES.TARGET_HEATING_TEMPERATURE_RANGE_EXCEEDED;
        } else if (field === 'cooling.targetTemperature') {
          min = -100;
          max = 100;
          rangeErrorMsg =
            ERROR_MESSAGES.TARGET_COOLING_TEMPERATURE_RANGE_EXCEEDED;
        } else {
          min = -50;
          max = 500;
          rangeErrorMsg = ERROR_MESSAGES.CURRENT_TEMPERATURE_RANGE_EXCEEDED;
        }

        if (!isValidTemperature(trimmed, min, max)) {
          setError(field, rangeErrorMsg);
          return;
        }

        const contractData = supplierDetailsFormData.contractManufacturer;

        if (field === 'heating.targetTemperature') {
          const currentTemp = contractData.heating?.currentTemperature?.trim();
          if (currentTemp && parseFloat(trimmed) <= parseFloat(currentTemp)) {
            setError(field, ERROR_MESSAGES.TARGET_HEATING_TEMPERATURE_COMPARISON);
            return;
          }
        } else if (field === 'cooling.targetTemperature') {
          const currentTemp = contractData.cooling?.currentTemperature?.trim();
          if (currentTemp && parseFloat(trimmed) >= parseFloat(currentTemp)) {
            setError(field, ERROR_MESSAGES.TARGET_COOLING_TEMPERATURE_COMPARISON);
            return;
          }
        } else if (field === 'heating.currentTemperature') {
          const targetTemp = contractData.heating?.targetTemperature?.trim();
          if (targetTemp) {
            if (parseFloat(targetTemp) <= parseFloat(trimmed)) {
              setError(
                'heating.targetTemperature',
                ERROR_MESSAGES.TARGET_HEATING_TEMPERATURE_COMPARISON
              );
            } else {
              clearError('heating.targetTemperature');
            }
          }
        } else if (field === 'cooling.currentTemperature') {
          const targetTemp = contractData.cooling?.targetTemperature?.trim();
          if (targetTemp) {
            if (parseFloat(targetTemp) >= parseFloat(trimmed)) {
              setError(
                'cooling.targetTemperature',
                ERROR_MESSAGES.TARGET_COOLING_TEMPERATURE_COMPARISON
              );
            } else {
              clearError('cooling.targetTemperature');
            }
          }
        }

        clearError(field);
      },
      [clearError, setError, supplierDetailsFormData]
    );

    const validateIntegerField = useCallback(
      (field: string, value: string) => {
        if (hasLeadingOrTrailingSpaces(value)) {
          setError(field, ERROR_MESSAGES.LEADING_TRAILING_SPACES);
          return;
        }

        const trimmed = value.trim();
        if (!trimmed) {
          setError(
            field,
            NUMERIC_REQUIRED_MESSAGE[field] ??
              ERROR_MESSAGES.NET_UNITSIZE_REQUIRED
          );
          return;
        }

        if (trimmed.includes('.')) {
          setError(field, ERROR_MESSAGES.DECIMAL_NOT_ALLOWED);
          return;
        }

        let min: number;
        let max: number;
        let rangeErrorMsg: string;

        if (field === 'storageDays') {
          min = 1;
          max = 999;
          rangeErrorMsg = ERROR_MESSAGES.STORAGE_DAYS_RANGE_EXCEEDED;
        } else if (field === 'labelling.numberOfLabels') {
          min = 1;
          max = 100;
          rangeErrorMsg = ERROR_MESSAGES.LABEL_PER_SKU_RANGE_EXCEEDED;
        } else {
          min = 1;
          max = 100;
          rangeErrorMsg = ERROR_MESSAGES.LABEL_PER_SKU_RANGE_EXCEEDED;
        }

        if (!isvalidIntegerField(trimmed, min, max)) {
          setError(field, rangeErrorMsg);
          return;
        }

        clearError(field);
      },
      [clearError, setError]
    );

    const rawMaterialsPlaces = useGeographyAutocomplete({
      value: supplierDetailsFormData.rawMaterialSupplier.supplierLocation,
      onSelect: (address) =>
        updateSupplierDetailsField(
          'rawMaterialSupplier',
          'supplierLocation',
          address
        ),
    });

    const transportPlaces = useGeographyAutocomplete({
      value: supplierDetailsFormData.transportFreight.transportRegion,
      onSelect: (address) =>
        updateSupplierDetailsField('transportFreight', 'transportRegion', address),
    });

    const packagingPlaces = useGeographyAutocomplete({
      value: supplierDetailsFormData.packagingManufacturer.supplierLocation,
      onSelect: (address) =>
        updateSupplierDetailsField(
          'packagingManufacturer',
          'supplierLocation',
          address
        ),
    });

    const rawMaterialsUnit = useUnitSelector({
      value: supplierDetailsFormData.rawMaterialSupplier.unitOfMeasurement,
      onValueChange: (value) =>
        updateSupplierDetailsField(
          'rawMaterialSupplier',
          'unitOfMeasurement',
          value
        ),
      onErrorChange: (error) => {
        if (error) setError('unitOfMeasurement', error);
        else clearError('unitOfMeasurement');
      },
      allowedUnits: UNITS_EXCLUDING_OTHER,
      allowCustom: false,
    });

    const transportUnit = useUnitSelector({
      value:
        supplierDetailsFormData.transportFreight.transportUnitOfMeasurement,
      onValueChange: (value) =>
        updateSupplierDetailsField(
          'transportFreight',
          'transportUnitOfMeasurement',
          value
        ),
      onErrorChange: (error) => {
        if (error) setError('transportUnitOfMeasurement', error);
        else clearError('transportUnitOfMeasurement');
      },
      allowedUnits: UNITS_EXCLUDING_OTHER,
      allowCustom: false,
    });

    const packagingUnit = useUnitSelector({
      value: supplierDetailsFormData.packagingManufacturer.unitOfMeasurement,
      onValueChange: (value) =>
        updateSupplierDetailsField(
          'packagingManufacturer',
          'unitOfMeasurement',
          value
        ),
      onErrorChange: (error) => {
        if (error) setError('packagingUnitOfMeasurement', error);
        else clearError('packagingUnitOfMeasurement');
      },
      allowedUnits: UNITS_EXCLUDING_OTHER,
      allowCustom: false,
    });

    const contractFillingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.filling?.volumeUnit || '',
      onValueChange: (v) =>
        updateContractManufacturerField('filling', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('filling.volumeUnit', e);
        else clearError('filling.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractMixingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.mixing?.volumeUnit || '',
      onValueChange: (v) =>
        updateContractManufacturerField('mixing', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('mixing.volumeUnit', e);
        else clearError('mixing.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractHomogenisingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.homogenising?.volumeUnit ||
        '',
      onValueChange: (v) =>
        updateContractManufacturerField('homogenising', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('homogenising.volumeUnit', e);
        else clearError('homogenising.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractFermentingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.fermenting?.volumeUnit ||
        '',
      onValueChange: (v) =>
        updateContractManufacturerField('fermenting', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('fermenting.volumeUnit', e);
        else clearError('fermenting.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractPackagingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.packaging?.volumeUnit ||
        '',
      onValueChange: (v) =>
        updateContractManufacturerField('packaging', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('packaging.volumeUnit', e);
        else clearError('packaging.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractHeatingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.heating?.volumeUnit || '',
      onValueChange: (v) =>
        updateContractManufacturerField('heating', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('heating.volumeUnit', e);
        else clearError('heating.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractCoolingUnit = useUnitSelector({
      value:
        supplierDetailsFormData.contractManufacturer.cooling?.volumeUnit || '',
      onValueChange: (v) =>
        updateContractManufacturerField('cooling', 'volumeUnit', v),
      onErrorChange: (e) => {
        if (e) setError('cooling.volumeUnit', e);
        else clearError('cooling.volumeUnit');
      },
      allowedUnits: [...KG_G_UNITS],
      allowCustom: false,
    });

    const contractUnitHooks = useMemo(
      () => ({
        filling: contractFillingUnit,
        mixing: contractMixingUnit,
        heating: contractHeatingUnit,
        homogenising: contractHomogenisingUnit,
        cooling: contractCoolingUnit,
        fermenting: contractFermentingUnit,
        packaging: contractPackagingUnit,
      }),
      [
        contractCoolingUnit,
        contractFermentingUnit,
        contractFillingUnit,
        contractHeatingUnit,
        contractHomogenisingUnit,
        contractMixingUnit,
        contractPackagingUnit,
      ]
    );

    const unitHooks = useMemo(
      () => [
        rawMaterialsUnit,
        transportUnit,
        packagingUnit,
        contractFillingUnit,
        contractMixingUnit,
        contractHomogenisingUnit,
        contractFermentingUnit,
        contractPackagingUnit,
        contractHeatingUnit,
        contractCoolingUnit,
      ],
      [
        rawMaterialsUnit,
        transportUnit,
        packagingUnit,
        contractFillingUnit,
        contractMixingUnit,
        contractHomogenisingUnit,
        contractFermentingUnit,
        contractPackagingUnit,
        contractHeatingUnit,
        contractCoolingUnit,
      ]
    );

    useMultipleClickOutside(unitHooks);

    const populateFormFromResponse = useCallback(
      (data: ComponentDetails, currentRoleSlug: string) => {
        const shouldPopulateForRole = (slug: string) => slug === currentRoleSlug;

        const currentFormData =
          useBuiltEnvironmentalProfileFlowStore.getState()
            .supplierDetailsFormData;

        const updated = {
          ...currentFormData,
          rawMaterialSupplier: { ...currentFormData.rawMaterialSupplier },
          transportFreight: { ...currentFormData.transportFreight },
          storageSection: { ...currentFormData.storageSection },
          packagingManufacturer: { ...currentFormData.packagingManufacturer },
          contractManufacturer: { ...currentFormData.contractManufacturer },
        };

        if (
          shouldPopulateForRole(
            SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
          ) &&
          data.rawMaterialSupplierDetails
        ) {
          const details = data.rawMaterialSupplierDetails;
          updated.rawMaterialSupplier.netWeight =
            details.netWeightUsedPerSku?.toString() || '';
          updated.rawMaterialSupplier.unitOfMeasurement =
            details.netWeightUnit || '';
          updated.rawMaterialSupplier.supplierLocation =
            details.supplierLocation || '';
        }

        if (
          shouldPopulateForRole(SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) &&
          data.transportFreightDetails
        ) {
          const details = data.transportFreightDetails;
          updated.transportFreight.transportNetWeight =
            details.netWeightPerUnit?.toString() || '';
          updated.transportFreight.transportUnitOfMeasurement =
            details.netWeightUnit || '';
          updated.transportFreight.transportRegion =
            details.transportRegion || '';
        }

        if (
          shouldPopulateForRole(SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT) &&
          data.storageFulfilmentDetails
        ) {
          const details = data.storageFulfilmentDetails;
          updated.storageSection.storageDays =
            details.storageDays?.toString() || '';
          updated.storageSection.volumePerSku =
            details.volumePerSku?.toString() || '';
          updated.storageSection.floorAreaPerSku =
            details.floorAreaPerSku?.toString() || '';
        }

        if (
          shouldPopulateForRole(SUPPLIER_ROLE_SLUGS.CPG_BRAND) &&
          data.cpgBrandDetails
        ) {
          const details = data.cpgBrandDetails;
          updated.storageSection.storageDays =
            details.storageDays?.toString() || '';
          updated.storageSection.volumePerSku =
            details.volumePerSku?.toString() || '';
          updated.storageSection.floorAreaPerSku =
            details.floorAreaPerSku?.toString() || '';
        }

        if (
          shouldPopulateForRole(SUPPLIER_ROLE_SLUGS.RETAILER) &&
          data.retailerDetails
        ) {
          const details = data.retailerDetails;
          updated.storageSection.storageDays =
            details.storageDays?.toString() || '';
          updated.storageSection.volumePerSku =
            details.volumePerSku?.toString() || '';
          updated.storageSection.floorAreaPerSku =
            details.floorAreaPerSku?.toString() || '';
        }

        if (
          shouldPopulateForRole(
            SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
          ) &&
          data.packagingManufacturerDetails
        ) {
          const details = data.packagingManufacturerDetails;
          updated.packagingManufacturer.netWeight =
            details.netWeightUsedPerSku?.toString() || '';
          updated.packagingManufacturer.unitOfMeasurement =
            details.netWeightUnit || '';
          updated.packagingManufacturer.supplierLocation =
            details.supplierLocation || '';
        }

        if (
          shouldPopulateForRole(SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) &&
          data.contractManufacturerDetails
        ) {
          const details = data.contractManufacturerDetails;

          if (details.filling) {
            updated.contractManufacturer.filling = {
              volumePerUnit: details.filling.volumePerUnit?.toString() || '',
              volumeUnit: details.filling.volumeUnit || '',
            };
          }

          if (details.mixing) {
            updated.contractManufacturer.mixing = {
              volumePerUnit: details.mixing.volumePerUnit?.toString() || '',
              volumeUnit: details.mixing.volumeUnit || '',
            };
          }

          if (details.heating) {
            updated.contractManufacturer.heating = {
              volumePerUnit: details.heating.volumePerUnit?.toString() || '',
              volumeUnit: details.heating.volumeUnit || '',
              currentTemperature:
                details.heating.currentTemperature?.toString() || '',
              targetTemperature:
                details.heating.targetTemperature?.toString() || '',
            };
          }

          if (details.homogenising) {
            updated.contractManufacturer.homogenising = {
              volumePerUnit:
                details.homogenising.volumePerUnit?.toString() || '',
              volumeUnit: details.homogenising.volumeUnit || '',
            };
          }

          if (details.labelling) {
            updated.contractManufacturer.labelling = {
              numberOfLabels: details.labelling.numberOfLabels?.toString() || '',
            };
          }

          if (details.cooling) {
            updated.contractManufacturer.cooling = {
              volumePerUnit: details.cooling.volumePerUnit?.toString() || '',
              volumeUnit: details.cooling.volumeUnit || '',
              currentTemperature:
                details.cooling.currentTemperature?.toString() || '',
              targetTemperature:
                details.cooling.targetTemperature?.toString() || '',
            };
          }

          if (details.fermenting) {
            updated.contractManufacturer.fermenting = {
              volumePerUnit: details.fermenting.volumePerUnit?.toString() || '',
              volumeUnit: details.fermenting.volumeUnit || '',
            };
          }

          if (details.packaging) {
            updated.contractManufacturer.packaging = {
              volumePerUnit: details.packaging.volumePerUnit?.toString() || '',
              volumeUnit: details.packaging.volumeUnit || '',
            };
          }
        }

        setSupplierDetailsFormData(updated);
      },
      [setSupplierDetailsFormData]
    );

    useEffect(() => {
      if (!componentDetails || !roleSlug || !componentId) return;

      const componentKey = `${componentId}-${roleSlug}`;
      if (hasPopulatedFormRef.current === componentKey) return;

      populateFormFromResponse(componentDetails, roleSlug);
      hasPopulatedFormRef.current = componentKey;
    }, [componentDetails, componentId, populateFormFromResponse, roleSlug]);

    type FormData = typeof supplierDetailsFormData;

    const handleFieldChange = useCallback(
      <S extends keyof FormData, F extends keyof FormData[S]>(
        section: S,
        field: F,
        value: FormData[S][F],
        errorKey?: string
      ) => {
        updateSupplierDetailsField(section, field, value);
        clearError(errorKey || String(field));
      },
      [clearError, updateSupplierDetailsField]
    );

    const getUnitValidatorByField = useCallback(
      (field: string) => {
        switch (field) {
          case 'unitOfMeasurement':
            return () => rawMaterialsUnit.validateUnit(rawMaterialsUnit.isCustom);
          case 'transportUnitOfMeasurement':
            return () => transportUnit.validateUnit(transportUnit.isCustom);
          case 'packagingUnitOfMeasurement':
            return () => packagingUnit.validateUnit(packagingUnit.isCustom);
          case 'filling.volumeUnit':
            return () => contractFillingUnit.validateUnit(false);
          case 'mixing.volumeUnit':
            return () => contractMixingUnit.validateUnit(false);
          case 'heating.volumeUnit':
            return () => contractHeatingUnit.validateUnit(false);
          case 'homogenising.volumeUnit':
            return () => contractHomogenisingUnit.validateUnit(false);
          case 'cooling.volumeUnit':
            return () => contractCoolingUnit.validateUnit(false);
          case 'fermenting.volumeUnit':
            return () => contractFermentingUnit.validateUnit(false);
          case 'packaging.volumeUnit':
            return () => contractPackagingUnit.validateUnit(false);
          default:
            return null;
        }
      },
      [
        contractCoolingUnit,
        contractFermentingUnit,
        contractFillingUnit,
        contractHeatingUnit,
        contractHomogenisingUnit,
        contractMixingUnit,
        contractPackagingUnit,
        packagingUnit,
        rawMaterialsUnit,
        transportUnit,
      ]
    );

    const handleFieldBlur = useCallback(
      (field: string, value: string, customUnitFlag?: boolean) => {
        if (NUMERIC_FIELDS.has(field)) {
          validateNumericField(field, value);
          return;
        }

        if (INTEGER_FIELDS.has(field)) {
          validateIntegerField(field, value);
          return;
        }

        if (TEMPERATURE_FIELDS.has(field)) {
          validateTemperature(field, value);
          return;
        }

        if (UNIT_FIELDS.has(field)) {
          if (field === 'unitOfMeasurement') {
            rawMaterialsUnit.validateUnit(customUnitFlag);
            return;
          }

          if (field === 'transportUnitOfMeasurement') {
            transportUnit.validateUnit(customUnitFlag);
            return;
          }

          if (field === 'packagingUnitOfMeasurement') {
            packagingUnit.validateUnit(customUnitFlag);
            return;
          }

          const validateUnit = getUnitValidatorByField(field);
          if (validateUnit) validateUnit();
        }
      },
      [
        getUnitValidatorByField,
        packagingUnit,
        rawMaterialsUnit,
        transportUnit,
        validateIntegerField,
        validateNumericField,
        validateTemperature,
      ]
    );

    const handleFocus = useCallback(
      (field: string) => {
        clearError(field);
      },
      [clearError]
    );

type SearchFieldKey = keyof SearchDatabaseFormData;
const SEARCH_FIELD_KEYS: SearchFieldKey[] = [
  'componentName',
  'supplierLocation',
  'transportMethod',
  'transportRegion',
  'lciaMethodology',
  'casNumber',
  'industry',
];

const hasAnySearchFilterValue = (formData: SearchDatabaseFormData): boolean =>
  SEARCH_FIELD_KEYS.some((key) => (formData[key] ?? '').trim().length > 0);

const buildBenchmarkingQueryParams = (
  formData: SearchDatabaseFormData
): BenchmarkingAuditQueryParams | undefined => {
  const lciaMethodology = (formData.lciaMethodology ?? '').trim();
  if (!lciaMethodology) return undefined;

  const params: BenchmarkingAuditQueryParams = { lciaMethodology };

  const componentName = (formData.componentName ?? '').trim();
  const supplierLocation = (formData.supplierLocation ?? '').trim();
  const transportMethod = (formData.transportMethod ?? '').trim();
  const transportRegion = (formData.transportRegion ?? '').trim();
  const casNumber = (formData.casNumber ?? '').trim();
  const industry = (formData.industry ?? '').trim();

  if (componentName) params.componentName = componentName;
  if (supplierLocation) params.supplierLocation = supplierLocation;
  if (transportMethod) params.transportMethod = transportMethod;
  if (transportRegion) params.transportRegion = transportRegion;
  if (casNumber) params.casNumber = casNumber;
  if (industry) params.industry = industry;

  return params;
};

type SaveBuiltEnvironmentalProfilePayload =
  Parameters<typeof saveBuiltEnvironmentalProfile>[1];

const buildPayload = useCallback((): SaveBuiltEnvironmentalProfilePayload => {
  const payload: SaveBuiltEnvironmentalProfilePayload = {};
  if (!roleSlug) return payload;

  if (
    roleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
  ) {
    const rawMaterial = supplierDetailsFormData.rawMaterialSupplier;

    if (
      rawMaterial.netWeight &&
      rawMaterial.unitOfMeasurement &&
      rawMaterial.supplierLocation
    ) {
      payload.rawMaterialSupplierDetails = {
        netWeightUsedPerSku: parseFloat(rawMaterial.netWeight),
        netWeightUnit: rawMaterial.unitOfMeasurement,
        supplierLocation: rawMaterial.supplierLocation,
      };
    }
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
    const transport = supplierDetailsFormData.transportFreight;

    if (
      transport.transportNetWeight &&
      transport.transportUnitOfMeasurement &&
      transport.transportRegion
    ) {
      payload.transportFreightDetails = {
        netWeightPerUnit: parseFloat(transport.transportNetWeight),
        netWeightUnit: transport.transportUnitOfMeasurement,
        transportRegion: transport.transportRegion,
      };
    }
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT) {
    const storage = supplierDetailsFormData.storageSection;

    if (
      storage.storageDays &&
      storage.volumePerSku &&
      storage.floorAreaPerSku
    ) {
      payload.storageFulfilmentDetails = {
        storageDays: parseFloat(storage.storageDays),
        volumePerSku: parseFloat(storage.volumePerSku),
        floorAreaPerSku: parseFloat(storage.floorAreaPerSku),
      };
    }
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND) {
    const storage = supplierDetailsFormData.storageSection;

    if (
      storage.storageDays &&
      storage.volumePerSku &&
      storage.floorAreaPerSku
    ) {
      payload.cpgBrandDetails = {
        storageDays: parseFloat(storage.storageDays),
        volumePerSku: parseFloat(storage.volumePerSku),
        floorAreaPerSku: parseFloat(storage.floorAreaPerSku),
      };
    }
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.RETAILER) {
    const storage = supplierDetailsFormData.storageSection;

    if (
      storage.storageDays &&
      storage.volumePerSku &&
      storage.floorAreaPerSku
    ) {
      payload.retailerDetails = {
        storageDays: parseFloat(storage.storageDays),
        volumePerSku: parseFloat(storage.volumePerSku),
        floorAreaPerSku: parseFloat(storage.floorAreaPerSku),
      };
    }
  }

  if (
    roleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
  ) {
    const packaging = supplierDetailsFormData.packagingManufacturer;

    if (
      packaging.netWeight &&
      packaging.unitOfMeasurement &&
      packaging.supplierLocation
    ) {
      payload.packagingManufacturerDetails = {
        netWeightUsedPerSku: parseFloat(packaging.netWeight),
        netWeightUnit: packaging.unitOfMeasurement,
        supplierLocation: packaging.supplierLocation,
      };
    }
  }

  if (roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
    const contractDetails: NonNullable<
      SaveBuiltEnvironmentalProfilePayload['contractManufacturerDetails']
    > = {};

    const contractData = supplierDetailsFormData.contractManufacturer;

    if (
      visibleContractActivities.filling &&
      contractData.filling?.volumePerUnit &&
      contractData.filling?.volumeUnit
    ) {
      contractDetails.filling = {
        volumePerUnit: parseFloat(contractData.filling.volumePerUnit),
        volumeUnit: contractData.filling.volumeUnit,
      };
    }

    if (
      visibleContractActivities.mixing &&
      contractData.mixing?.volumePerUnit &&
      contractData.mixing?.volumeUnit
    ) {
      contractDetails.mixing = {
        volumePerUnit: parseFloat(contractData.mixing.volumePerUnit),
        volumeUnit: contractData.mixing.volumeUnit,
      };
    }

    if (
      visibleContractActivities.heating &&
      contractData.heating?.volumePerUnit &&
      contractData.heating?.volumeUnit &&
      contractData.heating?.currentTemperature &&
      contractData.heating?.targetTemperature
    ) {
      contractDetails.heating = {
        volumePerUnit: parseFloat(contractData.heating.volumePerUnit),
        volumeUnit: contractData.heating.volumeUnit,
        currentTemperature: parseFloat(contractData.heating.currentTemperature),
        targetTemperature: parseFloat(contractData.heating.targetTemperature),
      };
    }

    if (
      visibleContractActivities.homogenising &&
      contractData.homogenising?.volumePerUnit &&
      contractData.homogenising?.volumeUnit
    ) {
      contractDetails.homogenising = {
        volumePerUnit: parseFloat(contractData.homogenising.volumePerUnit),
        volumeUnit: contractData.homogenising.volumeUnit,
      };
    }

    if (
      visibleContractActivities.labelling &&
      contractData.labelling?.numberOfLabels
    ) {
      contractDetails.labelling = {
        numberOfLabels: parseInt(contractData.labelling.numberOfLabels, 10),
      };
    }

    if (
      visibleContractActivities.cooling &&
      contractData.cooling?.volumePerUnit &&
      contractData.cooling?.volumeUnit &&
      contractData.cooling?.currentTemperature &&
      contractData.cooling?.targetTemperature
    ) {
      contractDetails.cooling = {
        volumePerUnit: parseFloat(contractData.cooling.volumePerUnit),
        volumeUnit: contractData.cooling.volumeUnit,
        currentTemperature: parseFloat(contractData.cooling.currentTemperature),
        targetTemperature: parseFloat(contractData.cooling.targetTemperature),
      };
    }

    if (
      visibleContractActivities.fermenting &&
      contractData.fermenting?.volumePerUnit &&
      contractData.fermenting?.volumeUnit
    ) {
      contractDetails.fermenting = {
        volumePerUnit: parseFloat(contractData.fermenting.volumePerUnit),
        volumeUnit: contractData.fermenting.volumeUnit,
      };
    }

    if (
      visibleContractActivities.packaging &&
      contractData.packaging?.volumePerUnit &&
      contractData.packaging?.volumeUnit
    ) {
      contractDetails.packaging = {
        volumePerUnit: parseFloat(contractData.packaging.volumePerUnit),
        volumeUnit: contractData.packaging.volumeUnit,
      };
    }

    if (Object.keys(contractDetails).length > 0) {
      payload.contractManufacturerDetails = contractDetails;
    }
  }

  return payload;
}, [roleSlug, supplierDetailsFormData, visibleContractActivities]);
    const CONTRACT_REQUIRED_FIELDS = useMemo(() => {
      const fields: Array<{ key: string; message: string }> = [];

      if (visibleContractActivities.filling) {
        fields.push(
          {
            key: 'filling.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'filling.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          }
        );
      }

      if (visibleContractActivities.mixing) {
        fields.push(
          {
            key: 'mixing.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'mixing.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          }
        );
      }

      if (visibleContractActivities.heating) {
        fields.push(
          {
            key: 'heating.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'heating.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          },
          {
            key: 'heating.currentTemperature',
            message: ERROR_MESSAGES.CURRENT_TEMPRETURE_REQUIRED,
          },
          {
            key: 'heating.targetTemperature',
            message: ERROR_MESSAGES.TARGET_HEATING_TEMPRETURE_REQUIRED,
          }
        );
      }

      if (visibleContractActivities.homogenising) {
        fields.push(
          {
            key: 'homogenising.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'homogenising.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          }
        );
      }

      if (visibleContractActivities.labelling) {
        fields.push({
          key: 'labelling.numberOfLabels',
          message: ERROR_MESSAGES.NUMBER_OF_LABELS_PER_SKU_REQUIRED,
        });
      }

      if (visibleContractActivities.cooling) {
        fields.push(
          {
            key: 'cooling.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'cooling.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          },
          {
            key: 'cooling.currentTemperature',
            message: ERROR_MESSAGES.CURRENT_TEMPRETURE_REQUIRED,
          },
          {
            key: 'cooling.targetTemperature',
            message: ERROR_MESSAGES.TARGET_COOLING_TEMPRETURE_REQUIRED,
          }
        );
      }

      if (visibleContractActivities.fermenting) {
        fields.push(
          {
            key: 'fermenting.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'fermenting.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          }
        );
      }

      if (visibleContractActivities.packaging) {
        fields.push(
          {
            key: 'packaging.volumePerUnit',
            message: ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED,
          },
          {
            key: 'packaging.volumeUnit',
            message: ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE,
          }
        );
      }

      return fields;
    }, [visibleContractActivities]);

    const validateContractRequiredFields = useCallback(() => {
      const nextErrors: Record<string, string> = {};
      const contractData = supplierDetailsFormData.contractManufacturer;

      CONTRACT_REQUIRED_FIELDS.forEach(({ key, message }) => {
        const [activityKey, fieldKey] = key.split('.');
        const activity =
          contractData[activityKey as keyof typeof contractData];

        let value: string | undefined;
        if (activity && typeof activity === 'object') {
          value = (activity as any)[fieldKey];
        }

        if (!String(value ?? '').trim()) {
          nextErrors[key] = message;
        }
      });

      if (visibleContractActivities.filling) contractFillingUnit.validateUnit(false);
      if (visibleContractActivities.mixing) contractMixingUnit.validateUnit(false);
      if (visibleContractActivities.heating) contractHeatingUnit.validateUnit(false);
      if (visibleContractActivities.homogenising) {
        contractHomogenisingUnit.validateUnit(false);
      }
      if (visibleContractActivities.cooling) contractCoolingUnit.validateUnit(false);
      if (visibleContractActivities.fermenting) {
        contractFermentingUnit.validateUnit(false);
      }
      if (visibleContractActivities.packaging) {
        contractPackagingUnit.validateUnit(false);
      }

      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return Object.keys(nextErrors).length === 0;
    }, [
      CONTRACT_REQUIRED_FIELDS,
      contractCoolingUnit,
      contractFermentingUnit,
      contractFillingUnit,
      contractHeatingUnit,
      contractHomogenisingUnit,
      contractMixingUnit,
      contractPackagingUnit,
      supplierDetailsFormData,
      visibleContractActivities,
    ]);

    const validateContractFieldBlurs = useCallback(() => {
      const contractData = supplierDetailsFormData.contractManufacturer;

      if (visibleContractActivities.filling && contractData.filling?.volumePerUnit) {
        handleFieldBlur('filling.volumePerUnit', contractData.filling.volumePerUnit);
      }

      if (visibleContractActivities.mixing && contractData.mixing?.volumePerUnit) {
        handleFieldBlur('mixing.volumePerUnit', contractData.mixing.volumePerUnit);
      }

      if (visibleContractActivities.heating) {
        if (contractData.heating?.volumePerUnit) {
          handleFieldBlur(
            'heating.volumePerUnit',
            contractData.heating.volumePerUnit
          );
        }
        if (contractData.heating?.currentTemperature) {
          handleFieldBlur(
            'heating.currentTemperature',
            contractData.heating.currentTemperature
          );
        }
        if (contractData.heating?.targetTemperature) {
          handleFieldBlur(
            'heating.targetTemperature',
            contractData.heating.targetTemperature
          );
        }
      }

      if (
        visibleContractActivities.homogenising &&
        contractData.homogenising?.volumePerUnit
      ) {
        handleFieldBlur(
          'homogenising.volumePerUnit',
          contractData.homogenising.volumePerUnit
        );
      }

      if (
        visibleContractActivities.labelling &&
        contractData.labelling?.numberOfLabels
      ) {
        handleFieldBlur(
          'labelling.numberOfLabels',
          contractData.labelling.numberOfLabels
        );
      }

      if (visibleContractActivities.cooling) {
        if (contractData.cooling?.volumePerUnit) {
          handleFieldBlur(
            'cooling.volumePerUnit',
            contractData.cooling.volumePerUnit
          );
        }
        if (contractData.cooling?.currentTemperature) {
          handleFieldBlur(
            'cooling.currentTemperature',
            contractData.cooling.currentTemperature
          );
        }
        if (contractData.cooling?.targetTemperature) {
          handleFieldBlur(
            'cooling.targetTemperature',
            contractData.cooling.targetTemperature
          );
        }
      }

      if (
        visibleContractActivities.fermenting &&
        contractData.fermenting?.volumePerUnit
      ) {
        handleFieldBlur(
          'fermenting.volumePerUnit',
          contractData.fermenting.volumePerUnit
        );
      }

      if (
        visibleContractActivities.packaging &&
        contractData.packaging?.volumePerUnit
      ) {
        handleFieldBlur(
          'packaging.volumePerUnit',
          contractData.packaging.volumePerUnit
        );
      }
    }, [handleFieldBlur, supplierDetailsFormData, visibleContractActivities]);

    const validateForm = useCallback(() => {
      const newErrors: Record<string, string> = {};

      if (!roleSlug) {
        return false;
      }

      if (
        roleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
      ) {
        const rawMaterial = supplierDetailsFormData.rawMaterialSupplier;
        if (!rawMaterial.netWeight) {
          newErrors.netWeight = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        }
        if (!rawMaterial.unitOfMeasurement) {
          newErrors.unitOfMeasurement = ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE;
        }
        if (!rawMaterial.supplierLocation?.trim()) {
          newErrors.supplierLocation =
            ERROR_MESSAGES.SUPPLIER_LOCATION_REQUIRED;
        }
      }

      if (roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
        const transport = supplierDetailsFormData.transportFreight;
        if (!transport.transportNetWeight) {
          newErrors.transportNetWeight = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        }
        if (!transport.transportUnitOfMeasurement) {
          newErrors.transportUnitOfMeasurement =
            ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE;
        }
        if (!transport.transportRegion?.trim()) {
          newErrors.transportRegion = ERROR_MESSAGES.TRANSPORT_REGION_REQUIRED;
        }
      }

      if (getStoragePayloadKey(roleSlug)) {
        const storage = supplierDetailsFormData.storageSection;
        if (!storage.storageDays) {
          newErrors.storageDays = ERROR_MESSAGES.STORAGE_DAYS_REQUIRED;
        } else if (!isvalidIntegerField(storage.storageDays, 1, 999)) {
          newErrors.storageDays = ERROR_MESSAGES.STORAGE_DAYS_RANGE_EXCEEDED;
        }

        if (!storage.volumePerSku) {
          newErrors.volumePerSku =
            ERROR_MESSAGES.VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED;
        }

        if (!storage.floorAreaPerSku) {
          newErrors.floorAreaPerSku = ERROR_MESSAGES.FLOOR_AREA_REQUIRED;
        }
      }

      if (
        roleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
      ) {
        const packaging = supplierDetailsFormData.packagingManufacturer;
        if (!packaging.netWeight) {
          newErrors.packagingNetWeight = ERROR_MESSAGES.NET_UNITSIZE_REQUIRED;
        }
        if (!packaging.unitOfMeasurement) {
          newErrors.packagingUnitOfMeasurement =
            ERROR_MESSAGES.SELECT_UNIT_OF_MEASURE;
        }
        if (!packaging.supplierLocation?.trim()) {
          newErrors.packagingSupplierLocation =
            ERROR_MESSAGES.SUPPLIER_LOCATION_REQUIRED;
        }
      }

      if (roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
        const isContractOk = validateContractRequiredFields();
        if (!isContractOk) {
          return false;
        }
      }

      validateContractFieldBlurs();

      setErrors((prev) => ({ ...prev, ...newErrors }));
      return Object.keys(newErrors).length === 0;
    }, [
      roleSlug,
      supplierDetailsFormData,
      validateContractFieldBlurs,
      validateContractRequiredFields,
    ]);

    const hasFormErrors = Object.keys(errors).length > 0;

    const requiredFilled = useMemo(() => {
      if (!roleSlug) return false;

      if (
        roleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
      ) {
        const rawMaterial = supplierDetailsFormData.rawMaterialSupplier;
        return !!(
          rawMaterial.netWeight?.trim() &&
          rawMaterial.unitOfMeasurement?.trim() &&
          rawMaterial.supplierLocation?.trim()
        );
      }

      if (roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
        const transport = supplierDetailsFormData.transportFreight;
        return !!(
          transport.transportNetWeight?.trim() &&
          transport.transportUnitOfMeasurement?.trim() &&
          transport.transportRegion?.trim()
        );
      }

      if (getStoragePayloadKey(roleSlug)) {
        const storage = supplierDetailsFormData.storageSection;
        return !!(
          storage.storageDays?.trim() &&
          storage.volumePerSku?.trim() &&
          storage.floorAreaPerSku?.trim()
        );
      }

      if (
        roleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR
      ) {
        const packaging = supplierDetailsFormData.packagingManufacturer;
        return !!(
          packaging.netWeight?.trim() &&
          packaging.unitOfMeasurement?.trim() &&
          packaging.supplierLocation?.trim()
        );
      }

      if (roleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
        const contractData = supplierDetailsFormData.contractManufacturer;

        if (
          visibleContractActivities.filling &&
          (!contractData.filling?.volumePerUnit?.trim() ||
            !contractData.filling?.volumeUnit?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.mixing &&
          (!contractData.mixing?.volumePerUnit?.trim() ||
            !contractData.mixing?.volumeUnit?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.heating &&
          (!contractData.heating?.volumePerUnit?.trim() ||
            !contractData.heating?.volumeUnit?.trim() ||
            !contractData.heating?.currentTemperature?.trim() ||
            !contractData.heating?.targetTemperature?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.homogenising &&
          (!contractData.homogenising?.volumePerUnit?.trim() ||
            !contractData.homogenising?.volumeUnit?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.labelling &&
          !contractData.labelling?.numberOfLabels?.trim()
        ) {
          return false;
        }

        if (
          visibleContractActivities.cooling &&
          (!contractData.cooling?.volumePerUnit?.trim() ||
            !contractData.cooling?.volumeUnit?.trim() ||
            !contractData.cooling?.currentTemperature?.trim() ||
            !contractData.cooling?.targetTemperature?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.fermenting &&
          (!contractData.fermenting?.volumePerUnit?.trim() ||
            !contractData.fermenting?.volumeUnit?.trim())
        ) {
          return false;
        }

        if (
          visibleContractActivities.packaging &&
          (!contractData.packaging?.volumePerUnit?.trim() ||
            !contractData.packaging?.volumeUnit?.trim())
        ) {
          return false;
        }

        return true;
      }

      return false;
    }, [roleSlug, supplierDetailsFormData, visibleContractActivities]);

    const canSaveContinue = requiredFilled && !hasFormErrors;

    const handleSave = useCallback(
      async (shouldProceed: boolean = false): Promise<boolean> => {
        if (!componentId) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          return false;
        }

        if (!validateForm()) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          return false;
        }

        const payload = buildPayload();
        const benchmarkingContextKey =
          componentId && roleSlug ? `${componentId}:${roleSlug}` : null;

        if (benchmarkingContextKey) {
          setBenchmarkingResetBySupplierDetails(benchmarkingContextKey, false);
        }

        const hasSupplierDetailsChanged = !!(
          roleSlug &&
          componentDetails &&
          !areObjectsEqual(
            payload,
            getRoleDetailsPayloadFromComponent(componentDetails, roleSlug)
          )
        );

        showSpinner();

        try {
          const response = await saveBuiltEnvironmentalProfile(
            componentId,
            payload
          );

          if (!response.success || !response.data) {
            showAlert(
              ERROR_MESSAGES.FAILED_TO_SAVE_ENVIRONMENTAL_PROFILE,
              'danger'
            );
            return false;
          }

          setComponentDetails(response.data);

          if (roleSlug) {
            populateFormFromResponse(response.data, roleSlug);
          }

          if (roleSlug && hasSupplierDetailsChanged) {
            try {
              const savedSearchFormData = getSearchDatabaseFormData(roleSlug);
              const resetQueryParams =
                hasAnySearchFilterValue(savedSearchFormData)
                  ? buildBenchmarkingQueryParams(savedSearchFormData)
                  : undefined;
              const resetResponse = await saveIndustryBenchmarkingData(
                componentId,
                roleSlug,
                { audit: [] },
                resetQueryParams
              );

              if (!resetResponse.success) {
                showAlert(
                  ERROR_MESSAGES.FAILED_TO_SAVE_INDUSTRY_BENCHMARKING_DATA,
                  'danger'
                );
                return false;
              }

              if (resetResponse.data) {
                setComponentDetails(resetResponse.data);
                populateFormFromResponse(resetResponse.data, roleSlug);
              }

              setAudit(null);
              if (benchmarkingContextKey) {
                setBenchmarkingResetBySupplierDetails(
                  benchmarkingContextKey,
                  true
                );
              }
              if (benchmarkingContextKey) {
                setImpactCategorySearchResetByBenchmarking(
                  benchmarkingContextKey,
                  true
                );
                setImpactValueClearBySupplierDetails(
                  benchmarkingContextKey,
                  true
                );
              }
            } catch (resetError) {
              Bugsnag.notify(resetError as Error, (event) => {
                event.addMetadata('context', {
                  component: 'CompleteSupplierDetails',
                  method: 'saveIndustryBenchmarkingData',
                  componentId,
                  roleSlug,
                });
              });

              showAlert(
                ERROR_MESSAGES.FAILED_TO_SAVE_INDUSTRY_BENCHMARKING_DATA,
                'danger'
              );
              return false;
            }
          }

          if (shouldProceed && onNext) {
            onNext();
          }

          return true;
        } catch (error) {
          Bugsnag.notify(error as Error, (event) => {
            event.addMetadata('context', {
              component: 'CompleteSupplierDetails',
              method: 'handleSave',
            });
          });

          showAlert(
            ERROR_MESSAGES.FAILED_TO_SAVE_ENVIRONMENTAL_PROFILE,
            'danger'
          );
          return false;
        } finally {
          hideSpinner();
        }
      },
      [
        buildPayload,
        componentDetails,
        componentId,
        hideSpinner,
        getSearchDatabaseFormData,
        onNext,
        populateFormFromResponse,
        setImpactCategorySearchResetByBenchmarking,
        roleSlug,
        setAudit,
        setBenchmarkingResetBySupplierDetails,
        setComponentDetails,
        setImpactValueClearBySupplierDetails,
        showAlert,
        showSpinner,
        validateForm,
      ]
    );

    const renderNumericInput = <S extends keyof FormData>(
      section: S,
      field: string,
      value: string,
      label: string,
      tooltipText?: string
    ) => (
      <div className={parentStyles.formField}>
        {buildLabel(label, tooltipText)}
        <div
          className={`${parentStyles.inputWrapper} ${
            field === 'floorAreaPerSku' || field === 'volumePerSku'
              ? styles.inputWithUnit
              : ''
          }`}
        >
          <input
            type="text"
            name={field}
            value={value}
            placeholder="Enter here..."
            onChange={(e) => {
              const sanitized = sanitizeNumericInput(e.target.value);

              if (field.includes('.')) {
                const [activityKey, fieldKey] = field.split('.');
                updateContractManufacturerField(
                  activityKey as ContractActivityKey,
                  fieldKey,
                  sanitized
                );
                return;
              }

              handleFieldChange(
                section,
                field as keyof FormData[S],
                sanitized as FormData[S][keyof FormData[S]]
              );
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text');
              const sanitized = sanitizeNumericInput(pasted);

              if (field.includes('.')) {
                const [activityKey, fieldKey] = field.split('.');
                updateContractManufacturerField(
                  activityKey as ContractActivityKey,
                  fieldKey,
                  sanitized
                );
                return;
              }

              handleFieldChange(
                section,
                field as keyof FormData[S],
                sanitized as FormData[S][keyof FormData[S]]
              );
            }}
            onBlur={() => handleFieldBlur(field, value)}
            onFocus={() => handleFocus(field)}
            className={`${parentStyles.formInput} ${
              errors[field] ? styles.inputError : ''
            }`}
          />

          {(field === 'floorAreaPerSku' || field === 'volumePerSku') && (
            <span className={styles.unitSuffix}>
              {field === 'floorAreaPerSku' ? 'm²' : 'm³'}
            </span>
          )}

          {(field.includes('currentTemperature') ||
            field.includes('targetTemperature')) && (
            <span className={styles.unitSuffix}>°C</span>
          )}
        </div>

        {errors[field] && <p className={styles.error}>{errors[field]}</p>}
      </div>
    );

    const renderUnitDropdown = <S extends keyof FormData>(
      section: S,
      weightField: string,
      unitField: string,
      weightValue: string,
      unitValue: string,
      unitHook: ReturnType<typeof useUnitSelector>,
      label: string,
      weightError?: string,
      unitError?: string,
      tooltipText?: string
    ) => (
      <div className={parentStyles.formField}>
        {buildLabel(label, tooltipText)}

        <div
          className={styles.netUnitWrapper}
          ref={unitHook.wrapperRef}
          tabIndex={-1}
          onBlur={() => {
            setTimeout(() => {
              if (
                unitHook.showDropdown ||
                (unitHook.wrapperRef.current &&
                  unitHook.wrapperRef.current.contains(document.activeElement))
              ) {
                return;
              }

              if (!weightValue?.trim()) {
                handleFieldBlur(weightField, weightValue);
              }
            }, 0);
          }}
        >
          <input
            type="text"
            name={weightField}
            value={weightValue}
            placeholder="Enter here..."
            onChange={(e) => {
              const sanitized = sanitizeNumericInput(e.target.value);

              if (weightField.includes('.')) {
                const [activityKey, fieldKey] = weightField.split('.');
                updateContractManufacturerField(
                  activityKey as ContractActivityKey,
                  fieldKey,
                  sanitized
                );
                return;
              }

              const formField =
                weightField === 'packagingNetWeight' ? 'netWeight' : weightField;

              handleFieldChange(
                section,
                formField as keyof FormData[S],
                sanitized as FormData[S][keyof FormData[S]],
                weightField
              );
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text');
              const sanitized = sanitizeNumericInput(pasted);

              if (weightField.includes('.')) {
                const [activityKey, fieldKey] = weightField.split('.');
                updateContractManufacturerField(
                  activityKey as ContractActivityKey,
                  fieldKey,
                  sanitized
                );
                return;
              }

              const formField =
                weightField === 'packagingNetWeight' ? 'netWeight' : weightField;

              handleFieldChange(
                section,
                formField as keyof FormData[S],
                sanitized as FormData[S][keyof FormData[S]],
                weightField
              );
            }}
            onBlur={() => {
              handleFieldBlur(weightField, weightValue);
              handleFieldBlur(unitField, unitValue, unitHook.isCustom);
            }}
            onFocus={() => handleFocus(weightField)}
            className={`${parentStyles.formInput} ${
              styles.netWeightInput
            } ${weightError ? styles.inputError : ''}`}
          />

          <div
            className={`${styles.customDropdown} ${
              unitError ? styles.inputErrorUnit : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              unitHook.toggleDropdown();
            }}
          >
            {!unitHook.isCustom ? (
              <span>
                {unitValue
                  ? `${
                      unitHook.filteredUnitOptions.find(
                        (u) => u.value === unitValue
                      )?.labelShort ?? unitValue
                    }/unit`
                  : '-/unit'}
              </span>
            ) : (
              <input
                type="text"
                value={unitValue}
                placeholder="Other"
                ref={unitHook.customInputRef}
                onChange={(e) => {
                  const sanitized = sanitizeCustomUnit(e.target.value);
                  const formField =
                    unitField === 'packagingUnitOfMeasurement'
                      ? 'unitOfMeasurement'
                      : unitField;

                  handleFieldChange(
                    section,
                    formField as keyof FormData[S],
                    sanitized as FormData[S][keyof FormData[S]],
                    unitField
                  );
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text');
                  const sanitized = sanitizeCustomUnit(pasted);
                  const formField =
                    unitField === 'packagingUnitOfMeasurement'
                      ? 'unitOfMeasurement'
                      : unitField;

                  handleFieldChange(
                    section,
                    formField as keyof FormData[S],
                    sanitized as FormData[S][keyof FormData[S]],
                    unitField
                  );
                }}
                onBlur={() => handleFieldBlur(unitField, unitValue, true)}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={`${styles.customUnitInput} ${
                  unitError ? styles.inputErrorUnit : ''
                }`}
              />
            )}

            <span className={styles.dropdownIcon}>
              {unitHook.showDropdown ? <SlArrowUp /> : <SlArrowDown />}
            </span>
          </div>

          {unitHook.showDropdown && (
            <div className={styles.dropdownMenu} ref={unitHook.dropdownRef}>
              <div className={styles.dropdownScrollbar}>
                {unitHook.filteredUnitOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={styles.dropdownItem}
                    onClick={() => unitHook.selectUnit(opt.value)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(weightError || unitError) && (
          <p className={styles.error}>{weightError || unitError}</p>
        )}
      </div>
    );

    const renderContractVolumeSection = useCallback(
      (
        activityKey:
          | 'filling'
          | 'mixing'
          | 'homogenising'
          | 'fermenting'
          | 'packaging',
        unitHook: ReturnType<typeof useUnitSelector>,
        volumeError?: string,
        unitError?: string
      ) => {
        const activity =
          supplierDetailsFormData.contractManufacturer[activityKey];
        const volumeValue = activity?.volumePerUnit || '';
        const unitValue = activity?.volumeUnit || '';

        return (
          <div className={styles.nestedFormCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleLabel}>
                {CONTRACT_SECTION_LABELS[activityKey]}
              </div>
            </div>

            <div className={styles.nestedFormCardContent}>
              <div className={parentStyles.twoColumnFields}>
                {renderUnitDropdown(
                  'contractManufacturer',
                  `${activityKey}.volumePerUnit`,
                  `${activityKey}.volumeUnit`,
                  volumeValue,
                  unitValue,
                  unitHook,
                  'Net Weight per Unit of One SKU',
                  volumeError,
                  unitError,
                  TOOLTIP_TEXT.VOLUME_PER_UNIT_OF_ONE_SKU_FOR_CONTRACT_MANUFACTURERS
                )}
              </div>
            </div>
          </div>
        );
      },
      [renderUnitDropdown, supplierDetailsFormData.contractManufacturer]
    );

    const renderContractTemperatureSection = useCallback(
      (
        activityKey: 'heating' | 'cooling',
        unitHook: ReturnType<typeof useUnitSelector>,
        volumeError?: string,
        unitError?: string
      ) => {
        const activity =
          supplierDetailsFormData.contractManufacturer[activityKey];
        const volumeValue = activity?.volumePerUnit || '';
        const unitValue = activity?.volumeUnit || '';
        const currentTempValue = activity?.currentTemperature || '';
        const targetTempValue = activity?.targetTemperature || '';

        const currentTempLabel = 'Current Temperature (°C)';
        const targetTempLabel =
          activityKey === 'heating'
            ? 'Target Heating Temperature (°C)'
            : 'Target Cooling Temperature (°C)';
        const currentTempTooltip =
          activityKey === 'heating'
            ? TOOLTIP_TEXT.CURRENT_HEATING_TEMPERATURE
            : TOOLTIP_TEXT.CURRENT_COOLING_TEMPERATURE;
        const targetTempTooltip =
          activityKey === 'heating'
            ? TOOLTIP_TEXT.TARGET_HEATING_TEMPERATURE
            : TOOLTIP_TEXT.TARGET_COOLING_TEMPERATURE;

        return (
          <div className={styles.nestedFormCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleLabel}>
                {CONTRACT_SECTION_LABELS[activityKey]}
              </div>
            </div>

            <div className={styles.nestedFormCardContent}>
              <div className={parentStyles.twoColumnFields}>
                {renderUnitDropdown(
                  'contractManufacturer',
                  `${activityKey}.volumePerUnit`,
                  `${activityKey}.volumeUnit`,
                  volumeValue,
                  unitValue,
                  unitHook,
                  'Net Weight per Unit of One SKU',
                  volumeError,
                  unitError,
                  TOOLTIP_TEXT.VOLUME_PER_UNIT_OF_ONE_SKU_FOR_CONTRACT_MANUFACTURERS
                )}

                {renderNumericInput(
                  'contractManufacturer',
                  `${activityKey}.currentTemperature`,
                  currentTempValue,
                  currentTempLabel,
                  currentTempTooltip
                )}
              </div>

              <div className={parentStyles.twoColumnFields}>
                {renderNumericInput(
                  'contractManufacturer',
                  `${activityKey}.targetTemperature`,
                  targetTempValue,
                  targetTempLabel,
                  targetTempTooltip
                )}
              </div>
            </div>
          </div>
        );
      },
      [renderNumericInput, renderUnitDropdown, supplierDetailsFormData.contractManufacturer]
    );

    return (
      <div className={parentStyles.container}>
        <div className={parentStyles.header}>
          <h2 className={parentStyles.pageTitle}>Complete Supplier Details</h2>
          <p className={parentStyles.helperText}>
            Enter key details to define this supplier’s relationship with this
            component or service
          </p>
        </div>

        <div className={parentStyles.formCard}>
          <div className={parentStyles.childcontent}>{detailsCard}</div>

          {roleSlug ===
            SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR && (
            <div className={parentStyles.twoColumnFields}>
              {renderUnitDropdown(
                'rawMaterialSupplier',
                'netWeight',
                'unitOfMeasurement',
                supplierDetailsFormData.rawMaterialSupplier.netWeight,
                supplierDetailsFormData.rawMaterialSupplier.unitOfMeasurement,
                rawMaterialsUnit,
                'Net Weight of Component Used per SKU',
                errors.netWeight,
                errors.unitOfMeasurement
              )}

              <LocationSearch
                field="supplierLocation"
                value={
                  supplierDetailsFormData.rawMaterialSupplier.supplierLocation
                }
                geographyHook={rawMaterialsPlaces}
                label="Supplier Location"
                placeholder="Search..."
                tooltipText={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                error={errors.supplierLocation}
                onFocus={handleFocus}
              />
            </div>
          )}

          {roleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT && (
            <div className={parentStyles.twoColumnFields}>
              {renderUnitDropdown(
                'transportFreight',
                'transportNetWeight',
                'transportUnitOfMeasurement',
                supplierDetailsFormData.transportFreight.transportNetWeight,
                supplierDetailsFormData.transportFreight
                  .transportUnitOfMeasurement,
                transportUnit,
                'Net Weight Per Unit Transported',
                errors.transportNetWeight,
                errors.transportUnitOfMeasurement
              )}

              <LocationSearch
                field="transportRegion"
                value={supplierDetailsFormData.transportFreight.transportRegion}
                geographyHook={transportPlaces}
                label="Transport Region"
                placeholder="Search..."
                error={errors.transportRegion}
                onFocus={handleFocus}
              />
            </div>
          )}

          {shouldShowStorageSection && (
            <div className={styles.storageWrapper}>
              <div className={parentStyles.twoColumnFields}>
                {renderNumericInput(
                  'storageSection',
                  'storageDays',
                  supplierDetailsFormData.storageSection.storageDays,
                  'Storage Days',
                  TOOLTIP_TEXT.STORAGE_DAYS
                )}

                {renderNumericInput(
                  'storageSection',
                  'volumePerSku',
                  supplierDetailsFormData.storageSection.volumePerSku,
                  'Volume per Unit of One SKU',
                  TOOLTIP_TEXT.VOLUME_PER_UNIT_SKU
                )}
              </div>

              <div className={parentStyles.twoColumnFields}>
                {renderNumericInput(
                  'storageSection',
                  'floorAreaPerSku',
                  supplierDetailsFormData.storageSection.floorAreaPerSku,
                  'Floor Area Required per Unit of One SKU',
                  TOOLTIP_TEXT.FLOOR_AREA_REQUIRED_PER_UNIT_OF_ONE_SKU
                )}
              </div>
            </div>
          )}

          {shouldShowContractManufacturerSection && (
            <div className={styles.storageWrapper}>
              {visibleContractActivities.filling &&
                renderContractVolumeSection(
                  'filling',
                  contractUnitHooks.filling,
                  errors['filling.volumePerUnit'],
                  errors['filling.volumeUnit']
                )}

              {visibleContractActivities.mixing &&
                renderContractVolumeSection(
                  'mixing',
                  contractUnitHooks.mixing,
                  errors['mixing.volumePerUnit'],
                  errors['mixing.volumeUnit']
                )}

              {visibleContractActivities.heating &&
                renderContractTemperatureSection(
                  'heating',
                  contractUnitHooks.heating,
                  errors['heating.volumePerUnit'],
                  errors['heating.volumeUnit']
                )}

              {visibleContractActivities.homogenising &&
                renderContractVolumeSection(
                  'homogenising',
                  contractUnitHooks.homogenising,
                  errors['homogenising.volumePerUnit'],
                  errors['homogenising.volumeUnit']
                )}

              {visibleContractActivities.labelling && (
                <div className={styles.nestedFormCard}>
                  <div className={styles.roleHeader}>
                    <div className={styles.roleLabel}>
                      {CONTRACT_SECTION_LABELS.labelling}
                    </div>
                  </div>

                  <div className={styles.nestedFormCardContent}>
                    <div className={parentStyles.twoColumnFields}>
                      {renderNumericInput(
                        'contractManufacturer',
                        'labelling.numberOfLabels',
                        supplierDetailsFormData.contractManufacturer.labelling
                          ?.numberOfLabels || '',
                        'Number of Labels Applied per Unit',
                        TOOLTIP_TEXT.NUMBER_OF_LABELS_BEING_PUT_ON_PER_UNIT_OF_ONE_SKU
                      )}
                    </div>
                  </div>
                </div>
              )}

              {visibleContractActivities.cooling &&
                renderContractTemperatureSection(
                  'cooling',
                  contractUnitHooks.cooling,
                  errors['cooling.volumePerUnit'],
                  errors['cooling.volumeUnit']
                )}

              {visibleContractActivities.fermenting &&
                renderContractVolumeSection(
                  'fermenting',
                  contractUnitHooks.fermenting,
                  errors['fermenting.volumePerUnit'],
                  errors['fermenting.volumeUnit']
                )}

              {visibleContractActivities.packaging &&
                renderContractVolumeSection(
                  'packaging',
                  contractUnitHooks.packaging,
                  errors['packaging.volumePerUnit'],
                  errors['packaging.volumeUnit']
                )}
            </div>
          )}

          {shouldShowPackagingSection && (
            <div className={parentStyles.twoColumnFields}>
              {renderUnitDropdown(
                'packagingManufacturer',
                'packagingNetWeight',
                'packagingUnitOfMeasurement',
                supplierDetailsFormData.packagingManufacturer.netWeight,
                supplierDetailsFormData.packagingManufacturer.unitOfMeasurement,
                packagingUnit,
                'Net Weight of Component Used per SKU',
                errors.packagingNetWeight,
                errors.packagingUnitOfMeasurement
              )}

              <LocationSearch
                field="packagingSupplierLocation"
                value={
                  supplierDetailsFormData.packagingManufacturer.supplierLocation
                }
                geographyHook={packagingPlaces}
                label="Supplier Location"
                placeholder="Search..."
                tooltipText={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                error={errors.packagingSupplierLocation}
                onFocus={handleFocus}
              />
            </div>
          )}
        </div>

        <div className={parentStyles.footerActions}>
          <button
            type="button"
            className={parentStyles.secondaryButton}
            onClick={onPrevious}
          >
            Go Back
          </button>

          <button
            type="button"
            className={parentStyles.tertiaryButton}
            onClick={() => {
              void (async () => {
                const saved = await handleSave(false);
                if (saved && onRedirectToComponentDetails) {
                  onRedirectToComponentDetails();
                }
              })();
            }}
            disabled={!canSaveContinue}
          >
            Save and Exit
          </button>

          <button
            type="button"
            className={parentStyles.primaryButton}
            onClick={() => {
              void handleSave(true);
            }}
            disabled={!canSaveContinue}
          >
            Save &amp; Continue
          </button>
        </div>
      </div>
    );
  }
);

CompleteSupplierDetails.displayName = 'CompleteSupplierDetails';

export default CompleteSupplierDetails;