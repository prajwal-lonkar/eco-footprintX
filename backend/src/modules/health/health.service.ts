import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { SuccessResponse } from '../../shared/successResponse/base.success.response';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  private checkMongoDB() {
    const state = this.mongoConnection.readyState;

    const mongoStatus = {
      code: state, // 0–3
      isConnected: state === 1,
      message: '',
    };

    switch (state) {
      case 0:
        mongoStatus.message = 'MongoDB is disconnected';
        break;
      case 1:
        mongoStatus.message = 'MongoDB is connected';
        break;
      case 2:
        mongoStatus.message = 'MongoDB is connecting';
        break;
      case 3:
        mongoStatus.message = 'MongoDB is disconnecting';
        break;
      default:
        mongoStatus.message = 'Unknown MongoDB state';
    }

    return mongoStatus;
  }

  check(): SuccessResponse<any> {
    const mongo = this.checkMongoDB();

    const isHealthy = mongo.isConnected;

    return {
      success: isHealthy,
      statusCode: isHealthy ? 200 : 503,
      data: {
        overallStatus: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          mongo,
        },
      },
    };
  }
}
