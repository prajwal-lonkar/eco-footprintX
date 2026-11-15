import type { ImpactCardSource } from '../types';
import clockIcon from '@assets/icons/clock.svg';
import styles from '../ImpactCategoryCard.module.scss';

interface InProgressMessageProps {
  source: ImpactCardSource;
}

const InProgressMessage = ({ source }: InProgressMessageProps) => {
  const messageMap: Record<ImpactCardSource, string> = {
    component: 'Awaiting data from supplier',
    product: 'Data input in progress',
    supplier: 'Data input in progress',
  };

  return (
    <div className={styles.inProgressMessage}>
      <img src={clockIcon} alt="clock" />
      {messageMap[source]}
    </div>
  );
};

export default InProgressMessage;
