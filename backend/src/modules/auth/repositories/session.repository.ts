import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema';

export interface CreateSessionDto {
  userId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  isValid?: boolean;
}

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Create a new session
   */
  async createSession(data: CreateSessionDto): Promise<SessionDocument> {
    const session = new this.sessionModel(data);
    return await session.save();
  }

  /**
   * Find valid session by ID
   */
  async findValidSessionById(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({
      _id: sessionId,
      isValid: true,
    }).exec();
  }

  /**
   * Invalidate session by sessionId
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: sessionId },
      { isValid: false },
    ).exec();
  }

  
  // Invalidate session by userId (invalidates current/latest session)
   
  async invalidateSessionByUserId(userId: string): Promise<void> {
    // Find the most recent valid session for this user and invalidate it
    const session = await this.sessionModel
      .findOne({
        userId,
        isValid: true,
      })
      .sort({ createdAt: -1 }) // Get the latest session
      .exec();

    if (session) {
      session.isValid = false;
      await session.save();
    }
  }

  /**
   * Invalidate ALL sessions for a user (logout from all devices)
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany(
      { userId, isValid: true },
      { isValid: false },
    ).exec();
  }

  /**
   * Find all active sessions for a user
   */
  async findActiveSessionsByUserId(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  /**
   * Find specific session by userId and sessionId
   */
  async findSessionByUserAndSessionId(
    userId: string,
    sessionId: string,
  ): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({
      _id: sessionId,
      userId,
      isValid: true,
    }).exec();
  }
}