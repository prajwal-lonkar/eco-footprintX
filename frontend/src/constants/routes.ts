export const ROUTES = {
  DASHBOARD: '/',
  COMPANY: {
    BASE: '/company-dashboard',
    PRODUCTS: '/products',
    SUPPLIERS: '/suppliers',
    PROFILE_VIEW: '/profile-view',
    PROFILE_EDIT: '/profile-edit',
    PRODUCT_REQUEST_COMPONENT_DETAIL: '/product-request-component-detail',
  },
  SUPPLIER: {
    BASE: '/supplier-dashboard',
    COMPONENT_AND_SERVICES: '/component-and-services',
    SUPPLIERS: '/suppliers',
    PROFILE_VIEW: '/profile-view',
    PROFILE_EDIT: '/profile-edit',
  },
  AUTH: {
    LOGIN: '/login',
    SIGN_UP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  ROLE: {
    BASE: '/roles',
  },
  
  COMPONENT: {
    BASE: '/components',
  },
  ENV_PROFILE: {
    BASE:'/env-profile',
  },
  NOT_FOUND: '*',
} as const;
 
