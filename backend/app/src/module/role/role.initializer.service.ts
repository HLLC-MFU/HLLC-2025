import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, Permission } from './schemas/role.schema';
import { encryptItem } from '../auth/utils/crypto';

@Injectable()
export class RoleInitializerService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    await this.createAdminRole();
  }

  private async createAdminRole() {
    const roleName = 'Administrator';

    const encryptedWildcard = encryptItem('*' as Permission);

    const existing = await this.roleModel.findOne({ name: roleName });

    if (!existing) {
      await this.roleModel.create({
        name: roleName,
        permissions: [encryptedWildcard],
      });
    } else {
      const hasWildcard = existing.permissions.includes(encryptedWildcard);

      if (!hasWildcard) {
        existing.permissions = [encryptedWildcard];
        await existing.save();
      }
    }
  }
}
