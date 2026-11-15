import { SuccessResponse } from './base.success.response';

export class CreateResponse<T> implements SuccessResponse<T> {
  success: boolean = true;
  statusCode: number = 201;
  data?: T;

  constructor(data?: T) {
    this.data = data;
  }
}
