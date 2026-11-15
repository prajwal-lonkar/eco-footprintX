import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import styles from '../ImpactCategoryCard.module.scss';
import { TOOLTIP_TEXT } from '@constants/tooltips';

interface DataSourceFooterProps {
  lciaMethod?: string;
  dataSource?: string;
}

const DataSourceFooter = ({
  lciaMethod,
  dataSource,
}: DataSourceFooterProps) => {
  if (!lciaMethod && !dataSource) {
    return null;
  }

  const isRequestedData =
    (dataSource ?? '').trim().toLowerCase() === 'requested data';

  return (
    <div className={styles.dataSourceFooter}>
      {lciaMethod && (
        <div className={styles.topContent}>
          <div className={styles.label}>
            LCIA Method
            <Tooltip
              text={TOOLTIP_TEXT.LCIA_METHOD_IMPACT_CATEGORY_VALUE}
              noTruncate
              position="bottom"
            >
              <img
                src={infoIcon}
                alt="info"
                className={styles.infoIcon}
                width={12}
                height={12}
                style={{
                  verticalAlign: 'middle',
                  marginTop: '3px',
                  marginLeft: '2px',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          </div>
          <span className={styles.value}>{lciaMethod}</span>
        </div>
      )}

      {dataSource && (
        <div className={styles.bottomContent}>
          <p>Data Source:</p>
          <span
            className={`${styles.dataSource} ${
              isRequestedData ? styles.requestedDataSource : ''
            }`}
          >
            {dataSource}
          </span>
        </div>
      )}
    </div>
  );
};

export default DataSourceFooter;
