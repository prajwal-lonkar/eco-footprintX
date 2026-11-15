import type { ImpactCategoryItem } from '@type/supplier';

export type DummyRequestSummary = {
  dateOfRequest: string;
  status: 'complete' | 'pending' | 'overdue';
  requestSentBy: string;
  companyRegistrationNumber: string;
  supplierRole: string;
  companyWebsite: string;
  companyContactName: string;
  companyContactEmail: string;

  // ✅ Raw Material extras (used inside requestSummaryBox for RawMaterial role)
  internalSku?: string;
  supplierSku?: string;
  netWeightPerSku?: string;
  casNumber?: string;
};

export const DUMMY_REQUEST_SUMMARY: DummyRequestSummary = {
  dateOfRequest: '12 Jan 2025',
  status: 'overdue',
  requestSentBy: 'Rawearth.co',
  companyRegistrationNumber: '123456788',
  supplierRole: 'Raw Material Supplier and Processor',
  companyWebsite: 'www.rawearth.co',
  companyContactName: 'Emily Johnson',
  companyContactEmail: 'emilyjohnson@gmail.com',

  // ✅ Raw Material extras
  internalSku: 'INT-SKU-001',
  supplierSku: 'SUP-SKU-889',
  netWeightPerSku: '1.25 kg',
  casNumber: '7732-18-5',
};

/**
 * Optional: keep this if other screens still use it.
 * (The latest ComponentDetails code does NOT need this anymore.)
 */
export const DUMMY_INFO_ITEMS = [
  { label: 'Request Sent By', value: 'Rawearth.co' },
  { label: 'Company Website', value: 'www.rawearth.co' },
  { label: 'Company Registration Number', value: '123456788' },
  { label: 'Name of Company Contact', value: 'Emily Johnson' },
  { label: 'Email ID of Company Contact', value: 'emilyjohnson@gmail.com' },
  { label: 'Supplier Role', value: 'Raw Material Supplier and Processor' },

  { label: 'Internal SKU', value: 'INT-SKU-001' },
  { label: 'Supplier SKU', value: 'SUP-SKU-889' },
  { label: 'Net Weight of Component Used per SKU', value: '1.25 kg' },
  { label: 'CAS Number', value: '7732-18-5' },
];
export const DUMMY_IMPACT_CARDS: ImpactCategoryItem[] = [
  // 1️⃣ Supplier data (highest priority)
  {
    dataSource: 'manual', // ignored because supplier overrides
    quantity: 11.45,
    unit: 'kg CO₂e/unit',
    lciaMethodology: 'IPCC 2021',
    isRequested: false,
    isSubmitted: false,
    isImpactPresent: true,
  },

  // // 2️⃣ Manual input (overrides database & temporary)
  // {
  //   dataSource: 'manual',
  //   quantity: 12.3,
  //   unit: 'm³/unit',
  //   lciaMethodology: 'ReCiPe 2016',
  //   isRequested: false,
  //   isSubmitted: false,
  //   isImpactPresent: true,
  // },

  // // 3️⃣ Database data
  // {
  //   dataSource: 'database',
  //   quantity: 3.8,
  //   unit: 'm²/unit',
  //   lciaMethodology: 'EF 3.0',
  //   isRequested: false,
  //   isSubmitted: false,
  //   isImpactPresent: true,
  // },

  // // 4️⃣ Temporary data (only temp fields exist)
  // {
  //   tempQuantity: 5.6,
  //   tempUnit: 'kg CO₂e/unit',
  //   tempLciaMethodology: 'IPCC 2013',
  //   isRequested: false,
  //   isSubmitted: false,
  //   isImpactPresent: true,
  // },

  // // 5️⃣ Yet to be uploaded (no usable data at all)
  // {
  //   isRequested: false,
  //   isSubmitted: false,
  //   isImpactPresent: false,
  // },
];