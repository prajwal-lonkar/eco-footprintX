import { memo, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import styles from './AddIndustryBenchmarking.module.scss';
import parentStyles from '../../BuiltEnviromentalProfileFlow.module.scss';
import { SearchDatabaseComponent } from './SearchDatabaseComponent/SearchDatabaseComponent';
import { SearchResultsTableComponent } from './SearchResultsTableComponent/SearchResultsTableComponent';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import { useShallow } from 'zustand/react/shallow';

import CommonModal from '@components/modals/CommonModal/CommonModal';
import warningIcon from '@assets/icons/warning.svg';
import {
  getIndustryBenchmarkingData,
  saveIndustryBenchmarkingData,
  getIndustryBenchmarkingDetails,
} from '@service/built-enviromental-profile.service';
import type {
  IndustryBenchmarkingResultItem,
  SaveIndustryBenchmarkingPayload,
  BenchmarkingAuditQueryParams,
  IndustryBenchmarkingSearchParams,
  BenchmarkingAuditItem,
} from '@type/built-enviromental-profile';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import Bugsnag from '@utils/bugsnag';
import { ERROR_MESSAGES } from '@constants/messages';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import type { SearchDatabaseFormData } from '@type/built-enviromental-profile';

interface AddIndustryBenchmarkingProps {
  onNext: () => void;
  onPrevious: () => void;
  handleRedirectToComponentDetails: () => void;
  detailsCard: React.ReactNode;
}

const normalizeFormDataForSignature = (
  formData: SearchDatabaseFormData | null
): SearchDatabaseFormData | null => {
  if (!formData) return null;

  return {
    componentName: formData.componentName.trim(),
    supplierLocation: formData.supplierLocation.trim(),
    transportMethod: formData.transportMethod.trim(),
    transportRegion: formData.transportRegion.trim(),
    lciaMethodology: formData.lciaMethodology.trim(),
    casNumber: formData.casNumber.trim(),
    industry: formData.industry.trim(),
  };
};

const getBenchmarkingSignature = (
  formData: SearchDatabaseFormData | null,
  selectedIds: string[]
) =>
  JSON.stringify({
    formData: normalizeFormDataForSignature(formData),
    selectedIds: Array.from(new Set(selectedIds)).sort(),
  });

const AddIndustryBenchmarking = memo(({ onNext, onPrevious, handleRedirectToComponentDetails, detailsCard }: AddIndustryBenchmarkingProps) => {
  const {
    componentId,
    selectedRole,
    setAudit,
    setSearchDatabaseFormData,
    consumeBenchmarkingResetBySupplierDetails,
    setImpactCategorySearchResetByBenchmarking,
  } = useBuiltEnvironmentalProfileFlowStore(
    useShallow((s) => ({
      componentId: s.componentId,
      selectedRole: s.selectedRole,
      setAudit: s.setAudit,
      setSearchDatabaseFormData: s.setSearchDatabaseFormData,
      consumeBenchmarkingResetBySupplierDetails:
        s.consumeBenchmarkingResetBySupplierDetails,
      setImpactCategorySearchResetByBenchmarking:
        s.setImpactCategorySearchResetByBenchmarking,
    })),
  );

  const [searchResults, setSearchResults] = useState<IndustryBenchmarkingResultItem[]>([]);
  const [wasResetBySupplierDetails, setWasResetBySupplierDetails] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Keep selection global for the active search session instead of deriving from the current page.
  const [selectedById, setSelectedById] = useState<Map<string, IndustryBenchmarkingResultItem>>(
    new Map<string, IndustryBenchmarkingResultItem>(),
  );
  const resultsByIdRef = useRef<Map<string, IndustryBenchmarkingResultItem>>(
    new Map<string, IndustryBenchmarkingResultItem>(),
  );
  const [showProceedWithoutBenchmarkingModal, setShowProceedWithoutBenchmarkingModal] = useState(false);
  const [lastSearchedFormData, setLastSearchedFormData] = useState<SearchDatabaseFormData | null>(null);
  const [pendingAction, setPendingAction] = useState<'continue' | 'exit' | null>(null);
  const initialBenchmarkingSignatureRef = useRef<string>(
    getBenchmarkingSignature(null, []),
  );

  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();
  const selectedItemIds = useMemo(
    () => new Set(selectedById.keys()),
    [selectedById],
  );

  const clearSelectionSession = useCallback(() => {
    setSelectedById(new Map<string, IndustryBenchmarkingResultItem>());
    resultsByIdRef.current = new Map<string, IndustryBenchmarkingResultItem>();
  }, []);

  // Unmark selections when search params change (before user re-searches)
  const storedBenchmarkingFormData = useBuiltEnvironmentalProfileFlowStore(
    (s) => s.searchDatabaseFormDataByRole[selectedRole?.supplierRoleSlug ?? ''],
  );

  useEffect(() => {
    if (!lastSearchedFormData || !storedBenchmarkingFormData) return;

    const hasChanged = (
      Object.keys(lastSearchedFormData) as Array<keyof SearchDatabaseFormData>
    ).some(
      (key) => storedBenchmarkingFormData[key] !== lastSearchedFormData[key],
    );

    if (hasChanged && selectedById.size > 0) {
      clearSelectionSession();
    }
  }, [storedBenchmarkingFormData, lastSearchedFormData, selectedById.size, clearSelectionSession]);

  const handleSelectionChange = useCallback((nextSelectedIds: Set<string>) => {
    setSelectedById((prevSelected) => {
      const nextSelected = new Map<string, IndustryBenchmarkingResultItem>();

      nextSelectedIds.forEach((id) => {
        const matchedItem = prevSelected.get(id) ?? resultsByIdRef.current.get(id);
        if (matchedItem) {
          nextSelected.set(id, matchedItem);
        }
      });

      return nextSelected;
    });
  }, []);

  const mapQueryToFormData = useCallback(
    (query: BenchmarkingAuditQueryParams): SearchDatabaseFormData => ({
      componentName: query.componentName || '',
      supplierLocation: query.supplierLocation || '',
      transportMethod: query.transportMethod || '',
      transportRegion: query.transportRegion || '',
      lciaMethodology: query.lciaMethodology || '',
      casNumber: query.casNumber || '',
      industry: query.industry || '',
    }),
    [],
  );

  const hasAnySearchFilterValue = useCallback((formData: SearchDatabaseFormData) => {
    return (Object.keys(formData) as Array<keyof SearchDatabaseFormData>).some(
      (key) => formData[key]?.trim().length > 0,
    );
  }, []);

  const mapAuditResultsToSearchResults = useCallback(
    (
      auditResults: BenchmarkingAuditItem[],
      lciaMethodology: string,
    ): IndustryBenchmarkingResultItem[] => {
      return auditResults.map((item) => ({
        _id: item._id,
        activityName: item.activityName,
        casNumber: item.casNumber,
        geography: item.geography,
        impacts: item.impacts,
        lciaMethod: lciaMethodology,
        referenceProductName: item.referenceProductName,
        cpcClassification: item.cpcClassification || '',
        unit: item.unit,
      }));
    },
    [],
  );

  useEffect(() => {
    const fetchBenchmarkingDetails = async () => {
      const supplierRoleSlug = selectedRole?.supplierRoleSlug;

      if (!componentId || !supplierRoleSlug) {
        return;
      }

      showSpinner();
      try {
        const response = await getIndustryBenchmarkingDetails(
          componentId,
          supplierRoleSlug,
        );
        const benchmarkingContextKey = `${componentId}:${supplierRoleSlug}`;
        const resetTriggeredBySupplierDetails =
          consumeBenchmarkingResetBySupplierDetails(benchmarkingContextKey);

        if (response.success && response.data) {
          const benchmarkingDetails = response.data;
          const audit = benchmarkingDetails.audit;

          if (audit && audit.query && Object.keys(audit.query).length > 0) {
            const query = audit.query;
            const mappedFormData = mapQueryToFormData(query);

            if (!hasAnySearchFilterValue(mappedFormData)) {
              // Some API responses return a query object with empty-string values.
              // Treat that as "no saved query" and keep any locally cached filters intact.
              setAudit(null);
              setSearchResults([]);
              setHasSearched(false);
              clearSelectionSession();
              setLastSearchedFormData(null);
              return;
            }

            setSearchDatabaseFormData(supplierRoleSlug, mappedFormData);
            const loadedSelectedIds = (audit.results ?? []).map((item) => item._id);
            const loadedSignature = getBenchmarkingSignature(
              mappedFormData,
              loadedSelectedIds,
            );

            if (audit.results && audit.results.length > 0) {
              setAudit(audit);
              setLastSearchedFormData(mappedFormData);
              setHasSearched(true);
              // Load results and selected items
              const mappedSearchResults = mapAuditResultsToSearchResults(
                audit.results,
                query.lciaMethodology,
              );
              setSearchResults(mappedSearchResults);
              const cachedResults = new Map<string, IndustryBenchmarkingResultItem>();
              mappedSearchResults.forEach((item) => {
                cachedResults.set(item._id, item);
              });
              resultsByIdRef.current = cachedResults;
              setSelectedById(cachedResults);
              initialBenchmarkingSignatureRef.current = loadedSignature;
            } else {
              // If this empty result came from supplier-details change, reopen as fresh search.
              // Otherwise, preserve normal "No Results Found" state.
              if (resetTriggeredBySupplierDetails) {
                setAudit(null);
                setHasSearched(false);
                setLastSearchedFormData(null);
                setWasResetBySupplierDetails(true);
                initialBenchmarkingSignatureRef.current =
                  getBenchmarkingSignature(null, []);
              } else {
                setAudit(audit);
                setHasSearched(true);
                setLastSearchedFormData(mappedFormData);
                initialBenchmarkingSignatureRef.current = loadedSignature;
              }
              setSearchResults([]);
              setSkip(0);
              setTotalCount(0);
              clearSelectionSession();
            }
          } else {
            // No query data - reset everything
            setAudit(null);
            setSearchResults([]);
            setHasSearched(false);
            setSkip(0);
            setTotalCount(0);
            clearSelectionSession();
            setLastSearchedFormData(null);
            initialBenchmarkingSignatureRef.current =
              getBenchmarkingSignature(null, []);
          }
        } else {
          setAudit(null);
          setSearchResults([]);
          setHasSearched(false);
          setSkip(0);
          setTotalCount(0);
          clearSelectionSession();
          setLastSearchedFormData(null);
          initialBenchmarkingSignatureRef.current =
            getBenchmarkingSignature(null, []);
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddIndustryBenchmarking',
            method: 'fetchBenchmarkingDetails',
            componentId,
            supplierRoleSlug,
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        setAudit(null);
        setSearchResults([]);
        setHasSearched(false);
        setSkip(0);
        setTotalCount(0);
        clearSelectionSession();
        setLastSearchedFormData(null);
        initialBenchmarkingSignatureRef.current =
          getBenchmarkingSignature(null, []);
      } finally {
        hideSpinner();
      }
    };

    void fetchBenchmarkingDetails();
  }, [
    componentId,
    selectedRole?.supplierRoleSlug,
    mapQueryToFormData,
    hasAnySearchFilterValue,
    mapAuditResultsToSearchResults,
    setAudit,
    setSearchDatabaseFormData,
    consumeBenchmarkingResetBySupplierDetails,
    clearSelectionSession,
    showSpinner,
    hideSpinner,
    showAlert,
  ]);

  const buildIndustryBenchmarkApiParams = useCallback(
    (
      formData: SearchDatabaseFormData,
      supplierRoleSlug: string | undefined,
    ): BenchmarkingAuditQueryParams | undefined => {
      if (!supplierRoleSlug) {
        return undefined;
      }

      const lciaMethodology = formData.lciaMethodology;
      const componentName = formData.componentName || '';
      const transportMethod = formData.transportMethod || '';
      const supplierLocation = formData.supplierLocation || '';
      const transportRegion = formData.transportRegion || '';
      const casNumber = formData.casNumber || '';
      const industry = formData.industry || '';

      const baseParams: BenchmarkingAuditQueryParams = {
        lciaMethodology,
      };

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR) {
        baseParams.componentName = componentName;
        if (casNumber) baseParams.casNumber = casNumber;
        if (supplierLocation) baseParams.supplierLocation = supplierLocation;
        if (industry) baseParams.industry = industry;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
        baseParams.transportMethod = transportMethod;
        baseParams.transportRegion = transportRegion;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR) {
        baseParams.componentName = componentName;
        if (supplierLocation) baseParams.supplierLocation = supplierLocation;
        return baseParams;
      }

      if (
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RETAILER ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND
      ) {
        baseParams.supplierLocation = supplierLocation;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
        baseParams.supplierLocation = supplierLocation;
        if (componentName) baseParams.componentName = componentName;
        return baseParams;
      }

      return undefined;
    },
    [],
  );

  const buildIndustryBenchmarkSearchParams = useCallback(
    (
      formData: SearchDatabaseFormData,
      supplierRoleSlug: string | undefined,
    ): IndustryBenchmarkingSearchParams | undefined => {
      if (!supplierRoleSlug) {
        return undefined;
      }

      const lciaMethod = formData.lciaMethodology;
      const referenceProductName =
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
          ? formData.transportMethod || ''
          : formData.componentName || '';
      const geography =
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
          ? formData.transportRegion || ''
          : formData.supplierLocation || '';
      const casNumber = formData.casNumber || '';
      const isicSection = formData.industry || '';

      const baseParams: IndustryBenchmarkingSearchParams = {
        lciaMethod,
      };

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR) {
        baseParams.referenceProductName = referenceProductName;
        if (casNumber) baseParams.casNumber = casNumber;
        if (geography) baseParams.geography = geography;
        if (isicSection) baseParams.isicSection = isicSection;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
        baseParams.referenceProductName = referenceProductName;
        baseParams.geography = geography;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR) {
        baseParams.referenceProductName = referenceProductName;
        if (geography) baseParams.geography = geography;
        return baseParams;
      }

      if (
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.RETAILER ||
        supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CPG_BRAND
      ) {
        baseParams.geography = geography;
        return baseParams;
      }

      if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER) {
        baseParams.geography = geography;
        if (referenceProductName) baseParams.referenceProductName = referenceProductName;
        return baseParams;
      }

      return undefined;
    },
    [],
  );

  const handleSaveBenchmarking = useCallback(
    async (shouldProceed: boolean) => {
      const supplierRoleSlug = selectedRole?.supplierRoleSlug;

      if (!componentId || !supplierRoleSlug || !lastSearchedFormData) {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        return;
      }

      const apiParams = buildIndustryBenchmarkApiParams(
        lastSearchedFormData,
        supplierRoleSlug,
      );

      if (!apiParams) {
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        return;
      }

      // Save all selected rows captured across pages in the current search session.
      const selectedAudits = Array.from(selectedById.values());
      const benchmarkingContextKey = `${componentId}:${supplierRoleSlug}`;
      const currentSignature = getBenchmarkingSignature(
        lastSearchedFormData,
        selectedAudits.map((item) => item._id),
      );
      const hasBenchmarkingChanged =
        currentSignature !== initialBenchmarkingSignatureRef.current;

      const payload: SaveIndustryBenchmarkingPayload =
        selectedById.size === 0
          ? {
              audit: [],
            }
          : {
              audit: selectedAudits,
            };

      setImpactCategorySearchResetByBenchmarking(benchmarkingContextKey, false);
      showSpinner();
      try {
        const response = await saveIndustryBenchmarkingData(
          componentId,
          supplierRoleSlug,
          payload,
          apiParams,
        );

        if (response.success && response.statusCode === 200) {
          setImpactCategorySearchResetByBenchmarking(
            benchmarkingContextKey,
            hasBenchmarkingChanged,
          );
          initialBenchmarkingSignatureRef.current = currentSignature;
          if (shouldProceed) {
            onNext();
          } else {
            handleRedirectToComponentDetails();
          }
        } else {
          showAlert(
            ERROR_MESSAGES.FAILED_TO_SAVE_INDUSTRY_BENCHMARKING_DATA,
            'danger',
          );
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddIndustryBenchmarking',
            method: 'handleSaveBenchmarking',
            componentId,
            supplierRoleSlug,
          });
        });
        showAlert(
          ERROR_MESSAGES.FAILED_TO_SAVE_INDUSTRY_BENCHMARKING_DATA,
          'danger',
        );
      } finally {
        hideSpinner();
      }
    },
    [
      componentId,
      handleRedirectToComponentDetails,
      hideSpinner,
      lastSearchedFormData,
      onNext,
      selectedById,
      selectedRole,
      setImpactCategorySearchResetByBenchmarking,
      showAlert,
      showSpinner,
    ],
  );

  const handleSearch = async (formData: SearchDatabaseFormData, pageSkip = 0, isNewSearch = false) => {
    const supplierRoleSlug = selectedRole?.supplierRoleSlug;

    if (isNewSearch) {
      // Explicit Search button submit starts a new search session.
      clearSelectionSession();
    }

    if (!supplierRoleSlug) {
      showAlert(
        ERROR_MESSAGES.UNEXPECTED_ERROR,
        'danger'
      );
      setHasSearched(true);
      setLastSearchedFormData(formData);
      clearSelectionSession();
      setSearchResults([]);
      return;
    }

    const searchParams = buildIndustryBenchmarkSearchParams(
      formData,
      supplierRoleSlug,
    );

    if (!searchParams) {
      setSearchResults([]);
      setHasSearched(true);
      setLastSearchedFormData(formData);
      clearSelectionSession();
      return;
    }

    showSpinner();
    try {
      const response = await getIndustryBenchmarkingData(
        supplierRoleSlug,
        {
          ...searchParams,
          skip: pageSkip,
          limit
        }
      );

      if (response.success && response.data) {
        const apiData = response.data;

        setTotalCount(apiData.count);
        setSkip(pageSkip);
        const items: IndustryBenchmarkingResultItem[] = (apiData?.result || []).map((item) => ({
          ...item,
          lciaMethod: Object.keys(item.impacts)[0] || searchParams.lciaMethod,
        }));
        items.forEach((item) => {
          resultsByIdRef.current.set(item._id, item);
        });
        setSelectedById((prevSelected) => {
          if (prevSelected.size === 0) {
            return prevSelected;
          }

          let hasChanges = false;
          const nextSelected = new Map(prevSelected);

          items.forEach((item) => {
            if (nextSelected.has(item._id) && nextSelected.get(item._id) !== item) {
              nextSelected.set(item._id, item);
              hasChanges = true;
            }
          });

          return hasChanges ? nextSelected : prevSelected;
        });
        setSearchResults(items);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'AddIndustryBenchmarking',
          method: 'handleSearch',
          supplierRoleSlug,
          searchParams,
        });
      });
      setSearchResults([]);
      showAlert(ERROR_MESSAGES.FAILED_TO_FETCH_INDUSTRY_BENCHMARKING_DATA, 'danger');
    } finally {
      hideSpinner();
      setHasSearched(true);
      setLastSearchedFormData(formData);
    }
  };

  // Controls button state based on search results and selection
  const canProceed = useMemo(() => {
    if (!hasSearched) return false;
    
    if (searchResults.length === 0) return true;
    
    // Show confirmation modal if nothing is selected
    return true;
  }, [hasSearched, searchResults.length]);

  const handleSaveAndContinue = () => {
    // Show modal if results found but none selected or no results found
    if (hasSearched && selectedById.size === 0) {
      setPendingAction('continue');
      setShowProceedWithoutBenchmarkingModal(true);
      return;
    }

    // Proceed if items are selected
    if (hasSearched && selectedById.size > 0) {
      void handleSaveBenchmarking(true);
      return;
    }
    
    // Fallback safety check
    onNext();
  };

  const handlePageChange = (newSkip: number) => {
    if (!lastSearchedFormData) return;
  
    if (newSkip < 0 || newSkip >= totalCount) return;
  
    handleSearch(lastSearchedFormData, newSkip, false);
  };

  const handleNewSearch = (formData: SearchDatabaseFormData, pageSkip = 0) => {
    handleSearch(formData, pageSkip, true);
  };

  const handleSaveAndExit = () => {
    // Show modal if results found but none selected or no results found
    if (hasSearched && selectedById.size === 0) {
      setPendingAction('exit');
      setShowProceedWithoutBenchmarkingModal(true);
      return;
    }

    // Proceed if items are selected
    if (hasSearched && selectedById.size > 0) {
      void handleSaveBenchmarking(false);
      return;
    }
    
    // Fallback safety check
    handleRedirectToComponentDetails();
  };

  return (
    <>
      <div className={parentStyles.container}>
      <div className={styles.content}>
        <div className={parentStyles.contentFrame}>
          <div className={parentStyles.header}>
            <h2 className={parentStyles.pageTitle}>Add Industry Benchmarking Data</h2>
            <p className={parentStyles.helperText}>
              Identify similar components or services in your industry to compare the environmental impact of your component or service against industry averages
            </p>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.componentDetailsContainer}>
            <div className={parentStyles.childcontent}>
              {detailsCard}
            </div>
            <div className={styles.searchDatabaseHeader}>
              <h3>Search Database</h3>
              <p>Search our database to find a component and activity that closely matches your supplier's role in your supply chain. This will be used to benchmark your component or service's impact category data against industry averages</p>
            </div>
          </div>

            <SearchDatabaseComponent
              supplierRoleSlug={selectedRole?.supplierRoleSlug}
              onSearch={handleNewSearch}
              lastSearchedFormData={lastSearchedFormData}
              disableSearchOnMount={!wasResetBySupplierDetails}
            />
            <SearchResultsTableComponent
              searchResults={searchResults}
              hasSearched={hasSearched}
              selectedItems={selectedItemIds}
              onSelectionChange={handleSelectionChange}
              supplierRoleSlug={selectedRole?.supplierRoleSlug}
              skip={skip}
              limit={limit}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
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
            onClick={handleSaveAndExit}
            disabled={!canProceed}
          >
            Save and Exit
          </button>
          <button
            type="button"
            className={parentStyles.primaryButton}
            onClick={handleSaveAndContinue}
            disabled={!canProceed}
          >
            Save &amp; Continue
          </button>
        </div>
      </div>
    </div>

    {showProceedWithoutBenchmarkingModal && (
    <CommonModal
      icon={warningIcon}
      title="Proceed Without Benchmarking Data"
      message="By not selecting any comparable component or service, you will not be able to benchmark your component or service's impact category data against industry averages"
      cancelText="Go Back"
      confirmText="Proceed"
      onCancel={() => {
        setShowProceedWithoutBenchmarkingModal(false);
        setPendingAction(null);
      }}
      onConfirm={async () => {
        const shouldProceed = pendingAction === 'continue';
        await handleSaveBenchmarking(shouldProceed);
        setShowProceedWithoutBenchmarkingModal(false);
        setPendingAction(null);
      }}
    />
    )}
    </>
  );
});

AddIndustryBenchmarking.displayName = 'AddIndustryBenchmarking';

export default AddIndustryBenchmarking;
