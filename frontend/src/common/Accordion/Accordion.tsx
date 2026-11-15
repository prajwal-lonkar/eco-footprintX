import type { FC, ReactNode } from 'react';
import UpArrowIcon from '@assets/icons/arrow-up.svg';
import DownArrowIcon from '@assets/icons/arrow-down.svg';
import styles from './Accordion.module.scss';

type AccordionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const Accordion: FC<AccordionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={onToggle}
      >
        <span>{title}</span>
        <img
          src={isOpen ? UpArrowIcon : DownArrowIcon}
          alt=""
          className={styles.arrow}
        />
      </button>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default Accordion;
