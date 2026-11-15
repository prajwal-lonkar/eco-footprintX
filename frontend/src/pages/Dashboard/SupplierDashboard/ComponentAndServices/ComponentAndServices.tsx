import { useEffect, useState } from 'react';
import styles from './ComponentAndServices.module.scss';
import addWhiteIcon from '@assets/icons/add-white.svg';
import infoIcon from '@assets/icons/info-icon.svg';
import logoImg from '@assets/images/logoImg.svg';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import Tooltip from '@common/Tooltip/Tooltip';
import Pagination from '@common/Pagination/Pagination';
import StatusBadge, { mapApiStatusToDisplayStatus } from '@common/StatusBadge/StatusBadge';
import FeatureComingSoonModal from '@components/modals/FeatureComingSoonModal/FeatureComingSoonModal';
import { getDateDotcolour, formatDate } from '@utils/dateHelpers';
import { getImpactCategoryRequests } from '@service/supplier.service';
import type { ComponentImpactRequest, Impacts , BenchmarkingData } from '@type/supplier';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import Bugsnag from '@utils/bugsnag';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@constants/routes';
import { TableImpactCategoryIcons } from '@common/TableImpactCategoryIcons/TableImpactCategoryIcons';
import { SUPPLIER_ROLE_LABEL_BY_SLUG } from '@constants/component-service-flow';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import { getTransportComponentName } from '@utils/formatters';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';

export type RequestRow = {
  id: string;
  productId: string;
  componentOrServiceName: string;
  impacts: Impacts;
  benchmarkingData?: BenchmarkingData | null;
  submissionStatus: 'pending' | 'submitted' | 'partial' | 'ready' | 'Awaiting Submission' | 'Submitted' | 'Partially Submitted' | 'Ready to Submit';
  requestedBy: string;
  dateOfRequest: string;
  dateDot: 'red' | 'green' | 'yellow';
  supplierLinkedRole?: string;
  supplierRole: string;
};

const mapComponentToRequestRow = (
  component: ComponentImpactRequest
): RequestRow => {
  const displayStatus = mapApiStatusToDisplayStatus(component.submissionStatus);

  const componentOrServiceName =
    component.supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
      ? getTransportComponentName(
          component.componentName,
          component.transportFreight?.transportMethod,
          component.transportFreight?.transportOrigin,
          component.transportFreight?.transportDestination
        )
      : component.componentName;

  return {
    id: component.componentId,
    productId: component.productId,
    componentOrServiceName,
    impacts: component.impacts,
    benchmarkingData: component.benchmarkingData,
    submissionStatus: displayStatus,
    requestedBy: component.supplierName,
    dateOfRequest: formatDate(component.createdAt),
    dateDot: getDateDotcolour(component.createdAt, component.submissionStatus),
    supplierLinkedRole: component.supplierRoleSlug,
    supplierRole: SUPPLIER_ROLE_LABEL_BY_SLUG[component.supplierRoleSlug],
  };
};

const ComponentAndServices = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requestsData, setRequestsData] = useState<RequestRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalRequests, setTotalRequests] = useState(0);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalRequests / itemsPerPage));

  const { showAlert } = useAlertStore();
  const currentData = requestsData;
  const navigate = useNavigate();
  const handleAddData = (row: RequestRow) => {
    navigate(
      ROUTES.SUPPLIER.BASE +
      ROUTES.SUPPLIER.COMPONENT_AND_SERVICES +
      `/${row.productId}` +
      ROUTES.COMPONENT.BASE +
      `/${row.id}` +
      ROUTES.ROLE.BASE +
      `/${row.supplierLinkedRole}` +
      ROUTES.ENV_PROFILE.BASE +
      '/new'
    );
  };

  const fetchImpactCategoryRequests = async () => {
    setIsLoading(true);
    try {
      const result = await getImpactCategoryRequests(itemsPerPage, currentPage);

      if (!result.success || result.statusCode !== 200 || !result.data) {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        setRequestsData([]);
        setTotalRequests(0);
        return;
      }

      const mappedData = result.data.results.map(mapComponentToRequestRow);
      setRequestsData(mappedData);
      setTotalRequests(result.data.total);
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'ComponentAndServices',
          method: 'fetchImpactCategoryRequests',
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      setRequestsData([]);
      setTotalRequests(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactCategoryRequests();
  }, [currentPage]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerContent}>
          <h2>Component &amp; Services Requests</h2>
          <p>
            This table shows the component and service requests you have received for providing
            impact category data.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.addProductBtn}
            onClick={() => setShowAddProductModal(true)}
          >
            <img src={addWhiteIcon} className={styles.addIcon} alt="" />
            Add Product
          </button>
        </div>
      </div>

      <div className={styles.cardTable}>
        {isLoading ? (
          <SkeletonLoader type="table" className={styles.tableShimmer} />
        ) : currentData.length === 0 ? (
          <div className={styles.emptyStateWrapper}>
            <img src={logoImg} alt="logo" />
            <div className={styles.emptyStateContent}>
              <h3>No component or service requests added yet.</h3>

              <p>Please click "Add Product" to get started.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.tableHead}>
              <h1>Component or Service Name</h1>

              <h1>Impact Categories Requested</h1>

              <h1>Supplier Role</h1>

              <h1 className={styles.headWithIcon} style={{ display: 'flex', gap: '8px' }}>
                Submission Status
                <Tooltip text={TOOLTIP_TEXT.SUBMISSION_STATUS} noTruncate>
                  <img
                    src={infoIcon}
                    alt="info"
                    className={styles.infoIcon}
                    width={16}
                    height={16}
                    style={{ verticalAlign: 'top' }}
                  />
                </Tooltip>
              </h1>

              <h1>Requested By</h1>

              <h1>Date of Request</h1>
            </div>

            <div className={styles.tableBody}>
              {currentData.map((row) => (
                <div
                  key={row.id}
                  className={styles.tableRow}
                  onClick={() => {
                    navigate(
                      `${ROUTES.SUPPLIER.BASE}${ROUTES.SUPPLIER.COMPONENT_AND_SERVICES}/${row.productId}/${row.id}/${row.supplierLinkedRole}`
                    );
                  }}
                >
                  <CellWithTooltip value={row.componentOrServiceName} className={styles.tableCell}/>

                  <TableImpactCategoryIcons impacts={row.impacts} benchmarkingData={row.benchmarkingData} />

                  <CellWithTooltip value={row.supplierRole || '-'} className={styles.tableCell}/>

                  <StatusBadge
                    status={row.submissionStatus}
                    onAddData={() => handleAddData(row)}
                  />

                  <CellWithTooltip value={row.requestedBy} className={`${styles.tableCell} ${styles.requestedByCell}`}/>

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

      {currentData.length > 0 && (
        <Pagination
          mode="page"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {showAddProductModal && (
        <FeatureComingSoonModal
          title="Add Product"
          message="The feature will be coming soon"
          goBackBtnText="Go Back"
          GoBack={() => setShowAddProductModal(false)}
        />
      )}
    </div>
  );
};

export default ComponentAndServices;
