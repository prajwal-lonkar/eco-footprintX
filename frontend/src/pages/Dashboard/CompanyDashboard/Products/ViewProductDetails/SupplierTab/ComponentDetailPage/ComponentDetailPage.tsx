import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import styles from './ComponentDetailPage.module.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import defaultImg from '@assets/images/company-profile.png';
import { BiEditAlt } from 'react-icons/bi';
import circleCheckIcon from '@assets/icons/circle-check.svg';

import deleteImg from '@assets/icons/trash.svg';
import Tooltip from '@common/Tooltip/Tooltip';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import {
  ImpactCategoryCard,
  ImpactCategoryCardState,
  type ImpactCategoryType,
  type ImpactCategoryCardProps,
  type ImpactCategoryItemWithPending,
  type PendingSupplierSubmission,
} from '@common/ImpactCategoryCard';
import StatusBadge, {
  mapApiStatusToDisplayStatus,
} from '@common/StatusBadge/StatusBadge';
import infoIcon from '@assets/images/info icon.svg';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';
import Accordion from '@common/Accordion';
import {
  deleteComponent,
  fetchComponentWithSupplierRole,
  getComponentImpactSummary,
  patchApproveRejectSupplierSubmission,
  patchImpactCategorySubmit,
  type ApprovedCategoryPayload,
} from '@service/company.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import { ROUTES } from '@constants/routes';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import { getTransportComponentName } from '@utils/formatters';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { parseAverageComparison } from '@utils/parseAverageComparision';
import type { ImpactCategoryData, ImpactCategoryItem } from '@type/supplier';
import type { ApiResponse } from '@type/auth';
import { USER_ROLES } from '@constants/auth';
import {
  mapDataSourceToLabel,
  PENDING_COMPARE_ICONS,
  buildApprovedCategoriesPayload,
} from '@utils/pendingSubmission.utils';

type ComponentDetailPageState = {
  componentName: string;
  internalSku: string;
  registrationNumber: string;
  supplierName: string;
  supplierRole: string;

  supplierLocation: string;
  casNumber: string;

  supplierContactName: string;
  supplierContactEmail: string;
  transportRegion: string;
  netWeightUsedPerSku: string;
  netWeightUnit: string;

  supplierSku: string;

  image: string;
  productName?: string;
};
type InfoItem = {
  label: string;
  value: string;
};

type ImpactCategoryItemWithPendingData =
  ImpactCategoryItemWithPending<ImpactCategoryItem>;

const getCategoryReferenceName = (componentName?: string): string =>
  componentName?.trim() || 'component or service';

