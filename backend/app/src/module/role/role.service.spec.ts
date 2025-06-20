import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoleService } from './role.service';
import { Role } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { encryptItem } from '../auth/utils/crypto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { BadRequestException } from '@nestjs/common';

jest.mock('../auth/utils/crypto', () => ({
  encryptItem: jest.fn((item) => `encrypted-${item}`),
}));

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
}));

describe('RoleService', () => {
  let service: RoleService;

  const saveMock = jest.fn();
  const findMock = jest.fn();
  const findOneMock = jest.fn();
  const findByIdMock = jest.fn();
  const findByIdAndDeleteMock = jest.fn();

  const roleModelMock = {
    find: findMock,
    findOne: findOneMock,
    findById: findByIdMock,
    findByIdAndDelete: findByIdAndDeleteMock,
  };

  const roleModelConstructorMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: saveMock.mockResolvedValue({
      _id: 'mock-id',
      ...data,
    }),
  }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getModelToken(Role.name),
          useValue: Object.assign(roleModelConstructorMock, roleModelMock),
        },
        {
          provide: getModelToken('Checkin'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('create', () => {
    it('should encrypt permissions and save the role', async () => {
      const dto: CreateRoleDto = {
        name: 'Admin',
        permissions: ['perm:read', 'perm:write'],
        metadataSchema: { dept: { type: 'string' } },
      };

      const result = await service.create(dto);

      expect(encryptItem).toHaveBeenCalledTimes(2);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        _id: 'mock-id',
        name: 'Admin',
        permissions: ['encrypted-perm:read', 'encrypted-perm:write'],
        metadataSchema: dto.metadataSchema,
      }));
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      findMock.mockReturnValueOnce({ lean: () => ['role1', 'role2'] });

      const result = await service.findAll();
      expect(result).toEqual(['role1', 'role2']);
      expect(findMock).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return role by ID', async () => {
      const mockRole = { _id: '123', name: 'Editor' };
      (findOrThrow as jest.Mock).mockResolvedValueOnce(mockRole);

      const result = await service.findOne('123');
      expect(findOrThrow).toHaveBeenCalledWith(
        service['roleModel'],
        '123',
        'Role',
      );
      expect(result).toBe(mockRole);
    });
  });

  describe('findByName', () => {
    it('should return role by name', async () => {
      const mockRole = { _id: '123', name: 'Admin' };
      findOneMock.mockReturnValueOnce({ lean: () => mockRole });

      const result = await service.findByName('Admin');
      expect(findOneMock).toHaveBeenCalledWith({ name: 'Admin' });
      expect(result).toEqual(mockRole);
    });
  });

  describe('update', () => {
    it('should update role fields and save', async () => {
      const mockExistingRole = {
        _id: '123',
        name: 'Old',
        permissions: [],
        metadataSchema: {},
        save: saveMock.mockResolvedValueOnce({
          _id: '123',
          name: 'New',
          permissions: ['encrypted-new-perm'],
          metadataSchema: { dept: { type: 'string' } },
        }),
      };

      (findOrThrow as jest.Mock).mockResolvedValueOnce(mockExistingRole);
      const dto: UpdateRoleDto = {
        name: 'New',
        permissions: ['new-perm'],
        metadataSchema: { dept: { type: 'string' } },
      };

      const result = await service.update('123', dto);

      expect(encryptItem).toHaveBeenCalledWith('new-perm');
      expect(result.name).toBe('New');
      expect(result.permissions).toEqual(['encrypted-new-perm']);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a role by ID', async () => {
      findByIdAndDeleteMock.mockResolvedValueOnce({});

      const result = await service.remove('456');
      expect(findByIdAndDeleteMock).toHaveBeenCalledWith('456');
      expect(result).toEqual({ message: 'Role deleted successfully', id: '456' });
    });
  });

  describe('updateMetadataSchema', () => {
    it('should update metadataSchema and save', async () => {
      const dto: UpdateMetadataSchemaDto = {
        metadataSchema: {
          updated: {
            type: 'boolean',
            label: 'Updated?',
            required: true,
          },
        },
      };

      const mockRole = {
        _id: '999',
        metadataSchema: {},
        save: saveMock.mockResolvedValueOnce({
          _id: '999',
          metadataSchema: dto.metadataSchema,
        }),
      };

      (findOrThrow as jest.Mock).mockResolvedValueOnce(mockRole);

      const result = await service.updateMetadataSchema('999', dto);

      expect(findOrThrow).toHaveBeenCalledWith(expect.any(Function), '999', 'Role');
      expect(result.metadataSchema).toEqual(dto.metadataSchema);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('updatePermissions', () => {
    it('should update encrypted permissions and save', async () => {
      const mockRole = {
        _id: '777',
        permissions: [],
        save: saveMock.mockResolvedValueOnce({
          _id: '777',
          permissions: ['encrypted-perm:create', 'encrypted-perm:update'],
        }),
      };

      (findOrThrow as jest.Mock).mockResolvedValueOnce(mockRole);

      const result = await service.updatePermissions('777', ['perm:create', 'perm:update']);

      expect(encryptItem).toHaveBeenNthCalledWith(1, 'perm:create', 0, ['perm:create', 'perm:update']);
      expect(encryptItem).toHaveBeenNthCalledWith(2, 'perm:update', 1, ['perm:create', 'perm:update']);
      expect(result.permissions).toEqual(['encrypted-perm:create', 'encrypted-perm:update']);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('updateCheckinScope', () => {
    it('should throw BadRequest if roleId is invalid', async () => {
      await expect(
        service.updateCheckinScope('invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if role not found', async () => {
      findByIdMock.mockReturnValueOnce(null);

      await expect(
        service.updateCheckinScope('60f6d62c4a3f1c2f5c8e6a96'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update check-in scope and save', async () => {
      const mockRole = {
        _id: '60f6d62c4a3f1c2f5c8e6a96',
        metadata: {},
        save: saveMock.mockResolvedValueOnce({
          _id: '60f6d62c4a3f1c2f5c8e6a96',
          metadata: {
            canCheckin: {
              users: ['u1'],
              majors: ['m1'],
              schools: ['s1'],
            },
          },
        }),
      };

      findByIdMock.mockReturnValueOnce(mockRole);

      const result = await service.updateCheckinScope(
        '60f6d62c4a3f1c2f5c8e6a96',
        ['u1'],
        ['m1'],
        ['s1'],
      );

      expect(result.metadata.canCheckin).toEqual({
        users: ['u1'],
        majors: ['m1'],
        schools: ['s1'],
      });
      expect(saveMock).toHaveBeenCalled();
    });
  });
});
