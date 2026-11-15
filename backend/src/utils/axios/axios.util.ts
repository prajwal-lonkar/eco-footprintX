import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

interface AxiosUtilOptions<T = any> {
  url: string;
  method?: Method;
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export async function axiosRequest<TResponse = any, TBody = any>(
  options: AxiosUtilOptions<TBody>,
): Promise<TResponse> {
  try {
    const config: AxiosRequestConfig = {
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      params: options.params,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 15000, // 15s default
    };

    const response: AxiosResponse<TResponse> = await axios(config);

    return response.data;
  } catch (error: any) {
    /**
     * Normalize axios error
     */
    if (error.response) {
      // External API responded with error status
      throw {
        message: 'External API Error',
        statusCode: error.response.status,
        response: error.response.data,
      };
    }

    if (error.request) {
      // Request made but no response
      throw {
        message: 'No response from external service',
        statusCode: 503,
      };
    }

    // Unknown / config error
    throw {
      message: error.message || 'Axios request failed',
      statusCode: 500,
    };
  }
}
