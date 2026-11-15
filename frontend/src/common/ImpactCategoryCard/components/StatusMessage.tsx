import styles from '../ImpactCategoryCard.module.scss';

interface StatusMessageProps {
  message: string;
}

const StatusMessage = ({ message }: StatusMessageProps) => {
  return <div className={styles.impactData}>{message}</div>;
};

export default StatusMessage;

