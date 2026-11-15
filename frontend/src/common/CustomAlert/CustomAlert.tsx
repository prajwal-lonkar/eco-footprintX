import { useEffect } from 'react';
import { useAlertStore } from '@store/useAlertStore';
import CircleCheckIcon from '@assets/icons/circle-check.svg';
import CircleXIcon from '@assets/icons/circle-x.svg';
import styles from './CustomAlert.module.scss';

const CustomAlert = () => {
  const { visible, variant, message, linkText, linkHref, hideAlert } =
    useAlertStore();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, hideAlert]);

  if (!visible) return null;

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return CircleCheckIcon;
      case 'danger':
        return CircleXIcon;
      default:
        return CircleCheckIcon;
    }
  };

  const variantClass = variant === 'success' ? styles.success : styles.danger;

  return (
    <div className={styles.alertContainer}>
      <div className={`${styles.banner} ${variantClass}`}>
        <div className={styles.content}>
          <div className={styles.artworkFrame}>
            <img src={getIcon()} alt={variant} className={styles.icon} />
          </div>
          <div className={styles.textFrame}>
            <p className={styles.message}>
              {message}{' '}
              {linkText && linkHref && (
                <a href={linkHref} className={styles.link}>
                  {linkText}
                </a>
              )}
            </p>
          </div>
          <button
            className={styles.closeButton}
            onClick={hideAlert}
            aria-label="Close alert"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.closeIcon}
            >
              <path
                d="M17.5831 4.25028L15.7498 2.41699L9.99982 8.25033L4.2498 2.41699L2.4165 4.25028L8.24984 10.0003L2.4165 15.7503L4.2498 17.5836L9.99982 11.7503L15.7498 17.5836L17.5831 15.7503L11.7498 10.0003L17.5831 4.25028Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
