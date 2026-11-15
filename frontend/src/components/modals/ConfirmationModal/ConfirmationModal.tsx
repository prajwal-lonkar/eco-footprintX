import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import styles from './ConfirmationModal.module.scss';

import CircleXIcon from '@assets/icons/circle-x.svg';
import CircleCheckIcon from '@assets/icons/circle-check.svg';
import InfoIcon from '@assets/icons/info-icon.svg';

type ModalVariant = 'info' | 'success' | 'error' | 'warning';

interface ConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  message: string;
  variant?: ModalVariant;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  centered?: boolean;
  backdrop?: 'static' | true | false;
  icon?: string;
}

const ConfirmationModal = ({
  show,
  onHide,
  title,
  message,
  variant = 'info',
  showCancelButton = true,
  confirmText = 'Ok',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  centered = true,
  backdrop = 'static',
  icon,
}: ConfirmationModalProps) => {
  const handleConfirm = () => {
    onConfirm?.();
    onHide();
  };

  const handleCancel = () => {
    onCancel?.();
    onHide();
  };

  const getDefaultIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'error':
        return CircleXIcon;
      case 'success':
        return CircleCheckIcon;
      case 'info':
      case 'warning':
      default:
        return InfoIcon;
    }
  };

  const confirmButton = (
    <Button
      onClick={handleConfirm}
      className={styles.confirmButton}
      aria-label={confirmText}
    >
      {confirmText}
    </Button>
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop={backdrop}
      keyboard={false}
      dialogClassName={`${styles.confirmationModal} ${styles[`variant-${variant}`]}`}
      centered={centered}
    >
      <div className={styles.modalContent}>
        <div className={styles.contentFrame}>
          <div className={styles.titleRow}>
            <img src={getDefaultIcon()} alt="" className={styles.icon} />
            <h2 className={styles.title}>{title}</h2>
          </div>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.actions}>
          {showCancelButton && (
            <Button
              onClick={handleCancel}
              className={styles.cancelButton}
              aria-label={cancelText}
            >
              {cancelText}
            </Button>
          )}
          {confirmButton}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;

