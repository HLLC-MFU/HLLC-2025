import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { Activities } from './schema/activities.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

jest.mock('src/pkg/helper/query.util', () => ({
  ...jest.requireActual('src/pkg/helper/query.util'),
  queryAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
}));

jest.mock('src/pkg/helper/helpers');

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let usersService: UsersService;

  const sharedUserObjectId = new Types.ObjectId();
  const sharedUserId = sharedUserObjectId.toHexString();

  const mockActivity = {
    _id: new Types.ObjectId().toHexString(),
    name: { th: 'ชื่อกิจกรรม', en: 'Activity Name' },
    acronym: 'ACT',
    fullDetails: { th: 'รายละเอียดเต็ม', en: 'Full Details' },
    shortDetails: { th: 'ย่อ', en: 'Short' },
    type: new Types.ObjectId().toHexString(),
    photo: {
      coverPhoto: '',
      bannerPhoto: '',
      thumbnail: '',
      logoPhoto: 'wasan.png',
    },
    location: { th: 'ที่ตั้ง', en: 'Location' },
    metadata: {
      isOpen: true,
      isProgressCount: false,
      isVisible: true,
      scope: {
        major: [],
        school: [],
        user: [sharedUserId],
      },
    },
  };

  const saveMock = jest.fn().mockResolvedValue(mockActivity);

  const mockActivityModel: any = Object.assign(
    jest.fn().mockImplementation(() => ({ save: saveMock })),
    {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockActivity]),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    }
  );

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(Types.ObjectId, 'isValid').mockImplementation((val) => {
      return typeof val === 'string' && val.length === 24;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getModelToken(Activities.name), useValue: mockActivityModel },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    const baseDto: CreateActivitiesDto = {
      name: { th: 'ชื่อ', en: 'Name' },
      acronym: 'ACT',
      fullDetails: { th: 'รายละเอียดเต็ม', en: 'Details' },
      shortDetails: { th: 'ย่อ', en: 'Short' },
      type: new Types.ObjectId().toHexString(),
      photo: {
        coverPhoto: '',
        bannerPhoto: '',
        thumbnail: '',
        logoPhoto: '',
      },
      location: { th: 'ที่ตั้ง', en: 'Location' },
    };

    it('should create activity with scope', async () => {
      const dto: CreateActivitiesDto = {
        ...baseDto,
        metadata: {
          scope: {
            major: ['m1'],
            school: ['s1'],
            user: [sharedUserId],
          },
        },
      };

      const result = await service.create(dto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(mockActivity);
    });

    it('should handle duplicate error', async () => {
      const error = { code: 11000 };
      saveMock.mockRejectedValueOnce(error);

      const dto: CreateActivitiesDto = {
        ...baseDto,
        metadata: {},
      };

      await service.create(dto);
      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
    });
  });

  describe('findAll', () => {
    it('should return all for admin', async () => {
      const result = await service.findAll({}, {
        _id: sharedUserId,
        role: { permissions: ['activities:read'] },
      });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should return unrestricted when no user', async () => {
      mockActivityModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([mockActivity]),
      });

      const result = await service.findAll({}, undefined);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should return filtered activities for user in scope', async () => {
      mockActivityModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([mockActivity]),
      });

      mockUsersService.findOne.mockResolvedValueOnce({
        data: [{
          _id: sharedUserId,
          metadata: {
            major: { _id: 'm1', school: { _id: 's1' } },
          },
        }],
      });

      const result = await service.findAll({}, { _id: sharedUserId });
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('findOne', () => {
    it('should return activity if user in scope', async () => {
      const mockActivityWithUser = {
        ...mockActivity,
        metadata: {
          ...mockActivity.metadata,
          scope: {
            ...mockActivity.metadata.scope,
            user: [sharedUserId],
          },
        },
      };

      mockActivityModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockActivityWithUser),
      });

      mockUsersService.findOne.mockResolvedValueOnce({
        data: [
          {
            _id: sharedUserId,
            metadata: {
              major: { _id: 'm1', school: { _id: 's1' } },
            },
          },
        ],
      });

      jest.spyOn(service as any, 'isUserInScope').mockResolvedValueOnce(true);

      const result = await service.findOne(mockActivity._id, sharedUserId);
      expect(result).toEqual(mockActivityWithUser);
    });

    it('should throw if activity not found', async () => {
      mockActivityModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id', sharedUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not found', async () => {
      mockActivityModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockActivity),
      });

      mockUsersService.findOne.mockResolvedValueOnce({ data: [] });

      await expect(service.findOne(mockActivity._id, sharedUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not in scope', async () => {
      mockActivityModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockActivity),
      });

      mockUsersService.findOne.mockResolvedValueOnce({
        data: [
          {
            _id: sharedUserId,
            metadata: {
              major: { _id: 'm1', school: { _id: 's1' } },
            },
          },
        ],
      });

      jest.spyOn(service as any, 'isUserInScope').mockResolvedValueOnce(false);

      await expect(service.findOne(mockActivity._id, sharedUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update activity', async () => {
      const updated = { ...mockActivity, acronym: 'NEW' };

      mockActivityModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(updated),
      });

      const dto: UpdateActivityDto = {
        acronym: 'NEW',
        metadata: {
          scope: {
            major: [new Types.ObjectId().toHexString()],
            school: [new Types.ObjectId().toHexString()],
            user: [sharedUserId],
          },
        },
      };

      const result = await service.update(mockActivity._id, dto);
      expect(result).toEqual(updated);
    });

    it('should throw if not found', async () => {
      mockActivityModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('not-found', { acronym: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete activity', async () => {
      mockActivityModel.findByIdAndDelete.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove(mockActivity._id);
      expect(result).toEqual({
        message: 'Activity deleted successfully',
        id: mockActivity._id,
      });
    });
  });

  describe('findAllWithScope', () => {
    it('should return all if admin', async () => {
      const result = await service.findAllWithScope({}, 'admin-id', true);
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should return filtered if not admin', async () => {
      mockActivityModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([mockActivity]),
        }),
      });

      mockUsersService.findOne.mockResolvedValueOnce({
        data: [{
          _id: sharedUserId,
          metadata: {
            major: { _id: 'm1', school: { _id: 's1' } },
          },
        }],
      });

      const result = await service.findAllWithScope({}, sharedUserId, false);
      expect(result.data).toBeInstanceOf(Array);
    });
  });
});
