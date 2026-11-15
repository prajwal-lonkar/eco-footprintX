import { useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Introduction from './steps/Introduction/Introduction';
import AddComponenOrService from './steps/AddComponenOrService/AddComponenOrService';
import AddSupplierDetails from './steps/AddSupplierDetails/AddSupplierDetails';
import SelectSupplierWithRole from './steps/SelectSupplierWithRole/SelectSupplierWithRole';
import Summary from './steps/Summary/Summary';
import styles from './AddComponentAndServiceFlow.module.scss';
import arrowLeftIcon from '@assets/icons/arrow-left.svg';
import recordIcon from '@assets/icons/record.svg';
import recordGreyIcon from '@assets/icons/record-grey.svg';
import circleCheck from '@assets/icons/circle-check.svg';
import { getSupplierRoles } from '@service/supplier.service';
import { getCompanyProfile, getProductDetails } from '@service/company.service';
import type { SupplierRole } from '@type/supplier';
import { ROUTES } from '@constants/routes';
import { ERROR_MESSAGES } from '@constants/messages';
import { useAlertStore } from '@store/useAlertStore';
import { useSpinnerStore } from '@store/useSpinnerStore';
import { useAddComponentAndServiceFlowStore } from '@store/useAddComponentAndServiceFlowStore';
import Bugsnag from '@utils/bugsnag';
import { FLOW_STEPS } from '@constants/component-service-flow';

// Step configuration - moved outside component to prevent recreation on every render
const STEP_CONFIG = [
  {
    step: FLOW_STEPS.INTRODUCTION,
    label: 'Introduction',
    description: undefined,
  },
  {
    step: FLOW_STEPS.ADD_COMPONENT_OR_SERVICE,
    label: 'Add or Select a Component or Service',
    description: 'Add a new Component or Service, or select one you have previously added',
  },
  {
    step: FLOW_STEPS.SELECT_SUPPLIER_WITH_ROLE,
    label: 'Assign and Select Supplier Roles',
    description: 'Choose or add a supplier who provides this component or service',
  },
  {
    step: FLOW_STEPS.ADD_SUPPLIER_DETAILS,
    label: 'Add Role-Specific Supplier Details',
    description: 'Provide additional details for your supplier based on their role',
  },
  {
    step: FLOW_STEPS.SUMMARY,
    label: 'Summary',
    description: undefined,
  },
] as const;

// Memoized step item component to prevent unnecessary re-renders
interface StepItemProps {
  step: number;
  label: string;
  description: string | undefined;
  currentStep: number;
}

const StepItem = memo(({ step, label, description, currentStep }: StepItemProps) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  const icon = isActive ? recordIcon : isCompleted ? circleCheck : recordGreyIcon;
  const iconAlt = isActive ? 'active' : isCompleted ? 'completed' : 'inactive';

  const stepClasses = isActive
    ? `${styles.stepItem} ${styles.activeStep}`
    : isCompleted
    ? `${styles.stepItem} ${styles.completedStep}`
    : styles.stepItem;

  return (
    <li className={stepClasses}>
      <img src={icon} alt={iconAlt} className={styles.stepIcon} />
      <div className={styles.stepText}>
        <div className={styles.stepLabel}>{label}</div>
        {description && <p className={styles.stepDescription}>{description}</p>}
      </div>
    </li>
  );
});

StepItem.displayName = 'StepItem';

