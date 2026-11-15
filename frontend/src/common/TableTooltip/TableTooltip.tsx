import React, { useEffect, useRef, useState } from 'react';
import styles from './TableTooltip.module.scss';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

const TableTooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Listen to global event to close when another tooltip opens
  useEffect(() => {
    const handleGlobalClose = () => setShowTooltip(false);
    window.addEventListener('tooltip:closeAll', handleGlobalClose);
    return () =>
      window.removeEventListener('tooltip:closeAll', handleGlobalClose);
  }, []);

  const handleToggle = () => {
    // e.stopPropagation();
    // Before opening this one, close others
    window.dispatchEvent(new Event('tooltip:closeAll'));
    setShowTooltip((prev) => !prev);
  };

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleToggle}
    >
      {children}

      {showTooltip && (
        <div className={styles.tooltipBox} ref={tooltipRef}>
          <ul>
            <li>{text}</li>
          </ul>
          <div className={styles.arrow}></div>
        </div>
      )}
    </div>
  );
};

export default TableTooltip;


