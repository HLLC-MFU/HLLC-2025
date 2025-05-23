// src/module/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../role/schemas/role.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ username }).populate('role');
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid password');

    return user;
  }

  async login(user: UserDocument) {
    // Populate role to get permissions
    await user.populate<{ role: Role }>('role');

    const { accessToken, refreshToken } = this.generateTokenPair(user);

    // ✅ Save refreshToken to user
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.userModel.findById(payload.sub).populate('role');
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('User not found');
      }

      // ✅ Check if refresh token is valid
      const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ✅ Generate new tokens
      const { accessToken, refreshToken } = this.generateTokenPair(user);

      // ✅ Update refresh token
      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      await user.save();

      return { accessToken, refreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    user.refreshToken = null;
    await user.save();
    return { message: 'Logged out successfully' };
  }

  private generateTokenPair(user: UserDocument) {
    if (!user.role || !('permissions' in user.role)) {
      throw new UnauthorizedException('User role not properly populated');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      permissions: user.role?.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    });

    return { accessToken, refreshToken };
  }
}
