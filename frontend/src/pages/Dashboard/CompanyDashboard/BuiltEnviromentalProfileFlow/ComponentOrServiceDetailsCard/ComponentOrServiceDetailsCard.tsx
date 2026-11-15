import { memo, useState, Fragment, useCallback } from 'react';
import styles from './ComponentOrServiceDetailsCard.module.scss'

import parentStyles from '../../BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow.module.scss';

import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import downArrowIcon from '@assets/icons/down-arrow.svg';

import { SUPPLIER_ROLE_NAMES } from '@constants/component-service-flow';
import { getTransportComponentName } from '@utils/formatters';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import type { ComponentDetails } from '@type/product-components';
import type { SupplierRole } from '@type/supplier';

interface ComponentOrServiceDetailsCardProps {
  componentDetails: ComponentDetails | null;
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
                <img src={infoIcon} alt="Info" className={parentStyles.infoIcon + ' ' + styles.infoIcon} />
              </Tooltip>
            </div>
          ) : (
            <div className={styles.dataLabel}>{label}</div>
          )}
          <CellWithTooltip value={value || '-'} className={styles.fieldValue} />
        </div>
      ),
      [],
    );

    const renderSupplierDetailCard = useCallback(
      (fields: Array<{ label: string; value: string; tooltipText?: string }>) => (
        <div className={styles.parentFormCard}>
          <div className={styles.fieldRow}>
            {fields.map((field, index) => (
              <Fragment key={index}>
                {renderSupplierDetailField(field.label, field.value, field.tooltipText)}
              </Fragment>
            ))}
          </div>
        </div>
      ),
      [renderSupplierDetailField],
    );

    const renderExpandableComponentDetails = () => {
      if (!componentDetails) return null;

      const rolesToDisplay = selectedRole ? [selectedRole] : [];

      const supplierCards = rolesToDisplay.map((roleObj, index) => {
        const role = typeof roleObj === 'string' ? roleObj : roleObj.role;

        const getComponentOrServiceName = () => {
          if (role === SUPPLIER_ROLE_NAMES.TRANSPORT_AND_FREIGHT) {
            return getTransportComponentName(
              componentDetails?.name ?? '',
              componentDetails?.transportFreight?.transportMethod,
              componentDetails?.transportFreight?.transportOrigin,
              componentDetails?.transportFreight?.transportDestination
            ) || '-';
          }
          return componentDetails?.name || '-';
        };

        const fields: Array<{ label: string; value: string; tooltipText?: string }> = [
          {
            label: 'Supplier Name',
            value: componentDetails.supplierName || '-',
          },
          {
            label: 'Supplier Role',
            value: role || '-',
            tooltipText: TOOLTIP_TEXT.SUPPLIER_ROLE_COMPANY_VIEW,
          },
          {
            label: 'Component or Service Name',
            value: getComponentOrServiceName(),
          },
        ];

        if (
          role === SUPPLIER_ROLE_NAMES.RAW_MATERIALS_SUPPLIER_AND_PROCESSOR &&
          componentDetails.rawMaterialSupplier
        ) {
          fields.push(   
            {
              label: 'Internal SKU',
              value: componentDetails.rawMaterialSupplier.internalSku || '-',
              tooltipText: TOOLTIP_TEXT.INTERNAL_SKU,
            },
            {
              label: 'Supplier SKU',
              value: componentDetails.rawMaterialSupplier.supplierSku || '-',
              tooltipText: TOOLTIP_TEXT.SUPPLIER_SKU,
            },
          );
        }

        return <Fragment key={index}>{renderSupplierDetailCard(fields)}</Fragment>;
      });

      return (
        <div className={`${styles.card} ${className ?? ''}`}>
          <div
            className={styles.sectionHeader}
            onClick={() => setIsExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsExpanded((prev) => !prev);
            }}
          >
            <p className={parentStyles.fieldLabel}>Component or Service Details</p>
            <img
              src={downArrowIcon}
              alt={isExpanded ? 'Collapse' : 'Expand'}
              className={`${styles.arrowIcon} ${isExpanded ? styles.arrowExpanded : ''}`}
            />
          </div>

          {isExpanded && <>{supplierCards}</>}
        </div>
      );
    };

    return renderExpandableComponentDetails();
  },
);

ComponentOrServiceDetailsCard.displayName = 'ComponentOrServiceDetailsCard';
export default ComponentOrServiceDetailsCard;
