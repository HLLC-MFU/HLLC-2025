import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, Permission } from './schemas/role.schema';
import { encryptItem } from '../auth/utils/crypto';

@Injectable()
export class RoleInitializerService implements OnModuleInit {
  private readonly logger = new Logger(RoleInitializerService.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    await this.createAdminRole();
  }

  private async createAdminRole() {
    const roleName = 'Administrator';
    this.logger.log(`Checking if "${roleName}" role exists...`);

    const encryptedWildcard = encryptItem('*' as Permission);

    const existing = await this.roleModel.findOne({ name: roleName });

    if (!existing) {
      this.logger.log(
        `Creating "${roleName}" role with wildcard permission...`,
      );
      await this.roleModel.create({
        name: roleName,
        permissions: [encryptedWildcard],
      });
    } else {
      const hasWildcard = existing.permissions.includes(encryptedWildcard);

      if (!hasWildcard) {
        this.logger.log(
          `Updating "${roleName}" role with wildcard permission...`,
        );
        existing.permissions = [encryptedWildcard];
        await existing.save();
      }
    }
  }
}
