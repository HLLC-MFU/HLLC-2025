import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
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
  permissions: string[]; // Can be encrypted or plain strings
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

  private isEncrypted(text: string): boolean {
    return text.includes(':') && /^[0-9a-fA-F]+:[0-9a-fA-F]+$/.test(text);
  }

  private decryptPermission(permission: string): string {
    try {
      return this.isEncrypted(permission)
        ? decryptItem(permission)
        : permission;
    } catch (error) {
      console.warn('Failed to decrypt permission:', permission, error);
      return permission;
    }
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

    // Handle both encrypted and non-encrypted permissions
    const decryptedPermissions: string[] = user.role.permissions.map(
      (permission) => this.decryptPermission(permission),
    );

    // If permissions include "*", bypass check
    if (decryptedPermissions.includes('*')) {
      return true;
    }

    // Check required permissions
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

    // Re-encrypt permissions only if they were encrypted before
    user.role.permissions = user.role.permissions.map((permission) =>
      this.isEncrypted(permission)
        ? encryptItem(this.decryptPermission(permission))
        : permission,
    );

    return true;
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    context?: ExecutionContext, // Note the "?" here
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }

    if (context) {
      const req = context.switchToHttp().getRequest<FastifyRequest>();
      req.user = user;
    }

    return user;
  }

}
