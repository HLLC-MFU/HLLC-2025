// src/module/auth/guards/permissions.guard.ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(PermissionsGuard.name);

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
            // ✅ Try to validate JWT token
            const isJwtValid = await super.canActivate(context);
            if (!isJwtValid) {
                throw new UnauthorizedException('Invalid or expired token');
            }
        } catch (error) {
            // Check if this is a development environment
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('JWT validation failed but allowing access in development mode');
                return true;
            }
            throw new UnauthorizedException('Authentication failed: ' + (error.message || 'Invalid token'));
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('No user found but allowing access in development mode');
                return true;
            }
            throw new UnauthorizedException('User not found');
        }

        // ✅ Permission check
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (requiredPermissions && requiredPermissions.length > 0) {
            // For development, log what permissions are required
            this.logger.debug(`Required permissions: ${requiredPermissions.join(', ')}`);
            
            const role = user.role;
            if (!role) {
                this.logger.error(`User ${user._id} has no role assigned`);
                if (process.env.NODE_ENV === 'development') {
                    return true;
                }
                throw new ForbiddenException('User has no role assigned');
            }
            
            if (!Array.isArray(role.permissions)) {
                this.logger.error(`Role ${role._id} has no permissions array`);
                if (process.env.NODE_ENV === 'development') {
                    return true;
                }
                throw new ForbiddenException('Role has invalid permissions format');
            }

            // Special check for admin role by name
            if (role.name === 'Administrator' || role.name === 'Admin') {
                this.logger.log(`Granting access to admin user: ${user.username}`);
                return true;
            }

            // Special case: if user has admin:access permission, allow all
            if (role.permissions.includes('admin:access')) {
                return true;
            }

            const fullPermissions = role.permissions.filter(p => !p.endsWith(':id'));
            const idPermissions = role.permissions.filter(p => p.endsWith(':id'));

            let hasPermission = false;

            for (const perm of requiredPermissions) {
                // ✅ Check full permission (e.g., 'activities:read', 'checkins:read')
                if (fullPermissions.includes(perm)) {
                    hasPermission = true;
                    break;
                }

                // ✅ Check ID-specific permission (e.g., 'activities:read:id', 'checkins:read:id')
                if (perm.endsWith(':id')) {
                    // Check if the user has this id-specific permission
                    if (idPermissions.includes(perm)) {
                        const paramId = request.params['id'];
                        
                        // If this is a request about the user's own resource
                        if (paramId && paramId === user._id.toString()) {
                            hasPermission = true;
                            break;
                        }
                    }
                }
            }

            if (!hasPermission) {
                this.logger.warn(
                    `Access denied for user ${user._id}: Required permissions: ${requiredPermissions.join(', ')}, Has permissions: ${role.permissions.join(', ')}`
                );
                
                if (process.env.NODE_ENV === 'development') {
                    this.logger.warn('Allowing access in development mode despite permission check failure');
                    return true;
                }
                
                throw new ForbiddenException('You do not have the required permissions for this operation');
            }
        }

        return true;
    }

    // ✅ Override handleRequest เพื่อให้ user แนบกับ req ก่อน
    handleRequest(err, user, info, context) {
        if (err) {
            throw err;
        }
        
        const req = context.switchToHttp().getRequest();
        
        if (!user) {
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('No user found in token but allowing access in development mode');
                req.user = { _id: 'dev-user', username: 'dev', role: { permissions: ['admin:access'] } };
                return req.user;
            }
            throw new UnauthorizedException('User not found');
        }
        
        req.user = user;
        return user;
    }
}
