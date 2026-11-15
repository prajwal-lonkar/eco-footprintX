export interface Geography {
  geography: string;
}

export interface GeographyResponse {
  success: boolean;
  statusCode: number;
  data: Geography[];
}
