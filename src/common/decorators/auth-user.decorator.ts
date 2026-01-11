import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../interfaces';

export const AuthUser = createParamDecorator(
  (
    data: keyof CurrentUser | undefined,
    ctx: ExecutionContext,
  ): CurrentUser | string | string[] | number | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();

    const user = request.user;

    if (!user) return undefined;

    return data ? user[data] : user;
  },
);
