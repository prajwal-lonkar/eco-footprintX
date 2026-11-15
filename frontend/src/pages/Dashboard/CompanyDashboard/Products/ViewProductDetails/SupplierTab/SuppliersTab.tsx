import styles from '../../Products.module.scss';
import supplierStyles from './SuppliersTab.module.scss';

import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import Pagination from '@common/Pagination/Pagination';

import { deleteComponent, getProductSuppliers } from '@service/company.service';
import StatusBadge, { mapApiStatusToDisplayStatus } from '@common/StatusBadge/StatusBadge';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import deleteImg from '@assets/icons/trash.svg';
import reviewUpdateIcon from '@assets/icons/review.svg';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { useAlertStore } from '@store/useAlertStore';
import { ROUTES } from '@constants/routes';
import type { ProductSupplierListItem, Impacts, BenchmarkingData } from '@type/supplier';
import { TableImpactCategoryIcons } from '@common/TableImpactCategoryIcons/TableImpactCategoryIcons';
import Bugsnag from '@utils/bugsnag';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import { formatDate } from '@utils/dateHelpers';
import {
  SUPPLIER_ROLE_SLUGS,
  TRANSPORT_METHOD_LABELS,
  type TransportMethod,
} from '@constants/component-service-flow';

interface SuppliersTabProps {
  handleNavigateToAddService: () => void;
  productId: any;
  onDataLoaded?: (length: number) => void;
  ondeleteComponent: () => void;
}

export interface SuppliersProps {
  _id: string;
  componentId: string;
  SupplierName: string;
  ComponentServiceName: string;
  SupplierRole: string;
  impacts?: Impacts;
  benchmarkingData?: BenchmarkingData | null;
  SubmissionStatus: string;
  SubmissionDate: string;
  supplierRoleSlug: string;
  hasProspectiveUpdate: boolean;
}

const IMPACT_KEYS: Array<keyof Impacts> = ['carbon', 'water', 'land'];

const hasProspectiveImpact = (impacts?: Impacts) =>
  IMPACT_KEYS.some((impactKey) => impacts?.[impactKey]?.isProspective === true);

