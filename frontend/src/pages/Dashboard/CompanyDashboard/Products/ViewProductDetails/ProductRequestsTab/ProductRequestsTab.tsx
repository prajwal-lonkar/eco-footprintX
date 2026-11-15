import { useEffect, useState } from 'react';
import StatusBadge, { mapApiStatusToDisplayStatus } from '@common/StatusBadge/StatusBadge';
import styles from './ProductRequestsTab.module.scss';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import Tooltip from '@common/Tooltip/Tooltip';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import logoImg from '@assets/images/logoImg.svg';
import Pagination from '@common/Pagination/Pagination';
import { getDateDotcolour, formatDate } from '@utils/dateHelpers';
import { getProductRequests } from '@service/company.service';
import {
  TableImpactCategoryIcons,
  IMPACT_CATEGORY_ORDER,
} from '@common/TableImpactCategoryIcons/TableImpactCategoryIcons';
import { SUPPLIER_ROLE_LABEL_BY_SLUG } from '@constants/component-service-flow';
import type { ProductRequestApiItem, ProcessStepData } from '@type/product-requests';
import type { Impacts, BenchmarkingData } from '@type/supplier';
import { useAlertStore } from '@store/useAlertStore';
import Bugsnag from '@utils/bugsnag';
import { ERROR_MESSAGES } from '@constants/messages';
import { ROUTES } from '@constants/routes';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';

const formatStepValue = (step: ProcessStepData): string => {
  const parts: string[] = [];

  if (step.volumePerUnit != null && step.volumeUnit != null) {
    parts.push(`${step.volumePerUnit}${step.volumeUnit}`);
  } else if (step.numberOfLabels != null) {
    parts.push(`${step.numberOfLabels}`);
  }

  if (step.currentTemperature != null) {
    parts.push(`${step.currentTemperature}°C`);
  }

  if (step.targetTemperature != null) {
    parts.push(`${step.targetTemperature}°C`);
  }

  return parts.join(', ');
};

const formatNetUnit = (
  netUnitSize: ProductRequestApiItem['netUnitSize'],
  netUnit: ProductRequestApiItem['netUnit']
): string => {
  if (typeof netUnitSize === 'number') {
    if (typeof netUnit === 'string') {
      return `${netUnitSize}${netUnit}`;
    }

    return `${netUnitSize}`;
  }

 if (netUnitSize && typeof netUnitSize === 'object') {
  const isValidStep = (step: unknown): step is ProcessStepData =>
    !!step &&
    typeof step === 'object' &&
    'volumePerUnit' in step &&
    'volumeUnit' in step;

  const formatted = Object.values(netUnitSize)
    .filter(isValidStep)
    .map(formatStepValue)
    .filter(Boolean)
    .join(', ');
  return formatted || '-';
}

  return '-';
};

type ProductRequestRow = {
  id: string;
  componentId: string;
  productId: string;
  roleDetailsId: string;
  supplierLinkedRole: string;
  supplierContactEmail: string;
  supplierContactName: string;
  companyName: string;
  requestedImpactCategories: string[];
  impacts?: Impacts;
  benchmarkingData?: BenchmarkingData | null;
  productSupplierRole: string;
  submissionStatus: string;
  submissionStatusRaw: string;
  netUnitSize: string;
  dateOfRequest: string;
  dateDot?: 'red' | 'green' | 'yellow';
};

const mapProductRequestToRow = (
  request: ProductRequestApiItem
): ProductRequestRow => {
  const requestedCategories = new Set(
    (request.requestedImpactCategories ?? []).map((category) =>
      category.toLowerCase()
    )
  );
  const impactCategories = IMPACT_CATEGORY_ORDER.filter((category) =>
    requestedCategories.has(category)
  );
  // TODO: derive statusByCategory using submitted data vs benchmarkingData once API provides submitted values.

  const displayStatus = mapApiStatusToDisplayStatus(request.submissionStatus);
  const netUnitSize = formatNetUnit(request.netUnitSize, request.netUnit);

  return {
    id: `${request.componentId}-${request.roleDetailsId}`,
    componentId: request.componentId,
    productId: request.productId,
    roleDetailsId: request.roleDetailsId,
    supplierLinkedRole: request.supplierLinkedRole,
    supplierContactEmail: request.supplierContactEmail,
    supplierContactName: request.supplierContactName,
    companyName: request.companyName,
    requestedImpactCategories: impactCategories,
    impacts: request.impacts,
    benchmarkingData: request.benchmarkingData,
    productSupplierRole: SUPPLIER_ROLE_LABEL_BY_SLUG[request.supplierLinkedRole],
    submissionStatus: displayStatus,
    submissionStatusRaw: request.submissionStatus,
    netUnitSize,
    dateOfRequest: formatDate(request.dateOfRequest),
    dateDot: getDateDotcolour(request.dateOfRequest, request.submissionStatus),
  };
};

