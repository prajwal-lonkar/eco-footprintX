export const SUCCESS_MESSAGES = {
  RESET_PASSWORD_SUCCESS:
    "Your password has been reset successfully. You can login into portal to get started.",
  EMAIL_SENT_FOR_PASSWORD_RESET:
    "We’ve sent a password reset link to the email associated with this account.",
  ACCOUNT_CREATED_SUCCESSFULLY: "Account has been created successfully.",
  OTP_SENT_SUCCESSFULLY: "OTP has been sent to your email.",
  PROFILE_SAVE_CHANGES: "Changes have been saved successfully!",
  PROFILE_CHNAGES_DISCARDED: "Changes have been discarded successfully!",
  PRODUCT_ADDED_SUCCESSFULLY: "Product has been added successfully!",
  PRODUCT_DELETED_SUCCESSFULLY: "Product has been deleted successfully!",
  IMAGE_DELETED_SUCCESSFULLY: "Image has been deleted successfully!",

  PRODUCT_UPDATED_SUCCESSFULLY: "Product has been updated successfully!",
  RECYCLE_INSTRUCTION_ADDED_SUCCESSFULLY:
    "Recycling instruction added successfully",
  RECYCLE_INSTRUCTION_UPDATE_UCCESSFULLY:
    "Recycling instruction updated successfully",
  RECYCLE_INSTRUCTION_DELETED_SUCCESSFULLY:
    "Recycling instruction deleted successfully",
  SUPPLIER_DETAILS_SAVED_SUCCESSFULLY: "Supplier details saved successfully.",

  ENVIRONMENTAL_PROFILE_SAVED_SUCCESSFULLY:
    "Environmental profile saved successfully.",

  CONSUMER_URL_COPIED_SUCCESSFULLY: "Consumer URL copied to clipboard",
  PUBLISH_IMPACT_CATEGORY_SUCCESSFULLY:
    "Impact category has been published successfully!",
  PUBLISH_IMPACT_CATEGORY_AND_COPY_URL_SUCCESSFULLY:
    "Impact category has been published successfully and consumer URL copied to clipboard!",
  UNPUBLISH_IMPACT_CATEGORY_SUCCESSFULLY:
    "Impact category has been unpublished successfully!",
  COMPONENT_DELETED_SUCCESSFULLY: "Component has been deleted successfully!",

  REQUESTDATA_EMAIL_TO_SUPPLIER_SENT_SUCCESSFULLY:
    "Email request has been sent to supplier successfully!",
  REQUESTDATA_UPDATED_EMAIL_TO_SUPPLIER_SENT_SUCCESSFULLY:
    "Email request has been updated successfully!",
  INDUSTRY_BENCHMARKING_SAVED_SUCCESSFULLY:
    "Industry benchmarking data saved successfully.",
  SUBSCRIPTION_UPGRADED_SUCCESSFULLY: "Subscription upgraded successfully.",
};
export const ERROR_MESSAGES = {
  FAILED_TO_VERIFY_EMAIL_ELIGIBILITY:
    "Failed to verify email eligibility. Please try again.",
  FAILED_TO_CREATE_ACCOUNT: "Failed to create account. Please try again.",
  FAILED_TO_SEND_OTP: "Failed to send OTP. Please try again.",
  SESSION_EXPIRED: "Session expired",
  LOGIN_FAILED: "Login failed. Please check your credentials.",
  UNEXPECTED_ERROR: "An unexpected error occurred.",
  PASSWORD_DO_NOT_MATCH: "Passwords do not match.",
  RESET_LINK_EXPIRED: "This password reset link has expired.",
  RESET_LINK_INVALID: "This password reset link is invalid.",
  RESET_LINK_ALREADY_USED: "Reset Link Already Used.",
  PASSWORD_DO_NOT_MEET_REQUIREMENTS:
    "Password does not meet requirements. Please try again.",
  RESET_PASSWORD_ERROR:
    "There was an error while reseting password. Please try again.",
  INVALID_EMAIL_FORMAT: "Invalid email format, Please enter a valid ID.",
  EMAIL_ALREADY_EXISTS: "Email already exists.",
  NO_ACCOUNT_FOUND_WITH_EMAIL_ID:
    "No account found with that email ID. Please check and try again.",
  RESET_LINK_RECENTLY_SENT:
    "A reset link was recently sent. Please wait a few minutes before requesting another.",
  USER_NOT_FOUND: "User not found",
  ACCOUNT_INACTIVE: "Account inactive. Please contact emma@betterworldtech.co",
  USER_ACCOUNT_BLOCKED:
    "Account has been blocked. Please contact subscriptions@ecofootprintx.tech for support.",
  SAME_PASSWORD_USED:
    "Choose a new password that is different from your previous one.",
  INCORRECT_PASSWORD: "Incorrect Password. Please try again.",
  REQUIRED_COMPANY_NAME: "Company name is required.",
  COMPANY_NAME_TOO_LONG: "Company name cannot exceed 100 characters.",
  INVALID_ALPHANUMERIC_NAME:
    "Please enter a valid name using only letters and spaces.",
  REQUIRED_CONTACT_NAME: "Contact name is required.",
  CONTACT_NAME_TOO_LONG: "Contact name cannot exceed 100 characters.",
  REQUIRED_REGISTRATION_NUMBER: "Registration number is required.",
  REQUIRED_COMPANY_REGISTRATION_NUMBER:
    "Company registration number is required.",
  ROLE_SLUG_REQUIRED: "Role slug is required.",
  COMPONENT_NOT_FOUND: "Failed to load component. Please try again.",
  INVALID_REGISTRATION_NUMBER:
    "Company Registration number can only contain letters and numbers.",
  REGISTRATION_NUMBER_TOO_LONG:
    "Company Registration number cannot exceed 30 characters.",
  REQUIRED_ADDRESS: "Address is required.",
  ADDRESS_TOO_LONG: "Address must be less than 150 characters.",
  REQUIRED_INDUSTRY: "Please select an industry.",
  REQUIRED_COMPANY_TYPE: "Please select a company type.",
  INVALID_WEBSITE: "Invalid URL format. Enter a valid website address.",
  INVALID_DUNS_NUMBER: "Invalid format. Please use numbers and hyphens only.",
  FAILED_TO_PUBLISH_IMPACT_CATEGORY:
    "Failed to publish impact category. Please try again.",
  DUNS_NUMBER_INVALID_LENGTH: "D-U-N-S Number must be a 9-digit number.",
  INCORRECT_OTP: "incorrect OTP code, please try again",
  PROFILE_FAILE_TO_SAVE_CHANGES:
    "Changes have not been saved, please try again.",
  PROFILE_FETCH_FAILED: "Failed to fetch company profile details.",
  FETCH_INDUSTRY_TYPES_FAILED: "Failed to fetch industry types.",
  FETCH_COMPANY_TYPES_FAILED: "Failed to fetch company types.",
  LEADING_TRAILING_SPACES: "Leading or trailing spaces are not allowed.",
  LEADING_TRAILING_HYPHEN: "Leading or trailing hyphens are not allowed.",
  PRODUCT_NAME_REQUIRED: "Product name is required.",
  PRODUCT_NAME_TOO_LONG: "Product name must be between 3 and 150 characters.",
  INVALID_PRODUCT_NAME: "Invalid Product name",
  GTIN_REQUIRED: "GTIN is required.",
  INVALID_GTIN: "Invalid GTIN.",
  GTIN_TOO_LONG: "GTIN cannot exceed 30 digits.",
  NET_UNITSIZE_REQUIRED: "Net unit size is required.",
  NET_UNITSIZE_TOO_LONG: "Net unit size cannot exceed 15 characters.",
  FLOOR_AREA_REQUIRED: "Floor Area Required per Unit of One SKU is required.",
  UNIT_OF_MEASUREMENT_REQUIRED: "Unit of measurement is required.",
  UNIT_OF_MEASUREMENT_INVALID: "Invalid unit selected.",
  CUSTOM_UNIT_OF_MEASUREMENT_TOO_LONG:
    "Unit of measurement can not exceed 5 characters.",
  INTERNAL_SKU_REQUIRED: "Internal SKU is required.",
  INTERNAL_SKU_TOO_LONG: " Internal SKU must be between 3 and 50 characters.",
  INTERNAL_SKU_INVALID:
    "Special characters not allowed (Except hyphen or underscore)",
  INTERNAL_SKU_EXISTS: "Internal SKU already exists",
  GTIN_EXISTS: "GTIN Already exists",
  PRODUCT_CATEGORY_TOO_LONG: "Product category cannot exceed 50 characters.",
  PRODUCT_CATEGORY_REQUIRED: "Product category is required.",
  BATCH_NUMBER_REQUIRED: "Batch number is required.",
  BATCH_NUMBER_INVALID: "Invalid batch number format",
  BATCH_NUMBER_TOO_LONG: "Batch number cannot exceed 20 characters.",
  PRODUCT_DESCRIPTION_REQUIRED: "Product description is required.",
  PRODUCT_DESCRIPTION_TOO_LONG:
    "Product description cannot exceed 500 characters.",
  COMPARISON_PRODUCT_DESCRIPTION_REQUIRED:
    "Comparison product category description is required.",
  COMPARISON_PRODUCT_DESCRIPTION_TOO_LONG:
    "Comparison product category description cannot exceed 500 characters.",
  IMAGE_UPLOAD_FAILED: "Failed to upload product image. Please try again.",
  IMAGE_INVALID_FORMAT:
    "Image upload failed. Please upload a JPG, JPEG, PNG, or WEBP file that is under 5MB.",
  PRODUCT_ADD_FAILED: "Product could not be added, please try again.",
  PRODUCT_UPDATE_FAILED: "Product could not be updated, please try again.",
  USER_STATE_MISSING:
    "User information is missing. Please try logging in again.",
  USER_ROLE_MISSING: "User role is missing. Please try logging in again.",

  FAILED_TO_LOAD_PRODUCTS: "Failed to load products.",
  FAILED_TO_DELETE_PRODUCT: "Failed to delete product. Please try again.",
  FAILED_TO_DELETE_IMAGE: "Failed to delete product image. Please try again.",
  COMPONENT_NAME_REQUIRED: "Component or Service Name is required.",
  COMPONENT_NAME_INVALID:
    "Component or Service Name contains invalid characters. Please use only letters, numbers, and standard special characters.",
  COMPONENT_SKU_REQUIRED: "Internal SKU is required.",
  COMPONENT_SKU_EXISTS:
    "A component or service with this SKU code already exists. Please enter a unique SKU code",
  COMPONENT_SKU_INVALID:
    "SKU can only contain letters, numbers, spaces, underscores, and hyphens",
  COMPONENT_SEARCH_FAILED: "Failed to search components. Please try again.",
  COMPONENT_CREATE_FAILED: "Failed to create component. Please try again.",
  PRODUCT_ID_REQUIRED: "Product ID is required.",
  COMPONENT_SELECTION_REQUIRED: "Please select a component or service.",
  INVALID_SEARCH_QUERY: "Search query is invalid",
  SELECT_UNIT_OF_MEASURE: "Please select a unit of measure",
  SUPPLIER_REGISTRATION_NUMBER_EXISTS:
    "A supplier with this registration number already exists.",
  COMPANY_REGISTRATION_NUMBER_EXISTS:
    "A company with this registration number already exists.",
  CANNOT_USE_OWN_EMAIL:
    "Cannot use your own email address associated with your current Eco FootprintX account.",
  REQUIRED_SUPPLIER_NAME: "Supplier name is required.",
  INVALID_SUPPLIER_NAME: "Invalid Supplier name.",
  SUPPLIER_NAME_TO_LONG: "Supplier Name cannot exceed 150 characters.",
  FAILED_TO_ASSIGN_SUPPLIER: "Failed to assign supplier. Please try again.",
  FAILED_TO_LOAD_SUPPLIER_ROLES:
    "Failed to load supplier roles. Please try again.",
  FAILED_TO_SEARCH_SUPPLIERS: "Failed to search suppliers. Please try again.",
  COMPONENT_NAME_TOO_LONG: "Component Name cannot exceed 150 characters",
  DISPOSAL_INSTRUCTION_TOO_LONG:
    "Disposal Instructions cannot exceed 150 characters",
  FAILED_TO_UPDATE_RECYCLE_INSTRUCTION:
    "Failed to update recycling instruction. Please try again.",
  FAILED_TO_ADD_RECYCLE_INSTRUCTION:
    "Failed to add recycling instruction. Please try again.",
  FAILED_TO_DELETE_INSTRUCTION:
    "Failed to delete recycling instruction. Please try again.",

  FAILED_TO_SEARCH_PLACES: "Failed to search places. Please try again.",
  FAILED_TO_SAVE_SUPPLIER_DETAILS:
    "Failed to save supplier details. Please try again.",
  SUPPLIER_LOCATION_REQUIRED: "Supplier location is required.",
  TRANSPORT_METHOD_REQUIRED: "Transport Method is required.",
  INVALID_TRANSPORT_METHOD_FOR_SELECTED_ROUTE:
    "This transport method cannot be used for the selected origin and destination. Please choose a different transport method",
  TRANSPORT_ORIGIN_REQUIRED: "Transport Origin is required.",
  TRANSPORT_DESTINATION_REQUIRED: "Transport Destination is required.",
  STORAGE_TYPE_REQUIRED: "Storage Type is required.",
  TARGET_COOLING_TEMPRETURE_REQUIRED: "Target Cooling Temperature is required.",
  TARGET_HEATING_TEMPRETURE_REQUIRED: "Target Heating Temperature is required.",
  CURRENT_TEMPRETURE_REQUIRED: "Current Temperature is required.",
  NUMBER_OF_LABELS_PER_SKU_REQUIRED:
    "Number of Labels Applied per Unit is required.",
  STORAGE_DAYS_REQUIRED: "Storage Days is required.",
  TRANSPORT_REGION_REQUIRED: "Transport Region is required.",
  LCIA_METHODOLOGY_REQUIRED: "LCIA Methodology is required.",
  STORAGE_DAYS_RANGE_EXCEEDED: "Storage Days must be between 1 and 999 days.",

  VOLUME_PER_UNIT_OF_ONE_SKU_REQUIRED:
    "Volume per Unit of One SKU is required.",
  NET_WEIGHT_OF_COMPONENT_USED_PER_SKU_REQUIRED:
    "Net Weight of Component Used per SKU is required.",
  NET_WEIGHT_PER_UNIT_TRANSPORTED_REQUIRED:
    "Net Weight Per Unit Transported is required.",
  ACTIVITY_DESCRIPTION_REQUIRED: "Activity Description is required.",
  ACTIVITY_DESCRIPTION_TOO_LONG:
    "Activity Description cannot exceed 300 characters.",
  WEIGHT_VOLUME_RANGE_EXCEEDED: "Value must be between 0.001 and 99999.",
  CURRENT_TEMPERATURE_RANGE_EXCEEDED:
    "Current Temperature must be between -50°C and 500°C.",
  TARGET_HEATING_TEMPERATURE_RANGE_EXCEEDED:
    "Target Heating Temperature must be between 0°C and 500°C.",
  TARGET_COOLING_TEMPERATURE_RANGE_EXCEEDED:
    "Target Cooling Temperature must be between -100°C and 100°C.",
  TARGET_HEATING_TEMPERATURE_COMPARISON:
    "Target heating temperature must be higher than the current temperature",
  TARGET_COOLING_TEMPERATURE_COMPARISON:
    "Target cooling temperature must be lower than the current temperature",
  LABEL_PER_SKU_RANGE_EXCEEDED: "Number of labels must be between 1 and 100.",
  ONLY_ONE_DECIMAL_ALLOWED: "only one decimal point is allowed",
  DECIMAL_NOT_ALLOWED: "Decimal is not allowed.",
  ONLY_THREE_DECIMAL_ALLOWED: "only up to three decimal places are allowed.",
  FAILED_TO_LOAD_COMPONENT:
    "Failed to load component details. Please try again.",
  FAILED_TO_SAVE_ENVIRONMENTAL_PROFILE:
    "Failed to save environmental profile. Please try again.",

  FAILED_TO_COPY_CONSUMER_URL: "Failed to copy consumer URL",
  FAILED_TO_FAITCH_PRODUCT: "Failed to fetch product",
  FAILED_TO_DELETE_COMPONENT: "Failed to delete component. Please try again.",
  IMPACTVALUE_REQUIRED: "Value is required",
  IMPACTVALUE_TOO_LONG: "Value cannot exceed 15 characters",

  OFFSETVALUE_REQUIRED: "Offset Value is required",
  OFFSETVALUE_TOO_LONG: "Offset Value cannot exceed 15 characters",
  FAILED_TO_SAVE_IMPACT_CATEGORY: "Failed to save data. Please try again.",
  FAILED_TO_LOAD_CATEGORY:
    "Failed to load impact category details. Please try again.",
  FAILED_TO_LOAD_PRODUCT_REQUESTS:
    "Failed to load product requests. Please try again.",
  CAS_NUMBER_REQUIRED: "CAS Number is required.",

  EMAIL_REQUEST_ALREADY_SENT:
    "An email request has already been sent to this supplier",

  IMPACT_MIN_VALUE_REQUIRED: "Value must be at least 0.00000001",
  IMPACT_MAX_VALUE_REQUIRED: "Value cannot exceed 1,000,000",
  IMPACT_DECIMAL_VALUE_REQUIRED: "Value can have up to 8 decimal places",

  IMPACT_MIN_OFFSETVALUE_REQUIRED: "Offset Value must be at least 0.00000001",
  IMPACT_MAX_OFFSETVALUE_REQUIRED: "Offset Value cannot exceed 1,000,000",
  IMPACT_DECIMAL_OFFSETVALUE_REQUIRED:
    "Offeset Value can have up to 8 decimal places",
  FAILED_TO_FETCH_INDUSTRY_BENCHMARKING_DATA:
    "Failed to fetch industry benchmarking data. Please try again.",
  FAILED_TO_SAVE_INDUSTRY_BENCHMARKING_DATA:
    "Failed to save industry benchmarking data. Please try again.",
  FAILED_TO_FETCH_VALUE_AFTER_SAVE:
    "Failed to fetch value after saving data. Please try again.",
  FAILED_TO_FETCH_SUBSCRIPTIONS:
    "Failed to fetch subscription plans. Please try again.",
  FAILED_TO_UPGRADE_SUBSCRIPTION:
    "Failed to upgrade subscription. Please try again.",
  USE_OUR_DATABASE_NO_RESULTS_MESSAGE:
    "Try searching by synonyms or INCI name. Otherwise, change\nyour data source for this Impact Category",
  USE_OUR_DATABASE_SEARCH_ERROR_MESSAGE:
    "We're unable to retrieve search results right now. Please try\nagain later, or change your data source for this Impact\nCategory",
};
