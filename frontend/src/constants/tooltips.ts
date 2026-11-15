export const TOOLTIP_TEXT = {
  COMPANY_REGISTRATION_NUMBER:
    "The official registration number of the Supplier's company, as issued by their national business registry (e.g. Companies House number in the UK)",
  SUPPLIER_ROLE_COMPANY_VIEW:
    "The role of your supplier in your product's supply chain for this component or service",
  INTERNAL_SKU:
    'A unique identifier assigned by your company to track a component or service in your internal systems',
  SUPPLIER_SKU:
    'A unique identifier assigned to the component or service by your Supplier, used to track it in their internal systems.',
  SUPPLIER_ROLE_SUPPLIER_VIEW:
    "The role you have been assigned in a company's supply chain for this component or service",
  CAS_NUMBER:
    'A unique numerical code assigned by the Chemical Abstracts Service (CAS) to every chemical substance',
  SELECT_ROLE_FOR_THIS_SUPPLIER:
    'Select the role(s) this Supplier is responsible for in delivering this component or service',
  ACTIVITY_DESCRIPTION:
    'Description of the specific activity which was performed with this component or service by a Supplier',
  SUPPLIER_LOCATION:
    'The geographic region where the Supplier carried out the activity related to the component or service',
  STORAGE_DAYS:
    'Number of days a component will be stored before being shipped or used',
  VOLUME_PER_UNIT_SKU:
    'Physical volume of a single unit of this SKU, measured in cubic metres',
  FLOOR_AREA_REQUIRED_PER_UNIT_OF_ONE_SKU:
    'Amount of floor space needed to store one unit of this SKU, measured in square metre',
  VOLUME_PER_UNIT_OF_ONE_SKU_FOR_CONTRACT_MANUFACTURERS:
    'The volume of a single unit of this SKU, measured in kilograms or grams',
  CURRENT_HEATING_TEMPERATURE:
    "The product's current temperature before being heated",
  TARGET_HEATING_TEMPERATURE:
    'The temperature the product needs to reach during heating',
  CURRENT_COOLING_TEMPERATURE:
    "The product's current temperature before undergoing cooling",
  TARGET_COOLING_TEMPERATURE:
    'The temperature the product needs to reach during cooling',
  NUMBER_OF_LABELS_BEING_PUT_ON_PER_UNIT_OF_ONE_SKU:
    'The total number of labels placed on one unit of this SKU',
  MANUFACTURING_ACTIVITY_TYPES:
    'The type of process used to manufacture the component or service',
  STORAGE_TYPE: 'The storage type required for this component or service',
  CARBON_IMPACT:
    "Reflects the total carbon emissions generated across the product's supply chain",
  WATER_IMPACT:
    "Reflects the volume of freshwater used across the product's supply chain",
  LAND_IMPACT:
    "Reflects the land area occupied or transformed across the product's supply chain",
  COMPONENT_OR_SERVICE_NAME:
    'Use this field to search for your component or service in our database',
  INDUSTRY: 'Filter results by the primary industry the company operates in',
  LCIA_METHODOLOGY:
    'Select the Life Cycle Impact Assessment method used to calculate this impact category',
  LCIA_METHOD_IMPACT_CATEGORY_VALUE:
    'The methodology used to calculate the impact category value',
 

  INDUSTRY_AVERAGE_COMPARISON:
    'This information shows whether the environmental impact of the selected component or service is higher, lower, or similar to the industry average',
  TRANSPORT_REGION: 'The geographic region where transportation occurs for this component',
  DATE_OF_REQUEST: 'The date a company sent a request for impact category data',
  RED: 'Higher impact than the industry average',
  BLUE: 'New data received from Supplier',
  GREEN: 'Lower impact than the industry average',
  YELLOW: 'Similar impact to the industry average',
  GREY: 'Awaiting data submission',
  BENCHMARKING_DATA_NOT_AVAILABLE: 'Impact category data submitted',
  DUNS_NUMBER:
    "A unique nine-digit identifier for businesses, used globally to verify a company's legal identity and track its global operations",
  GTIN: 'GTIN (Global Trade Item Number) is a unique identifier issued by GS1 used to distinguish products in the supply chain. Often referred to as an EAN number or "barcode"',
  NET_UNIT_SIZE: 'The size, weight, or volume of one unit of this product',
  PRODUCT_CATEGORY:
    'Enter the specific category which best describes this product to be used in comparison description',
  PRODUCT_DESCRIPTION:
    'Please provide a brief description of your product. This will be visible to your end customers',
  COMPARISON_PRODUCT_DESCRIPTION:
    'Provide details of the product category used for comparison, such as weight, volume, material composition, and product type',
  PUBLICATION_STATUS:
    "Indicates the current publication state of the product's impact category data",
  SUBMISSION_STATUS: 'Indicates the current submission state',
  SUBMISSION_STATUS_PROGRESS:
    'Indicates the current progress of data submission for the requested impact categories',
  INDUSTRY_DATA_SOURCE:
    'This impact category data is based on industry data from similar supply chains',
} as const;
