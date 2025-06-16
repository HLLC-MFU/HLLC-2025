import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { FastifyReply } from 'fastify';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const user = { _id: 'u123', username: 'john', role: {}, metadata: {} };
  const tokens = { accessToken: 'access123', refreshToken: 'refresh456' };

  const mockAuthService = {
    validateUser: jest.fn().mockResolvedValue(user),
    login: jest.fn().mockResolvedValue(tokens),
    refreshToken: jest.fn().mockResolvedValue(tokens),
    register: jest.fn().mockResolvedValue({ message: 'User registered successfully' }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset successfully' }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
    scanPermissions: jest.fn().mockReturnValue(['read', 'write']),
  };

  const createMockReply = (): FastifyReply =>
    ({
      setCookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn(),
      send: jest.fn(),
    } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return tokens if useCookie=false', async () => {
      const res = createMockReply();
      const dto: LoginDto = { username: 'john', password: 'pass' };
      await controller.login(dto, 'false', res);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(dto.username, dto.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(user, {
        useCookie: false,
        response: res,
      });
      expect(res.send).toHaveBeenCalledWith({ tokens, user });
    });

    it('should set cookies and return message if useCookie=true', async () => {
      const res = createMockReply();
      const dto: LoginDto = { username: 'john', password: 'pass' };
      await controller.login(dto, 'true', res);
      expect(res.send).toHaveBeenCalledWith({ message: 'Login successful!', user });
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      const result = await controller.refresh({ refreshToken: 'refresh123' });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh123');
      expect(result).toEqual(tokens);
    });
  });

  describe('register', () => {
    it('should register a user', async () => {
      const dto: RegisterDto = {
        username: 'john',
        password: 'pass',
        confirmPassword: 'pass',
        metadata: { secret: 's3cr3t' },
      };
      const result = await controller.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const dto: ResetPasswordDto = {
        username: 'john',
        password: 'pass',
        confirmPassword: 'pass',
        metadata: { secret: 's3cr3t' },
      };
      const result = await controller.resetPassword(dto);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const req = { user: { _id: 'u123' } };
      const res = createMockReply();
      const result = await controller.logout(req as any, res);
      expect(mockAuthService.logout).toHaveBeenCalledWith('u123', res);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', () => {
      const result = controller.getAllPermissions();
      expect(result).toEqual(['read', 'write']);
    });
  });
});
