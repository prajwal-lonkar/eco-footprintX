import { memo } from 'react';
import styles from './Introduction.module.scss';
import parentStyles from '../../BuiltEnviromentalProfileFlow.module.scss';
import { useBuiltEnvironmentalProfileFlowStore } from '@store/useBuiltEnvironmentalProfileFlowStore';

interface IntroductionProps {
  onRedirectToProductDetails?: () => void;
}

const Introduction = memo(({ onRedirectToProductDetails }: IntroductionProps) => {
  const goToNextStep = useBuiltEnvironmentalProfileFlowStore((state) => state.goToNextStep);
  return (
    <div className={parentStyles.container}>
      <div className={parentStyles.header}>
        <h2 className={parentStyles.pageTitle}>Introduction</h2>
      </div>

      <div className={parentStyles.formCard}>
        <div className={parentStyles.childcontent}>
            <div className={styles.overviewSection}>
              <p className={styles.sectionTitle}>Overview</p>
              <div className={styles.description}>
                <p>
                This section will help you gather impact category data for a specific component or service in your supply chain. You'll walk through a few key steps to collect the information needed to calculate its carbon, water, and land impact.                </p>
              </div>
            </div>

            <div className={styles.guidedSection}>
              <p className={styles.guidedText}>You'll be asked to:</p>

              <div className={styles.stepsBox}>
                <ol>
                  <li>
                    <span className={styles.stepBold}>Complete Supplier Details -</span>{' '}
                    Provide details about the supplier responsible for the component or service.
                  </li>
                  <li>
                    <span className={styles.stepBold}>Add Industry Benchmarking Data -</span>{''}
                    Select similar components or services to benchmark your data against the industry average.
                  </li>
                  <li>
                    <span className={styles.stepBold}>
                    Add Impact Category Data -
                    </span>{' '}
                    Enter or request the impact category data needed for this component or service.
                  </li>
                  <li>
                    <span className={styles.stepBold}>
                    Review Summary -
                    </span>{' '}
                    Confirm the details before completing the environmental profile.
                  </li>
                </ol>
              </div>

              <p className={styles.completionText}>
                By completing this section, you'll build the foundation for understanding and improving the environmental footprint of your product.
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
        <button type="button" className={parentStyles.primaryButton} onClick={goToNextStep}>
          Proceed
        </button>
      </div>
    </div>
  );
});

Introduction.displayName = 'Introduction';

export default Introduction;
