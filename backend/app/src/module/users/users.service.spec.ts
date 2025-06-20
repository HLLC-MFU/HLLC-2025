import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { CreateUserDto } from './dto/create-user.dto';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { validateMetadataSchema } from 'src/pkg/helper/validateMetadataSchema';
import { UserUploadDirectDto } from './dto/upload.user.dto';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/validateMetadataSchema');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: jest.Mock & Partial<Model<UserDocument>>;
  let roleModel: jest.Mocked<Model<RoleDocument>>;
  let majorModel: jest.Mocked<Model<MajorDocument>>;

  const mockUserId = new Types.ObjectId();
  const mockRoleId = new Types.ObjectId();
  const mockMajorId = new Types.ObjectId();

  const mockUser = {
    _id: mockUserId,
    username: 'john',
    password: 'pass',
    role: mockRoleId,
    metadata: { major: mockMajorId },
    save: jest.fn(),
  } as object as UserDocument;

  const mockRole = {
    _id: mockRoleId,
    name: 'Admin',
    metadataSchema: {},
  };

  const mockMajor = { _id: mockMajorId, name: 'CS', school: new Types.ObjectId() };

  beforeEach(async () => {
    const userModelMethods: Partial<Model<UserDocument>> = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    };

    userModel = Object.assign(jest.fn(), userModelMethods);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Role.name), useValue: { findById: jest.fn() } },
        {
          provide: getModelToken(Major.name),
          useValue: { find: jest.fn(), findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    roleModel = module.get(getModelToken(Role.name));
    majorModel = module.get(getModelToken(Major.name));
  });

  describe('create()', () => {
    it('should create a user with validated metadata', async () => {
      const dto: CreateUserDto = {
        name: { first: 'John', last: 'Doe' },
        username: 'johndoe',
        password: 'pass',
        role: mockRoleId,
        metadata: {},
      };
      (roleModel.findById as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(mockRole) });
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      const mockUserInstance = { ...dto, save: saveMock };
      (userModel as jest.Mock).mockImplementation(() => mockUserInstance);
      const result = await service.create(dto);
      expect(validateMetadataSchema).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if role is not found', async () => {
      const dto: CreateUserDto = {
        name: { first: 'John', last: 'Doe' },
        username: 'johndoe',
        password: 'pass',
        role: mockRoleId,
        metadata: {},
      };
      (roleModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve(null),
      });

      await expect(service.create(dto)).rejects.toThrow('Role not found');
    });
  });

  describe('findAll()', () => {
    it('should call queryAll with correct parameters', async () => {
      const query = { role: 'admin' };
      await service.findAll(query);
      expect(queryAll).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should call queryFindOne with id', async () => {
      const id = mockUserId.toHexString();
      await service.findOne(id);
      expect(queryFindOne).toHaveBeenCalledWith(userModel, { _id: id }, []);
    });
  });

  describe('getUserCountByRoles()', () => {
    it('should aggregate user counts', async () => {
      (userModel.aggregate as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve([{ _id: 'Admin', registered: 2, notRegistered: 1 }]),
      });
      const result = await service.getUserCountByRoles();
      expect(result.Admin.registered).toBe(2);
      expect(result.Admin.notRegistered).toBe(1);
      expect(result.Admin.registered + result.Admin.notRegistered).toBe(3);
    });
  });

  describe('findOneByQuery()', () => {
    it('should call queryFindOne with query and populated paths', async () => {
      const username = 'john';
      await service.findOneByQuery({ username });
      expect(queryFindOne).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should update user and return it', async () => {
      (userModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve({ _id: mockUserId, role: mockRoleId }),
      });
      (roleModel.findById as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(mockRole) });
      (userModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(mockUser) });
      const result = await service.update(mockUserId.toHexString(), { username: 'updated' });
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      (userModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve(null),
      });

      await expect(
        service.update(mockUserId.toHexString(), { username: 'new' }),
      ).rejects.toThrow('User not found');
    });

    it('should throw NotFoundException if role is not found', async () => {
      (userModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve({ _id: mockUserId, role: mockRoleId }),
      });
      (roleModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve(null),
      });

      await expect(
        service.update(mockUserId.toHexString(), { username: 'new' }),
      ).rejects.toThrow('Role not found');
    });
  });

  describe('remove()', () => {
    it('should call queryDeleteOne', async () => {
      await service.remove(mockUserId.toHexString());
      expect(queryDeleteOne).toHaveBeenCalled();
    });
  });

  describe('removeMultiple()', () => {
    it('should find and delete users by IDs', async () => {
      (userModel.find as jest.Mock).mockReturnValue({
        lean: () => Promise.resolve([mockUser]),
      });
      (userModel.deleteMany as jest.Mock).mockResolvedValue(undefined);
      const result = await service.removeMultiple([mockUserId.toHexString()]);
      expect((result[0] as UserDocument)._id.toString()).toEqual(mockUserId.toString());
    });
  });

  describe('resetPassword()', () => {
    it('should reset user password', async () => {
      const mockDoc = { save: jest.fn(), password: 'old', refreshToken: 'abc' };
      (findOrThrow as jest.Mock).mockResolvedValue(mockDoc);
      await service.resetPassword(mockUserId.toHexString());
      expect(mockDoc.password).toBe('');
      expect(mockDoc.refreshToken).toBeNull();
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe('upload()', () => {
    it('should upload and save users', async () => {
      const dto: UserUploadDirectDto[] = [
        {
          name: { first: 'a' },
          username: 'b',
          role: mockRoleId.toHexString(),
          metadata: { major: mockMajorId.toHexString() },
        },
      ];

      (majorModel.findById as jest.Mock).mockReturnValue({
        lean: () => Promise.resolve(mockMajor),
      });

      (userModel as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ _id: mockUserId.toHexString(), username: 'b' }),
        }),
      }));

      const result = await service.upload(dto);
      expect(result.length).toBe(1);
    });

    it('should throw BadRequestException if metadata.major is missing', async () => {
      const dto: UserUploadDirectDto[] = [
        {
          name: { first: 'a' },
          username: 'b',
          role: mockRoleId.toHexString(),
          metadata: {}, // missing major
        },
      ];

      await expect(service.upload(dto)).rejects.toThrow('Major is required');
    });

    it('should throw NotFoundException if major not found', async () => {
      const dto: UserUploadDirectDto[] = [
        {
          name: { first: 'a' },
          username: 'b',
          role: mockRoleId.toHexString(),
          metadata: { major: mockMajorId.toHexString() },
        },
      ];

      (majorModel.findById as jest.Mock).mockReturnValueOnce({
        lean: () => Promise.resolve(null),
      });

      await expect(service.upload(dto)).rejects.toThrow(
        'Major in database not found',
      );
    });

    it('should throw BadRequestException if user.save() fails', async () => {
      const dto: UserUploadDirectDto[] = [
        {
          name: { first: 'a' },
          username: 'b',
          role: mockRoleId.toHexString(),
          metadata: { major: mockMajorId.toHexString() },
        },
      ];

      (majorModel.findById as jest.Mock).mockReturnValue({
        lean: () => Promise.resolve(mockMajor),
      });

      (userModel as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      await expect(service.upload(dto)).rejects.toThrow('DB error');
    });
  });

  describe('registerDeviceToken()', () => {
    it('should call queryUpdateOne to add token', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(mockUser);
      await service.registerDeviceToken(mockUserId.toHexString(), { deviceToken: 'abc' });
      expect(queryUpdateOne).toHaveBeenCalled();
    });
    
  });

  describe('removeDeviceToken()', () => {
    it('should call queryUpdateOne to remove token', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(mockUser);
      await service.removeDeviceToken(mockUserId.toHexString(), 'abc');
      expect(queryUpdateOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is missing', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.removeDeviceToken(mockUserId.toHexString(), ''),
      ).rejects.toThrow('Token is required');
    });
  });
});
