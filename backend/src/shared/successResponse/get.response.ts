import { SuccessResponse } from './base.success.response';

export class GetResponse<T> implements SuccessResponse<T> {
  success: boolean = true;
  statusCode: number = 200;
  data: T;
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}
