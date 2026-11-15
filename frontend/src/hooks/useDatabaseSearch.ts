/**
 * Shared hook for "Use our Database" search logic.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  getResultColumnsForRole,
  buildDatabaseSearchParams,
  mapApiResponseToTableRows,
} from '@constants/databaseSearchUtils';
import type { ImpactCategory } from '@constants/databaseSearchUtils';
import { getIndustryBenchmarkingData } from '@service/built-enviromental-profile.service';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';
import Bugsnag from '@utils/bugsnag';
import type {
  ImpactDatabaseSearchResultRow,
  SearchDatabaseFormData,
} from '@type/built-enviromental-profile';

export const SEARCH_RESULTS_PAGE_SIZE = 10;

type SearchStatus = 'idle' | 'no-results' | 'error';

export interface UseDatabaseSearchOptions {
  supplierRoleSlug: string;
  impactType: ImpactCategory;
  /** Component name for Bugsnag error reporting */
  componentName: string;
  onSearchStatusChange?: (status: SearchStatus) => void;
}

export function useDatabaseSearch({
  supplierRoleSlug,
  impactType,
  componentName,
  onSearchStatusChange,
}: UseDatabaseSearchOptions) {
  const [results, setResults] = useState<ImpactDatabaseSearchResultRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [lastSearchedFormData, setLastSearchedFormData] =
    useState<SearchDatabaseFormData | null>(null);

  // pagination state
  const [skip, setSkip] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const { showSpinner, hideSpinner } = useSpinnerStore();
  const resetImpactCategorySearchDatabaseFormData =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.resetImpactCategorySearchDatabaseFormData
    );
  const getImpactCategorySearchDatabaseFormData =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.getImpactCategorySearchDatabaseFormData
    );
  const setImpactCategorySearchDatabaseFormData =
    useBuiltEnvironmentalProfileFlowStore(
      (s) => s.setImpactCategorySearchDatabaseFormData
    );

  const resultColumns = useMemo(
    () => getResultColumnsForRole(supplierRoleSlug),
    [supplierRoleSlug]
  );

  const handleSearch = useCallback(
    async (formDataFromSearch: SearchDatabaseFormData, pageSkip = 0) => {
      setSearchStatus('idle');
      if (pageSkip === 0) {
        setSelectedRowId(null);
      }

      const apiParams = buildDatabaseSearchParams(
        formDataFromSearch,
        supplierRoleSlug
      );
      const lciaMethod = (formDataFromSearch.lciaMethodology || '').trim();

      if (!apiParams || !lciaMethod) {
        setResults([]);
        setSearchStatus('no-results');
        setLastSearchedFormData(formDataFromSearch);
        onSearchStatusChange?.('no-results');
        return;
      }

      showSpinner();
      try {
        const response = await getIndustryBenchmarkingData(supplierRoleSlug, {
          ...apiParams,
          skip: pageSkip,
          limit: SEARCH_RESULTS_PAGE_SIZE,
        });

        if (response.success && response.data) {
          const apiData = response.data;

          setTotalCount(apiData.count ?? 0);
          setSkip(pageSkip);

          const mapped = mapApiResponseToTableRows(
            apiData.result || [],
            supplierRoleSlug,
            lciaMethod,
            impactType
          );
          setResults(mapped);
          if (mapped.length === 0) {
            setSearchStatus('no-results');
            onSearchStatusChange?.('no-results');
          } else {
            onSearchStatusChange?.('idle');
          }
        } else {
          setResults([]);
          setSearchStatus('no-results');
          onSearchStatusChange?.('no-results');
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: componentName,
            method: 'handleSearch',
            supplierRoleSlug,
            apiParams,
          });
        });
        setResults([]);
        setSearchStatus('error');
        onSearchStatusChange?.('error');
      } finally {
        hideSpinner();
        setLastSearchedFormData(formDataFromSearch);
      }
    },
    [
      supplierRoleSlug,
      impactType,
      componentName,
      showSpinner,
      hideSpinner,
      onSearchStatusChange,
    ]
  );

  /** Navigate to a different page — re-fetches from the API. */
  const handlePageChange = useCallback(
    (newSkip: number) => {
      if (!lastSearchedFormData) return;
      if (newSkip < 0 || newSkip >= totalCount) return;
      handleSearch(lastSearchedFormData, newSkip);
    },
    [lastSearchedFormData, totalCount, handleSearch]
  );

  /** Reset only local search state (used when switching tabs/data source). */
  const resetSearch = useCallback(() => {
    setResults([]);
    setSelectedRowId(null);
    setSkip(0);
    setTotalCount(0);
    setSearchStatus('idle');
    setLastSearchedFormData(null);
  }, []);

  /** Explicitly clear stored search filters for the current role+impact key. */
  const clearStoredSearchDatabaseFormData = useCallback(() => {
    if (!supplierRoleSlug) return;
    resetImpactCategorySearchDatabaseFormData(supplierRoleSlug);
  }, [supplierRoleSlug, resetImpactCategorySearchDatabaseFormData]);

  const getStoredSearchDatabaseFormData = useCallback(() => {
    if (!supplierRoleSlug) {
      return getImpactCategorySearchDatabaseFormData(undefined);
    }
    return getImpactCategorySearchDatabaseFormData(supplierRoleSlug);
  }, [supplierRoleSlug, getImpactCategorySearchDatabaseFormData]);

  const setStoredSearchDatabaseFormData = useCallback(
    (formData: SearchDatabaseFormData) => {
      if (!supplierRoleSlug) return;
      setImpactCategorySearchDatabaseFormData(supplierRoleSlug, formData);
    },
    [supplierRoleSlug, setImpactCategorySearchDatabaseFormData]
  );

  return {
    results,
    setResults,
    selectedRowId,
    setSelectedRowId,
    skip,
    totalCount,
    searchStatus,
    lastSearchedFormData,
    handleSearch,
    handlePageChange,
    resultColumns,

    paginatedResults: results,
    resetSearch,

    getStoredSearchDatabaseFormData,
    setStoredSearchDatabaseFormData,
    clearStoredSearchDatabaseFormData,
  };
}
