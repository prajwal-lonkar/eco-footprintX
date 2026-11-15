import React from "react";
import { useLocation } from "react-router-dom";
import styles from "./AuthLayout.module.scss";
import logo from "@assets/images/be-logo.svg";
import { ROUTES } from "@constants/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isSignUpPage = location.pathname === ROUTES.AUTH.SIGN_UP;

  return (
    <div className={styles.container}>
      <div className={styles.brand}>
        {/* Left Section */}
        <div className={styles.left}>
          <div className={styles.leftContent}>
            <div className={styles.logoCircle}>
              <img src={logo} alt="logo" />
            </div>
            <div className={styles.brandHeading}>
              <h2>Eco FootprintX</h2>
              <span>Think Smart. Manufacture Sustainably.</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.right}>
          <div className={styles.scrollWrapperParent}>
            <div
              className={`${styles.scrollWrapper} ${
                isSignUpPage ? styles.scrollWrapperFlexStart : ""
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
