import type { ImpactCardSource, ImpactProgressLabel } from '../types';
import { formatImpactProgressLabel } from '../utils/formatters';
import progressTrackIcon from '@assets/icons/progress-track.svg';
import styles from '../ImpactCategoryCard.module.scss';

interface ProgressBarProps {
  progressValue?: number;
  progressLabel?: ImpactProgressLabel;
  source: ImpactCardSource;
}

const ProgressBar = ({
  progressValue,
  progressLabel,
  source,
}: ProgressBarProps) => {
  const isNoBenchmarkData = progressValue == null || !progressLabel;

  const renderLabel = () => {
    if (progressLabel) {
      const { boldText, regularText } =
        formatImpactProgressLabel(progressLabel);
      return (
        <>
          <strong style={{ fontWeight: '500' }}>{boldText}</strong>{' '}
          {regularText}
        </>
      );
    }

    return (
      <>
        Industry average comparison unavailable —{' '}
        <span style={{ fontWeight: 500 }}>
          benchmarking data for this{' '}
          {source == 'component' ? 'component or service' : 'product'} is
          missing
        </span>
      </>
    );
  };

  const getBackgroundColor = () => {
    if (isNoBenchmarkData) {
      return '#EFF3FE';
    }

    if (progressLabel.cardColor) {
      switch (progressLabel.cardColor) {
        case 'red':
          return '#FFEFED';
        case 'yellow':
          return '#FFFAF0';
        case 'green':
          return '#EAFBF5';
        case 'blue':
          return '#EFF3FE';
        default:
          break;
      }
    }

    switch (progressLabel.comparison) {
      case 'more':
        return '#FFEFED';
      case 'similar':
        return '#FDEED3';
      case 'less':
        return '#eaf8e7';
      default:
        return '#eaf8e7';
    }
  };

  const getTrackColor = () => {
    return isNoBenchmarkData ? '#E3E3E3' : undefined;
  };

  return (
    <div className={styles.progressBarWrapper}>
      <div
        className={styles.progressLabel}
        style={{
          backgroundColor: getBackgroundColor(),
        }}
      >
        <div
          className={styles.progressTrack}
          style={{ background: getTrackColor() }}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${progressValue}%` }}
          ></div>
          {!isNoBenchmarkData && (
            <img
              src={progressTrackIcon}
              alt="progress"
              className={styles.progressKnob}
              style={{ left: `${progressValue}%` }}
            />
          )}
        </div>
        <span>{renderLabel()}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
