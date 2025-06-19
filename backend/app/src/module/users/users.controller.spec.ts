import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateUserDto } from './dto/create-user.dto';
import { UserUploadDirectDto } from './dto/upload.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';
import { ActivitiesService } from '../activities/services/activities.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockService = {
    create: jest.fn(),
    upload: jest.fn(),
    findAll: jest.fn(),
    findAllByQuery: jest.fn(),
    getUserCountByRoles: jest.fn(),
    findOne: jest.fn(),
    findOneByQuery: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeMultiple: jest.fn(),
    registerDeviceToken: jest.fn(),
    removeDeviceToken: jest.fn(),
  };

  const mockActivitiesService = {
    // mock only if used in controller, otherwise keep empty
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('create()', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateUserDto = {
        name: { first: 'John', last: 'Doe' },
        username: 'john',
        password: 'pass',
        role: new Types.ObjectId(),
        metadata: {},
      };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('upload()', () => {
    it('should call service.upload with dto', async () => {
      const dto: UserUploadDirectDto[] = [
        {
          name: { first: 'a' },
          username: 'b',
          role: new Types.ObjectId().toHexString(),
          metadata: { major: new Types.ObjectId().toHexString() },
        },
      ];
      await controller.upload(dto);
      expect(service.upload).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with query', async () => {
      const query = { role: 'admin' };
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getUserCountByRoles()', () => {
    it('should call service.getUserCountByRoles', async () => {
      await controller.getUserCountByRoles();
      expect(service.getUserCountByRoles).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with id', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('getProfile()', () => {
    it('should call service.findOneByQuery with user id', async () => {
      const req = {
        user: { _id: new Types.ObjectId().toHexString() },
      };
      await controller.getProfile(req as any);
      expect(service.findOneByQuery).toHaveBeenCalledWith({ _id: req.user._id });
    });
  });

  describe('update()', () => {
    it('should call service.update with id and dto', async () => {
      const id = new Types.ObjectId().toHexString();
      const dto: UpdateUserDto = { username: 'updated' };
      await controller.update(id, dto);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove()', () => {
    it('should call service.remove with id', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('removeMultiple()', () => {
    it('should call service.removeMultiple with ids', async () => {
      const ids = [new Types.ObjectId().toHexString()];
      await controller.removeMultiple(ids);
      expect(service.removeMultiple).toHaveBeenCalledWith(ids);
    });
  });

  describe('registerDeviceToken()', () => {
    it('should call service.registerDeviceToken with id and dto', async () => {
      const id = new Types.ObjectId().toHexString();
      const dto = { deviceToken: 'abc' };
      await controller.registerDeviceToken(id, dto);
      expect(service.registerDeviceToken).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('removeDeviceToken()', () => {
    it('should call service.removeDeviceToken with id and token', async () => {
      const id = new Types.ObjectId().toHexString();
      const token = 'abc';
      await controller.removeDeviceToken(id, token);
      expect(service.removeDeviceToken).toHaveBeenCalledWith(id, token);
    });
  });
});
