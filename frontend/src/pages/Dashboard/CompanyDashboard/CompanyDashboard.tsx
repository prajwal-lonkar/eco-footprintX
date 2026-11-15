import { lazy, Suspense, useEffect, useRef, useState } from "react";

import styles from "./CompanyDashboard.module.scss";
import icon1 from "@assets/images/box.svg";
import icon2 from "@assets/images/people.svg";
import logo from "@assets/images/logo.svg";
import { TbLogout2 } from "react-icons/tb";

import { useAuth } from "@hooks/useAuth";
import RouteLoader from "@common/RouteLoader/RouteLoader";

import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getCompanyProfile } from "@service/company.service";
import CommonModal from "@components/modals/CommonModal/CommonModal";
import logout from "@assets/icons/logout.svg";
import { ROUTES } from "@constants/routes";
import { USER_ROLES } from "@constants/auth";
import Bugsnag from "@utils/bugsnag";
import { ERROR_MESSAGES } from "@constants/messages";
import { useAlertStore } from "@store/useAlertStore";
import FeatureComingSoonModal from "@components/modals/FeatureComingSoonModal/FeatureComingSoonModal";

const Products = lazy(
  () => import("@pages/Dashboard/CompanyDashboard/Products/Products"),
);
const Suppliers = lazy(
  () => import("@pages/Dashboard/CompanyDashboard/Suppliers/Suppliers"),
);
const ViewProductDetails = lazy(
  () => import("./Products/ViewProductDetails/ViewProductDetails"),
);
const AddComponentAndServiceFlow = lazy(
  () =>
    import(
      "@pages/Dashboard/CompanyDashboard/AddComponentAndServiceFlow/AddComponentAndServiceFlow"
    ),
);
const BuiltEnviromentalProfileFlow = lazy(
  () =>
    import(
      "@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow"
    ),
);
const CompanyProfileDetails = lazy(
  () =>
    import(
      "@pages/Dashboard/CompanyDashboard/CompanyProfileDetails/CompanyProfileDetails"
    ),
);
const CompanyProfileEdit = lazy(
  () =>
    import(
      "@pages/Dashboard/CompanyDashboard/CompanyProfileEdit/CompanyProfileEdit"
    ),
);
const ComponentDetailPage = lazy(
  () =>
    import(
      "./Products/ViewProductDetails/SupplierTab/ComponentDetailPage/ComponentDetailPage"
    ),
);
const ProductRequestComponentDetail = lazy(
  () =>
    import(
      "@pages/Dashboard/SupplierDashboard/ComponentDetails/ComponentDetails"
    ),
);
const BuiltEnviromentalProfileFlowSupplier = lazy(
  () =>
    import(
      "@pages/Dashboard/SupplierDashboard/BuiltEnviromentalProfileFlow/BuiltEnviromentalProfileFlow"
    ),
);
const GoogleMapsProvider = lazy(
  () => import("@common/GoogleMapsProvider/GoogleMapsProvider"),
);

