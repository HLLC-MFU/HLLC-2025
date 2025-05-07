import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { Reflector } from '@nestjs/core';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { Role, RoleDocument } from 'src/module/role/schemas/role.schema';
  import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
  import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
  import { IS_OWNER_KEY } from '../decorators/is-owner.decorator';
  
  @Injectable()
  export class PermissionsGuard extends AuthGuard('jwt') {
    constructor(
      private reflector: Reflector,
      @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    ) {
      super();
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      // ✅ Public route check
      const isPublic = this.reflector.get<boolean>(
        IS_PUBLIC_KEY,
        context.getHandler(),
      );
      if (isPublic) {
        return true;
      }
  
      // ✅ JWT validation (auth)
      const isJwtValid = await super.canActivate(context);
      if (!isJwtValid || !user) {
        throw new ForbiddenException('Unauthorized');
      }
  
      // ✅ Owner check
      const ownerParamKey = this.reflector.get<string>(
        IS_OWNER_KEY,
        context.getHandler(),
      );
  
      if (ownerParamKey && user.role !== 'admin') {
        const targetId = request.params[ownerParamKey];
        if (targetId && user._id !== targetId) {
          throw new ForbiddenException('Access denied: not owner');
        }
      }
  
      // ✅ Permission check
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
  
      if (requiredPermissions && requiredPermissions.length > 0) {
        const role = await this.roleModel.findById(user.role).lean() as Role & {
          permissions: string[];
        };
  
        if (!role || !Array.isArray(role.permissions)) {
          throw new ForbiddenException('Role or permissions not valid');
        }
  
        const permissionFlags: Record<string, 'full' | 'own'> = {};
        const hasPermission = requiredPermissions.every((perm) => {
          if (role.permissions.includes(perm)) {
            const key = perm.split(':')[0];
            permissionFlags[key] = 'full';
            return true;
          }
  
          const ownScoped = `${perm}:id`;
          if (role.permissions.includes(ownScoped)) {
            const key = perm.split(':')[0];
            permissionFlags[key] = 'own';
            return true;
          }
  
          return false;
        });
  
        if (!hasPermission) {
          throw new ForbiddenException('Access Denied');
        }
  
        // 👇 แนบไว้ใน request ใช้ต่อใน controller
        request.permissionFlags = permissionFlags;
      }
  
      return true;
    }
  }
  