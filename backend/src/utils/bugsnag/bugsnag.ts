// src/shared/bugsnag/bugsnag.ts
import { BugsnagService } from './bugsnag.service';

// Will be assigned by NestJS after module initialization
let bugsnagMiddleware: any;

export const setBugsnagMiddleware = (service: BugsnagService) => {
  bugsnagMiddleware = service.middleware;
};

export { bugsnagMiddleware };
