import type { CtaConfig } from '../types';
import styles from '../ImpactCategoryCard.module.scss';

interface CtaRendererProps {
  cta?: CtaConfig | CtaConfig[];
}

const renderSingleCta = (cta: CtaConfig) => {
  switch (cta.type) {
    case 'primary-button':
      return (
        <button
          className={styles.publishBtn}
          onClick={cta.onClick}
          disabled={cta.disabled}
        >
          {cta.label}
        </button>
      );
    case 'secondary-button':
      return (
        <button
          className={styles.secondaryBtn}
          disabled={cta.disabled ?? true}
        >
          {cta.label}
        </button>
      );
    case 'ternary-button':
      return (
        <button
          className={styles.ternaryBtn}
          onClick={cta.onClick}
        >
          {cta.label}
        </button>
      );
    case 'label':
      return <div className={styles.ctaLabel}>{cta.text}</div>;
    default:
      return null;
  }
};

const CtaRenderer = ({ cta }: CtaRendererProps) => {
  if (!cta) {
    return null;
  }

  if (Array.isArray(cta)) {
    return (
      <div className={styles.twoButtonWrapper}>
        {cta.map((singleCta, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            {renderSingleCta(singleCta)}
          </div>
        ))}
      </div>
    );
  }

  return renderSingleCta(cta);
};

export default CtaRenderer;

