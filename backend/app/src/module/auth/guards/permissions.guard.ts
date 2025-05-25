import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { FastifyRequest } from 'fastify';
import { decryptItem, encryptItem } from '../utils/crypto';

declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
  }
}

interface Role {
  permissions: string[]; // ✅ array of encrypted strings
}

interface User {
  _id: string;
  role: Role;
}

@Injectable()
export class PermissionsGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) return true;

    const isJwtValid = (await super.canActivate(context)) as boolean;
    if (!isJwtValid) throw new ForbiddenException('Unauthorized');

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as User | undefined;
    if (!user) throw new ForbiddenException('User not found');

    // 🟡 Decrypt each permission item
    const decryptedPermissions: string[] = user.role.permissions.map((enc) =>
      decryptItem(enc),
    );

    // 🟡 ✅ NEW: If permissions include "*", bypass check
    if (decryptedPermissions.includes('*')) {
      return true;
    }

    // 🟡 Check required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const fullPermissions = decryptedPermissions.filter(
        (p) => !p.endsWith(':id'),
      );
      let hasPermission = false;

      for (const perm of requiredPermissions) {
        if (fullPermissions.includes(perm)) {
          hasPermission = true;
          break;
        }

        if (perm.endsWith(':id')) {
          const params = request.params as Record<string, unknown> | undefined;
          const paramId =
            typeof params?.['id'] === 'string'
              ? params['id']
              : params?.['id']?.toString?.();
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

    // 🟡 Re-encrypt each permission for downstream usage
    user.role.permissions = decryptedPermissions.map((perm) =>
      encryptItem(perm),
    );

    return true;
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new ForbiddenException('Unauthorized');
    }
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    req.user = user;
    return user;
  }
}
