import React from 'react';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
  status: string;
  hideAddButton?: boolean;
    onAddData?: (e: React.MouseEvent) => void;
}

export const mapApiStatusToDisplayStatus = (
  apiStatus: string
): 'Awaiting Submission' | 'Submitted' | 'Partially Submitted' | 'Ready to Submit' => {
  switch (apiStatus.trim().toLowerCase()) {
    case 'pending':
    case 'awaiting submission':
      return 'Awaiting Submission';
    case 'submitted':
      return 'Submitted';
    case 'partial':
    case 'partially submitted':
      return 'Partially Submitted';
    case 'ready':
    case 'ready to submit':
      return 'Ready to Submit';
    default:
      return 'Awaiting Submission';
  }
};

export const mapApiStatusToDisplayStatusForProduct = (
  apiStatus: string
): 'No Data' | 'Pending Submission' | 'Published' | 'Partially Published' | 'Ready to Publish' => {
  switch (apiStatus.toLowerCase()) {
    case 'pending':
      return 'No Data';
    case 'awaiting':
    case 'pending submission':
      return 'Pending Submission';
    case 'published':
      return 'Published';
    case 'partial':
      return 'Partially Published';
    case 'ready':
      return 'Ready to Publish';
    default:
      return apiStatus as 'No Data' | 'Pending Submission' | 'Published' | 'Partially Published' | 'Ready to Publish';
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onAddData, hideAddButton }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Submitted':
      case 'Published':
        return styles.badgeGreen;
      case 'Partially Submitted':
      case 'Partially Published':
        return styles.badgeYellow;
      case 'No Data':
      case 'Awaiting Submission':
      case 'Pending Submission':
        return styles.badgeGray;
      case 'Ready to Submit':
      case 'Ready to Publish':
        return styles.badgePurple;
      default:
        return styles.badgeDefault;
    }
  };
  const isAwaiting = status === 'Awaiting Submission' && !hideAddButton;
  return (
    <div className={styles.statusBadge}>
      <div className={`${styles.badge} ${getStatusClass()}`}>
        <span className={styles.dot} />

        {status}
      </div>
      {isAwaiting && (
        <div className={styles.addButton}   onClick={(e) => {
            e.stopPropagation();
            onAddData?.(e);
          }}>
          <span>+</span> Add Data
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