const CompanyDashboard = () => {
  const { handleLogout } = useAuth();
  const location = useLocation();
  const suppliersNavRef = useRef(false);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { showAlert } = useAlertStore();
  const [companyProfile, setCompanyProfile] = useState<{
    companyContactName?: string;
    companyContactEmail?: string;
  }>({});
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const fetchProfile = async () => {
    try {
      const data = await getCompanyProfile();
      setCompanyProfile({
        companyContactName: data.companyContactName,
        companyContactEmail: data.companyContactEmail,
      });
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata("context", {
          component: "CompanyDashboard",
          method: "fetchProfile",
        });
      });

      showAlert(ERROR_MESSAGES.PROFILE_FETCH_FAILED, "danger");
    }
  };

  // Load profile on dashboard mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Refresh method passed to Edit page
  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    if (!suppliersNavRef.current) {
      setShowSupplierModal(false);
    }

    // reset after handling
    suppliersNavRef.current = false;
  }, [location.pathname]);
  return (
    <>
      <div className={styles.mainWrapper}>
        <div className={styles.sideNav}>
          <div className={styles.sideNavTop}>
            <div className={styles.sideNavHeader}>
              <img src={logo} alt="logo" width="36" height="36" />
              <h1 className={styles.title}>Eco FootprintX</h1>
            </div>
            <div className={styles.sideNavContent}>
              <div className={styles.buttonwrapper}>
                <NavLink
                  to={ROUTES.COMPANY.BASE + ROUTES.COMPANY.PRODUCTS}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
                >
                  <img src={icon1} alt="icon" />
                  Products
                </NavLink>
              </div>
              <div className={styles.buttonwrapper}>
                <NavLink
                  to={ROUTES.COMPANY.BASE + ROUTES.COMPANY.SUPPLIERS}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => {
                    suppliersNavRef.current = true;
                    setShowSupplierModal(true);
                  }}
                >
                  <img src={icon2} alt="icon" />
                  Suppliers
                </NavLink>
              </div>
            </div>
          </div>
          <div className={styles.sideNavBottom}>
            <button
              className={styles.linkLogout}
              onClick={() => setShowLogoutModal(true)}
            >
              <span className={styles.icon}>
                <TbLogout2 />
              </span>
              Logout
            </button>

            <div
              className={styles.profile}
              onClick={() =>
                navigate(ROUTES.COMPANY.BASE + ROUTES.COMPANY.PROFILE_VIEW)
              }
            >
              <div className={styles.profileContent}>
                <h1>{companyProfile.companyContactName}</h1>
                <h2>{companyProfile.companyContactEmail}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.workspace}>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route
                index
                element={
                  <Navigate
                    to={ROUTES.COMPANY.BASE + ROUTES.COMPANY.PRODUCTS}
                    replace
                  />
                }
              />

              <Route path={ROUTES.COMPANY.PRODUCTS} element={<Products />} />
              <Route path={ROUTES.COMPANY.SUPPLIERS} element={<Suppliers />} />
              <Route
                path={ROUTES.COMPANY.PRODUCTS + "/:productId"}
                element={<ViewProductDetails />}
              />
              <Route
                path={
                  ROUTES.COMPANY.PRODUCTS +
                  "/:productId" +
                  ROUTES.COMPONENT.BASE +
                  "/new"
                }
                element={
                  <GoogleMapsProvider>
                    <AddComponentAndServiceFlow />
                  </GoogleMapsProvider>
                }
              />
              <Route
                path={
                  ROUTES.COMPANY.PRODUCTS +
                  "/:productId" +
                  ROUTES.COMPONENT.BASE +
                  "/:componentId" +
                  ROUTES.ROLE.BASE +
                  "/:roleSlug" +
                  ROUTES.ENV_PROFILE.BASE +
                  "/new"
                }
                element={
                  <GoogleMapsProvider>
                    <BuiltEnviromentalProfileFlow />
                  </GoogleMapsProvider>
                }
              />
              <Route
                path={
                  ROUTES.COMPANY.PRODUCT_REQUEST_COMPONENT_DETAIL +
                  "/:productId/:componentId/:supplierRoleSlug"
                }
                element={
                  <ProductRequestComponentDetail
                    userRole={USER_ROLES.COMPANY}
                  />
                }
              />
              <Route
                path={
                  ROUTES.COMPANY.PRODUCTS +
                  "/:productId" +
                  ROUTES.COMPONENT.BASE +
                  "/:componentId" +
                  ROUTES.ROLE.BASE +
                  "/:supplierRoleSlug"
                }
                element={<ComponentDetailPage />}
              />
              <Route
                path={ROUTES.COMPANY.PROFILE_VIEW}
                element={
                  <CompanyProfileDetails
                    onEdit={() =>
                      navigate(
                        ROUTES.COMPANY.BASE + ROUTES.COMPANY.PROFILE_EDIT,
                      )
                    }
                  />
                }
              />
              <Route
                path={ROUTES.COMPANY.PROFILE_EDIT}
                element={
                  <CompanyProfileEdit
                    onBack={() =>
                      navigate(
                        ROUTES.COMPANY.BASE + ROUTES.COMPANY.PROFILE_VIEW,
                      )
                    }
                    onProfileUpdate={refreshProfile}
                  />
                }
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to={ROUTES.COMPANY.BASE + ROUTES.COMPANY.PRODUCTS}
                    replace
                  />
                }
              />

              <Route
                path={
                  ROUTES.COMPANY.PRODUCTS +
                  "/:productId" +
                  ROUTES.COMPONENT.BASE +
                  "/:componentId" +
                  ROUTES.ROLE.BASE +
                  "/:supplierRoleSlug" +
                  ROUTES.ENV_PROFILE.BASE
                }
                element={<BuiltEnviromentalProfileFlowSupplier />}
              />
            </Routes>
          </Suspense>
        </div>
      </div>

      {showLogoutModal && (
        <CommonModal
          icon={logout}
          title="Confirm Logout"
          message="Are you sure you want to logout from the platform?"
          cancelText="Cancel"
          confirmText="Logout"
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={async () => {
            await handleLogout();
            setShowLogoutModal(false);
          }}
          confirmBtnClass={styles.logoutButton}
        />
      )}
      {showSupplierModal && (
        <FeatureComingSoonModal
          title="Suppliers Tab"
          message="This tab will be coming soon"
          goBackBtnText="Go Back"
          GoBack={() => {
            setShowSupplierModal(false);
            navigate(-1);
          }}
        />
      )}
    </>
  );
};

export default CompanyDashboard;
