import { memo, useEffect, useState } from 'react';
import styles from './Summary.module.scss';
import parentStyles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow.module.scss';
import { getImpactCategorySummary } from '@service/built-enviromental-profile.service';
import { useParams } from 'react-router-dom';
import {
  ImpactCategoryCard,
  ImpactCategoryCardState,
  type ImpactCategoryCardProps,
  type ImpactCategoryType,
} from '@common/ImpactCategoryCard';
import type { ImpactSummary } from '@type/built-enviromental-profile';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { parseAverageComparison } from '@utils/parseAverageComparision';

interface SummaryProps {
  onPrevious: () => void;
  onExit: () => void;
}

const getProgressModel = (
  raw: string | undefined,
  categoryType: ImpactCategoryType,
  componentName?: string
) => {
  const parsed = parseAverageComparison(
    raw,
    categoryType.charAt(0).toUpperCase() + categoryType.slice(1),
    componentName
  );

  if (!parsed || parsed.noBenchmark) {
    return {
      progressValue: undefined,
      progressLabel: undefined,
    };
  }

  return {
    progressValue: parsed.dotPosition,
    progressLabel: {
      category: categoryType,
      percentage: parsed.percentage,
      comparison: parsed.comparison,
      referenceName: componentName || 'component or service',
      cardColor: parsed.cardColor,
    },
  };
};

