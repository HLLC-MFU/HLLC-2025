import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { FastifyReply } from 'fastify';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User, UserDocument } from '../users/schemas/user.schema';

jest.mock('./utils/crypto', () => ({
  decryptItem: jest.fn(() => 'decrypted-perm'),
}));

jest.spyOn(bcrypt, 'compare').mockImplementation(async (a, b) => bcrypt.compareSync(a, b));

const mockUserId = new Types.ObjectId();
const mockRoleId = new Types.ObjectId();

const mockRole = {
  _id: mockRoleId,
  permissions: ['encrypted-perm'],
};

const mockUserData = {
  _id: mockUserId,
  username: 'testuser',
  password: bcrypt.hashSync('password123', 10),
  refreshToken: bcrypt.hashSync('mockToken', 10),
  role: mockRoleId,
  metadata: { secret: bcrypt.hashSync('mysecret', 10) },
};

const mockUser = {
  ...mockUserData,
  save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;

  const jwtServiceMock = {
    signAsync: jest.fn().mockResolvedValue('mockToken'),
    sign: jest.fn().mockReturnValue('mockToken'),
    verify: jest.fn().mockReturnValue({ sub: mockUserId.toHexString(), username: 'testuser' }),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_EXPIRATION': return '15m';
        case 'JWT_REFRESH_EXPIRATION': return '7d';
        case 'JWT_REFRESH_SECRET': return 'secret-key';
        default: return '';
      }
    }),
  };

  const userModelMock: Partial<Record<keyof Model<UserDocument>, jest.Mock>> = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    userModelMock.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ password: null }),
      }),
    });

    userModelMock.findById = jest.fn().mockResolvedValue({
      ...mockUserData,
      save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: DiscoveryService, useValue: { getControllers: () => [] } },
        { provide: Reflector, useValue: { get: () => [] } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  describe('register', () => {
    it('should throw if user not found in DB', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.register({
        username: 'newuser',
        password: 'pass123',
        confirmPassword: 'pass123',
        metadata: { secret: 's' },
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw if passwords do not match', async () => {
      await expect(service.register({
        username: 'newuser',
        password: 'a',
        confirmPassword: 'b',
        metadata: { secret: 's' },
      })).rejects.toThrow(BadRequestException);
    });

    it('should register user successfully', async () => {
      userModelMock.findOne = jest
        .fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ password: null }),
          }),
        })
        .mockReturnValueOnce({
          ...mockUserData,
          save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
        });

      const result = await service.register({
        username: 'testuser',
        password: '1234',
        confirmPassword: '1234',
        metadata: { secret: 's' },
      });

      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens', async () => {
      userModelMock.findById = jest.fn().mockResolvedValue({
        ...mockUserData,
        refreshToken: bcrypt.hashSync('mockToken', 10),
        save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
      });

      const result = await service.refreshToken('mockToken');

      expect(jwtServiceMock.verify).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mockToken',
        refreshToken: 'mockToken',
      });
    });

    it('should throw if token is invalid', async () => {
      jwtServiceMock.verify = jest.fn(() => { throw new Error(); });

      await expect(service.refreshToken('bad')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password if valid', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUserData,
          metadata: { secret: bcrypt.hashSync('mysecret', 10) },
          save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
        }),
      });

      const result = await service.resetPassword({
        username: 'testuser',
        password: '1234',
        confirmPassword: '1234',
        metadata: { secret: 'mysecret' },
      });

      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('validateUser', () => {
    it('should throw if user not found', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.validateUser('nouser', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user if valid', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockUserData,
            password: bcrypt.hashSync('password123', 10),
            role: mockRole,
          }),
        }),
      });

      const user = await service.validateUser('testuser', 'password123');
      expect(user.username).toBe('testuser');
    });
  });

  describe('login', () => {
    it('should set cookies and return tokens', async () => {
      const reply = {
        setCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      const result = await service.login(mockUser as any, {
        useCookie: true,
        response: reply,
      });

      expect(reply.setCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'mockToken', refreshToken: 'mockToken' });
    });
  });

  describe('logout', () => {
    it('should clear cookies', async () => {
      const reply = {
        clearCookie: jest.fn(),
      } as unknown as FastifyReply;

      userModelMock.findById = jest.fn().mockResolvedValue({
        ...mockUserData,
        save: jest.fn().mockResolvedValue(mockUserData),
      });

      const result = await service.logout(mockUserId.toHexString(), reply);
      expect(reply.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('scanPermissions', () => {
    it('should return empty list (mock)', () => {
      const result = service.scanPermissions();
      expect(result).toEqual([]);
    });
  });
});
