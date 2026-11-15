import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import arrowLeftIcon from '@assets/icons/arrow-left.svg';
import circleCheckIcon from '@assets/icons/circle-check.svg';
import styles from './ComponentDetails.module.scss';
import defaultImg from '@assets/images/company-profile.png';
import infoIcon from '@assets/icons/info-icon.svg';
import calendarIcon from '@assets/images/calendar.svg';
import { useNavigate, useParams } from 'react-router-dom';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';
import Tooltip from '@common/Tooltip/Tooltip';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import { getComponentDetails } from '@service/supplier.service';
import {
  getComponentImpactSummary,
  patchApproveRejectSupplierSubmission,
  patchImpactCategorySubmit,
  type ApprovedCategoryPayload,
} from '@service/company.service';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import { ERROR_MESSAGES } from '@constants/messages';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import { getTransportComponentName } from '@utils/formatters';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import type {
  SupplierComponentDetails,
  ImpactCategoryData,
  ImpactCategoryItem,
} from '@type/supplier';
import {
  ImpactCategoryCard,
  ImpactCategoryCardState,
  type ImpactCategoryCardProps,
  type ImpactCategoryType,
  type ImpactCategoryItemWithPending,
  type PendingSupplierSubmission,
} from '@common/ImpactCategoryCard';
import Accordion from '@common/Accordion';
import StatusBadge, {
  mapApiStatusToDisplayStatus,
} from '@common/StatusBadge/StatusBadge';
import {
  formatDate,
  getDateDotcolour,
  getStatusLabelFromColor,
} from '@utils/dateHelpers';
import { BiEditAlt } from 'react-icons/bi';

import { ROUTES } from '@constants/routes';
import { USER_ROLES } from '@constants/auth';
import { parseAverageComparison } from '@utils/parseAverageComparision';
import {
  mapDataSourceToLabel,
  PENDING_COMPARE_ICONS,
  buildApprovedCategoriesPayload,
} from '@utils/pendingSubmission.utils';

type RequestStatus = 'complete' | 'pending' | 'overdue';
type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

type RequestSummary = {
  dateOfRequest?: string;
  status?: RequestStatus;
  requestSentBy?: string;
  companyRegistrationNumber?: string;
  supplierRole?: string;
  companyWebsite?: string;
  companyContactName?: string;
  companyContactEmail?: string;
  name?: string;
  internalSku?: string;
  supplierSku?: string;
  netWeightPerSku?: string;
  casNumber?: string;
  requestedProductId?: string;
};

type ImpactCategoryItemWithPendingData =
  ImpactCategoryItemWithPending<ImpactCategoryItem>;

type ComponentDetailsProps = {
  breadcrumbLabel?: string;
  userRole?: UserRole;

  componentName?: string;
  onEditName?: () => void;

  requestSummary?: RequestSummary;

  impactTitle?: string;
  submissionStatusLabel?: string;
  submissionStatusDotColor?: string;
};

const FIELD_LABEL = {
  requestSentBy: 'Request Sent By',
  companyRegistrationNumber: 'Company Registration Number',
  supplierRole: 'Supplier Role',
  internalSku: 'Internal SKU',
  supplierSku: 'Supplier SKU',
  companyContactName: 'Name of Company Contact',
  companyContactEmail: 'Email ID of Company Contact',
  netWeightPerSku: 'Net Weight of Component Used per SKU',
  companyWebsite: 'Company Website',
  casNumber: 'CAS Number',
  componentName: 'Component Name',
  dateOfRequestText: 'Date of Request',
} as const;

type SummaryKey = keyof typeof FIELD_LABEL;

const OTHER_SUPPLIER_ROLE_FIELDS: SummaryKey[] = [
  'requestSentBy',
  'companyRegistrationNumber',
  'supplierRole',
  'companyWebsite',
  'companyContactName',
  'companyContactEmail',
];

const RAW_MATERIAL_SUPPLIER_FIELDS: SummaryKey[] = [
  'requestSentBy',
  'companyRegistrationNumber',
  'supplierRole',
  'internalSku',
  'supplierSku',
  'companyContactName',
  'companyContactEmail',
  'netWeightPerSku',
  'companyWebsite',
  'casNumber',
];

