import { Types } from 'mongoose';

export interface JwtUserPayload {
  tokenExpiresIn: string;
  userId: string | Types.ObjectId;
  userRole: string | Types.ObjectId;
  userRoleSlug: string;
  sessionId: string | Types.ObjectId;
  userSubRole: string;
}
