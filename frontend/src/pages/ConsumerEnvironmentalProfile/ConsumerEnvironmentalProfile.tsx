import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import styles from "./ConsumerEnvironmentalProfile.module.scss";

import logo from "@assets/images/envProfileLogo.svg";
import IMG1 from "@assets/images/howtorecycle.svg";
import infoIconGreen from "@assets/icons/infoIcon-geen.svg";

import SkeletonLoader from "@common/SkeletonLoader/SkeletonLoader";
import { ERROR_MESSAGES } from "@constants/messages";
import { TOOLTIP_TEXT } from "@constants/tooltips";
import { useAlertStore } from "@store/useAlertStore";

import {
  type ImpactCategoryType,
  type ImpactValue,
  type ImpactProgressLabel,
} from "@common/ImpactCategoryCard";
import {
  getIndustryAveragePercentage,
  mapComparisonFromPercentage,
  getDotPositionFromPercentage,
} from "@common/ImpactCategoryCard/utils/canculateIndustryAverage";
import ConsumerImpactCategoryCard, {
  ConsumerImpactCardState,
  type ConsumerImpactCategoryCardProps,
} from "../ConsumerImpactCategoryCard";

import type { ImpactCategories } from "@type/supplier";
import type {
  ConsumerImpactSummary,
  ImpactBenchMarking,
} from "@type/consumer-environmental-profile";
import { getConsumerEnvironmentalProfile } from "@service/consumer-environmental-profile.service";

import Bugsnag from "@utils/bugsnag";

interface RecycleInstruction {
  component: string;
  instructions: string;
  _id: string;
}

interface ProductData {
  _id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  recycleInstructions: RecycleInstruction[];
  publishStatus: string;
  impactSummary?: ConsumerImpactSummary;
  impactCategoryPublishStatus?: ImpactCategories;
  impactBenchMarking?: ImpactBenchMarking;
}

const IMPACT_CATEGORIES: ImpactCategoryType[] = ["carbon", "water", "land"];

const computeCardState = (
  impactValue: ImpactValue,
): ConsumerImpactCardState => {
  if (impactValue.isImpactPresent === false) {
    return ConsumerImpactCardState.NO_IMPACT;
  }
  return ConsumerImpactCardState.GENERAL;
};

const buildImpactValue = (metric: any): ImpactValue => ({
  value: metric.value,
  unit: metric.unit,
  isImpactPresent: metric.isImpactPresent,
});

