import { ENDPOINTS } from '@constants/endpoint';
import { ERROR_MESSAGES } from '@constants/messages';
import type { IndustryCompanyType } from '@type/dropdown';

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch Industry Types

export const getIndustryTypes = async (
  showAlert: (msg: string, variant: string) => void
): Promise<IndustryCompanyType[]> => {
  try {
    const res = await axios.get(
      `${BASE_URL}${ENDPOINTS.USERS.INDUSTRY_TYPES}`,
    );

    const data = res.data?.data || [];

 
    
    return data;
  } catch (error) {
    showAlert(ERROR_MESSAGES.FETCH_INDUSTRY_TYPES_FAILED, 'danger');
    return [];
  }
};

// Fetch Company Types

export const getCompanyTypes = async (
  showAlert: (msg: string, variant: string) => void
): Promise<IndustryCompanyType[]> => {
  try {
    const res = await axios.get(`${BASE_URL}${ENDPOINTS.USERS.COMPANY_TYPES}`
    );
    const data = res.data?.data || [];

    return data;
  } catch (error) {
    showAlert(ERROR_MESSAGES.FETCH_COMPANY_TYPES_FAILED, 'danger');

    return [];
  }
};
