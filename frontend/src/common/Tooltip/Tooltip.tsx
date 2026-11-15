import React, { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.scss';

interface Props {
  text: string | undefined;
  className?: string;
  children?: React.ReactNode;
  noTruncate?: boolean;
  position?: 'bottom' | 'right' | 'top' | 'rightbottom' | 'left';
  maxWidth?: number;
}

const Tooltip = ({
  text,
  className,
  children,
  noTruncate,
  position,
  maxWidth,
}: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (noTruncate) return;

    const el = textRef.current;
    if (!el) return;

    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [text, noTruncate]);

  const handleEnter = () => {
    if (children || noTruncate || isTruncated) {
      setShowTooltip(true);
    }
  };

  const handleLeave = () => setShowTooltip(false);

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children ? (
        <span className={className}>{children}</span>
      ) : (
        <p ref={textRef} className={`${styles.truncatedText} ${className}`}>
          {text}
        </p>
      )}

      {showTooltip && (
        <div
          className={`${styles.tooltipBox} ${
            position === 'right' ? styles.tooltipRight : ''
          }   ${position === 'top' ? styles.tooltipTop : ''}

              ${position === 'rightbottom' ? styles.tooltipBottomRight : ''} ${position === 'left' ? styles.tooltipLeft : ''}`}
          style={{ maxWidth }}
        >
          {text}
          <div
            className={`${styles.arrow} ${
              position === 'right' ? styles.arrowRight : ''
            }  ${position === 'top' ? styles.arrowTop : ''}

              ${position === 'rightbottom' ? styles.arrowBottomRight : ''}  ${position === 'left' ? styles.arrowLeft : ''}`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