const INFO_TEXT = {
  companyRegistrationNumber: TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER,
  supplierRole: TOOLTIP_TEXT.SUPPLIER_ROLE_SUPPLIER_VIEW,
  internalSku: TOOLTIP_TEXT.INTERNAL_SKU,
  supplierSku: TOOLTIP_TEXT.SUPPLIER_SKU,
  casNumber: TOOLTIP_TEXT.CAS_NUMBER,
};
const mapApiResponseToRequestSummary = (
  apiData: SupplierComponentDetails
): Required<RequestSummary> => {
  const netWeightPerSku = apiData.rawMaterialSupplierDetails
    ? `${apiData.rawMaterialSupplierDetails.netWeightUsedPerSku} ${apiData.rawMaterialSupplierDetails.netWeightUnit}`
    : '';

  const name =
    apiData.supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
      ? getTransportComponentName(
          apiData.name ?? '',
          apiData.transportFreight?.transportMethod,
          apiData.transportFreight?.transportOrigin,
          apiData.transportFreight?.transportDestination
        )
      : apiData.name || '';

  return {
    name,
    dateOfRequest: apiData.dateOfRequest
      ? formatDate(apiData.dateOfRequest)
      : '',
    status: 'pending',
    requestSentBy: apiData.requestSentBy || '',
    companyRegistrationNumber: apiData.companyRegistrationNumber || '',
    supplierRole: apiData.supplierRole || '',
    companyWebsite: apiData.companyWebsite || '',
    companyContactName: apiData.nameOfCompanyContact || '',
    companyContactEmail: apiData.emailIdOfCompanyContact || '',
    internalSku: apiData.internalSku || '',
    supplierSku: apiData.rawMaterialSupplier?.internalSku || '',
    netWeightPerSku,
    casNumber:
      apiData.casNumber || apiData.rawMaterialSupplier?.casNumber || '',
    requestedProductId: apiData.requestedProductId || '',
  };
};

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

const InfoIcon = ({ text }: { text: string }) => (
  <Tooltip className={styles.infoIcon} text={text} noTruncate position="bottom">
    <img src={infoIcon} alt="info" width={12} height={12} />
  </Tooltip>
);

