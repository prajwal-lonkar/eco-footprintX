import CheckmarkIcon from '@assets/icons/checkmark.svg';
import XIcon from '@assets/icons/x.svg';
import styles from './PasswordRequirements.module.scss';

interface Requirements {
  minLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

interface PasswordRequirementsProps {
  requirements: Requirements | null;
}

const PasswordRequirements = ({ requirements }: PasswordRequirementsProps) => (
  <>
    <p className={styles.requirementsTitle}>Password Requirements</p>
    <div className={styles.requirementsList}>
      <div className={styles.requirementItem}>
        <img
          src={requirements?.minLength ? CheckmarkIcon : XIcon}
          alt={requirements?.minLength ? 'Valid' : 'Invalid'}
          className={styles.icon}
        />
        <p className={styles.text}>At least 12 characters</p>
      </div>
      <div className={styles.requirementItem}>
        <img
          src={requirements?.hasUpperLower ? CheckmarkIcon : XIcon}
          alt={requirements?.hasUpperLower ? 'Valid' : 'Invalid'}
          className={styles.icon}
        />
        <p className={styles.text}>Mix of uppercase and lowercase letters</p>
      </div>
      <div className={styles.requirementItem}>
        <img
          src={requirements?.hasNumber ? CheckmarkIcon : XIcon}
          alt={requirements?.hasNumber ? 'Valid' : 'Invalid'}
          className={styles.icon}
        />
        <p className={styles.text}>At least one number</p>
      </div>
      <div className={styles.requirementItem}>
        <img
          src={requirements?.hasSymbol ? CheckmarkIcon : XIcon}
          alt={requirements?.hasSymbol ? 'Valid' : 'Invalid'}
          className={styles.icon}
        />
        <p className={styles.text}>At least one symbol</p>
      </div>
    </div>
  </>
);

export default PasswordRequirements;
