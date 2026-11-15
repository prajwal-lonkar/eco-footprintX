import { create } from 'zustand';

/**
 * Spinner state management store
 * Controls the visibility and display mode of the global SpinnerLoader component
 *
 * @example
 * // Show spinner (fullscreen by default)
 * const { showSpinner, hideSpinner } = useSpinnerStore();
 * showSpinner();
 *
 * // Show spinner in inline mode
 * showSpinner(true);
 *
 * // Hide spinner
 * hideSpinner();
 */
interface SpinnerState {
  visible: boolean;
  inline: boolean;
  showSpinner: (inline?: boolean) => void;
  hideSpinner: () => void;
}

export const useSpinnerStore = create<SpinnerState>((set) => ({
  visible: false,
  inline: false,
  showSpinner: (inline = false) => {
    set({
      visible: true,
      inline,
    });
  },
  hideSpinner: () => {
    set({ visible: false });
  },
}));

