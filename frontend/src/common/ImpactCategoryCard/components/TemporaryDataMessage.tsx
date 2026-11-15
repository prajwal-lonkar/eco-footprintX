import styles from '../ImpactCategoryCard.module.scss';

const TemporaryDataMessage = () => {
  return (
    <p className={styles.temporaryInfo}>
      Temporary data used while waiting for supplier's submission
    </p>
  );
};

export default TemporaryDataMessage;

