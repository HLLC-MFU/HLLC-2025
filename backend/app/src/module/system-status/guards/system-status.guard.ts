import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemStatus } from '../schemas/system-status.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { IS_PUBLIC_KEY } from 'src/module/auth/decorators/public.decorator';

@Injectable()
export class SystemStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(SystemStatus.name)
    private systemStatusModel: Model<SystemStatus>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Checking status with index 0
    const systemStatus = await this.systemStatusModel
      .findOne()
      .sort({ updatedAt: -1 });
    if (!systemStatus || systemStatus.status) return true;

    // jwt auth role checking
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?._id) throw new ForbiddenException('System is closed.');

    const fullUser = await this.userModel.findById(user._id).populate('role');
    const role = fullUser?.role as any;
    if (role?.name === 'User') {
      throw new ForbiddenException('System is closed for your role.');
    }

    return true;
  }
}
