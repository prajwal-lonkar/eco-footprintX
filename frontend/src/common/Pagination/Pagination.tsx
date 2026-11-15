import styles from './Pagination.module.scss';
import type { ReactNode } from 'react';

interface PaginationBaseProps {
  hideOnSinglePage?: boolean;
  className?: string;
  prevLabel?: ReactNode;
  nextLabel?: ReactNode;
}

// Offset-based pagination for flows that use skip/limit (for example: ProductRequestsTab).
interface OffsetPaginationProps extends PaginationBaseProps {
  mode?: 'offset';
  skip: number;
  limit: number;
  totalCount: number;
  onPageChange: (skip: number) => void;
  currentPage?: never;
  totalPages?: never;
}

// Page-based pagination for flows that use page/totalPages (for example: Products).
interface PagePaginationProps extends PaginationBaseProps {
  mode: 'page';
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  skip?: never;
  limit?: never;
  totalCount?: never;
}

type PaginationProps = OffsetPaginationProps | PagePaginationProps;

const Pagination = (props: PaginationProps) => {
  const {
    hideOnSinglePage = true,
    className,
    prevLabel = '<',
    nextLabel = '>',
    onPageChange,
  } = props;
  const isPageMode = props.mode === 'page';
  const currentPage = isPageMode
    ? Math.max(1, props.currentPage)
    : Math.floor(props.skip / props.limit) + 1;
  const totalPages = isPageMode
    ? Math.max(1, props.totalPages)
    : Math.max(1, Math.ceil(props.totalCount / props.limit));

  const handleNext = () => {
    if (currentPage < totalPages) {
      if (isPageMode) {
        onPageChange(currentPage + 1);
        return;
      }

      onPageChange(props.skip + props.limit);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      if (isPageMode) {
        onPageChange(currentPage - 1);
        return;
      }

      onPageChange(props.skip - props.limit);
    }
  };

  if (hideOnSinglePage && totalPages <= 1) return null;

  return (
    <div className={`${styles.pagination} ${className ?? ''}`.trim()}>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className={styles.pageControls}>
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={currentPage === 1 ? styles.disabled : ''}
        >
          {prevLabel}
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? styles.disabled : ''}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
