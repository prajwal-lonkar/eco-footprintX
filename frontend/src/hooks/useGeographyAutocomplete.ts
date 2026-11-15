import { useState, useRef, useEffect, useCallback } from 'react';
import { useClickOutside } from './useClickOutside';
import { getGeographies } from '@service/geography.service';
import type { Geography } from '@type/geography';
import { useSpinnerStore } from '@store/useSpinnerStore';

interface UseGeographyAutocompleteOptions {
  value: string;
  onSelect: (geography: string) => void;
  debounceMs?: number;
}

interface UseGeographyAutocompleteReturn {
  predictions: Geography[];
  showResults: boolean;
  isLoading: boolean;
  searchCompleted: boolean;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  handleInputChange: (value: string) => void;
  handleInputFocus: () => void;
  handleGeographySelect: (geography: string) => void;
}

export const useGeographyAutocomplete = ({
  value,
  onSelect,
  debounceMs = 500,
}: UseGeographyAutocompleteOptions): UseGeographyAutocompleteReturn => {
  const [predictions, setPredictions] = useState<Geography[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { showSpinner, hideSpinner } = useSpinnerStore();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isSettingFromSelectionRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  const fetchGeographies = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 1) {
        setPredictions([]);
        setShowResults(false);
        setSearchCompleted(false);
        return;
      }

      setSearchCompleted(false);
      setIsSearching(true);
      showSpinner(true);
      try {
        const response = await getGeographies(trimmed);
        if (response.success && response.data) {
          setPredictions(response.data);
          if (hasUserInteractedRef.current) {
            setShowResults(true);
          }
        } else {
          setPredictions([]);
        }
      } catch (error) {
        setPredictions([]);
        console.error('Error fetching geographies:', error);
      } finally {
        setSearchCompleted(true);
        setIsSearching(false);
        hideSpinner();
      }
    },
    [showSpinner, hideSpinner],
  );

  useEffect(() => {
    if (isSettingFromSelectionRef.current) return;
    if (value.trim().length > 0 && !hasUserInteractedRef.current) return;

    if (value.trim().length > 0) {
      setIsSearching(true);
      setSearchCompleted(false);
    }

    const timer = setTimeout(() => {
      fetchGeographies(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, fetchGeographies, debounceMs]);

  useClickOutside({
    refs: [wrapperRef],
    isOpen: showResults,
    onClose: () => setShowResults(false),
  });

  const handleInputChange = useCallback((newValue: string) => {
    isSettingFromSelectionRef.current = false;
    hasUserInteractedRef.current = true;
    onSelect(newValue);

    if (!newValue.trim()) {
      setShowResults(false);
      setPredictions([]);
      setSearchCompleted(false);
      setIsSearching(false);
    } else {
      setShowResults(true);
      setSearchCompleted(false);
      setIsSearching(true);
    }
  }, [onSelect]);

  const handleInputFocus = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (value.trim().length >= 1) {
      setShowResults(true);
    }
  }, [value]);

  const handleGeographySelect = useCallback(
    (geography: string) => {
      isSettingFromSelectionRef.current = true;
      onSelect(geography);
      setShowResults(false);
      setPredictions([]);
      setTimeout(() => {
        isSettingFromSelectionRef.current = false;
      }, 100);
    },
    [onSelect],
  );

  return {
    predictions,
    showResults,
    isLoading: isSearching,
    searchCompleted,
    wrapperRef,
    handleInputChange,
    handleInputFocus,
    handleGeographySelect,
  };
};