const Summary = memo(({ onPrevious, onExit }: SummaryProps) => {
  const { componentId, roleSlug } = useParams();

  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [hasVersioning, setHasVersioning] = useState(false);
  const [originalSummary, setOriginalSummary] = useState<ImpactSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const { showSpinner, hideSpinner } = useSpinnerStore();
  const componentName = useBuiltEnvironmentalProfileFlowStore(
    (s) => s.componentDetails?.name
  );
  const fetchSummary = async () => {
    setLoading(true);
    showSpinner();

    try {
      const res = await getImpactCategorySummary(componentId!, roleSlug!);

      const normalizeImpact = (impact: any, type: ImpactCategoryType) => {
        if (!impact) return undefined;
        return {
          dataSource: impact.dataSource,
          presentableDataSource: impact.presentableDataSource,
          quantity: impact.presentableQuantity ?? null,
          unit:
            impact.presentableUnit ??
            (type === 'carbon'
              ? 'kg CO₂-eq/unit'
              : type === 'water'
                ? 'm³/unit'
                : 'm²/unit'),
          lciaMethodology: impact.presentableLciaMethodology ?? null,
          isRequested: impact.isRequested,
          isImpactPresent:
            impact.presentableIsImpactpresent ??
            impact.presentableIsImpactPresent ??
            impact.isImpactPresent,
          offsetCarbonImpact: impact.offsetCarbonImpact,
          offsetQuantity: impact.offsetQuantity,
          averageComparison: impact.averageComparison,
        };
      };

      const normalizeSummary = (
        apiData: any,
        isVersioned: boolean
      ): ImpactSummary => ({
        carbon: normalizeImpact(
          isVersioned
            ? (apiData?.toBeSubmittedCategories?.carbon ?? apiData?.carbon)
            : apiData?.carbon,
          'carbon'
        ),
        water: normalizeImpact(
          isVersioned
            ? (apiData?.toBeSubmittedCategories?.water ?? apiData?.water)
            : apiData?.water,
          'water'
        ),
        land: normalizeImpact(
          isVersioned
            ? (apiData?.toBeSubmittedCategories?.land ?? apiData?.land)
            : apiData?.land,
          'land'
        ),
      });

      const normalizeOriginalSummary = (apiData: any): ImpactSummary => ({
        carbon: normalizeImpact(apiData?.originalCategories?.carbon, 'carbon'),
        water: normalizeImpact(apiData?.originalCategories?.water, 'water'),
        land: normalizeImpact(apiData?.originalCategories?.land, 'land'),
      });

      if (res.statusCode === 201 || res.statusCode === 200) {
        const isVersioned = res.data.hasVersioning === true;
        setSummary(normalizeSummary(res.data, isVersioned));
        setHasVersioning(isVersioned);
        setOriginalSummary(normalizeOriginalSummary(res.data));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      hideSpinner();
    }
  };
  useEffect(() => {
    fetchSummary();
  }, [componentId, roleSlug]);

  const hasFilledDataForCategory = (
    key: 'carbon' | 'water' | 'land',
    data: NonNullable<ImpactSummary[typeof key]>
  ): boolean => {
    if (key === 'carbon') {
      const carbon = data as ImpactSummary['carbon'];
      return (
        (carbon?.dataSource != null && carbon?.dataSource !== '') ||
        carbon?.quantity != null ||
        (carbon?.offsetCarbonImpact === true && carbon?.offsetQuantity != null)
      );
    }
    const waterLand = data as ImpactSummary['water'];
    return (
      waterLand?.isImpactPresent === false ||
      (waterLand?.presentableDataSource != null &&
        waterLand?.presentableDataSource !== '') ||
      waterLand?.quantity != null
    );
  };

  const getCategoryKeys = (summaryData: ImpactSummary | null) =>
    (['carbon', 'water', 'land'] as const).filter((key) => {
      const data = summaryData?.[key];
      if (!data) return false;
      if (hasVersioning) {
        return hasFilledDataForCategory(key, data);
      }
      return true;
    });

  const renderSummaryGrid = (
    summaryData: ImpactSummary | null,
    inAccordion = false
  ) => {
    if (!summaryData) return null;
    const keys = getCategoryKeys(summaryData);

    return (
      <div
        className={`${styles.summaryWrapper} ${inAccordion ? styles.summaryWrapperInAccordion : ''}`}
      >
        {keys.map((key) => {
          const data = summaryData?.[key];
          if (!data) return null;

          const carbonData = key === 'carbon' ? summaryData.carbon : null;

          const hasCarbonOffset =
            summaryData?.carbon?.offsetCarbonImpact === true &&
            summaryData?.carbon?.offsetQuantity != null;

          const resolvedQuantity = data.quantity ?? null;
          const resolvedUnit = data.unit ?? undefined;
          const resolvedLciaMethod = data.lciaMethodology ?? undefined;
          const resolvedDataSource = data.presentableDataSource;
          const hasAnyTemporaryData =
            summaryData &&
            (['carbon', 'water', 'land'] as const).some((key) => {
              const d = summaryData[key];
              if (!d) return false;
              const source = (d.presentableDataSource ?? '').toLowerCase();
              return (
                source === 'temporary data' ||
                source === 'supplier' ||
                source === 'requested from supplier'
              );
            });

          const resolvedDataSourceLower = (
            resolvedDataSource ?? ''
          ).toLowerCase();
          const isTemporaryCard =
            resolvedDataSourceLower === 'temporary data' ||
            resolvedDataSourceLower === 'supplier';
          const reserveTemporaryDataSpace =
            hasAnyTemporaryData && !isTemporaryCard;
          const progress = getProgressModel(
            data.averageComparison,
            key,
            componentName
          );

          if (data.isImpactPresent === false) {
            const noImpactCard: ImpactCategoryCardProps = {
              categoryType: key,
              source: 'component',
              cardState: ImpactCategoryCardState.NO_IMPACT,
            };
            return <ImpactCategoryCard key={key} {...noImpactCard} />;
          }
          const isAwaitingSubmission = (impact: any) => {
            const hasPresentableData =
              impact.quantity != null && impact.lciaMethodology != null;
            const source = (impact.presentableDataSource ?? '').toLowerCase();

            return (
              impact.isRequested === true &&
              !hasPresentableData &&
              source === 'requested data'
            );
          };
          if (isAwaitingSubmission(data)) {
            const awaitingCard: ImpactCategoryCardProps = {
              categoryType: key,
              source: 'component',
              cardState: ImpactCategoryCardState.IN_PROGRESS,
              impactValue: resolvedQuantity ?? undefined,
              impactUnit: resolvedUnit ?? undefined,
              dataSource: 'Requested Data',
            };
            return <ImpactCategoryCard key={key} {...awaitingCard} />;
          }

          const normalCard: ImpactCategoryCardProps = {
            categoryType: key,
            source: 'component',
            cardState: ImpactCategoryCardState.GENERAL,
            general: {
              impactValue: resolvedQuantity ?? '----',
              impactUnit: resolvedUnit ?? undefined,
              lciaMethod: resolvedLciaMethod || '----',
              dataSource: resolvedDataSource,
              progressValue: progress.progressValue,
              progressLabel: progress.progressLabel,
              isTemporaryData: isTemporaryCard,
              reserveTemporaryDataSpace,
              offsetCarbonImpact:
                key === 'carbon' ? carbonData?.offsetCarbonImpact : undefined,
              offsetQuantity:
                key === 'carbon' ? carbonData?.offsetQuantity : undefined,
              reserveOffsetSpace: hasCarbonOffset && key !== 'carbon',
            },
          };
          return <ImpactCategoryCard key={key} {...normalCard} />;
        })}
      </div>
    );
  };

  return (
    <div className={parentStyles.container}>
      <div className={styles.content}>
        {!loading && (
          <>
            <div className={parentStyles.contentFrame}>
              <div className={styles.header}>
                <h2 className={parentStyles.pageTitle}>Summary</h2>
                <p className={parentStyles.helperText}>
                  Please review the details you've provided. If everything looks
                  correct, proceed to complete the built environmental profile.
                </p>

                <p
                  className={`${parentStyles.helperText} ${styles.helperText}`}
                >
                  You will see the submitted values, the selected LCIA
                  methodology, and the data source used for each category:
                  Carbon, Water, and Land
                </p>
              </div>
            </div>

            {summary && (
              <>
                {hasVersioning ? (
                  <div className={styles.versionedContainer}>
                    <div className={styles.versionedSection}>
                      <h3 className={styles.versionedSectionTitle}>
                        Original Impact Categories Submitted
                      </h3>
                      {renderSummaryGrid(originalSummary, true)}
                    </div>

                    <div className={styles.versionedSection}>
                      <h3 className={styles.versionedSectionTitle}>
                        New Impact Categories To Be Submitted
                      </h3>
                      {renderSummaryGrid(summary, true)}
                    </div>
                  </div>
                ) : (
                  renderSummaryGrid(summary)
                )}
                <div className={parentStyles.footerActions}>
                  <button
                    className={parentStyles.secondaryButton}
                    onClick={onPrevious}
                  >
                    Go Back
                  </button>
                  <button
                    className={parentStyles.primaryButton}
                    onClick={onExit}
                  >
                    Complete and Exit
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;
