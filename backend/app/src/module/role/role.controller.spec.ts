import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateMetadataSchema: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call roleService.create with dto', async () => {
      const dto: CreateRoleDto = {
        name: 'Admin',
        permissions: ['perm:read'],
        metadataSchema: { dept: { type: 'string' } },
      };
      const expected = { _id: '123', ...dto };
      mockRoleService.create.mockResolvedValueOnce(expected);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const expected = [{ name: 'Admin' }];
      mockRoleService.findAll.mockResolvedValueOnce(expected);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return role by ID', async () => {
      const expected = { _id: 'abc', name: 'Editor' };
      mockRoleService.findOne.mockResolvedValueOnce(expected);

      const result = await controller.findOne('abc');

      expect(service.findOne).toHaveBeenCalledWith('abc');
      expect(result).toEqual(expected);
    });
  });

  describe('updateMetadataSchema', () => {
    it('should update metadata schema and return updated role', async () => {
      const dto: UpdateMetadataSchemaDto = {
        metadataSchema: {
          active: {
            type: 'boolean',
            label: 'Active',
            required: true,
          },
        },
      };
      const expected = { _id: 'id1', metadataSchema: dto.metadataSchema };

      mockRoleService.updateMetadataSchema.mockResolvedValueOnce(expected);

      const result = await controller.updateMetadataSchema('id1', dto);

      expect(service.updateMetadataSchema).toHaveBeenCalledWith('id1', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should update role and return updated result', async () => {
      const dto: UpdateRoleDto = {
        name: 'Updated',
        permissions: ['perm:edit'],
        metadataSchema: { role: { type: 'string' } },
      };
      const expected = { _id: 'id2', ...dto };

      mockRoleService.update.mockResolvedValueOnce(expected);

      const result = await controller.update('id2', dto);

      expect(service.update).toHaveBeenCalledWith('id2', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should delete the role and return message', async () => {
      const expected = { message: 'Role deleted successfully', id: 'id3' };
      mockRoleService.remove.mockResolvedValueOnce(expected);

      const result = await controller.remove('id3');

      expect(service.remove).toHaveBeenCalledWith('id3');
      expect(result).toEqual(expected);
    });
  });
});
