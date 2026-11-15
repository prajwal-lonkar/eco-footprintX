import { memo, useState, useCallback, Fragment } from 'react';
import styles from './ComponentOrServiceDetailsCard.module.scss';
import parentStyles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import downArrowIcon from '@assets/icons/down-arrow.svg';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import type { ComponentDetails } from '@type/product-components';
import type { SupplierRole, SupplierComponentDetails } from '@type/supplier';
import { getTransportComponentName } from '@utils/formatters';

interface ComponentOrServiceDetailsCardProps {
  componentDetails: ComponentDetails | SupplierComponentDetails | null;
  selectedRole: SupplierRole | null;
  defaultExpanded?: boolean;
  className?: string;
}

const ComponentOrServiceDetailsCard = memo(
  ({
    componentDetails,
    selectedRole,
    defaultExpanded = true,
    className,
  }: ComponentOrServiceDetailsCardProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const renderSupplierDetailField = useCallback(
      (label: string, value: string, tooltipText?: string) => (
        <div className={styles.fieldItem}>
          {tooltipText ? (
            <div className={styles.dataLabelWithIcon}>
              <span className={styles.dataLabel}>{label}</span>
              <Tooltip text={tooltipText} noTruncate>
                <img
                  src={infoIcon}
                  alt="Info"
                  className={parentStyles.infoIcon + ' ' + styles.infoIcon}
                />
              </Tooltip>
            </div>
          ) : (
            <div className={styles.dataLabel}>{label}</div>
          )}
          <CellWithTooltip value={value || '-'} className={styles.fieldValue} />
        </div>
      ),
      []
    );

    const renderSupplierDetailCard = useCallback(
      (
        fields: Array<{ label: string; value: string; tooltipText?: string }>
      ) => (
        <div className={styles.parentFormCard}>
          <div className={styles.fieldRow}>
            {fields.map((field, index) => (
              <Fragment key={index}>
                {renderSupplierDetailField(
                  field.label,
                  field.value,
                  field.tooltipText
                )}
              </Fragment>
            ))}
          </div>
        </div>
      ),
      [renderSupplierDetailField]
    );

    const renderExpandableComponentDetails = () => {
      if (!componentDetails || !selectedRole) return null;
      // Only show supplier-dashboard 4 fields when we have supplier details and a selected role
      if (!('requestSentBy' in componentDetails)) return null;

      const supplierDetails = componentDetails as SupplierComponentDetails;
      const componentOrServiceName =
        selectedRole?.supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT
          ? getTransportComponentName(
              supplierDetails.name ?? '',
              supplierDetails.transportFreight?.transportMethod,
              supplierDetails.transportFreight?.transportOrigin,
              supplierDetails.transportFreight?.transportDestination
            )
          : supplierDetails.name || '-';

      const fields: Array<{
        label: string;
        value: string;
        tooltipText?: string;
      }> = [
        {
          label: 'Request Sent By',
          value: supplierDetails.requestSentBy || '-',
        },
        {
          label: 'Component or Service Name',
          value: componentOrServiceName || '-',
        },
        {
          label: 'Internal SKU',
          value: supplierDetails.internalSku || '-',
          tooltipText: TOOLTIP_TEXT.INTERNAL_SKU,
        },
        {
          label: 'Supplier SKU',
          value: supplierDetails.supplierSku || '-',
          tooltipText: TOOLTIP_TEXT.SUPPLIER_SKU,
        },
      ];

      const cardContent = renderSupplierDetailCard(fields);

      return (
        <div className={`${styles.card} ${className ?? ''}`}>
          <div
            className={styles.sectionHeader}
            onClick={() => setIsExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                setIsExpanded((prev) => !prev);
            }}
          >
            <p className={parentStyles.fieldLabel}>
            
            Component or Service Request Details
            </p>
            <img
              src={downArrowIcon}
              alt={isExpanded ? 'Collapse' : 'Expand'}
              className={`${styles.arrowIcon} ${isExpanded ? styles.arrowExpanded : ''}`}
            />
          </div>

          {isExpanded && <>{cardContent}</>}
        </div>
      );
    };

    return renderExpandableComponentDetails();
  }
);

ComponentOrServiceDetailsCard.displayName = 'ComponentOrServiceDetailsCard';
export default ComponentOrServiceDetailsCard;

