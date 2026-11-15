import { lazy, Suspense, useEffect, useState } from "react";

import styles from "../CompanyDashboard/CompanyDashboard.module.scss";
import icon1 from "@assets/images/box.svg";
import icon2 from "@assets/images/people.svg";
import logo from "@assets/images/logo.svg";
import { TbLogout2 } from "react-icons/tb";

import { useAuth } from "@hooks/useAuth";
import RouteLoader from "@common/RouteLoader/RouteLoader";

import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { getCompanyProfile } from "@service/company.service";
import CommonModal from "@components/modals/CommonModal/CommonModal";
import logout from "@assets/icons/logout.svg";
import { ROUTES } from "@constants/routes";

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
const ComponentAndServices = lazy(
  () => import("./ComponentAndServices/ComponentAndServices"),
);
const ComponentDetails = lazy(
  () => import("./ComponentDetails/ComponentDetails"),
);
const Supplier = lazy(() => import("./Suppliers/Supplier"));
const BuiltEnviromentalProfileFlow = lazy(
  () => import("./BuiltEnviromentalProfileFlow"),
);

const SupplierDashboard = () => {
  const { handleLogout } = useAuth();

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<{
    companyContactName?: string;
    companyContactEmail?: string;
  }>({});

  const fetchProfile = async () => {
    try {
      const data = await getCompanyProfile();
      setCompanyProfile({
        companyContactName: data.companyContactName,
        companyContactEmail: data.companyContactEmail,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
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
                  to={
                    ROUTES.SUPPLIER.BASE +
                    ROUTES.SUPPLIER.COMPONENT_AND_SERVICES
                  }
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
                  to={ROUTES.SUPPLIER.BASE + ROUTES.SUPPLIER.SUPPLIERS}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
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
                navigate(ROUTES.SUPPLIER.BASE + ROUTES.SUPPLIER.PROFILE_VIEW)
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
                path={ROUTES.SUPPLIER.COMPONENT_AND_SERVICES}
                element={<ComponentAndServices />}
              />
              <Route path={ROUTES.SUPPLIER.SUPPLIERS} element={<Supplier />} />
              <Route
                path={ROUTES.SUPPLIER.PROFILE_VIEW}
                element={
                  <CompanyProfileDetails
                    onEdit={() =>
                      navigate(
                        ROUTES.SUPPLIER.BASE + ROUTES.SUPPLIER.PROFILE_EDIT,
                      )
                    }
                  />
                }
              />

              <Route
                path={ROUTES.SUPPLIER.PROFILE_EDIT}
                element={
                  <CompanyProfileEdit
                    onBack={() =>
                      navigate(
                        ROUTES.SUPPLIER.BASE + ROUTES.SUPPLIER.PROFILE_VIEW,
                      )
                    }
                    onProfileUpdate={refreshProfile}
                  />
                }
              />
              <Route
                path={
                  ROUTES.SUPPLIER.COMPONENT_AND_SERVICES +
                  "/:productId/:componentId/:supplierRoleSlug"
                }
                element={<ComponentDetails />}
              />

              <Route
                path={
                  ROUTES.SUPPLIER.COMPONENT_AND_SERVICES +
                  "/:productId" +
                  ROUTES.COMPONENT.BASE +
                  "/:componentId" +
                  ROUTES.ROLE.BASE +
                  "/:supplierRoleSlug" +
                  ROUTES.ENV_PROFILE.BASE +
                  "/new"
                }
                element={<BuiltEnviromentalProfileFlow />}
              />
              <Route
                path="*"
                element={
                  <Navigate
                    to={
                      ROUTES.SUPPLIER.BASE +
                      ROUTES.SUPPLIER.COMPONENT_AND_SERVICES
                    }
                    replace
                  />
                }
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
    </>
  );
};

export default SupplierDashboard;
