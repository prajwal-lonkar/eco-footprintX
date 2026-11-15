import React from 'react';
import styles from './SkeletonLoader.module.scss';

interface SkeletonLoaderProps {
  type:
    | 'table'
    | 'companyProfile'
    | 'companyProfileEdit'
    | 'productProfile'
    | 'recycleInstructions'
    | 'supplierTable'
    | 'consumerProductProfile'
    | 'componentDetail'
    | 'impactSummary';

  className?: string;

  columns?: string[];
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  className = '',
  columns,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return (
          <div
            className={`${styles.cardTable} ${styles.animatepulse} ${className}`}
          >
            <div className={styles.tableHead}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeletonHeadCell} />
              ))}
            </div>

            {[...Array(10)].map((_, rowIndex) => (
              <div key={rowIndex} className={styles.tableRow}>
                {[...Array(6)].map((_, colIndex) => (
                  <div key={colIndex} className={styles.skeletonCell} />
                ))}
              </div>
            ))}
          </div>
        );

      case 'companyProfile':
        return (
          <div
            className={`${styles.companySkeletonWrapper} ${styles.animatepulse}`}
          >
            <div className={styles.headerRow}>
              <div className={styles.skeletonProfileImage}></div>

              <div className={styles.headerTextBlock}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonDate}></div>
              </div>
            </div>

            <div className={styles.infoGrid}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className={styles.skeletonInfoItem}>
                  <div className={styles.skeletonLabel}></div>
                  <div className={styles.skeletonValue}></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'productProfile':
        return (
          <div
            className={`${styles.productSkeletonWrapper} ${styles.animatepulse}`}
          >
            <div className={styles.headerRow}>
              <div className={styles.skeletonProfileImage}></div>

              <div className={styles.headerTextBlock}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonDate}></div>
              </div>
            </div>

            <div className={styles.infoGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonInfoItem}>
                  <div className={styles.skeletonLabel}></div>
                  <div className={styles.skeletonValue}></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'companyProfileEdit':
        return (
          <div
            className={`${styles.companyEditSkeletonWrapper} ${styles.animatepulse}`}
          >
            {/* Header Card */}
            <div className={styles.profileHeaderCard}>
              <div className={styles.skeletonProfileImage} />
              <div className={styles.profileTextBlock}>
                <div className={styles.skeletonCompanyName} />
                <div className={styles.skeletonDate} />
              </div>
            </div>

            {/* Form Grid */}
            <div className={styles.formGridSkeleton}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className={styles.skeletonFormItem} key={i}>
                  <div className={styles.skeletonLabel} />
                  <div className={styles.skeletonInput} />
                </div>
              ))}

              {/* Address textarea */}
              <div className={styles.skeletonTextareaBlock}>
                <div className={styles.skeletonLabel} />
                <div className={styles.skeletonTextarea} />
              </div>

              {/* Buttons */}
              <div className={styles.actionRow}>
                <div className={styles.skeletonButton} />
                <div className={styles.skeletonButton} />
              </div>
            </div>
          </div>
        );
      case 'recycleInstructions':
        return (
          <div
            className={`${styles.recycleSkeletonWrapper} ${styles.animatepulse} ${className}`}
          >
            {/* Instruction rows */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.recycleRow}>
                <div className={styles.recycleText}>
                  <div className={styles.skeletonLineShort} />
                  <div className={styles.skeletonLineLong} />
                </div>

                <div className={styles.recycleActions}>
                  <div className={styles.skeletonIcon} />
                  <div className={styles.skeletonIcon} />
                </div>
              </div>
            ))}

            {/* Add new instruction */}
            <div className={styles.recycleAddRow}>
              <div className={styles.skeletonAddText} />
            </div>
          </div>
        );
      case 'supplierTable':
        return (
          <div
            className={`${styles.cardTable} ${styles.animatepulse} ${className}`}
          >
            {[...Array(10)].map((_, rowIndex) => (
              <div key={rowIndex} className={styles.tableRowSupplier}>
                {columns?.map(
                  (width: any, colIndex: React.Key | null | undefined) => (
                    <div
                      key={colIndex}
                      className={styles.skeletonCell}
                      style={{ width }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        );

      case 'consumerProductProfile':
        return (
          <div
            className={`${styles.consumerSkeletonWrapper} ${styles.animatepulse}`}
          >
            <div className={styles.consumerContent}>
              {/* LEFT IMAGE CARD */}
              <div className={styles.consumerLeft}>
                <div className={styles.skeletonProductImage} />
              </div>

              {/* RIGHT DETAILS */}
              <div className={styles.consumerRight}>
                {/* Product name & description */}
                <div className={styles.skeletonProductTitle} />
                <div className={styles.skeletonSubtitle} />

                {/* Environmental impact */}
                <div className={styles.skeletonSectionTitle} />
                <div className={styles.impactSkeletonGrid}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={styles.impactSkeletonCard} />
                  ))}
                </div>

                {/* How to recycle */}
                <div className={styles.skeletonSectionTitle} />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.recycleSkeletonRow}>
                    <div className={styles.skeletonStepNumber} />
                    <div className={styles.recycleSkeletonText}>
                      <div className={styles.skeletonLineShort} />
                      <div className={styles.skeletonLineLong} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'componentDetail':
        return (
          <>
            {/* Component card */}
            <div
              className={`${styles.componentCard} ${styles.animatepulse} ${className}`}
            >
              <div className={styles.componentTopRow}>
                <div className={styles.skeletonProfileImage} />

                <div className={styles.componentTitleBlock}>
                  <div className={styles.skeletonLabel} />
                  <div className={styles.skeletonTitle} />
                </div>

                <div className={styles.componentActions}>
                  <div className={styles.skeletonButtonLarge} />
                  <div className={styles.skeletonButtonSmall} />
                </div>
              </div>

              {/* Info grid */}
              <div className={styles.componentInfoGrid}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={styles.skeletonInfoItem}>
                    <div className={styles.skeletonLabelSmall} />
                    <div className={styles.skeletonValue} />
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'impactSummary':
        return (
          <div
            className={`${styles.summarySkeletonWrapper} ${styles.animatepulse} ${className}`}
          >
            {/* Impact cards */}
            <div className={styles.summaryCards}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.impactCardSkeleton}>
                  {/* Card header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.skeletonTitleSmall} />
                  </div>

                  {/* Value */}
                  <div className={styles.skeletonValueLarge} />

                  {/* Info text */}
                  <div className={styles.skeletonCardLineMedium} />
                  <div className={styles.skeletonCardLineShort} />

                  {/* Footer row */}
                  <div className={styles.cardFooter}>
                    <div className={styles.skeletonBadge} />
                    {/* <div className={styles.skeletonBadge} /> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
