import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/module/auth/decorators/public.decorator';
import { SystemStatus } from '../schemas/system-status.schema';
import { Reflector } from '@nestjs/core';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/module/users/schemas/user.schema';

@Injectable()
export class SystemStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(SystemStatus.name)
    private systemStatusModel: Model<SystemStatus>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const systemStatus = await this.systemStatusModel
      .findOne()
      .sort({ updatedAt: -1 });
    if (!systemStatus || systemStatus.status) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?._id) throw new ForbiddenException('System is closed.');

    const fullUser = await this.userModel
      .findById(user._id)
      .populate('role')
      .exec();

    if (!fullUser?.role || typeof fullUser.role === 'object' && !('name' in fullUser.role)) {
      throw new ForbiddenException('User role not found.');
    }

    const roleName = typeof fullUser.role === 'object' ? fullUser.role.name : fullUser.role;
    if (roleName === 'User') {
      throw new ForbiddenException('System is closed for your role.');
    }

    return true;
  }
}
