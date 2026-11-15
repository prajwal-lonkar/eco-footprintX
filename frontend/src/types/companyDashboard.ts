export interface DropdownOption {
  label: string;
  value: string;
}
export interface CompanyFormData {
  companyName: string;
  dunsNumber: string;
  contactName: string;

  contactEmail: string;
  website: string;
  registrationNumber: string;
  industry: string;
  companyType: string;
  address: string;
}
export interface CompanyProfileResponse {
  companyName: string;
  companyWebsite: string;
  industry: {
    _id: string;
    type: string;
  };
  companyType: {
    _id: string;
    type: string;
  };
  registrationNumber: string;
  dunsNumber: string | null;
  companyContactName: string;
  companyContactEmail: string;
  companyAddress: string;
  createdAt: string;
}
export interface UpdateCompanyProfilePayload {
  contactName: string;
  companyName: string;
  //   dunsNumber: string | null;

  //   companyContactEmail: string;
  website: string;
  address: string;
  industryType: string;
  companyType: string;
  registrationNumber: string;
}

//how to recycle
export interface RecycleInstruction {
  _id: string;
  component: any;
  instructions: any;
  image: string;
}
[];

export interface ProductType {
  recycleInstructions?: RecycleInstruction[];
  image: string;
}

export interface HowToRecycleProps {
  productDetails: ProductType | null;

  setProductDetails: any;
}

export interface StepType {
  id: string;
  componentName: string;
  disposal: string;
  isNew?: boolean;
  dirty?: boolean;
}