const SuppliersTab = ({
  handleNavigateToAddService,
  productId,
  onDataLoaded,
  ondeleteComponent,
}: SuppliersTabProps) => {
  const navigate = useNavigate();
  const defaultWidths = [
    '110px',
    '189px',
    '110px',
    '125px',
    '220px',
    '110px',
    '60px',
  ];
  const smallWidths = [
    '120px',
    '140px',
    '120px',
    '125px',
    '220px',
    '90px',
    '50px',
  ];

  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [showDeleteComponent, setShowDeleteCompoModal] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );

  const { showAlert } = useAlertStore();

  const [isLoading, setIsLoading] = useState(true);
  const [companiesData, setCompaniesData] = useState<SuppliersProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [supplierRoleSlug, setSupplierRoleSlug] = useState('');
  const currentData = companiesData;
  const fetchSuppliers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setHasError(false);
      const res = await getProductSuppliers(
        productId,
        itemsPerPage,
        page
      );

      const resolvedTotalPages = Math.max(res.data?.totalPages || 1, 1);
      setTotalPages(resolvedTotalPages);

      if (page > resolvedTotalPages) {
        setCurrentPage(resolvedTotalPages);
        return;
      }
      const suppliers = res.data?.results ?? [];
      const mappedData: SuppliersProps[] = suppliers.map((item: ProductSupplierListItem) => {
        let componentServiceName = item.componentName;

        if (
          item.supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT &&
          item.transportFreight
        ) {
          const methodKey = item.transportFreight.transportMethod as TransportMethod;
          const methodLabel = TRANSPORT_METHOD_LABELS[methodKey];
          const transportOrigin = item.transportFreight.transportOrigin;
          const transportDestination = item.transportFreight.transportDestination;
          if (
            methodLabel &&
            item.componentName &&
            transportOrigin &&
            transportDestination
          ) {
            componentServiceName = `${methodLabel} transportation of ${item.componentName} from ${transportOrigin} to ${transportDestination}`;
          }
        }

        return {
          _id: item._id,
          componentId: item.componentId,
          SupplierName: item.supplierName,
          ComponentServiceName: componentServiceName,
          SupplierRole: item.supplierRole,
          impacts: item.impacts,
          benchmarkingData: item.benchmarkingData,
          SubmissionStatus: mapApiStatusToDisplayStatus(item.submissionStatus ?? ''),
          SubmissionDate: formatDate(item.createdAt),
          supplierRoleSlug: item.supplierRoleSlug,
          hasProspectiveUpdate: hasProspectiveImpact(item.impacts),
        };
      });

      setCompaniesData(mappedData);
      if (onDataLoaded) {
        onDataLoaded(mappedData.length);
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('SuppliersTab', {
          method: 'fetchSuppliers',
          productId,
          currentPage: page,
          itemsPerPage,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_COMPONENT, 'danger');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSuppliers(currentPage);
  }, [productId, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRowClick = (row: SuppliersProps) => {
    if (!row.componentId || !row.supplierRoleSlug) {
      return;
    }
    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${row.componentId}${ROUTES.ROLE.BASE}/${row.supplierRoleSlug}`
    );
  };

  const handleReviewUpdateClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: SuppliersProps
  ) => {
    event.stopPropagation();
    if (!row.componentId || !row.supplierRoleSlug) {
      return;
    }

   navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${row.componentId}${ROUTES.ROLE.BASE}/${row.supplierRoleSlug}`
    );
  };

  const handleDeleteComponent = async (
    productId: string,
    componentId: string,
    supplierRoleSlug: string
  ) => {
    try {
      const encodedSlug = encodeURIComponent(supplierRoleSlug);

      const res = await deleteComponent(productId, componentId, encodedSlug);

      if (res.statusCode === 200) {
        await fetchSuppliers(currentPage);
        showAlert(SUCCESS_MESSAGES.COMPONENT_DELETED_SUCCESSFULLY, 'success');
          ondeleteComponent();
      } else {
        showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_COMPONENT, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('SuppliersTab', {
          method: 'handleDeleteComponent',
          productId,
          componentId,
          supplierRoleSlug,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_COMPONENT, 'danger');
    }
  };
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const toggleMenu = (index: number) => {
    setOpenMenuIndex((prev) => (prev === index ? null : index));
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuIndex !== null &&
        rowRefs.current[openMenuIndex] &&
        !rowRefs.current[openMenuIndex]!.contains(e.target as Node)
      ) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIndex]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setColumnWidths(smallWidths);
      } else {
        setColumnWidths(defaultWidths);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <>
      <div className={supplierStyles.supplierTabWrapper}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerWrapper}>
            <p>
              This table shows all the suppliers supplying components or
              services for your product. Select a component or service to view
              its environmental profile.
            </p>
          </div>
        </div>

        <div className={styles.cardTable}>
          <>
            <div className={supplierStyles.tableHead}>
              <h1>Supplier Name</h1>
              <h1>Component or Service Name</h1>
              <h1>Supplier Role</h1>
              <h1>Impact Categories</h1>
              <h1 style={{ display: 'flex', gap: '8px' }}>
                Submission Status{' '}
                <Tooltip
                  text={TOOLTIP_TEXT.SUBMISSION_STATUS_PROGRESS}
                  noTruncate
                >
                  <img
                    src={infoIcon}
                    alt="info"
                    className={styles.infoIcon}
                    width={14}
                    height={14}
                    style={{ verticalAlign: 'top' }}
                  />
                </Tooltip>
              </h1>
              <h1>Submission Date</h1>
              <h1 className="d-flex justify-content-center align-items-center">
                Action
              </h1>
            </div>
            <div className={styles.tableBody}>
              {isLoading || hasError ? (
                <SkeletonLoader
                  type="supplierTable"
                  className={styles.tableShimmer}
                  columns={columnWidths}
                />
              ) : currentData.length === 0 ? (
                <div className={supplierStyles.emptyStateWrapper}>
                  <button
                    className={supplierStyles.addBtn}
                    onClick={handleNavigateToAddService}
                  >
                    <span>+</span> Add Your First Component or Service
                  </button>
                </div>
              ) : (
                <>
                  {currentData.map((row, index) => (
                      <div
                         className={supplierStyles.tableRow}
                         key={`${row.componentId}-${row.supplierRoleSlug}-${index}`}
                         onClick={() => handleRowClick(row)}
                       >
                      
                      <CellWithTooltip
                        value={row.SupplierName}
                        style={{ width: columnWidths[0] }}
                        className={supplierStyles.cell}
                      />

                      <CellWithTooltip
                        value={row.ComponentServiceName}
                        style={{ width: columnWidths[1] }}
                        className={supplierStyles.cell}
                      />

                      <CellWithTooltip
                        value={row.SupplierRole}
                        style={{ width: columnWidths[2] }}
                        className={supplierStyles.cell}
                      />

                      <div
                        style={{ width: columnWidths[3] }}
                        className={supplierStyles.cell}
                      >
                        <TableImpactCategoryIcons
                          impacts={row.impacts ?? { carbon: { quantity: null }, water: { quantity: null }, land: { quantity: null } }}
                          benchmarkingData={row.benchmarkingData}
                        />
                      </div>

                    {/* TODO: handle review update button */}
                      <div
                        className={supplierStyles.cell}
                        style={{ width: columnWidths[4] }}
                      >
                        <div className={supplierStyles.submissionStatusContent}>
                          <StatusBadge
                            status={row.SubmissionStatus}
                            hideAddButton={row.hasProspectiveUpdate}
                            onAddData={() =>
                              navigate(
                                `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}${ROUTES.COMPONENT.BASE}/${row.componentId}${ROUTES.ROLE.BASE}/${row.supplierRoleSlug}${ROUTES.ENV_PROFILE.BASE}/new`
                              )
                            }
                          />
                          {row.hasProspectiveUpdate && (
                            <button
                              type="button"
                              className={supplierStyles.reviewUpdateButton}
                              onClick={(event) =>
                                handleReviewUpdateClick(event, row)
                              }
                            >
                              <img
                                src={reviewUpdateIcon}
                                alt=""
                                aria-hidden="true"
                              />
                              Review Update
                            </button>
                          )}
                        </div>
                      </div>
                      <CellWithTooltip
                        value={row.SubmissionDate?.trim() ? row.SubmissionDate : '-'}
                        style={{ width: columnWidths[5] }}
                        className={supplierStyles.cell}
                      />

                      <div
                        style={{ width: columnWidths[6], padding: '14px 0px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className={styles.actionWrapper}>
                          <span
                            className={styles.moreIcon}
                            ref={(el) => {
                              rowRefs.current[index] = el;
                            }}
                            onClick={() => toggleMenu(index)}
                          >
                            ⋯
                          </span>

                          {openMenuIndex === index && (
                            <button
                              className={styles.dropdownMenu}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuIndex(null);
                                setShowDeleteCompoModal(true);
                                setSelectedComponentId(row.componentId);
                                setSupplierRoleSlug(row.supplierRoleSlug);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                  )}
                </>
              )}
            </div>
          </>
        </div>
        {currentData.length > 0 && (
          <Pagination
            mode="page"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
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
            // onConfirm={()=>{}}
            onConfirm={async () => {
              if (!selectedComponentId) return;

              await handleDeleteComponent(
                productId,
                selectedComponentId,
                supplierRoleSlug
              );

              setShowDeleteCompoModal(false);
              setSelectedComponentId(null);
            }}
            confirmBtnClass={styles.removeButton}
          />
        </div>
      )}
    </>
  );
};

export default SuppliersTab;