const getProgressModel = (
  averageComparison: string | undefined | null,
  categoryType: ImpactCategoryType,
  componentName?: string
) => {
  if (!averageComparison)
    return { progressValue: undefined, progressLabel: undefined };
  const parsed = parseAverageComparison(
    averageComparison,
    categoryType === 'carbon'
      ? 'Carbon'
      : categoryType === 'water'
        ? 'Water'
        : 'Land',
    componentName
  );
  if (!parsed || parsed.noBenchmark) {
    return { progressValue: undefined, progressLabel: undefined };
  }
  return {
    progressValue: parsed.dotPosition,
    progressLabel: {
      category: categoryType,
      percentage: parsed.percentage,
      comparison: parsed.comparison,
      referenceName: getCategoryReferenceName(componentName),
      cardColor: parsed.cardColor,
    } as const,
  };
};
const ComponentDetailPage = () => {
  const navigate = useNavigate();
  const { productId, componentId, supplierRoleSlug } = useParams<{
    productId?: string;
    componentId?: string;
    supplierRoleSlug?: string;
  }>();
  const [componentData, setComponentData] =
    useState<ComponentDetailPageState | null>(null);
  const [hasEnvironmentalProfile, setHasEnvironmentalProfile] = useState(false);
  const { showAlert } = useAlertStore();

  const [showDeleteComponent, setShowDeleteCompoModal] = useState(false);
  const [submittedCategories, setSubmittedCategories] = useState<
    Set<ImpactCategoryType>
  >(new Set());
  const [submittingCategory, setSubmittingCategory] =
    useState<ImpactCategoryType | null>(null);
  const [impactCategoryData, setImpactCategoryData] =
    useState<ImpactCategoryData | null>(null);
  const [impactSummaryLoading, setImpactSummaryLoading] = useState(true);
  const [isPreviousDataOpen, setIsPreviousDataOpen] = useState(true);
  const [approvedPendingCategories, setApprovedPendingCategories] = useState<
    Partial<Record<ImpactCategoryType, boolean>>
  >({});
  const [showSubmitNewResultsModal, setShowSubmitNewResultsModal] =
    useState(false);
  const [isApprovingPendingSubmission, setIsApprovingPendingSubmission] =
    useState(false);
  const [pendingApprovalAction, setPendingApprovalAction] = useState<
    'keep' | 'submit' | null
  >(null);
  const { showSpinner, hideSpinner } = useSpinnerStore();

  const productName = useBuiltEnvironmentalProfileFlowStore(
    (state) => state.productName
  );

  useEffect(() => {
    if (!productId || !componentId || !supplierRoleSlug) return;

    const fetchData = async () => {
      try {
        const res = await fetchComponentWithSupplierRole(
          productId,
          componentId,
          supplierRoleSlug,
          USER_ROLES.COMPANY
        );

        const data = res?.data;

        const detailsKey = `${supplierRoleSlug}Details`;
        const roleDetails = data?.[detailsKey] ?? {};
        const hasDetails =
          data?.[detailsKey] !== undefined && data?.[detailsKey] !== null;

        setHasEnvironmentalProfile(hasDetails);

        const mappedData: ComponentDetailPageState = {
          componentName:
            supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
              ? getTransportComponentName(
                  data.name ?? '',
                  data.transportFreight?.transportMethod,
                  data.transportFreight?.transportOrigin,
                  data.transportFreight?.transportDestination
                )
              : (data.name ?? '-'),
          internalSku: data.internalSku ?? '-',
          registrationNumber: data.companyRegistrationNumber ?? '-',

          supplierName: data.supplierName ?? '-',
          supplierRole: data.supplierRole ?? '-',

          supplierContactName: data.supplierContactName ?? '-',
          supplierContactEmail: data.supplierContactEmail ?? '-',

          supplierLocation:
            roleDetails?.supplierLocation ??
            data?.rawMaterialSupplierDetails?.supplierLocation ??
            data?.[supplierRoleSlug]?.supplierLocation ??
            '-',

          transportRegion:
            data?.transportFreightDetails?.transportRegion ??
            roleDetails?.transportRegion ??
            data?.transportFreight?.transportRegion ??
            '-',

          netWeightUsedPerSku:
            roleDetails?.netWeightUsedPerSku ??
            data?.rawMaterialSupplierDetails?.netWeightUsedPerSku ??
            data?.rawMaterialSupplier?.netWeightUsedPerSku ??
            '-',

          netWeightUnit:
            roleDetails?.netWeightUnit ??
            data?.rawMaterialSupplierDetails?.netWeightUnit ??
            data?.rawMaterialSupplier?.netWeightUnit ??
            '',

          casNumber: data?.rawMaterialSupplier?.casNumber ?? '-',

          supplierSku: data?.rawMaterialSupplier?.supplierSku ?? '-',
          image: data.image || '',
          productName: data.productName,
        };

        setComponentData(mappedData);
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('ComponentDetailPage', {
            method: 'fetchData',
            productId,
            componentId,
            supplierRoleSlug,
          });
        });
        showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_COMPONENT, 'danger');
      }
    };

    fetchData();
  }, [productId, componentId, supplierRoleSlug]);

  const fetchImpactCategories = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!componentId || !supplierRoleSlug) {
        if (!silent) {
          setImpactSummaryLoading(false);
        }
        return;
      }

      if (!silent) {
        setImpactSummaryLoading(true);
      }
      try {
        const response = await getComponentImpactSummary(
          componentId,
          supplierRoleSlug
        );

        if (response.success && response.data) {
          setImpactCategoryData(response.data);
          const nextSubmitted = new Set<ImpactCategoryType>();
          if (response.data.carbon?.isSubmitted) nextSubmitted.add('carbon');
          if (response.data.water?.isSubmitted) nextSubmitted.add('water');
          if (response.data.land?.isSubmitted) nextSubmitted.add('land');
          setSubmittedCategories(nextSubmitted);
        } else {
          setImpactCategoryData(null);
          if (!silent) {
            showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_CATEGORY, 'danger');
          }
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('ComponentDetailPage', {
            method: 'fetchImpactCategories',
            componentId,
            supplierRoleSlug,
          });
        });
        setImpactCategoryData(null);
        if (!silent) {
          showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_CATEGORY, 'danger');
        }
      } finally {
        if (!silent) {
          setImpactSummaryLoading(false);
        }
      }
    },
    [componentId, supplierRoleSlug, showAlert]
  );

  useEffect(() => {
    fetchImpactCategories();
  }, [fetchImpactCategories]);

  const companyInfo = useMemo<InfoItem[]>(() => {
    if (!componentData || !supplierRoleSlug) return [];

    // Common fields for ALL roles
    const commonFields: InfoItem[] = [
      { label: 'Supplier Name', value: componentData.supplierName },
      { label: 'Supplier Role', value: componentData.supplierRole },
      {
        label: 'Company Registration Number',
        value: componentData.registrationNumber,
      },
      {
        label: 'Name of Supplier Contact',
        value: componentData.supplierContactName,
      },
      {
        label: 'Email ID of Supplier Contact',
        value: componentData.supplierContactEmail,
      },
      { label: 'Internal SKU', value: componentData.internalSku },
    ];

    let roleSpecificFields: InfoItem[] = [];

    /** Raw Material Suppliers & Processors */
    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
    ) {
      roleSpecificFields = [
        { label: 'Supplier SKU', value: componentData.supplierSku },
        {
          label: 'Net Weight of Component Used per SKU',
          value: `${componentData.netWeightUsedPerSku} ${componentData.netWeightUnit}`,
        },
        { label: 'Supplier Location', value: componentData.supplierLocation },
        { label: 'CAS Number', value: componentData.casNumber },
      ];
    } else if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
      /** Transport & Freight */
      roleSpecificFields = [
        { label: 'Transport Region', value: componentData.transportRegion },
      ];
    } else {
      /** All Other Supplier Roles */
      roleSpecificFields = [
        { label: 'Supplier Location', value: componentData.supplierLocation },
      ];
    }

    return [...commonFields, ...roleSpecificFields].filter(
      (item) => item.value !== null && item.value !== undefined
    );
  }, [componentData, supplierRoleSlug]);

  const handleDeleteComponent = async (
    productId: string,
    componentId: string,
    supplierRoleSlug: string
  ) => {
    try {
      const encodedSlug = encodeURIComponent(supplierRoleSlug);

      const res = await deleteComponent(productId, componentId, encodedSlug);

      if (res.statusCode === 200) {
        showAlert(SUCCESS_MESSAGES.COMPONENT_DELETED_SUCCESSFULLY, 'success');
        navigate(
          `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}`
        );
      } else {
        showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_COMPONENT, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('ComponentDetailPage', {
          method: 'handleDeleteComponent',
          productId,
          componentId,
          supplierRoleSlug,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_COMPONENT, 'danger');
    }
  };

  const handleBuildEnvironmentalProfile = useCallback(() => {
    if (!productId || !componentId || !supplierRoleSlug) {
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      return;
    }
    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${componentId}${ROUTES.ROLE.BASE}/${supplierRoleSlug}${ROUTES.ENV_PROFILE.BASE}/new`
    );
  }, [productId, componentId, supplierRoleSlug, navigate]);

  const handleRedirectToProductDetails = useCallback(() => {
    navigate(`${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}`);
  }, [productId, navigate]);

  const handleSubmit = useCallback(
    async (categoryType: ImpactCategoryType) => {
      if (!componentId || !supplierRoleSlug) {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        return;
      }
      if (submittedCategories.has(categoryType)) return;

      const impactCategoryId = supplierRoleSlug;
      setSubmittingCategory(categoryType);
      showSpinner();
      try {
        await patchImpactCategorySubmit(componentId, supplierRoleSlug, [
          categoryType,
        ]);
        setSubmittedCategories((prev) => {
          const newSet = new Set(prev);
          newSet.add(categoryType);
          return newSet;
        });
        await fetchImpactCategories({ silent: true });
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse<unknown>>;
        const statusCode = axiosError.response?.status;
        const apiMessage = axiosError.response?.data?.message;

        Bugsnag.notify(err as Error, (event) => {
          event.addMetadata('ComponentDetailPage', {
            method: 'handleSubmit',
            componentId,
            impactCategoryId,
            categoryType,
            statusCode,
          });
        });
        showAlert(
          statusCode === 409 && apiMessage
            ? apiMessage
            : ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY,
          'danger'
        );
      } finally {
        hideSpinner();
        setSubmittingCategory(null);
      }
    },
    [
      componentId,
      supplierRoleSlug,
      submittedCategories,
      showAlert,
      showSpinner,
      hideSpinner,
      fetchImpactCategories,
    ]
  );

  const hasAnyTemporaryData = useMemo(() => {
    if (!impactCategoryData) return false;

    return (['carbon', 'water', 'land'] as const).some((key) => {
      const data = impactCategoryData[key];
      if (!data) return false;

      return (
        data?.isRequested === true ||
        data?.presentableDataSource?.toLowerCase() === 'temporary data' ||
        data?.tempQuantity != null ||
        data?.tempLciaMethodology != null
      );
    });
  }, [impactCategoryData]);

  const hasCarbonOffset = useMemo(() => {
    return impactCategoryData?.carbon?.offsetCarbonImpact === true;
  }, [impactCategoryData]);

  const previousSubmittedData = useMemo(
    () =>
      (
        impactCategoryData as
          | (ImpactCategoryData & {
              previouslySubmittedData?: {
                hasPreviousData?: boolean;
                submissionStatus?: string;
                carbon?: ImpactCategoryItem;
                water?: ImpactCategoryItem;
                land?: ImpactCategoryItem;
              };
            })
          | null
      )?.previouslySubmittedData,
    [impactCategoryData]
  );

  const latestPreviousCompanySubmittedVersion = useMemo(
    () => impactCategoryData?.latestPreviousCompanySubmittedVersion,
    [impactCategoryData]
  );

  const hasPreviousSubmittedData =
    previousSubmittedData?.hasPreviousData === true;
  const originalSectionStatus = previousSubmittedData?.submissionStatus
    ? mapApiStatusToDisplayStatus(previousSubmittedData.submissionStatus)
    : 'Submitted';
  const newSectionStatus = impactCategoryData?.supplierSubmissionStatus
    ? mapApiStatusToDisplayStatus(impactCategoryData.supplierSubmissionStatus)
    : 'Ready to Submit';

  const hasPendingSupplierSubmissionData = useMemo(() => {
    if (!impactCategoryData) return false;
    return (['carbon', 'water', 'land'] as const).some((key) => {
      const item = impactCategoryData[key] as
        | ImpactCategoryItemWithPendingData
        | undefined;
      return item?.pendingSupplierSubmission != null;
    });
  }, [impactCategoryData]);

  const buildCardProps = (
    categoryType: ImpactCategoryType,
    item?: ImpactCategoryItem
  ): ImpactCategoryCardProps => {
    const isNoImpactCard =
      item?.isImpactPresent === false ||
      item?.presentableDataSource?.toLowerCase() === 'no impact';

    const presentableQuantity = item?.presentableQuantity ?? null;
    const hasPresentableData =
      item?.presentableQuantity != null &&
      item?.presentableLciaMethodology != null;
    const hasTempData =
      item?.tempQuantity != null && item?.tempLciaMethodology != null;
    const isAwaitingSubmission =
      item?.isRequested === true && !hasPresentableData && !hasTempData;

    if (
      isNoImpactCard ||
      (presentableQuantity !== null && presentableQuantity <= 0)
    ) {
      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.NO_IMPACT,
        cta: {
          type: 'primary-button',
          label: 'Submit',
          onClick: () => {},
        },
      };
    }

    if (isAwaitingSubmission) {
      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.IN_PROGRESS,
        impactValue:
          item?.presentableQuantity ?? item?.tempQuantity ??  undefined,
        impactUnit: item?.presentableUnit ?? item?.tempUnit ?? undefined,
        lciaMethod:
          item?.presentableLciaMethodology ?? item?.tempLciaMethodology ?? '-',
        dataSource: 'Requested Data',
        cta: {
          type: 'primary-button',
          label: 'Submit',
          onClick: () => {},
          disabled: true,
        },
      };
    }

    if (presentableQuantity === null) {
      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.NO_DATA,
        cta: {
          type: 'primary-button',
          label: 'Submit',
          onClick: () => {},
          disabled: true,
        },
      };
    }

    const progress = getProgressModel(
      item?.averageComparison,
      categoryType,
      componentData?.componentName
    );
    const resolvedDataSource = item?.presentableDataSource;
    const isTemporaryCard =
      (resolvedDataSource ?? '').toLowerCase() === 'supplier' ||
      (resolvedDataSource ?? '').toLowerCase() === 'temporary data';
    const presentableSource = (resolvedDataSource ?? '').toLowerCase();
    const shouldShowUploadedBy =
      (presentableSource === 'manual' ||
        presentableSource === 'manual input' ||
        presentableSource === 'database') &&
      !!item?.uploadedBy;

    return {
      categoryType,
      source: 'component',
      cardState: ImpactCategoryCardState.GENERAL,
      general: {
        impactValue: presentableQuantity,
        impactUnit: item?.presentableUnit ?? undefined,
        lciaMethod: item?.presentableLciaMethodology ?? undefined,
        dataSource: resolvedDataSource ?? undefined,
        isTemporaryData: isTemporaryCard,
        reserveTemporaryDataSpace: hasAnyTemporaryData && !isTemporaryCard,
        progressValue: progress.progressValue,
        progressLabel: progress.progressLabel,
        dataUploadedBy: shouldShowUploadedBy
          ? (item?.uploadedBy ?? undefined)
          : undefined,
        offsetQuantity: item?.offsetQuantity ?? undefined,
        offsetUnit: item?.offsetUnit ?? undefined,
        offsetCarbonImpact: item?.offsetCarbonImpact ?? undefined,
        reserveOffsetSpace: hasCarbonOffset && categoryType !== 'carbon',
      },
      cta: {
        type: 'primary-button',
        label: 'Submit',
        onClick: () => {},
      },
    };
  };

  const buildPreviousCardProps = (
    categoryType: ImpactCategoryType,
    item?: ImpactCategoryItem
  ): ImpactCategoryCardProps => {
    const presentableIsImpactPresent =
      item?.presentableIsImpactpresent ?? item?.presentableIsImpactPresent;
    const isNoImpactCard =
      presentableIsImpactPresent === false ||
      item?.isImpactPresent === false ||
      item?.presentableDataSource?.toLowerCase() === 'no impact';
    if (isNoImpactCard) {
      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.NO_IMPACT,
      };
    }

    const presentableQuantity = item?.presentableQuantity ?? null;
    const presentableUnit = item?.presentableUnit ?? undefined;
    const resolvedLciaMethod = item?.presentableLciaMethodology ?? undefined;
    const resolvedDataSource = item?.presentableDataSource ?? undefined;
    const isTemporaryCard =
      (resolvedDataSource ?? '').toLowerCase() === 'supplier' ||
      (resolvedDataSource ?? '').toLowerCase() === 'temporary data';
    const hasPresentableData =
      presentableQuantity != null ||
      presentableUnit != null ||
      resolvedLciaMethod != null;

    if (!hasPresentableData) {
      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.NO_DATA,
      };
    }

    const progress = getProgressModel(
      item?.averageComparison,
      categoryType,
      componentData?.componentName
    );

    return {
      categoryType,
      source: 'component',
      cardState: ImpactCategoryCardState.GENERAL,
      general: {
        impactValue: presentableQuantity ?? '----',
        impactUnit: presentableUnit,
        lciaMethod: resolvedLciaMethod,
        dataSource: resolvedDataSource,
        isTemporaryData: isTemporaryCard,
        progressValue: progress.progressValue,
        progressLabel: progress.progressLabel,
        offsetQuantity: item?.offsetQuantity ?? undefined,
        offsetUnit: item?.offsetUnit ?? undefined,
        offsetCarbonImpact: item?.offsetCarbonImpact ?? undefined,
      },
    };
  };

  const previousCardsToRender = useMemo(
    () =>
      (['carbon', 'water', 'land'] as const)
        .filter((key) => {
          const item = previousSubmittedData?.[key];
          if (!item) return false;

          const presentableIsImpactPresent =
            item.presentableIsImpactpresent ?? item.presentableIsImpactPresent;
          if (
            presentableIsImpactPresent === false ||
            item.isImpactPresent === false
          )
            return true;

          return (
            item.presentableQuantity != null ||
            item.presentableUnit != null ||
            item.presentableLciaMethodology != null ||
            (item.presentableDataSource ?? '').trim().length > 0
          );
        })
        .map((key) =>
          buildPreviousCardProps(key, previousSubmittedData?.[key])
        ),
    [previousSubmittedData, componentData?.componentName]
  );

  const compareCategoryKeys = useMemo(
    () =>
      (['carbon', 'water', 'land'] as const).filter((key) => {
        const currentItem = impactCategoryData?.[key] as
          | ImpactCategoryItemWithPendingData
          | undefined;
        return currentItem?.pendingSupplierSubmission != null;
      }),
    [impactCategoryData]
  );

  const hasPendingCarbonOffset = useMemo(
    () =>
      compareCategoryKeys.some((key) => {
        const item = impactCategoryData?.[key] as
          | ImpactCategoryItemWithPendingData
          | undefined;
        const pending = item?.pendingSupplierSubmission;
        return pending?.offsetCarbonImpact === true;
      }),
    [compareCategoryKeys, impactCategoryData]
  );

  const buildPendingCardProps = useCallback(
    (
      categoryType: ImpactCategoryType,
      item?: PendingSupplierSubmission | null
    ): ImpactCategoryCardProps => {
      const pendingIcon = PENDING_COMPARE_ICONS[categoryType];
      const isNoImpactCard = item?.isImpactPresent === false;
      if (isNoImpactCard) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_IMPACT,
          categoryIcon: pendingIcon,
        };
      }

      const value = item?.quantity ?? item?.tempQuantity ?? null;
      const unit = item?.unit ?? item?.tempUnit ?? undefined;
      const lciaMethod =
        item?.lciaMethodology ?? item?.tempLciaMethodology ?? undefined;
      const hasData = value != null || unit != null || lciaMethod != null;

      if (!hasData) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_DATA,
        };
      }

      const progress = getProgressModel(
        item?.averageComparison,
        categoryType,
        componentData?.componentName
      );
      const pendingProgressLabel = progress.progressLabel
        ? { ...progress.progressLabel, cardColor: 'blue' as const }
        : undefined;

      const dataSourceLabel = mapDataSourceToLabel(item?.dataSource);
      const isTemporaryCard =
        (dataSourceLabel ?? '').toLowerCase() === 'supplier' ||
        (dataSourceLabel ?? '').toLowerCase() === 'temporary data';

      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.GENERAL,
        general: {
          categoryIcon: pendingIcon,
          impactValue: value ?? '----',
          impactUnit: unit,
          lciaMethod,
          dataSource: dataSourceLabel,
          hideDataSourceFooter: true,
          hideWarningBadge: true,
          isTemporaryData: isTemporaryCard,
          progressValue: progress.progressValue,
          progressLabel: pendingProgressLabel,
          offsetQuantity: item?.offsetQuantity ?? undefined,
          offsetUnit: item?.offsetUnit ?? undefined,
          offsetCarbonImpact: item?.offsetCarbonImpact ?? undefined,
          reserveOffsetSpace:
            hasPendingCarbonOffset && categoryType !== 'carbon',
        },
      };
    },
    [componentData?.componentName, hasPendingCarbonOffset]
  );

  const originalCardsToRenderForCompare = useMemo(
    () =>
      (['carbon', 'water', 'land'] as const).map((key) => {
        const card = buildPreviousCardProps(
          key,
          latestPreviousCompanySubmittedVersion?.[key]
        );
        if (card.cardState === ImpactCategoryCardState.GENERAL) {
          return {
            ...card,
            general: {
              ...card.general,
              hideDataSourceFooter: true,
            },
          };
        }
        return card;
      }),
    [latestPreviousCompanySubmittedVersion, componentData?.componentName]
  );

  const pendingCardsToRenderForCompare = useMemo(
    () =>
      compareCategoryKeys.map((key) => {
        const item = impactCategoryData?.[key] as
          | ImpactCategoryItemWithPendingData
          | undefined;
        return buildPendingCardProps(key, item?.pendingSupplierSubmission);
      }),
    [compareCategoryKeys, impactCategoryData, buildPendingCardProps]
  );

  const isOriginalCompareAllNoData = useMemo(
    () =>
      originalCardsToRenderForCompare.length > 0 &&
      originalCardsToRenderForCompare.every(
        (card) => card.cardState === ImpactCategoryCardState.NO_DATA
      ),
    [originalCardsToRenderForCompare]
  );

  const isPendingCompareAllNoData = useMemo(
    () =>
      pendingCardsToRenderForCompare.length > 0 &&
      pendingCardsToRenderForCompare.every(
        (card) => card.cardState === ImpactCategoryCardState.NO_DATA
      ),
    [pendingCardsToRenderForCompare]
  );

  const hasApprovedPendingCategory = useMemo(
    () =>
      (['carbon', 'water', 'land'] as const).some(
        (key) => approvedPendingCategories[key] === true
      ),
    [approvedPendingCategories]
  );

  const renderApprovalCheckbox = useCallback(
    (categoryType: ImpactCategoryType) => (
      <label className={styles.approvalCheckbox}>
        <input
          type="checkbox"
          checked={approvedPendingCategories[categoryType] === true}
          onChange={(event) =>
            setApprovedPendingCategories((prev) => ({
              ...prev,
              [categoryType]: event.target.checked,
            }))
          }
        />
        <span>Approve This Submission</span>
      </label>
    ),
    [approvedPendingCategories]
  );

  const liveSubmissionStatus =
    impactCategoryData?.submissionStatus ?? 'pending';

  const submitApprovedCategories = useCallback(
    async (
      approvedCategories: ApprovedCategoryPayload[],
      action: 'keep' | 'submit'
    ) => {
      if (!componentId || !supplierRoleSlug) {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        return;
      }

      setPendingApprovalAction(action);
      setIsApprovingPendingSubmission(true);
      try {
        await patchApproveRejectSupplierSubmission(
          componentId,
          supplierRoleSlug,
          approvedCategories,
          {
            submissionAction:
              action === 'keep' ? 'keep-original' : 'submit-approved',
          }
        );
        await fetchImpactCategories({ silent: true });
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse<unknown>>;
        const statusCode = axiosError.response?.status;
        const apiMessage = axiosError.response?.data?.message;

        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('ComponentDetailPage', {
            method: 'submitApprovedCategories',
            componentId,
            supplierRoleSlug,
            approvedCategories,
            statusCode,
          });
        });
        showAlert(
          statusCode === 409 && apiMessage
            ? apiMessage
            : ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY,
          'danger'
        );
      } finally {
        setIsApprovingPendingSubmission(false);
        setPendingApprovalAction(null);
      }
    },
    [componentId, supplierRoleSlug, fetchImpactCategories, showAlert]
  );

  const handleKeepOriginalResults = useCallback(async () => {
    await submitApprovedCategories([], 'keep');
    setApprovedPendingCategories({});
  }, [submitApprovedCategories]);

  const handleSubmitNewResults = useCallback(async () => {
    const selectedKeys = (['carbon', 'water', 'land'] as const).filter(
      (key) => approvedPendingCategories[key] === true
    );
    const approvedCategories = buildApprovedCategoriesPayload(
      selectedKeys,
      impactCategoryData
    );
    await submitApprovedCategories(approvedCategories, 'submit');
    setApprovedPendingCategories({});
    setShowSubmitNewResultsModal(false);
  }, [approvedPendingCategories, submitApprovedCategories, impactCategoryData]);

  return (
    <div>
      <div className={styles.headerWrapper}>
        <div
          className={styles.btnWrapper}
          onClick={handleRedirectToProductDetails}
        >
          <button className={styles.backBtn}>
            <IoIosArrowBack className={styles.backIcon} />
          </button>

          {componentData?.productName
            ? componentData?.productName
            : productName}
        </div>
      </div>

      <div className={styles.Wrapper}>
        {!componentData ? (
          <SkeletonLoader type="componentDetail" />
        ) : (
          <>
            <div className={styles.componentDetailWrapper}>
              <div className={styles.headerRow}>
                <div className={styles.companyInfo}>
                  <img
                    src={
                      componentData?.image
                        ? `${import.meta.env.VITE_AWS_BUCKET_BASE_URL}/${componentData.image}`
                        : defaultImg
                    }
                    alt="profile"
                  />

                  <div className={styles.companyNameWrap}>
                    <h2 className={styles.title}>Component or Service Name:</h2>
                    <div className={styles.compoName}>
                      <h2 className={styles.componentName}>
                        {componentData?.componentName}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className={styles.btnWrapper}>
                  {!hasEnvironmentalProfile ? (
                    <button
                      className={styles.buildBtn}
                      onClick={handleBuildEnvironmentalProfile}
                    >
                      {' '}
                      <span style={{ fontSize: '16px' }}>+</span> Build
                      Environmental Profile
                    </button>
                  ) : (
                    <button
                      className={styles.editButton}
                      onClick={handleBuildEnvironmentalProfile}
                    >
                      {' '}
                      <BiEditAlt style={{ width: '16px', height: '16px' }} />
                      Edit Environmental Profile
                    </button>
                  )}

                  <button
                    className={styles.deleteBtn}
                    onClick={() => setShowDeleteCompoModal(true)}
                  >
                    <img
                      src={deleteImg}
                      alt="delete"
                      style={{ width: '16px', height: '16px' }}
                    />{' '}
                    Remove
                  </button>
                </div>
              </div>

              <div className={styles.profileInfo}>
                {companyInfo.map((item, index) => (
                  <div key={index} className={styles.infoItem}>
                    <div className={styles.labelWithIcon}>
                      <h4>{item.label}</h4>
                      {item.label === 'Supplier Role' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.SUPPLIER_ROLE_COMPANY_VIEW}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                      {item.label === 'Company Registration Number' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                      {item.label === 'Internal SKU' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.INTERNAL_SKU}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                      {item.label === 'Supplier SKU' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.SUPPLIER_SKU}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                      {item.label === 'Supplier Location' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.SUPPLIER_LOCATION}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                      {item.label === 'CAS Number' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.CAS_NUMBER}
                          noTruncate
                          position="bottom"
                        >
                          <img
                            src={infoIcon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                          />
                        </Tooltip>
                      )}
                    </div>

                    <Tooltip text={item.value} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <div className={styles.impactCategoryWrapper}>
          {hasPendingSupplierSubmissionData ? (
            <div className={styles.compareWrapper}>
              <div className={styles.compareSection}>
                <div className={styles.compareSectionHeader}>
                  <h2>Original Impact Categories Submitted</h2>
                  <StatusBadge
                    status={originalSectionStatus}
                    hideAddButton={true}
                  />
                </div>
                <div
                  className={`${styles.compareCardsWrapper} ${isOriginalCompareAllNoData ? styles.compareCardsAllNoData : ''}`}
                >
                  {originalCardsToRenderForCompare.map((cardData, idx) => (
                    <div
                      key={`original-${idx}`}
                      className={styles.compareCardSlot}
                    >
                      <ImpactCategoryCard {...cardData} />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.keepOriginalButton}
                  onClick={handleKeepOriginalResults}
                  disabled={isApprovingPendingSubmission}
                >
                  {isApprovingPendingSubmission &&
                  pendingApprovalAction === 'keep' ? (
                    <SpinnerLoader inline={true} />
                  ) : (
                    'Keep Original Results'
                  )}
                </button>
              </div>
              <div className={styles.compareSection}>
                <div className={styles.compareSectionHeader}>
                  <h2>New Impact Categories Submitted</h2>
                  <StatusBadge status={newSectionStatus} hideAddButton={true} />
                </div>
                <div
                  className={`${styles.compareCardsWrapper} ${isPendingCompareAllNoData ? styles.compareCardsAllNoData : ''}`}
                >
                  {pendingCardsToRenderForCompare.map((cardData, idx) => {
                    const categoryKey = compareCategoryKeys[idx];
                    if (!categoryKey) return null;

                    const item = impactCategoryData?.[categoryKey] as
                      | ImpactCategoryItemWithPendingData
                      | undefined;
                    const hasPendingApproval =
                      item?.pendingSupplierSubmission != null;

                    const pendingCardWithApproval =
                      hasPendingApproval && cardData.cardState === 'GENERAL'
                        ? {
                            ...cardData,
                            general: {
                              ...cardData.general,
                              footerContent:
                                renderApprovalCheckbox(categoryKey),
                            },
                          }
                        : hasPendingApproval &&
                            cardData.cardState === 'NO_IMPACT'
                          ? {
                              ...cardData,
                              footerContent:
                                renderApprovalCheckbox(categoryKey),
                            }
                          : cardData;

                    return (
                      <div
                        key={`pending-${categoryKey}`}
                        className={`${styles.pendingCardWrapper} ${styles.compareCardSlot}`}
                      >
                        <ImpactCategoryCard {...pendingCardWithApproval} />
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className={styles.submitNewResultsButton}
                  disabled={
                    !hasApprovedPendingCategory || isApprovingPendingSubmission
                  }
                  onClick={() => setShowSubmitNewResultsModal(true)}
                >
                  Submit New Results
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.categoryTitle}>
                <h1>Impact Categories for This Component or Service </h1>

                <StatusBadge
                  status={mapApiStatusToDisplayStatus(liveSubmissionStatus)}
                  hideAddButton={true}
                />
              </div>

              <div
                className={`${styles.categoryContentWrapper} ${impactSummaryLoading ? styles.categoryContentWrapperLoading : ''}`}
              >
                {impactSummaryLoading ? (
                  <SkeletonLoader type="impactSummary" />
                ) : (
                  [
                    buildCardProps('carbon', impactCategoryData?.carbon),
                    buildCardProps('water', impactCategoryData?.water),
                    buildCardProps('land', impactCategoryData?.land),
                  ].map((cardData, idx) => {
                    const categoryType = cardData.categoryType;
                    const isSubmitted = submittedCategories.has(categoryType);
                    const isSubmitting = submittingCategory === categoryType;

                    const transformedCardData = isSubmitted
                      ? {
                          ...cardData,
                          cta: {
                            type: 'secondary-button' as const,
                            label: 'Submitted',
                          },
                        }
                      : {
                          ...cardData,
                          cta:
                            cardData.cta && Array.isArray(cardData.cta)
                              ? cardData.cta.find(
                                  (c) => c.type === 'primary-button'
                                )
                              : cardData.cta &&
                                  cardData.cta.type === 'primary-button'
                                ? {
                                    ...cardData.cta,
                                    onClick: () => handleSubmit(categoryType),
                                    disabled:
                                      isSubmitting || cardData.cta.disabled,
                                  }
                                : cardData.cta,
                        };

                    return (
                      <ImpactCategoryCard key={idx} {...transformedCardData} />
                    );
                  })
                )}
              </div>
              {hasPreviousSubmittedData && (
                <div className={styles.previousDataSection}>
                  <Accordion
                    title="Previously Submitted Impact Category Data"
                    isOpen={isPreviousDataOpen}
                    onToggle={() => setIsPreviousDataOpen((prev) => !prev)}
                  >
                    <div className={styles.previousDataBody}>
                      <div className={styles.categoryContentWrapper}>
                        {previousCardsToRender.map((cardData, idx) => (
                          <ImpactCategoryCard
                            key={`previous-${idx}`}
                            {...cardData}
                          />
                        ))}
                      </div>
                    </div>
                  </Accordion>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDeleteComponent && (
        <div className={styles.modalWrapper}>
          <CommonModal
            icon={deleteImg}
            title="Are you sure you want to remove this component or service?  "
            message="This action will permanently delete the component or service and any associated impact category data, including published data. This cannot be undone."
            cancelText="Cancel"
            confirmText="Remove"
            onCancel={() => setShowDeleteCompoModal(false)}
            onConfirm={async () => {
              if (!productId || !componentId || !supplierRoleSlug) return;

              await handleDeleteComponent(
                productId,
                componentId,
                supplierRoleSlug
              );

              setShowDeleteCompoModal(false);
            }}
            confirmBtnClass={styles.removeButton}
          />
        </div>
      )}

      {showSubmitNewResultsModal && (
        <div className={styles.modalWrapper}>
          <CommonModal
            icon={circleCheckIcon}
            title="Submit New Results?"
            message={
              <>
                Are you sure you want to submit the new impact category data?
                <br />
                This will replace the results you originally submitted.
              </>
            }
            cancelText="No"
            confirmText="Submit"
            onCancel={() => setShowSubmitNewResultsModal(false)}
            onConfirm={handleSubmitNewResults}
            confirmLoading={isApprovingPendingSubmission}
          />
        </div>
      )}
    </div>
  );
};

export default ComponentDetailPage;
