import { useEffect, useRef, useState } from 'react';
import styles from './CellWithTooltip.module.scss';

import Tooltip from '@common/Tooltip/Tooltip';
import { isTruncated } from '@utils/formatters';

interface CellWithTooltipProps {
  value: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

const CellWithTooltip: React.FC<CellWithTooltipProps> = ({
  value,
  style,
  className,
  children,
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (cellRef.current) {
      setTruncated(isTruncated(cellRef.current));
    }
  }, [value]);

  const content = (
    <div ref={cellRef} className={className} style={style}>
      {children ?? value}
    </div>
  );

  return truncated ? (
    <div className={styles.tooltipWrapperOverride}>
      <Tooltip text={value}>{content}</Tooltip>
    </div>
  ) : content;
};

export default CellWithTooltip;