const ProductRequestsTab = ({ productId }: { productId: string }) => {
  const [rows, setRows] = useState<ProductRequestRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { showAlert } = useAlertStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const hasRequests = rows.length > 0;
  const itemsPerPage = 10;
  const [skip, setSkip] = useState(0);

  useEffect(() => {
    if (!productId) {
      setRows([]);
      setTotalCount(0);
      return;
    }
    setSkip(0);
  }, [productId]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!productId) {
        setRows([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await getProductRequests(productId, itemsPerPage, skip);
        if (res.success && res.data) {
          const result = res.data?.result ?? [];
          setRows(result.map(mapProductRequestToRow));
          setTotalCount(res.data?.count ?? 0);
          return;
        }
        setRows([]);
        setTotalCount(0);
        showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_PRODUCT_REQUESTS, 'danger');
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'ProductRequestsTab',
            method: 'fetchRequests',
            productId,
            itemsPerPage,
            skip,
          });
        });
        setRows([]);
        setTotalCount(0);
        showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_PRODUCT_REQUESTS, 'danger');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [productId, itemsPerPage, skip, showAlert]);

  const handleNavigateToComponentDetails = (row: ProductRequestRow) => {
    if (!row.productId || !row.componentId || !row.supplierLinkedRole) {
      showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_PRODUCT_REQUESTS, 'danger');
      return;
    }
    const encodedRoleSlug = encodeURIComponent(row.supplierLinkedRole);
    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCT_REQUEST_COMPONENT_DETAIL}/${row.productId}/${row.componentId}/${encodedRoleSlug}`
    );
  };

  return (
    <div className={styles.wrapper}>
      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : (
        <div className={styles.cardTable}>
        {!hasRequests ? (
          <div className={styles.emptyStateWrapper}>
            <img src={logoImg} alt="logo" />
            <div className={styles.emptyStateContent}>
              <h3>No requests received yet</h3>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.tableHead}>
              
              <h1>Company Name</h1>
              <h1>Requested Impact Categories</h1>
              <h1>Supplier Role</h1>
              <h1>Submission Status</h1>
              <h1>Net Unit Size</h1>
              <h1 className={styles.labelWithIcon}>Date of Request
                <Tooltip text={TOOLTIP_TEXT.DATE_OF_REQUEST} noTruncate>
                  <img
                    src={infoIcon}
                    alt="info"
                    className={styles.infoIcon}
                  />
                </Tooltip>
              </h1>
            </div>

            <div className={styles.tableBody}>
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={styles.tableRow}
                  onClick={() => {
                    handleNavigateToComponentDetails(row);
                  }}
                >
                  <CellWithTooltip value={row.companyName} className={styles.tableCell}/>
                  <TableImpactCategoryIcons
                    impacts={row.impacts ?? row.requestedImpactCategories.reduce((acc, cat) => ({ ...acc, [cat]: { quantity: null } }), {} as Impacts)}
                    benchmarkingData={row.benchmarkingData}
                  />
                  <CellWithTooltip value={row.productSupplierRole} className={styles.tableCell} />
                  <div className={styles.cell}>
                    <StatusBadge
                      status={row.submissionStatus}
                      onAddData={() => {
                        handleNavigateToComponentDetails(row);
                      }}
                    />
                  </div>

                  <CellWithTooltip value={row.netUnitSize} className={styles.tableCell} />

                  <div className={styles.dateCell}>
                    {row.dateOfRequest ? (
                      <>        
                        <span
                          className={`${styles.dateDot} ${styles[`dateDot--${row.dateDot}`]}`}
                          aria-hidden="true"
                        />
                        <span className={styles.dateText}>{row.dateOfRequest}</span>
                      </>
                    ) : (
                      <span className={styles.dateText}>-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      )}

      {/* Table Pagination */}
        <Pagination
          skip={skip}
          limit={itemsPerPage}
          totalCount={totalCount}
          onPageChange={setSkip}
        />
    </div>
  );
};

export default ProductRequestsTab;
