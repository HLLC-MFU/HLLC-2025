import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, Actions } from './schemas/role.schema';

@Injectable()
export class RoleInitializerService implements OnModuleInit {
  private readonly logger = new Logger(RoleInitializerService.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>
  ) {}

  async onModuleInit() {
    await this.createDefaultRoles();
  }

  private async createDefaultRoles() {
    this.logger.log('Checking for default roles...');
    
    const roles = [
      {
        name: 'Administrator',
        permissions: this.createAdminPermissions(),
      },
      {
        name: 'User',
        permissions: [
          'users:read',
          'users:update',
        ] as `${string}:${Actions}`[],
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleModel.findOne({ name: roleData.name });
      
      if (!existing) {
        this.logger.log(`Creating default role: ${roleData.name}`);
        await this.roleModel.create(roleData);
      } else {
        if (roleData.name === 'Administrator' && 
            (!existing.permissions || existing.permissions.length < roleData.permissions.length)) {
          this.logger.log(`Updating Administrator permissions from ${existing.permissions.length} to ${roleData.permissions.length}`);
          existing.permissions = roleData.permissions;
          await existing.save();
        }
      }
    }
  }

  private createAdminPermissions(): `${string}:${Actions}`[] {
    const resources = ['users', 'schools', 'majors', 'roles', 'activities'] as const;
    const actions = Object.values(Actions);
    
    const permissions: `${string}:${Actions}`[] = [];

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}` as `${string}:${Actions}`);
      }
    }
    
    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}:id` as `${string}:${Actions}`);
      }
    }
    
    permissions.push('admin:access' as `${string}:${Actions}`);
    
    return permissions;
  }
} 