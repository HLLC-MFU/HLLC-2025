// src/module/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    const { accessToken, refreshToken } = this.generateTokenPair(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, confirmPassword, secret } = registerDto;

    const user = await findOrThrow(
      this.userModel,
      { username },
      'Username already exists',
    );

    if (user.password && user.secret) {
      throw new ConflictException(`Username ${username} is already registered`);
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.secret = await bcrypt.hash(secret, 10);

    await user.save();

    return { message: 'User registered successfully' };
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
      const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const { accessToken, refreshToken } = this.generateTokenPair(user);

      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      await user.save();

      return { accessToken, refreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await findOrThrow(this.userModel, { _id: userId }, 'User not found');

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshToken: '' } },
    );

    return { message: 'Logged out successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { username, password, confirmPassword, secret } = resetPasswordDto;

    const user = await findOrThrow(
      this.userModel,
      { username },
      'User not found',
    );

    if (!user.secret) {
      throw new BadRequestException('User has no secret set');
    }

    const isSecretValid = await bcrypt.compare(secret, user.secret);
    if (!isSecretValid) {
      throw new UnauthorizedException('Invalid secret');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.refreshToken = null;
    await user.save();

    return { message: 'Password reset successfully' };
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
