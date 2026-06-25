import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  id: string;
  role?: string;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest();
  const idHeader = request.headers['x-user-id'];
  const roleHeader = request.headers['x-user-role'];

  return {
    id: Array.isArray(idHeader) ? idHeader[0] : idHeader ?? 'local-demo-user',
    role: Array.isArray(roleHeader) ? roleHeader[0] : roleHeader,
  };
});
