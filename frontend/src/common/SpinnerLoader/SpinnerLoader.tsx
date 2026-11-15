import styles from './SpinnerLoader.module.scss';
import { useSpinnerStore } from '@store/useSpinnerStore';

// Use showSpinner() and hideSpinner() from useSpinnerStore to control visibility.
interface SpinnerLoaderProps {
  inline?: boolean;
}

const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ inline }) => {
  const { visible } = useSpinnerStore();

  if (!visible && !inline) return null;

  return (
    <div
      className={`${styles.loaderWrapper} ${
        !inline ? styles.fullScreenBackground : ''
      }`}
      style={
        inline
          ? { position: 'relative', width: '20px', height: '15px' }
          : {}
      }
    >
      <svg
        className={styles.ring}
        xmlns="http://www.w3.org/2000/svg"
        style={inline ? { width: '15px', height: '71px' } : {}}
        viewBox="0 0 71 71"
        fill="none"
      >
        <g clipPath="url(#clip0_1847_20435)">
          <path
            d="M70.6211 35.3105C70.6211 54.812 54.812 70.6211 35.3105 70.6211C15.8091 70.6211 0 54.812 0 35.3105C0 15.8091 15.8091 0 35.3105 0C54.812 0 70.6211 15.8091 70.6211 35.3105ZM8.74942 35.3105C8.74942 49.9799 20.6412 61.8717 35.3105 61.8717C49.9799 61.8717 61.8717 49.9799 61.8717 35.3105C61.8717 20.6412 49.9799 8.74942 35.3105 8.74942C20.6412 8.74942 8.74942 20.6412 8.74942 35.3105Z"
            fill="#D9D9D9"
          />

          <circle
            cx="35.5"
            cy="35.5"
            r="30"
            stroke="#344B44"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={styles.progress}
            style={inline ? { strokeWidth: '22%' } : {}}
          />
        </g>
        <defs>
          <clipPath id="clip0_1847_20435">
            <rect width="70.6211" height="70.6211" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export default SpinnerLoader;
