import {
  Injectable,
  UnauthorizedException,
  Type,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import '@fastify/cookie';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type Permission = string;

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
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  async validateUser(username: string, pass: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ username })
      .select('+password')
      .populate('role');
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.password) {
      throw new UnauthorizedException('User not registered');
    }

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
          options?: Record<string, string>,
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

  async register(registerDto: RegisterDto) {
    const { username, password, confirmPassword, metadata } = registerDto;

    // First check if user exists
    const existingUser = await this.userModel
      .findOne({ username })
      .select('+password')
      .lean();
    if (!existingUser) {
      throw new NotFoundException(
        'User not found. Please contact administrator to create your account first.',
      );
    }
    if (existingUser.password) {
      throw new ConflictException(`Username ${username} is already registered`);
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    // Get the user document (not lean) for saving
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Set password (will be hashed by pre-save hook)
    user.password = password;

    if (!user.metadata) user.metadata = {};

    user.metadata = {
      ...user.metadata,
      secret: await bcrypt.hash(metadata.secret, 10),
    };

    await user.save();

    return { message: 'User registered successfully' };
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

      const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }
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

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { username, password, confirmPassword, metadata } = resetPasswordDto;

    // First find the user
    const user = await this.userModel.findOne({ username }).select('+password');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.metadata?.secret) {
      throw new BadRequestException(
        'User has no secret set. Please register first.',
      );
    }

    const isSecretValid = await bcrypt.compare(
      metadata.secret,
      user.metadata.secret,
    );
    if (!isSecretValid) {
      throw new UnauthorizedException('Invalid secret');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.refreshToken = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async logout(userId: string, response?: FastifyReply) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    user.refreshToken = null;
    await user.save();

    if (response) {
      response.clearCookie('accessToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      response.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    return { message: 'Logged out successfully' };
  }

  scanPermissions(): Permission[] {
    const allPermissions = new Set<Permission>();

    const controllers = this.discoveryService
      .getControllers()
      .map((wrapper: { instance?: unknown }) => wrapper?.instance)
      .filter(
        (
          instance,
        ): instance is object & { constructor: new (...args: any[]) => any } =>
          !!instance,
      );

    for (const controller of controllers) {
      const controllerType = controller.constructor as Type<unknown>;

      const classPermissions =
        this.reflector.get<Permission[]>(PERMISSIONS_KEY, controllerType) ?? [];
      classPermissions.forEach((p) => allPermissions.add(p));

      const prototype = Object.getPrototypeOf(controller) as object;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (key): key is keyof typeof prototype =>
          key !== 'constructor' && typeof prototype[key] === 'function',
      );

      for (const methodName of methodNames) {
        const method = prototype[methodName] as (...args: unknown[]) => unknown;

        const methodPermissions =
          this.reflector.get<Permission[]>(PERMISSIONS_KEY, method) ?? [];

        methodPermissions.forEach((p) => allPermissions.add(p));
      }
    }

    return [...allPermissions].sort();
  }
}
