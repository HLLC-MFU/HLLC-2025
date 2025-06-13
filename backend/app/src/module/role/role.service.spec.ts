import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoleService } from './role.service';
import { Role } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { encryptItem } from '../auth/utils/crypto';
import { findOrThrow } from 'src/pkg/validator/model.validator';

jest.mock('../auth/utils/crypto', () => ({
  encryptItem: jest.fn((item: string) => `encrypted-${item}`),
}));

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
}));

describe('RoleService', () => {
  let service: RoleService;

  const saveMock = jest.fn();
  const findMock = jest.fn();
  const findByIdAndDeleteMock = jest.fn();

  const roleModelMock = {
    find: findMock,
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
      expect(encryptItem).toHaveBeenNthCalledWith(1, 'perm:read', 0, ['perm:read', 'perm:write']);
      expect(encryptItem).toHaveBeenNthCalledWith(2, 'perm:write', 1, ['perm:read', 'perm:write']);
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
      expect(findOrThrow).toHaveBeenCalledWith(expect.any(Function), '123', 'Role');
      expect(result).toBe(mockRole);
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
});
