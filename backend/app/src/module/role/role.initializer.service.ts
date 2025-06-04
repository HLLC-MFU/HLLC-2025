import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, Actions, Permission } from './schemas/role.schema';

@Injectable()
export class RoleInitializerService implements OnModuleInit {
  private readonly logger = new Logger(RoleInitializerService.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    await this.createDefaultRoles();
  }

  private async createDefaultRoles() {
    this.logger.log('Checking for default roles...');

    const roles = [
      {
        name: 'Administrator',
        permissions: ['*'] as Permission[], // Admin has full access to everything
      },
      {
        name: 'User',
        permissions: ['users:read:id', 'users:update:id'] as Permission[],
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleModel.findOne({ name: roleData.name });

      if (!existing) {
        this.logger.log(`Creating default role: ${roleData.name}`);
        await this.roleModel.create(roleData);
      } else {
        // Always update User role permissions to ensure they're restricted
        if (roleData.name === 'User') {
          this.logger.log(
            `Updating User role permissions to: ${roleData.permissions.join(', ')}`,
          );
          existing.permissions = roleData.permissions;
          await existing.save();
        }
        // Update Administrator permissions if needed
        else if (
          roleData.name === 'Administrator' &&
          existing.permissions[0] !== '*'
        ) {
          this.logger.log(
            'Updating Administrator permissions to use wildcard (*)',
          );
          existing.permissions = roleData.permissions;
          await existing.save();
        }
      }
    }
  }

  private createAdminPermissions(): Permission[] {
    const resources = [
      'users',
      'schools',
      'majors',
      'roles',
      'activities',
      'checkin',
    ] as const;
    const actions = Object.values(Actions);

    const permissions: Permission[] = [];

    // Add base permissions (e.g., users:read, users:create)
    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}` as Permission);
      }
    }

    // Add :id permissions for admin (e.g., users:read:id, users:update:id)
    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}:id` as Permission);
      }
    }

    return permissions;
  }
}
