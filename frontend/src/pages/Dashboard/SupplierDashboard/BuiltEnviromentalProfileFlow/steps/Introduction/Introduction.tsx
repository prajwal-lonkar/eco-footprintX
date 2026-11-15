import { memo } from 'react';
import styles from './Introduction.module.scss';
import parentStyles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow.module.scss';

interface IntroductionProps {
  onRedirectToProductDetails?: () => void;
  onProceed?: () => void | Promise<void>;
  requestedBy?: string;
}

const Introduction = memo(
  ({
    onRedirectToProductDetails,
    onProceed,
    requestedBy,
  }: IntroductionProps) => {
    const handleProceed = onProceed;
    return (
      <div className={parentStyles.container}>
        <div className={parentStyles.header}>
          <h2 className={parentStyles.pageTitle}>Introduction</h2>
        </div>

        <div className={styles.card}>
          <div className={styles.headerWrapper}>
            <h3 className={styles.title}>Overview</h3>
            <p className={styles.description}>
              In this section, you will need to provide data for your component
              or service across the impact categories requested by{' '}
              <span className={styles.requestedBy}>{requestedBy ?? '-'}</span>.
            </p>
          </div>

          <div className={styles.contentWrapper}>
            <h3>
              You can do this by selecting one of the following data sources:
            </h3>
            <ol className={styles.list}>
              <li>Enter the data manually</li>
              <li>
                Use our database to select impact category data from a
                comparable component or service in your industry
              </li>
            </ol>

            <div className={styles.note}>
              If your component or service has no impact in a particular
              category, you can mark it as “No Impact”
              <p className={styles.note}>
                — no data input will be required for that category.
              </p>
            </div>
          </div>
        </div>

        <div className={parentStyles.footerActions}>
          <button
            type="button"
            className={parentStyles.secondaryButton}
            onClick={onRedirectToProductDetails}
          >
            Go Back
          </button>
          <button
            type="button"
            className={parentStyles.primaryButton}
            onClick={handleProceed}
          >
            Proceed
          </button>
        </div>
      </div>
    );
  }
);

Introduction.displayName = 'Introduction';

export default Introduction;