const ConsumerEnvironmentalProfile = () => {
  const { showAlert } = useAlertStore();
  const { gtin } = useParams<{ gtin: string }>();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapApiProduct = useCallback((apiProduct: any): ProductData => {
    return {
      _id: apiProduct._id,
      name: apiProduct.name,
      category: apiProduct.category ?? "",
      description: apiProduct.description,
      image: apiProduct.image,
      recycleInstructions: apiProduct.recycleInstructions ?? [],
      publishStatus: apiProduct.publishStatus,
      impactSummary: apiProduct.impactSummary,
      impactCategoryPublishStatus: apiProduct.impactCategoryPublishStatus,
      impactBenchMarking: apiProduct.impactBenchMarking,
    };
  }, []);

  const fetchProduct = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        if (!gtin) {
          setProduct(null);
          showAlert(ERROR_MESSAGES.INVALID_GTIN, "danger");
          return;
        }

        const res = await getConsumerEnvironmentalProfile(gtin);

        if (res.success && res.data) {
          const mappedProduct = mapApiProduct(res.data);
          setProduct(mappedProduct);
          return;
        }

        setProduct(null);
        showAlert(ERROR_MESSAGES.FAILED_TO_FAITCH_PRODUCT, "danger");
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata("context", {
            component: "ConsumerEnvironmentalProfile",
            method: "fetchProduct",
            gtin,
          });
        });

        showAlert(ERROR_MESSAGES.FAILED_TO_FAITCH_PRODUCT, "danger");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [mapApiProduct, gtin, showAlert],
  );

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const hasNoData =
    !product?.image &&
    !product?.description &&
    !((product?.recycleInstructions?.length ?? 0) > 0);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchProduct(true);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchProduct]);

  const renderNoImpact = () => (
    <div className={`${styles.noImpactWrapper} ${styles.noImpactFullWidth}`}>
      <h2 className={styles.noImpactTitle}>No Impact Details</h2>
      <p className={styles.noImpactSubTitle}>
        There are no impact details provided for this product.
      </p>
    </div>
  );

  const buildCardProps = useCallback(
    (category: ImpactCategoryType): ConsumerImpactCategoryCardProps | null => {
      const metric = product?.impactSummary?.[category];
      if (!metric) return null;

      const impactValue = buildImpactValue(metric);
      const cardState = computeCardState(impactValue);

      const baseProps = {
        categoryType: category,
      };

      if (cardState === ConsumerImpactCardState.NO_IMPACT) {
        return {
          ...baseProps,
          cardState: ConsumerImpactCardState.NO_IMPACT,
        };
      }

      let progressValue: number | undefined;
      let progressLabel: ImpactProgressLabel | undefined;

      const benchmarkValue = product?.impactBenchMarking?.[category];
      const actualValue = metric.value;

      if (benchmarkValue != null && actualValue != null) {
        const percentage = getIndustryAveragePercentage(
          benchmarkValue,
          actualValue,
        );
        const comparison = mapComparisonFromPercentage(percentage);
        progressValue = getDotPositionFromPercentage(percentage);
        const cardColor =
          percentage < 0 ? "green" : percentage > 0 ? "red" : "yellow";
        progressLabel = {
          category,
          percentage: Math.abs(percentage),
          comparison,
          referenceName: product?.category || "",
          cardColor,
        };
      }

      const isIndustryDataSource = metric.dataSource === "database";
      const tooltip = isIndustryDataSource
        ? TOOLTIP_TEXT.INDUSTRY_DATA_SOURCE
        : undefined;
      const tooltipIcon = isIndustryDataSource ? infoIconGreen : undefined;

      return {
        ...baseProps,
        cardState: ConsumerImpactCardState.GENERAL,
        general: {
          impactValue: impactValue.value,
          impactUnit: impactValue.unit,
          progressValue,
          progressLabel,
        },
        tooltip,
        tooltipIcon,
      };
    },
    [product],
  );

  const renderImpactCards = () => {
    if (!product?.impactCategoryPublishStatus) return renderNoImpact();

    const publishedCategories = IMPACT_CATEGORIES.filter(
      (category) =>
        product.impactCategoryPublishStatus?.[category] &&
        product.impactSummary?.[category],
    );

    if (publishedCategories.length === 0) return renderNoImpact();

    return publishedCategories.map((category) => {
      const cardProps = buildCardProps(category);
      if (!cardProps) return null;

      return <ConsumerImpactCategoryCard key={category} {...cardProps} />;
    });
  };

  const renderRecycleSteps = () => {
    if ((product?.recycleInstructions?.length as any) > 0) {
      return (
        <ul className={styles.recycleSteps}>
          {product?.recycleInstructions.map((step: any, idx: number) => (
            <li key={step._id}>
              <span>{String(idx + 1).padStart(2, "0")}</span>
              <div className={styles.stepsWrap}>
                <p className={styles.stepTitle}>{step.component}</p>
                <p className={styles.stepSubTitle}>{step.instructions}</p>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className={styles.noImpactWrapper}>
        <h2 className={styles.noImpactTitle}>No Instructions</h2>
        <p className={styles.noImpactSubTitle}>
          There are no recycling instruction details provided for this product
        </p>
      </div>
    );
  };

  return (
    <>
      <div
        className={`${styles.mobileVector} ${hasNoData ? styles.mobileVectorNodata : ""}`}
      />

      <div
        className={`${styles.wrapper} ${
          hasNoData ? styles.noDataBackground : ""
        }`}
      >
        <div className={styles.headerWrapper}>
          <div className={styles.headerTitleWrap}>
            <img src={logo} alt="logo" />
            <p className={styles.title}>Eco FootprintX</p>
          </div>
        </div>

        <div className={styles.horizontalLine} />

        <div className={styles.container}>
          {isLoading ? (
            <SkeletonLoader type="consumerProductProfile" />
          ) : (
            <>
              {/* LEFT CARD */}
              {product?.image && (
                <div className={styles.productCardWrapper}>
                  <>
                    <div className={styles.productCard}>
                      <div className={styles.imageWrapper}>
                        <img
                          src={`${import.meta.env.VITE_AWS_BUCKET_BASE_URL}/${product?.image}`}
                          alt="Product Image"
                        />
                      </div>
                    </div>
                    <p className={styles.cardNoteDesktop}>
                      All environmental impact data shown is based on globally
                      recognised standards for measuring a product’s footprint
                    </p>
                  </>
                </div>
              )}

              <p className={styles.cardNoteMobile}>
                All environmental impact data shown is based on globally
                recognised standards for measuring a product’s footprint
              </p>

              {/* RIGHT CONTENT */}
              <div
                className={`${styles.scrollbarWrapper} ${
                  !product?.image ? styles.fullWidthDetails : ""
                }`}
              >
                <div className={styles.details}>
                  <div className={styles.infoWrapper}>
                    <div className={styles.detailsWrapper}>
                      <h2>{product?.name}</h2>

                      <p
                        className={
                          product?.description
                            ? styles.subtitle
                            : styles.noSubTitle
                        }
                      >
                        {product?.description}
                      </p>
                    </div>

                    {/* Environmental Impact */}
                    <div className={styles.environmentalImpactWrapper}>
                      <div className={styles.impactHeader}>
                        <div>
                          <h3>Environment Impact</h3>
                          <p>
                            Below is the impact of this product on the
                            environment
                          </p>
                        </div>

                        <img src={logo} alt="logo" width="32" height="32" />
                      </div>

                      <div className={styles.impactGrid}>
                        {renderImpactCards()}
                      </div>
                    </div>
                  </div>

                  {/* Recycling */}
                  <div className={styles.howToRecycleSection}>
                    <div className={styles.titleWrapper}>
                      <h2>
                        <img src={IMG1} alt="img1" width="24" height="24" />
                        How to Recycle
                      </h2>

                      <p>
                        Follow these instructions for easy and efficient
                        recycling.
                      </p>
                    </div>

                    {renderRecycleSteps()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ConsumerEnvironmentalProfile;
