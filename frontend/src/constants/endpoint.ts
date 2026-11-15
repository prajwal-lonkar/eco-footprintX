export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    FORGOT_PASSWORD: '/api/v1/users/resetPasswordEmail',
    RESET_PASSWORD: '/api/v1/users/resetPassword',
  },
  USERS: {
    CREATE: '/api/v1/users/create',
    VERIFY_WHITELISTED_EMAIL: '/api/v1/users/check-eligibility',
    COMPANY_TYPES: '/api/v1/users/company-types',
    INDUSTRY_TYPES: '/api/v1/users/industry-types',
    SEND_OTP: '/api/v1/users/send-otp',
    VERIFY_OTP: '/api/v1/users/verify-otp',
    CHECK_REGISTRATION_NUMBER: '/api/v1/users/check-registration-number',
    CHECK_EMAIL_EXIST: (email: string, componentName: string) =>
      `/api/v1/products/check-email?email=${email}&componentName=${componentName}`,
    UPGRADE_SUBSCRIPTION: '/api/v1/users/subscription',
    GET_SUBSCRIPTIONS: '/api/v1/users/subscriptions',
  },
  PROFILE: {
    GET: '/api/v1/users/profile',
    UPDATE: '/api/v1/users/profile',
  },
  PRODUCTS: {
    UPLOAD_IMAGE: '/api/v1/products/image/upload-url',
    ADD_PRODUCT: '/api/v1/products/create',
    GET_PRODUCT_LISTS: '/api/v1/products/list',
    DELETE_PRODUCT: '/api/v1/products/product',
    EDIT_PRODUCT: '/api/v1/products/product',
    VIEW_PRODUCT_DETAIL: '/api/v1/products/product',
    DELETE_IMAGE: '/api/v1/products/product',
    GET_PRODUCT: (productId: string) => `/api/v1/products/product/${productId}`,
    ADD_COMPONENT: (productId: string) =>
      `/api/v1/products/${productId}/component`,
    DELETE_COMPONENT: (
      productId: string,
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/${productId}/component/${componentId}?supplierRoleSlug=${supplierRoleSlug}`,

    SEARCH_COMPONENTS: '/api/v1/products/search',

    GET_SUPPLIERTAB_LIST: (productId: string) =>
      `/api/v1/products/${productId}/components/suppliers`,
    SAVE_SUPPLIER_DETAILS: (componentId: string) =>
      `/api/v1/products/component/${componentId}/supplier`,
    CALCULATE_DISTANCE: (componentId: string, roleSlug: string) =>
      `/api/v1/products/component/${componentId}/calculate-distance?roleSlug=${encodeURIComponent(roleSlug)}`,
    GET_COMPONENT_DETAILS: (
      productId: string,
      componentId: string,
      supplierRoleSlug: string,
      roleSlug: string
    ) =>
      `/api/v1/products/${productId}/component/${componentId}?supplierRoleSlug=${supplierRoleSlug}&roleSlug=${roleSlug}`,
    GET_PRODUCT_REQUESTS: (productId: string) =>
      `/api/v1/products/product/${productId}/requests`,
    SAVE_BUILT_ENVIRONMENTAL_PROFILE: (componentId: string) =>
      `/api/v1/products/component/${componentId}/complete-supplier-details`,
    SAVE_ADD_IMPACT_CATEGORY: (componentId: string, productId: string) =>
      `/api/v1/products/components/${componentId}/impact-category/${productId}`,
    SAVE_IMPACT_CATEGORY_DATABASE_VALUE: (
      componentId: string,
      roleDetailsId: string
    ) =>
      `/api/v1/products/components/${componentId}/impact-category/database-value/${roleDetailsId}`,
    GET_BUILT_ENVIRONMENTAL_SUMMARY: (
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/components/${componentId}/impact-category/${supplierRoleSlug}`,
    GET_COMPONENT_IMPACT_SUMMARY: (
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/components/${componentId}/impact-summary/${supplierRoleSlug}`,
    PATCH_IMPACT_CATEGORY_SUBMIT: (componentId: string, roleSlug: string) =>
      `/api/v1/products/component/${componentId}/impact-category/${roleSlug}`,
    PATCH_APPROVE_REJECT_SUPPLIER_SUBMISSION: (
      componentId: string,
      roleSlug: string
    ) => `/api/v1/products/components/${componentId}/impact-category/${roleSlug}/approve-reject`,
    GET_IMPACT_SUMMARY: (productId: string) =>
      `/api/v1/products/product/${productId}/impact-summary`,
    PATCH_IMPACT_CATEGORY: (productId: string, category: string) =>
      `/api/v1/products/product/${productId}/impact-category?category=${category}`,
    GET_INDUSTRY_BENCHMARKING_DATA: '/api/v1/products/master-data/search',
    SAVE_INDUSTRY_BENCHMARKING_DATA: (
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/component/${componentId}/bench-marking?supplierRoleSlug=${supplierRoleSlug}`,
    GET_INDUSTRY_BENCHMARKING_DETAILS: (
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/component/${componentId}/bench-marking?supplierRoleSlug=${supplierRoleSlug}`,
  },
  SUPPLIERS: {
    GET_SUPPLIERS: '/api/v1/users/suppliers',
    SEARCH_SUPPLIERS: '/api/v1/products/suppliers/search',
    GET_SUPPLIER_ROLES: '/api/v1/users/supplier-roles',
    GET_IMPACT_CATEGORY_REQUESTS:
      '/api/v1/users/supplier/impact-category-request',
    GET_BUILT_ENVIRONMENTAL_SUPPLIER_SUMMARY: (
      componentId: string,
      supplierRoleSlug: string
    ) =>
      `/api/v1/products/components/${componentId}/impact-category/${supplierRoleSlug}?userRoleSlug=supplier_user`,
  },

  GEOGRAPHY: {
    GET_GEOGRAPHIES: '/api/v1/products/geography/search',
  },
  CONSUMER_PROFILE: {
    GET_PRODUCT: '/api/v1/products/view-product',
  },
};

export const PUBLIC_ENDPOINTS = [
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REFRESH,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.RESET_PASSWORD,
  ENDPOINTS.USERS.CREATE,
  ENDPOINTS.USERS.VERIFY_WHITELISTED_EMAIL,
  ENDPOINTS.USERS.SEND_OTP,
  ENDPOINTS.USERS.VERIFY_OTP,
  ENDPOINTS.USERS.COMPANY_TYPES,
  ENDPOINTS.USERS.INDUSTRY_TYPES,
];
