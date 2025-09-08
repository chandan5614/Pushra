import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isAdminEmail } from '../config/admin-emails';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    return !!(user && isAdminEmail(user.email));
  }
}

