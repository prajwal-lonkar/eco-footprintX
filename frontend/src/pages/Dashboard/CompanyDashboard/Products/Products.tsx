import { useEffect, useRef, useState } from 'react';
import styles from './Products.module.scss';

import importImg from '@assets/images/import.svg';

import AddProductModal from '@components/modals/AddProductModal/AddProductModal';

import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import Pagination from '@common/Pagination/Pagination';

import logoImg from '@assets/images/logoImg.svg';

import infoIcon from '@assets/icons/info-icon.svg';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import deleteIcon from '@assets/icons/trash.svg';

import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import StatusBadge, { mapApiStatusToDisplayStatusForProduct } from '@common/StatusBadge/StatusBadge';
import Tooltip from '@common/Tooltip/Tooltip';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import { deleteProduct, getProductList } from '@service/company.service';
import { upgradeSubscription } from '@service/subscription.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { ROUTES } from '@constants/routes';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useNavigate } from 'react-router-dom';
import FeatureComingSoonModal from '@components/modals/FeatureComingSoonModal/FeatureComingSoonModal';
import UpgradeSubscriptionModal from '@components/modals/UpgradeSubscriptionModel/UpgradeSubscriptionModel';
import { SUBSCRIPTION_TIERS, isValidSubscriptionTier, type SubscriptionTier } from '@constants/subscription';
import type { SubscriptionPlan } from '@type/subscription';
import { getSubscriptions } from '@service/subscription.service';

import Bugsnag from '@utils/bugsnag';
export interface ProductRow {
  _id: string;
  name: string;
  netSize: string;
  internalSku: string;
  category: string;
  publishStatus: string;
}


