// src/module/auth/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
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

    try {
      // ✅ JWT validation
      const isJwtValid = await super.canActivate(context);
      if (!isJwtValid) {
        throw new UnauthorizedException('Invalid token');
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new UnauthorizedException('User not found in token');
      }

      console.log('✅ Guard: User from JWT:', user);

      // ✅ Permission check
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredPermissions && requiredPermissions.length > 0) {
        if (!Array.isArray(user.permissions)) {
          throw new ForbiddenException('User permissions not valid');
        }

        const fullPermissions = user.permissions.filter(
          p => !p.endsWith(':id'),
        );
        const ownPermissions = user.permissions.filter(p => p.endsWith(':id'));

        let hasPermission = false;

        for (const perm of requiredPermissions) {
          // Check if user has the exact permission
          if (user.permissions.includes(perm)) {
            hasPermission = true;
            break;
          }

          // Check if user has a broader permission (non-:id version)
          if (perm.endsWith(':id')) {
            const basePerm = perm.replace(':id', '');
            if (user.permissions.includes(basePerm)) {
              hasPermission = true;
              break;
            }
          }

          // Check if it's an :id permission and user is accessing their own resource
          if (perm.endsWith(':id')) {
            const paramId = request.params['id'];
            if (
              paramId &&
              paramId === user._id.toString() &&
              ownPermissions.includes(perm)
            ) {
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
    } catch (error) {
      console.error('❌ Guard Error:', error);
      throw error;
    }
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      throw err || new ForbiddenException('Unauthorized');
    }
    const req = context.switchToHttp().getRequest();
    req.user = user;
    return user;
  }
}
