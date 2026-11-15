import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/*
 A convenient shortcut to access request.user that the guard already attached to the request, 
without manually pulling it from the request object in the controllers.

Not a middleware.
*/
export const UserToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Populated by JwtStrategy.validate()
  },
);