const Products = () => {
  const columnWidths = ['250px', '150px', '120px', '160px', '150px', '60px'];
  const [isLoading, setIsLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);

  const [companiesData, setCompaniesData] = useState<ProductRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCompanies, setTotalCompanies] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCompanies / itemsPerPage));

  const currentData = companiesData;
  const rowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // upgrade modal state + plan state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [subscriptionPlanLimit, setSubscriptionPlanLimit] = useState<number>(1);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>('');


  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const toggleMenu = (index: number) => {
    setOpenMenuIndex((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);


  // Fetches Subscriptions
  const fetchSubscriptions = async () => {
    setIsPlansLoading(true);
    try {
      const response = await getSubscriptions();

      if (response.success && response.data?.allPlans?.length) {
        const plans = response.data.allPlans;
        setSubscriptionPlans(plans);
        
        const currentPlan = plans.find(
          (plan) => Boolean(plan.isCurrentPlan) === true
        );
        if (currentPlan) {
          setCurrentPlanSlug(currentPlan.slug);
          setSubscriptionPlanLimit(currentPlan.maxProducts || 0);
        } else {
          setCurrentPlanSlug('');
        }
      } else {
        setSubscriptionPlans([]);
        setCurrentPlanSlug('');
        showAlert(ERROR_MESSAGES.FAILED_TO_FETCH_SUBSCRIPTIONS, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'Products',
          method: 'fetchSubscriptions',
        });
      });
      setSubscriptionPlans([]);
      setCurrentPlanSlug('');
      showAlert(ERROR_MESSAGES.FAILED_TO_FETCH_SUBSCRIPTIONS, 'danger');
    } finally {
      setIsPlansLoading(false);
    }
  };

  //Fetches Product List
  const fetchProductList = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      const skip = (page - 1) * itemsPerPage;
      const result = await getProductList(itemsPerPage, skip);

      if (!result.success || result.statusCode !== 200) {
        showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_PRODUCTS, 'danger');
        setCompaniesData([]);
        setTotalCompanies(0);
        return;
      }

      setCompaniesData(result?.list as any);
      setTotalCompanies(result.total as any);
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'Products',
          method: 'fetchProductList',
          page,
          itemsPerPage,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_PRODUCTS, 'danger');
      setCompaniesData([]);
      setTotalCompanies(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductList(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  //Delete Product
  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await deleteProduct(productId);

      if (res.statusCode === 200) {
        const nextTotalCompanies = Math.max(totalCompanies - 1, 0);
        const nextTotalPages = Math.max(
          1,
          Math.ceil(nextTotalCompanies / itemsPerPage)
        );
        const nextPage = Math.min(currentPage, nextTotalPages);

        setTotalCompanies(nextTotalCompanies);

        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
        } else {
          await fetchProductList(nextPage);
        }

        showAlert(SUCCESS_MESSAGES.PRODUCT_DELETED_SUCCESSFULLY, 'success');
      } else {
        showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_PRODUCT, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'Products',
          method: 'handleDeleteProduct',
          productId,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_PRODUCT, 'danger');
    }
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


  const canAddProductNow = (): boolean => {
    if (currentPlanSlug === SUBSCRIPTION_TIERS.ENTERPRISE) {
      return true;
    }
    return totalCompanies < subscriptionPlanLimit;
  };

  const handleAddProductClick = async () => {
    if (!subscriptionPlans.length && !isPlansLoading) {
      await fetchSubscriptions();
    }

    if (!canAddProductNow()) {
      setShowUpgradeModal(true);
      return;
    }

    setOpenAddModal(true);
  };


  // upgrade handler with API call
  const handleUpgrade = async (planId: SubscriptionTier) => {
    // Validate planId is a valid subscription tier
    if (!isValidSubscriptionTier(planId)) {
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      return;
    }

    // Skip enterprise tier (disabled)
    if (planId === SUBSCRIPTION_TIERS.ENTERPRISE) {
      return;
    }

    try {
      showSpinner();
      const result = await upgradeSubscription({ slug: planId });

      if (result.success && result.statusCode === 200) {
        setShowUpgradeModal(false);
        showAlert(SUCCESS_MESSAGES.SUBSCRIPTION_UPGRADED_SUCCESSFULLY, 'success');

        // Update limit immediately from current plans
        const upgradedPlan = subscriptionPlans.find((p) => p.tier === planId);
        if (upgradedPlan) {
          setSubscriptionPlanLimit(
            upgradedPlan.maxProducts || 0
          );
        }

        await fetchSubscriptions();
      } else {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'Products',
          method: 'handleUpgrade',
          planId,
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
    } finally {
      hideSpinner();
    }
  };

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerContent}>
            <h2>Products</h2>
            <p>
              This table displays all the products you've added to the Eco
              FootprintX platform. Click on any product to view and manage its
              environmental profile
            </p>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.addProductBtn}
              onClick={handleAddProductClick}
            >
              <span style={{ fontSize: '16px' }}>+</span> Add Product
            </button>

            <button
              className={styles.importroductBtn}
              onClick={() => setShowImportModal(true)}
            >
              <img src={importImg} alt="importImg" />
              Import Product
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
                <h3>No products added yet.</h3>

                <p>Please click “Add Product” to get started.</p>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tableHead}>
                <h1>Product Name</h1>
                <h1>Net Unit Size</h1>
                <h1>Internal SKU</h1>
                <h1>Product Category</h1>
                <h1 style={{ display: 'flex', gap: '8px' }}>
                  Publication Status{' '}
                  <Tooltip
                    text={TOOLTIP_TEXT.PUBLICATION_STATUS}
                    noTruncate
                  >
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
                <h1 className="d-flex justify-content-center align-items-center">
                  Action
                </h1>
              </div>
              <div className={styles.tableBody}>
                {currentData.map((row, index) => (
                  <div
                    className={styles.tableRow}
                    key={index}
                    onClick={() =>
                      navigate(
                        `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${row._id}`
                      )
                    }
                  >
                    <CellWithTooltip
                      value={row.name}
                      className={styles.cell}
                      style={{ width: columnWidths[0] }}
                    />

                    <CellWithTooltip
                      value={row.netSize}
                      className={styles.cell}
                      style={{ width: columnWidths[1] }}
                    />

                    <CellWithTooltip
                      value={row.internalSku}
                      className={styles.cell}
                      style={{ width: columnWidths[2] }}
                    />

                    <CellWithTooltip
                      value={row.category}
                      className={styles.cell}
                      style={{ width: columnWidths[3] }}
                    />

                    <div
                      className={styles.cell}
                      style={{ width: columnWidths[4] }}
                    >
                      <StatusBadge
                        status={mapApiStatusToDisplayStatusForProduct(row.publishStatus)}
                        hideAddButton
                      />
                    </div>

                    <div
                      style={{ width: columnWidths[5], padding: '14px 0px' }}
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
                              setShowRemoveModal(true);
                              setSelectedProductId(row._id);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
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
      </div>

      <AddProductModal
        isOpen={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={() => {
          fetchProductList();
        }}
        mode="add"
        productId=""
      />

      {/* Upgrade Subscription Modal */}
      <UpgradeSubscriptionModal
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        plans={subscriptionPlans}
        isLoading={isPlansLoading}
      />

      {showRemoveModal && (
        <div className={styles.modalWrapper}>
          <CommonModal
            icon={deleteIcon}
            title="Are you sure you want to remove this product?"
            message="This action will permanently delete the product and any associated impact category data, including published data. This cannot be undone."
            cancelText="Cancel"
            confirmText="Remove"
            onCancel={() => setShowRemoveModal(false)}
            onConfirm={async () => {
              if (!selectedProductId) return;

              await handleDeleteProduct(selectedProductId);

              setShowRemoveModal(false);
              setSelectedProductId(null);
            }}
            confirmBtnClass={styles.removeButton}
          />
        </div>
      )}

      {showImportModal && (
        <FeatureComingSoonModal
          title="Import Product"
          message="The feature will be coming soon"
          goBackBtnText="Go Back"
          GoBack={() => setShowImportModal(false)}
        />
      )}
    </>
  );
};

export default Products;
