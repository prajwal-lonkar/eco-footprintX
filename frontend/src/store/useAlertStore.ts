import { create } from 'zustand';

interface AlertState {
  visible: boolean;
  variant: 'success' | 'danger';
  message: string;
  linkText?: string;
  linkHref?: string;
  showAlert: (
    message: string,
    variant?: AlertState['variant'],
    linkText?: string,
    linkHref?: string
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  variant: 'success',
  message: '',
  linkText: undefined,
  linkHref: undefined,
  showAlert: (message, variant = 'success', linkText, linkHref) => {
    set({
      visible: true,
      message,
      variant,
      linkText,
      linkHref,
    });
  },
  hideAlert: () => {
    set({ visible: false });
  },
}));
