import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';

@Injectable()
export class UserInitializerService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    await this.createAdminUser();
  }

  private async createAdminUser() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'user1234';
    const existing = await this.userModel.findOne({ username });

    if (existing) {
      return;
    }

    const role = await this.roleModel.findOne({ name: 'Administrator' });
    if (!role) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      name: {
        first: 'Administrator',
      },
      username,
      password: hashedPassword,
      role: role._id,
      metadata: {},
    });
  }
}
