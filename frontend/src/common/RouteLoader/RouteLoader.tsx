import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';

import styles from './RouteLoader.module.scss';

interface RouteLoaderProps {
  className?: string;
}

const RouteLoader = ({ className = '' }: RouteLoaderProps) => {
  return (
    <div className={`${styles.loader} ${className}`.trim()}>
      <SpinnerLoader inline />
    </div>
  );
};

export default RouteLoader;
