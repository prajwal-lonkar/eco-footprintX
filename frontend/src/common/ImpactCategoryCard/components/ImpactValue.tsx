import { useEffect, useRef, useState } from 'react';
import Tooltip from '@common/Tooltip/Tooltip';
import styles from '../ImpactCategoryCard.module.scss';
import { formatUnitForDisplay } from '../utils/formatUnitForDisplay';

interface ImpactValueProps {
  value: string | number;
  unit: string;
  wrapperClassName?: string;
  valueContainerClassName?: string;
  valueClassName?: string;
  unitClassName?: string;
}

const ImpactValue = ({
  value,
  unit,
  wrapperClassName,
  valueContainerClassName,
  valueClassName,
  unitClassName,
}: ImpactValueProps) => {
  const valueText = String(value);
  const displayUnit = formatUnitForDisplay(unit);
  const impactRef = useRef<HTMLSpanElement>(null);
  const [isImpactTruncated, setIsImpactTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (!impactRef.current) return;
      // small threshold prevents false positives from sub-pixel rounding
      setIsImpactTruncated(
        impactRef.current.scrollWidth - impactRef.current.clientWidth > 1
      );
    };

    const rafId = window.requestAnimationFrame(checkTruncation);
    window.addEventListener('resize', checkTruncation);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && impactRef.current) {
      observer = new ResizeObserver(checkTruncation);
      observer.observe(impactRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkTruncation);
      observer?.disconnect();
    };
  }, [valueText]);

  return (
    <div className={`${styles.infoWrap} ${wrapperClassName ?? ''}`.trim()}>
      <div className={`${styles.impactValueContainer} ${valueContainerClassName ?? ''}`.trim()}>
        {isImpactTruncated ? (
          <Tooltip text={valueText} position="bottom" maxWidth={135} noTruncate>
            <span ref={impactRef} className={`${styles.impact} ${valueClassName ?? ''}`.trim()}>
              {valueText}
            </span>
          </Tooltip>
        ) : (
          <span ref={impactRef} className={`${styles.impact} ${valueClassName ?? ''}`.trim()}>
            {valueText}
          </span>
        )}
      </div>
      <span className={`${styles.unit} ${unitClassName ?? ''}`.trim()}>{displayUnit}</span>
    </div>
  );
};

export default ImpactValue;
