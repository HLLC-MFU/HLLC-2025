// src/module/auth/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ Public route check
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    // ✅ ให้ AuthGuard ทำงานก่อน
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) {
      throw new ForbiddenException('Unauthorized');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // ✅ Permission check
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const role = user.role;
      if (!role || !Array.isArray(role.permissions)) {
        throw new ForbiddenException('Role or permissions not valid');
      }

      const fullPermissions = role.permissions.filter(
        (p) => !p.endsWith(':id'),
      );
      const ownPermissions = role.permissions.filter((p) => p.endsWith(':id'));

      let hasPermission = false;

      for (const perm of requiredPermissions) {
        // ✅ Full permission (เช่น activities:read, checkins:read)
        if (fullPermissions.includes(perm)) {
          hasPermission = true;
          break;
        }

        // ✅ Own permission (เช่น activities:read:id, checkins:read:id)
        if (perm.endsWith(':id')) {
          const basePerm = perm.replace(':id', '');
          const paramId = request.params['id'];

          // ✅ ถ้า owner id ตรงกับ user
          if (paramId && paramId === user._id.toString()) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        throw new ForbiddenException('Access Denied');
      }
    }

    return true;
  }

  // ✅ Override handleRequest เพื่อให้ user แนบกับ req ก่อน
  handleRequest(err, user, info, context) {
    if (err || !user) {
      throw err || new ForbiddenException('Unauthorized');
    }
    const req = context.switchToHttp().getRequest();
    req.user = user;
    return user;
  }
}
