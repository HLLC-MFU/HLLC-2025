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
          'users:read:id',
          'users:update:id',
        ],
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleModel.findOne({ name: roleData.name });
      
      if (!existing) {
        this.logger.log(`Creating default role: ${roleData.name}`);
        await this.roleModel.create(roleData);
      } else {
        // Update permissions if needed
        if (roleData.name === 'Administrator' && 
            (!existing.permissions || existing.permissions.length < roleData.permissions.length)) {
          this.logger.log(`Updating Administrator permissions from ${existing.permissions.length} to ${roleData.permissions.length}`);
          existing.permissions = roleData.permissions;
          await existing.save();
        }
      }
    }
  }

  private createAdminPermissions(): string[] {
    const resources = ['users', 'schools', 'majors', 'roles', 'activities'];
    const actions = Object.values(Actions);
    
    const permissions: string[] = [];
    
    // Add regular permissions
    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}`);
      }
    }
    
    // Add ID-specific permissions
    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}:id`);
      }
    }
    
    // Add special admin permissions
    permissions.push('admin:access');
    
    return permissions;
  }
} 