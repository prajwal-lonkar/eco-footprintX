import { SuccessResponse } from './base.success.response';

export class UpdateResponse<T> implements SuccessResponse<T> {
  success: boolean = true;
  statusCode: number = 200;
  data?: T;
  
  constructor(data?: T) {
    this.data = data;
  }
}