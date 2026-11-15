import React from 'react';
import styles from './RestrictedUser.module.scss';

interface RestrictedUserProps {
  goToStep: (stepNumber: number) => void;
}
const RestrictedUser: React.FC<RestrictedUserProps> = ({ goToStep }) => {
  const handleClick = () => {
    goToStep(1);
  };
  const platformURL = import.meta.env.VITE_PLATFORM_URL;
  return (
    <div className={styles.step}>
      <div className={styles.restrictedUserWrapper}>
        <h1 className={styles.restrictedUserTitle}>Sorry, Access Restricted</h1>
        <p>
          Sorry, access to this platform is currently restricted to a closed
          group of users.{' '}
        </p>
        <p>
          To learn more about the platform, visit &nbsp;
          <a href={platformURL} target="_blank" rel="noopener noreferrer">
            ecofootprintx.tech
          </a>
        </p>
      </div>
      <button onClick={handleClick}>Go Back</button>
    </div>
  );
};

export default RestrictedUser;
