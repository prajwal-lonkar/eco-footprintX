export interface ApiResponse<T> {
  success: boolean;
  status?: number;
  statusCode?: number;
  message?: string;
  total?: number;
  data?: T;
  code?: string;
}

export interface User {
  userId: string;
  userRole: string[];
  sessionId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  isEmailVerified: boolean;
  roleSlug: string;
}

export interface AuthState {
  user: User | null;
  login: (accessToken: string, roleSlug?: string) => Promise<void>;
  updateAccessToken: (accessToken: string, roleSlug?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  getRoleSlug: () => string | null;
}


export interface RoleDetails {
  deletedAt: string | null;
  _id: string;
  roleName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityResponse {
  isEligible: boolean;
  roleDetails?: RoleDetails;
}

export interface CompanyDetails {
  name: string;
  website: string;
  address: string;
  industryType: string;
  companyType: string;
  registrationNumber: string;
  dunsNumber: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  companyDetails: CompanyDetails;
}

export interface CreateUserResponseData {
  isActive: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  comment: string | null;
  name: string;
  email: string;
  roles: string[];
  companyDetails: CompanyDetails & {
    _id: string;
  };
  invitedBy: string | null;
  isEmailVerified: boolean;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateUserResponse {
  success: boolean;
  statusCode: number;
  data: CreateUserResponseData;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  statusCode: number;
  message?: string;
}
