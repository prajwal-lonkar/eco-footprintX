import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    payload: {
      userId: string;
      userRoleSlug: string;
    };
  };
}