const AddComponentAndServiceFlow = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { showAlert } = useAlertStore();
  const { showSpinner, hideSpinner } = useSpinnerStore();

  // Zustand store - minimal subscriptions (only what parent needs)
  const currentStep = useAddComponentAndServiceFlowStore((state) => state.currentStep);
  const productDetails = useAddComponentAndServiceFlowStore((state) => state.productDetails);
  const isLoadingProduct = useAddComponentAndServiceFlowStore((state) => state.isLoadingProduct);

  // Zustand actions
  const setProductDetails = useAddComponentAndServiceFlowStore((state) => state.setProductDetails);
  const setIsLoadingProduct = useAddComponentAndServiceFlowStore((state) => state.setIsLoadingProduct);
  const setSupplierRoles = useAddComponentAndServiceFlowStore((state) => state.setSupplierRoles);
  const setCurrentUserEmail = useAddComponentAndServiceFlowStore((state) => state.setCurrentUserEmail);
  const resetFlow = useAddComponentAndServiceFlowStore((state) => state.resetFlow);

  // Memoize derived values to prevent unnecessary recalculations
  const productName = useMemo(
    () => productDetails?.name || 'Product',
    [productDetails?.name]
  );

  const handleNavigateToProducts = useCallback(() => {
    navigate(`${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}`, {
      replace: true,
    });
  }, [navigate]);

  const handleRedirectToProductDetails = useCallback(() => {
    if (!productId || !productDetails?.name) {
      handleNavigateToProducts();
      return;
    }

    navigate(
      `${ROUTES.COMPANY.BASE}${ROUTES.COMPANY.PRODUCTS}/${productId}`
    );
  }, [productId, productDetails, navigate, handleNavigateToProducts]);

  // Redirect if productId is missing
  useEffect(() => {
    if (!productId) {
      handleNavigateToProducts();
    }
  }, [productId, handleNavigateToProducts]);

  // Reset flow state on mount and cleanup on unmount
  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

  // Fetch supplier roles and company profile on mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      showSpinner();
      try {
        // Fetch supplier roles
        const rolesResponse = await getSupplierRoles();
        if (isMounted && rolesResponse.success && rolesResponse.data) {
          const roles = rolesResponse.data.map((role: SupplierRole) => ({
            id: role._id,
            name: role.role,
            slug: role.supplierRoleSlug,
          }));
          setSupplierRoles(roles);
        } else {
          showAlert(ERROR_MESSAGES.FAILED_TO_LOAD_SUPPLIER_ROLES, 'danger');
        }

        // Fetch company profile for current user email
        const profile = await getCompanyProfile();
        if (isMounted && profile.companyContactEmail) {
          setCurrentUserEmail(profile.companyContactEmail);
        }
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddComponentAndServiceFlow',
            method: 'fetchInitialData',
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
      } finally {
        if (isMounted) {
          hideSpinner();
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [showAlert, showSpinner, hideSpinner, setSupplierRoles, setCurrentUserEmail]);

  // Fetch product details when productId changes
  useEffect(() => {
    if (!productId) {
      setIsLoadingProduct(false);
      return;
    }

    const fetchProductDetails = async () => {
      setIsLoadingProduct(true);
      showSpinner();
      try {
        const response = await getProductDetails(productId);

        if (!response.success || !response.data) {
          showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
          handleNavigateToProducts();
          return;
        }

        setProductDetails(response.data);
        setIsLoadingProduct(false);
      } catch (error) {
        Bugsnag.notify(error as Error, (event) => {
          event.addMetadata('context', {
            component: 'AddComponentAndServiceFlow',
            method: 'fetchProductDetails',
            productId,
          });
        });
        showAlert(ERROR_MESSAGES.UNEXPECTED_ERROR, 'danger');
        handleNavigateToProducts();
      } finally {
        hideSpinner();
      }
    };

    fetchProductDetails();
  }, [productId, showAlert, showSpinner, hideSpinner, handleNavigateToProducts, setProductDetails, setIsLoadingProduct]);

  // Memoize current step content to prevent unnecessary re-renders
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case FLOW_STEPS.ADD_COMPONENT_OR_SERVICE:
        return (
          <AddComponenOrService
            productId={productId}
            onRedirectToProductDetails={handleRedirectToProductDetails}
          />
        );
      case FLOW_STEPS.SELECT_SUPPLIER_WITH_ROLE:
        return <SelectSupplierWithRole />;
      case FLOW_STEPS.ADD_SUPPLIER_DETAILS:
        return (
          <AddSupplierDetails
            onRedirectToProductDetails={handleRedirectToProductDetails}
          />
        );
      case FLOW_STEPS.SUMMARY:
        return (
          <Summary
            onRedirectToProductDetails={handleRedirectToProductDetails}
          />
        );
      case FLOW_STEPS.INTRODUCTION:
      default:
        return (
          <Introduction
            onRedirectToProductDetails={handleRedirectToProductDetails}
          />
        );
    }
  }, [currentStep, handleRedirectToProductDetails, productId]);

  // Memoize step navigation list to prevent unnecessary re-renders
  const stepNavigationList = useMemo(
    () =>
      STEP_CONFIG.map((config) => (
        <StepItem
          key={config.step}
          step={config.step}
          label={config.label}
          description={config.description}
          currentStep={currentStep}
        />
      )),
    [currentStep]
  );

  if (isLoadingProduct) {
    return null;
  }

  return (
    <>
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <button className={styles.breadcrumb} onClick={handleRedirectToProductDetails}>
          <img src={arrowLeftIcon} alt="" className={styles.arrowIcon} />
          <span>{productName}</span>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.layout}>
          {/* LEFT STEPPER */}
          <aside className={styles.stepSidebar}>
            <h3 className={styles.stepTitle}>
              Build Component or Service and Supplier Relationship
            </h3>

            <div className={styles.stepContainer}>
              <ul className={styles.stepList}>{stepNavigationList}</ul>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <section className={styles.mainPanel}>{stepContent}</section>
        </div>
      </div>
    </div>
    </>
  );
};

export default AddComponentAndServiceFlow;

