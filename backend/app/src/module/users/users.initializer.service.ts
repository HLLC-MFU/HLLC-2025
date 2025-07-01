// src/module/users/user.initializer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { Role } from 'src/module/role/schemas/role.schema';

@Injectable()
export class UserInitializerService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) { }

  async onModuleInit() {
    await this.createAdminUser();
  }

  private async createAdminUser() {
    const username = 'admin';

    const existing = await this.userModel.findOne({ username });
    if (existing) return;

    const adminRole = await this.roleModel.findOne({ name: 'Administrator' });
    if (!adminRole) throw new Error('Admin role not found. Cannot create admin user.');


    await this.userModel.create({
      username,
      password: 'user1234',
      name: {
        first: 'Admin',
        last: 'User',
      },
      role: adminRole._id,
    });

    Logger.debug('[UserInitializer] Admin user created.');
  }
}