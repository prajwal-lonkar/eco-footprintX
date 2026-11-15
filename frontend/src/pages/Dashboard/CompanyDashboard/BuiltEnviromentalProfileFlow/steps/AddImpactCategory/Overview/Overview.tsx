import styles from './Overview.module.scss';
import parentStyles from '../AddImpactCategory.module.scss';

interface OverviewProps {
  onPrevious: () => void;
  onOverviewProceed: () => void;
}
const Overview = ({ onPrevious, onOverviewProceed }: OverviewProps) => {
  return (
    <>
      <div className={styles.card}>
        <div className={styles.headerWrapper}>
          <h3 className={styles.title}>Overview</h3>
          <p className={styles.description}>
            In this section, you will need to provide data for your component or
            service across the impact category of <span>Carbon, Water,</span>{' '}
            and <span>Land.</span>
          </p>
        </div>

        <div className={styles.contentWrapper}>
          <h3>
            You can do this by selecting one of the following data sources:
          </h3>
          <ol className={styles.list}>
            <li>Send a request to your supplier to provide this data</li>
            <li>Enter the data manually</li>
            <li>
              Use our database to select impact category data from a comparable
              component or service in your industry
            </li>
          </ol>
        </div>

        <p className={styles.note}>
          If your component or service has no impact in a particular category,
          you can mark it as “No Impact” — no data input will be required for
          that category.
        </p>
      </div>
      <div className={parentStyles.footerActions}>
        <button className={parentStyles.secondaryButton} onClick={onPrevious}>
          Go Back
        </button>

        <button
          className={parentStyles.primaryButton}
          onClick={onOverviewProceed}
        >
          Proceed
        </button>
      </div>
    </>
  );
};

export default Overview;
