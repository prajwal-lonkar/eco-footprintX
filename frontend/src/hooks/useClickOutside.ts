import { useEffect } from 'react';
import type { RefObject } from 'react';

interface UseClickOutsideOptions {
  refs: RefObject<HTMLElement | null>[];
  isOpen: boolean;
  onClose: () => void;
}

export const useClickOutside = ({
  refs,
  isOpen,
  onClose,
}: UseClickOutsideOptions): void => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = refs.every(
        (ref) => !ref.current || !ref.current.contains(event.target as Node),
      );
      if (clickedOutside) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, isOpen, onClose]);
};

interface UnitHook {
  dropdownRef: RefObject<HTMLElement | null>;
  wrapperRef: RefObject<HTMLElement | null>;
  showDropdown: boolean;
  closeDropdown: () => void;
}

export const useMultipleClickOutside = (unitHooks: UnitHook[]): void => {
  useEffect(() => {
    const cleanupFunctions: Array<() => void> = [];

    unitHooks.forEach((unitHook) => {
      if (!unitHook.showDropdown) return;

      const handleClickOutside = (event: MouseEvent) => {
        const clickedOutside =
          (!unitHook.dropdownRef.current ||
            !unitHook.dropdownRef.current.contains(event.target as Node)) &&
          (!unitHook.wrapperRef.current ||
            !unitHook.wrapperRef.current.contains(event.target as Node));

        if (clickedOutside) {
          unitHook.closeDropdown();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      cleanupFunctions.push(() => {
        document.removeEventListener('mousedown', handleClickOutside);
      });
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [unitHooks]);
};

