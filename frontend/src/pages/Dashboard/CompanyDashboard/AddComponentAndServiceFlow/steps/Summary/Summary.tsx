import { memo, useCallback, useMemo } from 'react';
import styles from './Summary.module.scss';
import parentStyles from '../../AddComponentAndServiceFlow.module.scss';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { ROUTES } from '@constants/routes';
import { useNavigate } from 'react-router-dom';
import { useAlertStore } from '@store/useAlertStore';

import { SUCCESS_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';

interface SummaryProps {
  onRedirectToProductDetails: () => void;
}
const Summary = memo(({ onRedirectToProductDetails }: SummaryProps) => {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();


  // Zustand store
  const selectedComponent = useAddComponentAndServiceFlowStore(
    (state) => state.selectedComponent
  );
  const assignedSupplier = useAddComponentAndServiceFlowStore(
    (state) => state.assignedSupplier
  );
  const supplierRoles = useAddComponentAndServiceFlowStore(
    (state) => state.supplierRoles
  );
  const productDetails = useAddComponentAndServiceFlowStore(
    (state) => state.productDetails
  );
  const goToPreviousStep = useAddComponentAndServiceFlowStore(
    (state) => state.goToPreviousStep
  );
  // Map role IDs to role names
  const roleNames = useMemo(() => {
    if (!assignedSupplier?.roles || !supplierRoles.length) {
      return [];
    }
    return assignedSupplier.roles
      .map((roleSlug) => {
        const role = supplierRoles.find((r) => r.slug === roleSlug);
        return role?.name || '';
      })
      .filter(Boolean);
  }, [assignedSupplier?.roles, supplierRoles]);

  const handleSaveAndExit = useCallback(() => {
    onRedirectToProductDetails();
    showAlert(SUCCESS_MESSAGES.SUPPLIER_DETAILS_SAVED_SUCCESSFULLY, 'success',);
  
  }, [onRedirectToProductDetails]);

  const handleBuildEnvironmentalProfile = useCallback(() => {

    navigate(`${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productDetails?._id}${ROUTES.COMPONENT.BASE}/${selectedComponent?._id}${ROUTES.ROLE.BASE}/${assignedSupplier?.roles[0]}${ROUTES.ENV_PROFILE.BASE}/new`);
    showAlert(SUCCESS_MESSAGES.SUPPLIER_DETAILS_SAVED_SUCCESSFULLY, 'success');

  }, [productDetails?._id, selectedComponent?._id, assignedSupplier?.roles, navigate]);
  return (
    <div className={parentStyles.container}>
      <div className={parentStyles.contentFrame}>
        <div className={parentStyles.header}>
          <h2 className={parentStyles.pageTitle}>Summary</h2>
          <p className={parentStyles.helperText}>
            Please review the details you've provided for your component and
            supplier.
          </p>
          <p className={parentStyles.helperText}>
            If everything looks correct, proceed to build the environmental
            profile for this component or service to calculate its impact
            category data, or save and exit to add another component or service
          </p>
        </div>

        <div className={parentStyles.formCard}>
          <div className={parentStyles.twoColumnFields}>
            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>
                Component or Service Name
              </label>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={parentStyles.formInput}
                  value={selectedComponent?.name || ''}
                  disabled
                />
              </div>
            </div>

            <div className={parentStyles.formField}>
              <div className={parentStyles.labelWithIcon}>
                <label
                  className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
                >
                  Internal SKU <span className={parentStyles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.INTERNAL_SKU}
                    noTruncate
                  >
                    <img
                      src={infoIcon}
                      alt="Info"
                      className={parentStyles.infoIcon}
                    />
                  </Tooltip>
                </label>
              </div>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={parentStyles.formInput}
                  value={selectedComponent?.internalSku || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className={parentStyles.twoColumnFields}>
            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>Supplier Name</label>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={parentStyles.formInput}
                  value={assignedSupplier?.name || ''}
                  disabled
                />
              </div>
            </div>

            <div className={parentStyles.formField}>
              <div className={parentStyles.labelWithIcon}>
                <label
                  className={`${parentStyles.fieldLabel} ${parentStyles.fieldLabelWithTooltip}`}
                >
                  Company Registration Number{' '}
                  <span className={parentStyles.required}>*</span>
                  <Tooltip
                    text={TOOLTIP_TEXT.COMPANY_REGISTRATION_NUMBER}
                    noTruncate
                  >
                    <img
                      src={infoIcon}
                      alt="Info"
                      className={parentStyles.infoIcon}
                    />
                  </Tooltip>
                </label>
              </div>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={parentStyles.formInput}
                  value={assignedSupplier?.registrationNumber || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className={parentStyles.twoColumnFields}>
            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>
                Company Contact Name{' '}
                <span className={parentStyles.required}>*</span>
              </label>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="text"
                  className={parentStyles.formInput}
                  value={assignedSupplier?.contactName || ''}
                  disabled
                />
              </div>
            </div>

            <div className={parentStyles.formField}>
              <label className={parentStyles.fieldLabel}>
                Company Contact Email{' '}
                <span className={parentStyles.required}>*</span>
              </label>
              <div className={parentStyles.inputWrapper}>
                <input
                  type="email"
                  className={parentStyles.formInput}
                  value={assignedSupplier?.contactEmail || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className={parentStyles.formField}>
            <label className={parentStyles.fieldLabel}>
              Roles Assigned to Supplier
            </label>
            <div className={styles.roleList}>
              {roleNames.length > 0 ? (
                roleNames.map((roleName, index) => (
                  <div key={`${roleName}-${index}`} className={styles.roleItem}>
                    <div className={styles.roleWrapper}>
                      <input
                        type="text"
                        className={styles.roleInput}
                        value={roleName}
                        disabled
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.roleItem}>
                  <div className={styles.roleWrapper}>
                    <input
                      type="text"
                      className={styles.roleInput}
                      value=""
                      disabled
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={parentStyles.footerActions}>
        <button
          type="button"
          className={parentStyles.secondaryButton}
          onClick={goToPreviousStep}
        >
          Go Back
        </button>
        <button
          type="button"
          className={parentStyles.tertiaryButton}
          onClick={handleSaveAndExit}
        >
          Save and Exit
        </button>
        <button
          type="button"
          className={parentStyles.primaryButton}
          onClick={handleBuildEnvironmentalProfile}
        >
          Build Environmental Profile
        </button>
      </div>
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;
