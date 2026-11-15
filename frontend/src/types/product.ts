export interface ProductDetails {
  _id: string;
  isActive: boolean;
  createdBy: string;
  deletedAt: string | null;
  deletedBy: string | null;
  comment: string | null;
  name: string;
  productCategory: string;
  internalSku: string;
  gstin: number;
  netSize: number;
  isPubliclyAccessible: boolean;
  unit: string;
  customUnit: string;
  category: string;
  batchNumber: string;
  description: string;
  comparisonProductDescription: string;
  companyId: string;
  image: string;
  publishStatus: string;
  recycleInstructions: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}