const ComponentDetails = ({
  userRole = USER_ROLES.SUPPLIER,
  requestSummary,
  impactTitle = 'Impact Categories for This Component or Service',
  submissionStatusLabel,
  submissionStatusDotColor,
}: ComponentDetailsProps) => {
  const { productId, componentId, supplierRoleSlug } = useParams<{
    productId?: string;
    componentId?: string;
    supplierRoleSlug?: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] =
    useState<Required<RequestSummary> | null>(null);
  const [impactCategoryData, setImpactCategoryData] =
    useState<ImpactCategoryData | null>(null);
  const [impactSummaryLoading, setImpactSummaryLoading] = useState(true);
  const [submittedCategories, setSubmittedCategories] = useState<
    Set<ImpactCategoryType>
  >(new Set());
  const [submittingCategory, setSubmittingCategory] =
    useState<ImpactCategoryType | null>(null);
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
  const impactFetchInFlightRef = useRef(false);

  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  useEffect(() => {
    const fetchComponentDetails = async () => {
      if (!productId || !componentId || !supplierRoleSlug) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await getComponentDetails(
          productId,
          componentId,
          supplierRoleSlug,
          userRole,
          {
            productRequested: userRole === USER_ROLES.COMPANY,
          }
        );

        if (response.success && response.data) {
          const apiData = response.data;
          const mappedData = mapApiResponseToRequestSummary(apiData);

          // Route decides supplierRole label (source of truth)
          const merged: Required<RequestSummary> = {
            ...mappedData,
            ...(requestSummary ?? {}),
          };

          setSummaryData(merged);
        } else {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'ComponentDetails',
            method: 'fetchComponentDetails',
            productId,
            componentId,
            supplierRoleSlug,
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchComponentDetails();
  }, [
    productId,
    componentId,
    supplierRoleSlug,
    requestSummary,
    showAlert,
    userRole,
  ]);

  const fetchImpactCategoryData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!componentId || !supplierRoleSlug) {
        if (!silent) {
          setImpactSummaryLoading(false);
        }
        return;
      }
      if (impactFetchInFlightRef.current) {
        return;
      }
      impactFetchInFlightRef.current = true;
      if (!silent) {
        setImpactSummaryLoading(true);
      }
      try {
        const response = await getComponentImpactSummary(
          componentId,
          supplierRoleSlug,
          {
            productRequested: userRole === USER_ROLES.COMPANY,
          }
        );

        if (response.success && response.data) {
          setImpactCategoryData(response.data);
          const nextSubmitted = new Set<ImpactCategoryType>();
          if (response.data.carbon?.isSubmitted) nextSubmitted.add('carbon');
          if (response.data.water?.isSubmitted) nextSubmitted.add('water');
          if (response.data.land?.isSubmitted) nextSubmitted.add('land');
          setSubmittedCategories(nextSubmitted);
        } else {
          if (!silent) {
            showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          }
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'ComponentDetails',
            method: 'fetchImpactCategoryData',
            componentId,
            supplierRoleSlug,
          });
        });
        if (!silent) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        }
      } finally {
        if (!silent) {
          setImpactSummaryLoading(false);
        }
        impactFetchInFlightRef.current = false;
      }
    },
    [componentId, supplierRoleSlug, showAlert, userRole]
  );

  useEffect(() => {
    fetchImpactCategoryData();
  }, [fetchImpactCategoryData, userRole]);

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
        await patchImpactCategorySubmit(
          componentId,
          supplierRoleSlug,
          [categoryType],
          {
            productRequested: userRole === USER_ROLES.COMPANY,
          }
        );
        setSubmittedCategories((prev) => {
          const newSet = new Set(prev);
          newSet.add(categoryType);
          return newSet;
        });
        await fetchImpactCategoryData({ silent: true });
      } catch (err) {
        Bugsnag.notify(err as Error, (event) => {
          event.addMetadata('ComponentDetails', {
            method: 'handleSubmit',
            componentId,
            impactCategoryId,
            categoryType,
          });
        });
        showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
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
      fetchImpactCategoryData,
    ]
  );

  const summaryOrder: SummaryKey[] = useMemo(() => {
    if (
      supplierRoleSlug ===
      SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR
    ) {
      return [...RAW_MATERIAL_SUPPLIER_FIELDS];
    }
    return [...OTHER_SUPPLIER_ROLE_FIELDS];
  }, [supplierRoleSlug]);

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

  const buildCardProps = useCallback(
    (
      categoryType: ImpactCategoryType,
      item?: ImpactCategoryItem
    ): ImpactCategoryCardProps => {
      const isSubmitted =
        item?.isSubmitted === true || submittedCategories.has(categoryType);
      const isSubmitting = submittingCategory === categoryType;
      const uploadedBy = item?.uploadedBy?.trim() ?? '';
      const hasUploadedBy = uploadedBy.length > 0;
      const isUploadedByCurrentUser = uploadedBy === 'You';
      const hasCompanyUploadedData = hasUploadedBy && !isUploadedByCurrentUser;
      const normalizedPresentableDataSource =
        item?.presentableDataSource ?? undefined;
      const displayPresentableDataSource =
        (normalizedPresentableDataSource ?? '').toLowerCase() === 'supplier'
          ? 'Temporary Data'
          : normalizedPresentableDataSource;
      const presentableQuantity = item?.presentableQuantity ?? null;
      const presentableUnit = item?.presentableUnit ?? undefined;
      const resolvedLciaMethod = item?.presentableLciaMethodology ?? undefined;
      const presentableIsImpactPresent =
        item?.presentableIsImpactpresent ?? item?.presentableIsImpactPresent;
      const isNoImpactCard =
        presentableIsImpactPresent === false ||
        item?.presentableDataSource?.toLowerCase() === 'no impact';
      const hasPresentableValueData =
        presentableQuantity != null ||
        presentableUnit != null ||
        resolvedLciaMethod != null;
      const hasSubmittableData = isNoImpactCard || hasPresentableValueData;
      const shouldShowSubmittedCta =
        isSubmitted && !hasCompanyUploadedData && hasSubmittableData;
      const shouldAllowSupplierCta =
        (item?.isRequested === true &&
          !hasCompanyUploadedData &&
          hasSubmittableData) ||
        shouldShowSubmittedCta;
      const cta = !shouldAllowSupplierCta
        ? undefined
        : isSubmitted
          ? {
              type: 'secondary-button' as const,
              label: 'Submitted',
            }
          : {
              type: 'primary-button' as const,
              label: 'Submit',
              onClick: () => handleSubmit(categoryType),
              disabled: isSubmitting,
            };
      if (isNoImpactCard) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_IMPACT,
          cta,
          dataUploadedBy: hasCompanyUploadedData
            ? (item?.uploadedBy ?? undefined)
            : undefined,
        };
      }
      const isAwaitingSubmission =
        item?.isRequested === true &&
        !hasPresentableValueData &&
        (normalizedPresentableDataSource ?? '').toLowerCase() ===
          'requested data';

      if (isAwaitingSubmission) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_DATA,
          cta: undefined,
        };
      }

      if (!hasPresentableValueData && !normalizedPresentableDataSource) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_DATA,
          cta: undefined,
        };
      }

      if (!hasPresentableValueData) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.IN_PROGRESS,
          impactValue:
            presentableQuantity ?? undefined,
          impactUnit: presentableUnit ?? undefined,
          lciaMethod: resolvedLciaMethod,
          dataSource: displayPresentableDataSource ?? undefined,
          cta,
        };
      }

      const progress = getProgressModel(
        item?.averageComparison,
        categoryType,
        summaryData?.name
      );
      const shouldShowUploadedBy = hasCompanyUploadedData;

      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.GENERAL,
        general: {
          impactValue: presentableQuantity ?? '----',
          impactUnit: presentableUnit,
          lciaMethod: resolvedLciaMethod,
          dataSource: displayPresentableDataSource ?? undefined,
          progressValue: progress.progressValue,
          progressLabel: progress.progressLabel,
          hideTemporaryInfoMessage: true,
          offsetQuantity: item?.offsetQuantity ?? undefined,
          offsetUnit: item?.offsetUnit ?? undefined,
          offsetCarbonImpact: item?.offsetCarbonImpact ?? undefined,
          reserveOffsetSpace: hasCarbonOffset && categoryType !== 'carbon',
          dataUploadedBy: shouldShowUploadedBy
            ? (item?.uploadedBy ?? undefined)
            : undefined,
        },
        cta,
      };
    },
    [
      submittedCategories,
      submittingCategory,
      handleSubmit,
      summaryData?.name,
      hasCarbonOffset,
    ]
  );

  const cardsToRender = useMemo(() => {
    return [
      buildCardProps('carbon', impactCategoryData?.carbon),
      buildCardProps('water', impactCategoryData?.water),
      buildCardProps('land', impactCategoryData?.land),
    ];
  }, [
    buildCardProps,
    impactCategoryData?.carbon,
    impactCategoryData?.water,
    impactCategoryData?.land,
  ]);

  const buildPreviousCardProps = useCallback(
    (
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
      const hasPresentableValueData =
        presentableQuantity != null ||
        presentableUnit != null ||
        resolvedLciaMethod != null;

      if (!hasPresentableValueData) {
        return {
          categoryType,
          source: 'component',
          cardState: ImpactCategoryCardState.NO_DATA,
        };
      }

      const progress = getProgressModel(
        item?.averageComparison,
        categoryType,
        summaryData?.name
      );

      return {
        categoryType,
        source: 'component',
        cardState: ImpactCategoryCardState.GENERAL,
        general: {
          impactValue: presentableQuantity ?? '----',
          impactUnit: presentableUnit,
          lciaMethod: resolvedLciaMethod,
          dataSource: item?.presentableDataSource ?? undefined,
          progressValue: progress.progressValue,
          progressLabel: progress.progressLabel,
          hideTemporaryInfoMessage: true,
          offsetQuantity: item?.offsetQuantity ?? undefined,
          offsetUnit: item?.offsetUnit ?? undefined,
          offsetCarbonImpact: item?.offsetCarbonImpact ?? undefined,
        },
      };
    },
    [summaryData?.name]
  );

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
    [buildPreviousCardProps, previousSubmittedData]
  );

  const hasPendingSupplierSubmissionData = useMemo(() => {
    if (!impactCategoryData) return false;
    return (['carbon', 'water', 'land'] as const).some((key) => {
      const item = impactCategoryData[key] as
        | ImpactCategoryItemWithPendingData
        | undefined;
      return item?.pendingSupplierSubmission != null;
    });
  }, [impactCategoryData]);

  const compareCategoryKeys = useMemo(
    () =>
      (['carbon', 'water', 'land'] as const).filter((key) => {
        const item = impactCategoryData?.[key] as
          | ImpactCategoryItemWithPendingData
          | undefined;
        return item?.pendingSupplierSubmission != null;
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
      const isNoImpactCard =
        item?.isImpactPresent === false ||
        (item?.dataSource ?? '').trim().toLowerCase() === 'no impact';

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
        summaryData?.name
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
    [summaryData?.name, hasPendingCarbonOffset]
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
    [buildPreviousCardProps, latestPreviousCompanySubmittedVersion]
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
        await fetchImpactCategoryData({ silent: true });
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('ComponentDetails', {
            method: 'submitApprovedCategories',
            componentId,
            supplierRoleSlug,
            approvedCategories,
          });
        });
        showAlert(ERROR_MESSAGES.FAILED_TO_SAVE_IMPACT_CATEGORY, 'danger');
      } finally {
        setIsApprovingPendingSubmission(false);
        setPendingApprovalAction(null);
      }
    },
    [
      componentId,
      supplierRoleSlug,
      userRole,
      showAlert,
      fetchImpactCategoryData,
    ]
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

  const liveSubmissionStatus =
    impactCategoryData?.submissionStatus ?? 'pending';

  const hasAnyCompletedImpactCategory = useMemo(() => {
    const categories: Array<ImpactCategoryItem | undefined> = [
      impactCategoryData?.carbon,
      impactCategoryData?.water,
      impactCategoryData?.land,
    ];

    return categories.some((item) => {
      if (!item) return false;
      const uploadedBy = (item.uploadedBy ?? '').trim();
      const isUploadedByCurrentUser = uploadedBy === 'You';
      const isCompanyUploaded = uploadedBy.length > 0 && uploadedBy !== 'You';
      if (isCompanyUploaded) return false;
      if (isUploadedByCurrentUser) return true;

      const presentableIsImpactPresent =
        item.presentableIsImpactpresent ?? item.presentableIsImpactPresent;
      const presentableDataSource = (item.presentableDataSource ?? '')
        .trim()
        .toLowerCase();

      if (
        presentableIsImpactPresent === false ||
        item.isImpactPresent === false
      )
        return true;
      if (
        item.presentableQuantity != null ||
        item.quantity != null ||
        item.tempQuantity != null
      ) {
        return true;
      }
      if (
        presentableDataSource &&
        presentableDataSource !== 'requested data' &&
        presentableDataSource !== 'requested from supplier' &&
        presentableDataSource !== 'supplier'
      ) {
        return true;
      }
      return false;
    });
  }, [
    impactCategoryData?.carbon,
    impactCategoryData?.water,
    impactCategoryData?.land,
  ]);

  const statusChipConfig = useMemo(() => {
    const label = mapApiStatusToDisplayStatus(liveSubmissionStatus);
    switch (liveSubmissionStatus) {
      case 'submitted':
        return {
          wrapClass: styles['submissionStatusWrap--green'],
          dotClass: styles.dotGreen,
          label,
        };
      case 'partial':
        return {
          wrapClass: styles['submissionStatusWrap--yellow'],
          dotClass: styles.dotYellow,
          label,
        };
      case 'ready':
        return {
          wrapClass: styles['submissionStatusWrap--purple'],
          dotClass: styles.dotPurple,
          label,
        };
      default:
        return {
          wrapClass: styles['submissionStatusWrap--grey'],
          dotClass: styles.dotGrey,
          label,
        };
    }
  }, [liveSubmissionStatus]);

  const dateDotColor = useMemo(() => {
    if (!summaryData?.dateOfRequest) {
      return 'yellow';
    }
    return getDateDotcolour(
      summaryData?.dateOfRequest,
      impactCategoryData?.submissionStatus || 'pending'
    );
  }, [summaryData?.dateOfRequest, impactCategoryData?.submissionStatus]);

  const statusChipClass = useMemo(() => {
    return styles[`statusChip--${dateDotColor}`];
  }, [dateDotColor]);

  const statusChipLabel = useMemo(
    () => getStatusLabelFromColor(dateDotColor),
    [dateDotColor]
  );

  const renderSummaryItem = (key: SummaryKey) => {
    const label = FIELD_LABEL[key];

    const value =
      key === 'componentName' ? summaryData?.name : (summaryData as any)?.[key];

    return (
      <div key={key}>
        <label>
          {label}
          {INFO_TEXT[key as keyof typeof INFO_TEXT] && (
            <InfoIcon text={INFO_TEXT[key as keyof typeof INFO_TEXT]} />
          )}
        </label>
        <p>{value}</p>
      </div>
    );
  };

  const handleBuildEnvironmentalProfile = useCallback(() => {
    if (!productId || !componentId || !supplierRoleSlug) {
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      return;
    }

    if (userRole === USER_ROLES.COMPANY) {
      navigate(
        `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${componentId}${ROUTES.ROLE.BASE}/${supplierRoleSlug}${ROUTES.ENV_PROFILE.BASE}`
      );
      return;
    }

    navigate(
      `${ROUTES.SUPPLIER.BASE}${ROUTES.SUPPLIER.COMPONENT_AND_SERVICES}/${productId}${ROUTES.COMPONENT.BASE}/${componentId}${ROUTES.ROLE.BASE}/${supplierRoleSlug}${ROUTES.ENV_PROFILE.BASE}/new`
    );
  }, [productId, componentId, supplierRoleSlug, navigate, showAlert]);

  const handleBack = useCallback(() => {
    if (userRole === USER_ROLES.COMPANY) {
      const targetProductId = summaryData?.requestedProductId;
      if (!targetProductId) {
        navigate(`${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}`);
        return;
      }
      navigate(
        `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${targetProductId}`,
        { state: { activeTab: 1 } }
      );
      return;
    }
    navigate(
      `${ROUTES.SUPPLIER.BASE}${ROUTES.SUPPLIER.COMPONENT_AND_SERVICES}`
    );
  }, [userRole, summaryData?.requestedProductId, navigate]);

  return (
    <div>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.btnWrapper} onClick={handleBack}>
          <img src={arrowLeftIcon} alt="Back" className={styles.backIcon} />
          {'Products'}
        </div>
      </div>

      <div className={styles.Wrapper}>
        {loading ? (
          <SkeletonLoader type="componentDetail" />
        ) : (
          <div className={styles.componentDetailWrapper}>
            <div className={styles.headerRow}>
              <div className={styles.companyInfo}>
                <img src={defaultImg} alt="profile" />

                <div>
                  <h2 className={styles.title}>Component or Service Name:</h2>

                  <h2 className={styles.componentName}>{summaryData?.name}</h2>

                  <div className={styles.requestMeta}>
                    <span className={styles.requestDate}>
                      <span className={styles.calendarIcon}>
                        <img src={calendarIcon} alt="calendar" />
                      </span>
                      Date of Request: {summaryData?.dateOfRequest}
                    </span>

                    <span className={`${styles.statusChip} ${statusChipClass}`}>
                      {statusChipLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.btnWrapper}>
                <button
                  className={
                    hasAnyCompletedImpactCategory
                      ? styles.editButton
                      : styles.buildBtn
                  }
                  type="button"
                  onClick={handleBuildEnvironmentalProfile}
                >
                  {hasAnyCompletedImpactCategory ? (
                    <>
                      <BiEditAlt style={{ width: '16px', height: '16px' }} />
                      Edit Environmental Profile
                    </>
                  ) : (
                    '+ Build Environmental Profile'
                  )}
                </button>
              </div>
            </div>

            {/* Request Summary */}
            <div className={styles.requestSummaryBox}>
              <div className={styles.requestSummaryGrid}>
                {summaryOrder.map(renderSummaryItem)}
              </div>
            </div>
          </div>
        )}

        {/* Impact */}
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
                <h1>{impactTitle}</h1>

                {!loading && !submissionStatusLabel && (
                  <span
                    className={`${styles.submissionStatusWrap} ${statusChipConfig.wrapClass}`}
                  >
                    <span
                      className={statusChipConfig.dotClass}
                      style={
                        submissionStatusDotColor
                          ? { background: submissionStatusDotColor }
                          : undefined
                      }
                    />
                    {statusChipConfig.label}
                  </span>
                )}
              </div>

              <div
                className={`${styles.categoryContentWrapper} ${impactSummaryLoading ? styles.categoryContentWrapperLoading : ''}`}
              >
                {impactSummaryLoading ? (
                  <SkeletonLoader type="impactSummary" />
                ) : (
                  cardsToRender.map((item, i) => (
                    <ImpactCategoryCard key={i} {...item} />
                  ))
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
                        {previousCardsToRender.map((item, i) => (
                          <ImpactCategoryCard key={`previous-${i}`} {...item} />
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

export default ComponentDetails;
