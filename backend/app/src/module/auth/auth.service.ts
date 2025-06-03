import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import '@fastify/cookie';

interface LoginOptions {
  useCookie?: boolean;
  response?: FastifyReply;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username }).populate('role');
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid password');

    return user;
  }

  async login(
    user: UserDocument,
    options?: LoginOptions,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user._id.toString(), username: user.username };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    if (options?.useCookie && options.response) {
      const reply = options.response as FastifyReply & {
        setCookie: (
          name: string,
          value: string,
          options?: Record<string, any>,
        ) => FastifyReply;
      };
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60,
        domain: 'localhost',
      });

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        domain: 'localhost',
      });
    }

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret';
    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';
    const refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    try {
      const payload = this.jwtService.verify<JwtPayload>(oldRefreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('User not found');
      }

      // Check if refresh token is valid
      const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.jwtService.sign(
        { sub: user._id.toString(), username: user.username },
        {
          expiresIn: accessTokenExpiresIn,
        },
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: user._id.toString(), username: user.username },
        {
          expiresIn: refreshTokenExpiresIn,
          secret: refreshSecret,
        },
      );

      // Update refresh token
      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      console.error(err); // For debugging, remove in production
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
}
