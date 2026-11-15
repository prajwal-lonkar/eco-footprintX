import React from 'react';
import styles from './FeatureComingSoonModal.module.scss';

import icon from '@assets/images/logoImg.svg';
interface Props {
  
  title: string;
  message: React.ReactNode;
  goBackBtnText: string;
  GoBack: () => void;
}
const FeatureComingSoonModal: React.FC<Props> = ({
  title,
  message,
  goBackBtnText,
  GoBack,
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

        <button className={styles.goBackBtn} onClick={GoBack}>
          {goBackBtnText}
        </button>
      </div>
    </div>
  );
};

export default FeatureComingSoonModal;
