export interface DropdownOption {
  label: string;
  value: string;
}

export interface IndustryCompanyType {
  _id: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  comment: string | null;
}
