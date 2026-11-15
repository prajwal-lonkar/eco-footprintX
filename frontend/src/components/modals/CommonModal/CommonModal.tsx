import React from 'react';
import styles from './CommonModal.module.scss';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';

interface CommonModalProps {
  icon: string;
  title: string;
  message: React.ReactNode;
  cancelText?: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;

  confirmBtnClass?: string;
  cancelBtnClass?: string;
  confirmLoading?: boolean;
}
//For Logout,Discard Changes
const CommonModal: React.FC<CommonModalProps> = ({
  icon,
  title,
  message,
  cancelText = 'Cancel',
  confirmText,
  onCancel,
  onConfirm,
  confirmBtnClass = '',
  cancelBtnClass = '',
  confirmLoading = false,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.subContent}>
            <img src={icon} alt="icon" className={styles.logo} />
            <h2>{title}</h2>
          </div>

          <p>{message}</p>
        </div>

        <div className={styles.btnWrapper}>
          <button
            className={`${styles.cancelBtn} ${cancelBtnClass}`}
            onClick={onCancel}
            disabled={confirmLoading}
          >
            {cancelText}
          </button>

          <button
            className={`${styles.confirmBtn} ${confirmBtnClass}`}
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? <SpinnerLoader inline={true} /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommonModal;
