import { memo } from 'react';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import styles from './Introduction.module.scss';
import parentStyles from '../../AddComponentAndServiceFlow.module.scss';

interface IntroductionProps {
  onRedirectToProductDetails?: () => void;
}

const Introduction = memo(({ onRedirectToProductDetails }: IntroductionProps) => {
  const goToNextStep = useAddComponentAndServiceFlowStore((state) => state.goToNextStep);
  return (
    <div className={parentStyles.container}>
      <div className={styles.content}>
        <p className={styles.title}>Introduction</p>

        <div className={styles.card}>
          <div className={styles.overviewSection}>
            <p className={styles.sectionTitle}>Overview</p>
            <div className={styles.description}>
              <p>
                To assess the environmental impact of your component or
                service, you will first need to define the relationship between
                the component or service and the supplier that provides it.
              </p>
            </div>
          </div>

          <div className={styles.guidedSection}>
            <p className={styles.guidedText}>You'll be guided through:</p>

            <div className={styles.stepsBox}>
              <ol>
                <li>
                  <span className={styles.stepBold}>
                    Adding a new component or service
                  </span>
                  , or selecting one you have already added
                </li>
                <li>
                  <span className={styles.stepBold}>Selecting a supplier</span>{' '}
                  who provides this component or service
                </li>
                <li>
                  <span className={styles.stepBold}>
                    Identifying the role this supplier
                  </span>{' '}
                  has for this component or service
                </li>
                <li>
                  <span className={styles.stepBold}>
                    Provide role-specific details
                  </span>{' '}
                  for your supplier
                </li>
              </ol>
            </div>

            <p className={styles.completionText}>
              Once completed, you will be able to build the environmental
              profile for this component or service.
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

