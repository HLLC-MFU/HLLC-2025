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
} from '@nestjs/common';
import { User, UserDocument } from '../users/schemas/user.schema';

jest.mock('./utils/crypto', () => ({
  decryptItem: jest.fn((perm) => `decrypted-${perm}`),
}));

const mockUserId = new Types.ObjectId();
const mockRole = {
  _id: new Types.ObjectId(),
  permissions: ['encrypted-perm'],
};

const createPopulateSelectLeanChain = (data: any) => ({
  populate: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(data),
    }),
  }),
});

const createSelectLeanChain = (data: any) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(data),
  }),
});

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
      const values = {
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        JWT_REFRESH_SECRET: 'secret-key',
        COOKIE_DOMAIN: 'localhost',
      };
      return values[key];
    }),
  };

  const userModelMock: Partial<Record<keyof Model<UserDocument>, jest.Mock>> = {
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async (a, b) => bcrypt.compareSync(a, b));

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

  describe('validateUser', () => {
    it('should throw if user not found', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue(createPopulateSelectLeanChain(null));
      await expect(service.validateUser('nouser', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user if valid', async () => {
      const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        password: bcrypt.hashSync('password123', 10),
        role: mockRole,
        metadata: { major: {} },
      };
      userModelMock.findOne = jest.fn().mockReturnValue(createPopulateSelectLeanChain(mockUser));
      const user = await service.validateUser('testuser', 'password123');
      expect(user.username).toBe('testuser');
    });
  });

  describe('register', () => {
    it('should throw if not found', async () => {
      userModelMock.findOne = jest.fn().mockReturnValue(createSelectLeanChain(null));
      await expect(
        service.register({ username: 'nouser', password: '123', confirmPassword: '123', metadata: { secret: 'x' } })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if valid', async () => {
      const oldRefreshToken = 'mockToken';
      const hashedToken = await bcrypt.hash(oldRefreshToken, 10);

      userModelMock.findById = jest.fn().mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        refreshToken: hashedToken,
        save: jest.fn(),
      });

      const result = await service.refreshToken(oldRefreshToken);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('resetPassword', () => {
  it('should throw if user not found', async () => {
    // simulate that findOne().select() returns null
    userModelMock.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null), // ❗ ไม่มี lean เพราะ service ไม่ใช้ lean
    });

    await expect(
      service.resetPassword({
        username: 'nouser',
        password: 'x',
        confirmPassword: 'x',
        metadata: { secret: 'x' },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw if user has no secret', async () => {
    userModelMock.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: mockUserId,
        metadata: {}, // no secret
      }),
    });

    await expect(
      service.resetPassword({
        username: 'nouser',
        password: 'x',
        confirmPassword: 'x',
        metadata: { secret: 'x' },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});


  describe('logout', () => {
    it('should clear refreshToken and return success message', async () => {
      userModelMock.findById = jest.fn().mockResolvedValue({ save: jest.fn(), refreshToken: 'token' });

      const responseMock = { clearCookie: jest.fn() } as unknown as FastifyReply;
      const result = await service.logout(mockUserId.toHexString(), responseMock);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('scanPermissions', () => {
    it('should return all permissions found in controllers', () => {
      class FakeController {
        testMethod() {}
      }

      const discoveryServiceMock = { getControllers: () => [{ instance: new FakeController() }] };
      const reflectorMock = {
        get: (key: string, target: unknown) => {
          if (target === FakeController) return ['perm:read'];
          if (target === FakeController.prototype.testMethod) return ['perm:write'];
          return [];
        },
      };

      const scanService = new AuthService(
        {} as Model<UserDocument>,
        {} as JwtService,
        configServiceMock as any,
        discoveryServiceMock as any,
        reflectorMock as any,
      );

      const result = scanService.scanPermissions();
      expect(result).toEqual(['perm:read', 'perm:write']);
    });
  });
});
