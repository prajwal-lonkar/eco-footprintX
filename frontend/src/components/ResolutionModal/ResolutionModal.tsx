import React, { useEffect, useState } from 'react';
import styles from './ResolutionModal.module.scss';

import logoImg from '@assets/images/logoImg.svg';

const ResolutionModal: React.FC = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1280);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1280);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isSmallScreen) return;

    // Only show once per session on this device
    const modalShown = sessionStorage.getItem('resolution-modal-shown');

    if (!modalShown) {
      setShowModal(true);
      sessionStorage.setItem('resolution-modal-shown', 'true');
    }
  }, [isSmallScreen]);

  // Disable scrolling and resizing interactions while modal is open
  useEffect(() => {
    if (showModal && isSmallScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
      return () => {
    document.body.style.overflow = '';
  };
  }, [showModal,isSmallScreen]);

  if (!showModal) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <img src={logoImg} alt="Logo" className={styles.logo} />
          <div className={styles.subContent}>
            <h2>Recommended Resolution</h2>
            <p>
              Your screen resolution is below the recommended width for optimal
              viewing. For the best experience, please access the platform on a
              larger screen or adjust your window size.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(false)}
          className={styles.closeButton}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ResolutionModal;

