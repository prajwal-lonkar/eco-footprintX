import React, { useEffect, useRef, useState } from 'react';
import styles from './ViewProductDetails.module.scss';
import { IoIosArrowBack } from 'react-icons/io';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BiEditAlt } from 'react-icons/bi';
import trash from '@assets/icons/trash.svg';
import Tooltip from '@common/Tooltip/Tooltip';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import infoIcon from '@assets/images/info icon.svg';
import link from '@assets/images/link.svg';
import SupplierTab from './SupplierTab/SuppliersTab';
import ProductRequestsTab from './ProductRequestsTab/ProductRequestsTab';
import SupplyChainTab from './SupplyChainTab/SupplyChainTab';
import {
  ImpactCategoryCard,
  ImpactCategoryCardState,
  type ImpactCategoryType,
  type ImpactCategoryCardProps,
  type CtaConfig,
} from '@common/ImpactCategoryCard';
import type {
  ImpactValue,
  ProductImpactSummaryData,
} from '@common/ImpactCategoryCard/types';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import deleteIcon from '@assets/icons/trash.svg';
import circleCheckIcon from '@assets/icons/circle-check.svg';
import {
  updateProductImageOrInstructions,
  getProductDetails,
  getProductImpactSummary,
  patchImpactCategoryPublish,
} from '@service/company.service';
import defaultImg from '@assets/images/company-profile.png';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import { ROUTES } from '@constants/routes';
import type { ProductDetails } from '@type/product';
import AddProductModal from '@components/modals/AddProductModal/AddProductModal';
import HowToRecycle from './HowToRecycle/HowToRecycle';
import IMG1 from '@assets/images/howtorecycle.svg';
import Bugsnag from '@utils/bugsnag';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import StatusBadge, {
  mapApiStatusToDisplayStatusForProduct,
} from '@common/StatusBadge/StatusBadge';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { parseAverageComparison } from '@utils/parseAverageComparision';
const ViewProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab =
    (location.state as { activeTab?: number } | null)?.activeTab ?? 0;
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();
  const [impactSummary, setImpactSummary] =
    useState<ProductImpactSummaryData | null>(null);
  const [publishingCategories, setPublishingCategories] = useState<
    Set<ImpactCategoryType>
  >(new Set());
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const publishActionRef = useRef<(() => Promise<void>) | null>(null);

  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { productId } = useParams<{ productId: string }>();
  // const [productName, setProductName] = useState('');
  const { setProductName } = useBuiltEnvironmentalProfileFlowStore();
  const fetchProductDetails = async (productId: any, manageSpinner = true) => {
    try {
      setLoading(true);
      if (manageSpinner) {
        showSpinner();
      }
      const res = await getProductDetails(productId!);

      if (res.statusCode === 200 && res.data) {
        setProductDetails(res.data);
        setLoading(false);
        setProductName(res.data.name);
      }
    } catch (err) {
      Bugsnag.notify(err as Error, (event) => {
        event.addMetadata('context', {
          component: 'ViewProductDetails',
          method: 'fetchProductDetails',
          productId,
        });
      });
      console.error(err);
    } finally {
      if (manageSpinner) {
        hideSpinner();
      }
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchProductDetails();
  // }, [productId]);
  const fetchImpactSummary = async (
    productId: string,
    manageSpinner = true
  ) => {
    try {
      if (manageSpinner) {
        showSpinner();
      }
      const res = await getProductImpactSummary(productId);

      if (res.statusCode === 200 && res.data) {
        setImpactSummary(res.data);
      }
    } catch (err) {
      Bugsnag.notify(err as Error, (event) => {
        event.addMetadata('context', {
          component: 'ViewProductDetails',
          method: 'fetchImpactSummary',
          productId,
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
    } finally {
      if (manageSpinner) {
        hideSpinner();
      }
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductDetails(productId);
      fetchImpactSummary(productId);
    }
  }, [productId]);
  const [hasSuppliers, setHasSuppliers] = useState(false);
  const publishStatus = impactSummary?.impactCategoryPublishStatus;
  const publishedCount =
    (publishStatus?.carbon ? 1 : 0) +
    (publishStatus?.water ? 1 : 0) +
    (publishStatus?.land ? 1 : 0);

  const STEP_NAMES = [
    'Add Product Details',
    'Add Components or Services',
    'Add Recycling Instructions',
    `Publish Impact Category ${publishedCount}/3`,
  ];
  const stepStatus = {
    step1: true,
    step2: hasSuppliers,
    step3: !!productDetails?.recycleInstructions?.length,
    step4: publishedCount === 3,
  };
  const progressPercent =
    (stepStatus.step1 ? 25 : 0) +
    (stepStatus.step2 ? 25 : 0) +
    (stepStatus.step3 ? 25 : 0) +
    (stepStatus.step4 ? 25 : 0);
  const activeStep = !stepStatus.step1
    ? 1
    : !stepStatus.step2
      ? 2
      : !stepStatus.step3
        ? 3
        : !stepStatus.step4
          ? 4
          : 0;

  const [activeIndex, setActiveIndex] = useState(initialTab);
  const tabWidths = [86, 141, 110];

  // Calculate left position based on sum of previous widths
  const leftPosition =
    tabWidths.slice(0, activeIndex).reduce((acc, w) => acc + w, 0) +
    activeIndex * 4;

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, []);

  const productInfo = productDetails
    ? [
        { label: 'GTIN', value: productDetails.gstin ?? '---' },
        {
          label: 'Net Unit Size',
          value: `${productDetails.netSize} ${
            productDetails.unit === 'Other'
              ? productDetails.customUnit || '---'
              : (productDetails.unit || '---').replace(/_/g, ' ')
          }`,
        },
        { label: 'Internal SKU', value: productDetails.internalSku ?? '---' },
        { label: 'Product Category', value: productDetails.category ?? '---' },
      ]
    : [];

  const handleConfirmDeleteImage = async () => {
    if (!productId) return;

    try {
      showSpinner();
      // const sanitizedInstructions =
      //   productDetails?.recycleInstructions?.map(
      //     ({ _id, ...rest }: any) => rest
      //   ) || [];
      const res = await updateProductImageOrInstructions(productId, {
        image: null,
      });

      if (res.status === 200) {
        setProductDetails((prev: any) => ({
          ...prev,
          image: null,
        }));

        showAlert(SUCCESS_MESSAGES.IMAGE_DELETED_SUCCESSFULLY, 'success');
        setShowDeleteImageModal(false);
      } else {
        showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_IMAGE, 'danger');
      }
      setShowDeleteImageModal(false);
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'ViewProductDetails',
          method: 'handleConfirmDeleteImage',
          productId,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_IMAGE, 'danger');
    } finally {
      hideSpinner();
    }
  };

  const handleNavigateToAddService = () => {
    const currentProductId = productDetails?._id || '';
    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${currentProductId}${ROUTES.COMPONENT.BASE}/new`
    );
  };

  const normalizedProductDetails = productDetails
    ? {
        ...productDetails,
        recycleInstructions:
          productDetails.recycleInstructions?.map(
            (item: any, index: number) => ({
              _id: item._id || String(index),
              component: item.component,
              instructions: item.instructions,
              image: item.image || '',
            })
          ) || [],
      }
    : null;

  const handleCopyConsumerUrl = async (suppressAlert = false) => {
    if (!productDetails || !productDetails.gstin) return;

    const normalizedGtin = String(productDetails.gstin).trim();
    const url = `${window.location.origin}/01/${normalizedGtin}`;
    try {
      await navigator.clipboard.writeText(url);
      if (!suppressAlert) {
        showAlert(SUCCESS_MESSAGES.CONSUMER_URL_COPIED_SUCCESSFULLY);
      }
    } catch {
      showAlert(ERROR_MESSAGES.FAILED_TO_COPY_CONSUMER_URL, 'danger');
    }
  };

  const handlePublishUnpublish = async (
    category: ImpactCategoryType,
    currentPublishedState: boolean,
    suppressAlert = false
  ) => {
    if (!productId) return;

    try {
      setPublishingCategories((prev) => new Set(prev).add(category));
      showSpinner();
      await patchImpactCategoryPublish(
        productId,
        category,
        !currentPublishedState
      );
      await fetchImpactSummary(productId, false);
      await fetchProductDetails(productId, false);
      if (!suppressAlert) {
        const successMessage = currentPublishedState
          ? SUCCESS_MESSAGES.UNPUBLISH_IMPACT_CATEGORY_SUCCESSFULLY
          : SUCCESS_MESSAGES.PUBLISH_IMPACT_CATEGORY_SUCCESSFULLY;
        showAlert(successMessage, 'success');
      }
    } catch (err) {
      Bugsnag.notify(err as Error, (event) => {
        event.addMetadata('context', {
          component: 'ViewProductDetails',
          method: 'handlePublishUnpublish',
          productId,
          category,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_PUBLISH_IMPACT_CATEGORY, 'danger');
    } finally {
      hideSpinner();
      setPublishingCategories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
    }
  };

  const handlePublishAndCopyUrl = async () => {
    if (!productId || !publishActionRef.current) return;

    try {
      showSpinner();
      await publishActionRef.current();
      if (!productDetails?.isPubliclyAccessible) {
        await handleCopyConsumerUrl(true);
      }
      if (!productDetails?.isPubliclyAccessible) {
        showAlert(
          SUCCESS_MESSAGES.PUBLISH_IMPACT_CATEGORY_AND_COPY_URL_SUCCESSFULLY,
          'success'
        );
      } else {
        showAlert(
          SUCCESS_MESSAGES.PUBLISH_IMPACT_CATEGORY_SUCCESSFULLY,
          'success'
        );
      }
      await fetchImpactSummary(productId, false);
      await fetchProductDetails(productId, false);
    } catch (err) {
      Bugsnag.notify(err as Error, (event) => {
        event.addMetadata('context', {
          component: 'ViewProductDetails',
          method: 'handlePublishAndCopyUrl',
          productId,
        });
      });
      showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
    } finally {
      hideSpinner();
      publishActionRef.current = null;
      setShowPublishConfirmModal(false);
    }
  };

  const computeCardState = (
    productPublishStatus: string,
    impactValue: ImpactValue | undefined
  ): ImpactCategoryCardState => {
    if (impactValue?.isDataInputInProgress === true) {
      return ImpactCategoryCardState.IN_PROGRESS;
    }

    // No data: Only possible when there is no component added - product status pending
    if (productPublishStatus === 'pending') {
      return ImpactCategoryCardState.NO_DATA;
    }

    if (!impactValue) {
      return ImpactCategoryCardState.NO_DATA;
    }

    // No impact (great news): isImpactPresent === false
    if (impactValue.isImpactPresent === false) {
      return ImpactCategoryCardState.NO_IMPACT;
    }

    // In progress: isImpactPresent === true, value === 0
    if (impactValue.isImpactPresent === true && impactValue.value === 0) {
      return ImpactCategoryCardState.IN_PROGRESS;
    }

    // Normal: isImpactPresent === true, value !== 0 (can be negative like -12)
    if (impactValue.isImpactPresent === true && impactValue.value !== 0) {
      return ImpactCategoryCardState.GENERAL;
    }

    return ImpactCategoryCardState.NO_DATA;
  };

  const buildAverageComparisonFromBenchmark = (
    value: number | undefined,
    benchmarkValue: number | undefined
  ): string | undefined => {
    if (
      value == null ||
      benchmarkValue == null ||
      !Number.isFinite(benchmarkValue) ||
      benchmarkValue === 0
    ) {
      return undefined;
    }

    const deltaPercent = ((value - benchmarkValue) / benchmarkValue) * 100;
    const rounded = Math.round(deltaPercent);

    if (rounded === 0) return '0% Similar';
    return `${Math.abs(rounded)}% ${rounded > 0 ? 'More' : 'Less'}`;
  };

  const getProgressModel = (
    averageComparison: string | undefined,
    categoryType: ImpactCategoryType
  ) => {
    if (!averageComparison) {
      return { progressValue: undefined, progressLabel: undefined };
    }

    const comparisonReferenceName = impactSummary?.productCategory ?? '';

    const parsed = parseAverageComparison(
      averageComparison,
      categoryType === 'carbon'
        ? 'Carbon'
        : categoryType === 'water'
          ? 'Water'
          : 'Land',
      comparisonReferenceName
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
        referenceName: comparisonReferenceName,
        cardColor: parsed.cardColor,
      } as const,
    };
  };

  const buildCtaConfig = (
    category: ImpactCategoryType,
    isCategoryPublished: boolean,
    isPublishing: boolean,
    canPublish: boolean
  ): CtaConfig | CtaConfig[] | undefined => {
    if (isPublishing) {
      if (isCategoryPublished) {
        return [
          { type: 'ternary-button', label: 'Unpublish', onClick: () => {} },
          { type: 'secondary-button', label: 'Published', disabled: true },
        ];
      }
      return {
        type: 'primary-button',
        label: 'Publish Impact Category',
        onClick: () => {},
        disabled: true,
      };
    }

    if (isCategoryPublished) {
      return [
        {
          type: 'ternary-button',
          label: 'Unpublish',
          onClick: () => handlePublishUnpublish(category, true),
        },
        { type: 'secondary-button', label: 'Published' },
      ];
    }

    if (canPublish) {
      return {
        type: 'primary-button',
        label: 'Publish Impact Category',
        onClick: () => {
          publishActionRef.current = () =>
            handlePublishUnpublish(category, false, true);
          if (!productDetails?.isPubliclyAccessible) {
            setShowPublishConfirmModal(true);
          } else {
            handlePublishAndCopyUrl();
          }
        },
      };
    }

    return {
      type: 'secondary-button',
      label: 'Publish Impact Category',
      disabled: true,
    };
  };

  const buildCardProps = (
    category: ImpactCategoryType,
    impactValue: ImpactValue | undefined,
    productPublishStatus: string,
    isCategoryPublished: boolean,
    canPublish: boolean,
    averageComparison: string | undefined
  ): ImpactCategoryCardProps => {
    const cardState = computeCardState(productPublishStatus, impactValue);
    const isPublishing = publishingCategories.has(category);
    const progress = getProgressModel(averageComparison, category);
    const cta = buildCtaConfig(
      category,
      isCategoryPublished,
      isPublishing,
      canPublish
    );

    const baseProps = {
      categoryType: category,
      source: 'product' as const,
      cta,
    };

    switch (cardState) {
      case ImpactCategoryCardState.NO_DATA:
        return {
          ...baseProps,
          cardState: ImpactCategoryCardState.NO_DATA,
        };

      case ImpactCategoryCardState.NO_IMPACT:
        return {
          ...baseProps,
          cardState: ImpactCategoryCardState.NO_IMPACT,
        };

      case ImpactCategoryCardState.IN_PROGRESS:
        return {
          ...baseProps,
          cardState: ImpactCategoryCardState.IN_PROGRESS,
          impactValue: impactValue?.value,
          impactUnit: impactValue?.unit,
        };

      case ImpactCategoryCardState.GENERAL:
        return {
          ...baseProps,
          cardState: ImpactCategoryCardState.GENERAL,
          general: {
            impactValue: impactValue?.value ?? 0,
            impactUnit: impactValue?.unit,
            progressValue: progress.progressValue,
            progressLabel: progress.progressLabel,
            isTemporaryData: false,
          },
        };

      default:
        return {
          ...baseProps,
          cardState: ImpactCategoryCardState.NO_DATA,
        };
    }
  };

  return (
    <>
      <div>
        <div className={styles.headerWrapper}>
          <div
            className={styles.btnWrapper}
            onClick={() => navigate('/company-dashboard/products')}
          >
            <button className={styles.backBtn}>
              <IoIosArrowBack className={styles.backIcon} />
            </button>
            Products
          </div>
        </div>

        <div className={styles.Wrapper}>
          <div className={styles.contentWrapper}>
            <div className={styles.productDetailsWrapper}>
              <div className={styles.productProgressWrapper}>
                <h1>Product Details Progress</h1>
                <div className={styles.stepperContainer}>
                  <div className={styles.steps}>
                    {STEP_NAMES.map((label, index) => {
                      const stepNumber = index + 1;

                      const isCompleted =
                        (stepNumber === 1 && stepStatus.step1) ||
                        (stepNumber === 2 && stepStatus.step2) ||
                        (stepNumber === 3 && stepStatus.step3) ||
                        (stepNumber === 4 && stepStatus.step4);

                      const isActive = stepNumber === activeStep;

                      return (
                        <React.Fragment key={index}>
                          <span
                            className={`${styles.stepText}
          ${isCompleted ? styles.completedStep : ''}
          ${isActive ? styles.activeStep : ''}`}
                          >
                            {label}
                          </span>

                          {index !== STEP_NAMES.length - 1 && (
                            <span
                              className={`${styles.dot} ${
                                isCompleted ? styles.activeDot : ''
                              }`}
                            >
                              •
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className={styles.progressContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="51"
                      height="24"
                      viewBox="0 0 51 24"
                      fill="none"
                      className={styles.progress}
                    >
                      <path
                        d="
        M25.2 1.3
        H39.17
        C44.67 1.3 49.14 5.93 49.14 11.64
        C49.14 17.35 44.67 21.98 39.17 21.98
        H11.26
        C5.76 21.98 1.29 17.35 1.29 11.64
        C1.29 5.93 5.76 1.3 11.26 1.3
        H25.2
        Z"
                        stroke="#E1EAE7"
                        strokeWidth="2.586"
                        fill="none"
                      />

                      <path
                        ref={pathRef}
                        style={{
                          strokeDasharray: pathLength,
                          strokeDashoffset:
                            pathLength * (1 - progressPercent / 100),
                          // transition: 'stroke-dashoffset 0.4s ease',
                          transition: 'none',
                        }}
                        className={styles.progressFill}
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M25.2 1.3
    H39.17
    C44.67 1.3 49.14 5.93 49.14 11.64
    C49.14 17.35 44.67 21.98 39.17 21.98
    H11.26
    C5.76 21.98 1.29 17.35 1.29 11.64
    C1.29 5.93 5.76 1.3 11.26 1.3
    H25.2
    Z"
                        stroke="#E1EAE7"
                        strokeWidth="2.58628"
                      />
                    </svg>
                    <div className={styles.progressBox}>{progressPercent}%</div>
                  </div>
                </div>
              </div>

              <div className={styles.productInfo}>
                {loading ? (
                  <SkeletonLoader type="productProfile" />
                ) : (
                  <>
                    <div className={styles.productTitleWrapper}>
                      <div className={styles.prodImgWrapper}>
                        <div className={styles.imgContainer}>
                          <img
                            src={
                              productDetails?.image
                                ? `${import.meta.env.VITE_AWS_BUCKET_BASE_URL}/${productDetails.image}`
                                : defaultImg
                            }
                            alt="productImg"
                            width="60"
                            height="60"
                            style={{ borderRadius: '53.097px' }}
                          />
                          {productDetails?.image && (
                            <button
                              className={styles.deleteIcon}
                              onClick={() => setShowDeleteImageModal(true)}
                            >
                              <img
                                src={trash}
                                alt="deleteIcon"
                                className={styles.deleteIconImg}
                              />
                            </button>
                          )}
                        </div>
                        <div className={styles.productNameWrapper}>
                          <Tooltip
                            text={productDetails?.name}
                            className={styles.productName}
                          />
                          {(productDetails?.isPubliclyAccessible ?? false) && (
                            <button
                              type="button"
                              className={styles.consumerUrl}
                              onClick={() => handleCopyConsumerUrl()}
                            >
                              <img
                                src={link}
                                alt="link"
                                width="14"
                                height="14"
                              />{' '}
                              <span> Consumer URL</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={styles.btnWrapper}>
                        <button
                          className={styles.editBtn}
                          onClick={() => setShowEditProductModal(true)}
                        >
                          {' '}
                          <BiEditAlt
                            style={{ width: '16px', height: '16px' }}
                          />{' '}
                          Edit
                        </button>

                        <button
                          className={styles.addBtn}
                          onClick={handleNavigateToAddService}
                        >
                          <span>+</span>
                          {hasSuppliers
                            ? 'Add component or service'
                            : 'Add Your First Component or Service'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.productInfoWrapper}>
                      {productInfo.map((info, index) => (
                        <div className={styles.productInfoItem} key={index}>
                          <div className={styles.label}>
                            {info.label}
                            {info.label === 'GTIN' && (
                              <Tooltip
                                text={TOOLTIP_TEXT.GTIN}
                                noTruncate
                                position="left"
                              >
                                <img
                                  src={infoIcon}
                                  alt="info"
                                  className={styles.infoIcon}
                                  width={12}
                                  height={12}
                                  style={{
                                    verticalAlign: 'baseline',
                                    marginTop: '2px',
                                    cursor: 'pointer',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {info.label === 'Internal SKU' && (
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
                                  style={{
                                    verticalAlign: 'baseline',
                                    marginTop: '2px',
                                    cursor: 'pointer',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </div>

                          <div className={styles.value}>{info.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className={styles.impactCategoriesWrapper}>
              <div className={styles.impactCateWrap}>
                <h2>Impact Categories for This Product </h2>
                <StatusBadge
                  status={mapApiStatusToDisplayStatusForProduct(
                    impactSummary?.publishStatus ??
                      productDetails?.publishStatus ??
                      'pending'
                  )}
                  hideAddButton={true}
                />
              </div>

              <div className={styles.categoryWrapper}>
                {(['carbon', 'water', 'land'] as ImpactCategoryType[]).map(
                  (category) => {
                    const impactValue = impactSummary?.impactSummary[category];
                    const benchmarkValue =
                      impactSummary?.impactBenchMarking?.[category];
                    const averageComparison =
                      impactValue?.averageComparison ??
                      buildAverageComparisonFromBenchmark(
                        impactValue?.value,
                        benchmarkValue
                      );
                    const productPublishStatus =
                      impactSummary?.publishStatus ??
                      productDetails?.publishStatus ??
                      'pending';
                    const isCategoryPublished =
                      impactSummary?.impactCategoryPublishStatus[category] ??
                      false;
                    const canPublish = impactValue?.canPublish ?? false;

                    const cardProps = buildCardProps(
                      category,
                      impactValue,
                      productPublishStatus,
                      isCategoryPublished,
                      canPublish,
                      averageComparison
                    );

                    return <ImpactCategoryCard key={category} {...cardProps} />;
                  }
                )}
              </div>
            </div>

            <div className={styles.tabsWrapper}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <div className={styles.tabs}>
                  <div
                    className={styles.slider}
                    style={{
                      width: tabWidths[activeIndex],
                      transform: `translateX(${leftPosition}px)`,
                    }}
                  />
                  {['Suppliers', 'Product Requests', 'Supply Chain'].map(
                    (tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveIndex(index)}
                        style={{ width: tabWidths[index] }}
                        className={`${styles.tab} ${activeIndex === index ? styles.active : ''}`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
                {activeIndex === 0 && hasSuppliers && (
                  <button
                    className={styles.componentBtn}
                    onClick={handleNavigateToAddService}
                  >
                    <span>+</span>Add component or service
                  </button>
                )}
              </div>

              <div className={styles.tabContentWrapper}>
                {activeIndex === 0 && (
                  <SupplierTab
                    handleNavigateToAddService={handleNavigateToAddService}
                    productId={productId}
                    onDataLoaded={(dataLength: number) =>
                      setHasSuppliers(dataLength > 0)
                    }
                    ondeleteComponent={() => {
                      fetchImpactSummary(productId!);
                    }}
                  />
                )}

                {activeIndex === 1 && (
                  <ProductRequestsTab productId={productId ?? ''} />
                )}
                {activeIndex === 2 && <SupplyChainTab />}
              </div>
            </div>
            <div className={styles.howToRecycleWrapper}>
              <div className={styles.howToRecycleTitleWrap}>
                <div className={styles.howToRecycleTitle}>
                  <h2>
                    <img src={IMG1} alt="img1" />
                    How to Recycle
                  </h2>

                  <p>
                    Add up to 10 instructions to guide consumers on how to
                    recycle or dispose of your product responsibly
                  </p>
                </div>
              </div>

              {loading || !productDetails?.recycleInstructions ? (
                <SkeletonLoader type="recycleInstructions" />
              ) : (
                <HowToRecycle
                  productDetails={normalizedProductDetails}
                  setProductDetails={setProductDetails}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showDeleteImageModal && (
        <div className={styles.modalWrapper}>
          <CommonModal
            icon={deleteIcon}
            title="Are you sure you want to delete this image?"
            message="This action will permanently remove the image from the product. This action cannot be undone"
            cancelText="Cancel"
            confirmText="Delete"
            onCancel={() => setShowDeleteImageModal(false)}
            onConfirm={handleConfirmDeleteImage}
            confirmBtnClass={styles.removeButton}
          />
        </div>
      )}
      {showPublishConfirmModal && (
        <CommonModal
          icon={circleCheckIcon}
          title="Confirm Impact Category Publication"
          message="You are about to publish this impact category. Once published, Its value and comparison to the industry average will be visible to your customers. Make sure to copy the URL and link it to your GS1 barcode so customers can access it"
          cancelText="Cancel"
          confirmText="Publish & Copy URL"
          onCancel={() => {
            publishActionRef.current = null;
            setShowPublishConfirmModal(false);
          }}
          onConfirm={handlePublishAndCopyUrl}
        />
      )}
      {showEditProductModal && productId && (
        <AddProductModal
          isOpen={showEditProductModal}
          onClose={() => setShowEditProductModal(false)}
          onSuccess={() => fetchProductDetails(productId)}
          mode="edit"
          productDetails={productDetails}
          productId={productId}
          setProductDetails={setProductDetails}
        />
      )}
    </>
  );
};

export default ViewProductDetails;
