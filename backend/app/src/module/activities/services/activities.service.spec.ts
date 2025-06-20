import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../../users/users.service';
import { Activities } from '../schemas/activities.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { Checkin } from 'src/module/checkin/schema/checkin.schema';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, totalPages: 1 } }),
}));

jest.mock('../utils/scope.util', () => ({
  isUserInScope: jest.fn(() => true),
  parseScope: jest.fn((s) => s),
  parseStringArray: jest.fn((arr) => arr),
}));

import { queryAll } from 'src/pkg/helper/query.util';
import { isUserInScope } from '../utils/scope.util';

const mockUsersService = {
  findOneByQuery: jest.fn(),
};

const mockCheckinModel = {
  find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn() }) }),
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityModel: any;
  const saveMock = jest.fn();

  beforeEach(async () => {
    saveMock.mockClear();
    activityModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getModelToken(Activities.name), useValue: jest.fn(() => ({ save: saveMock })) },
        { provide: UsersService, useValue: mockUsersService },
        { provide: getModelToken(Checkin.name), useValue: mockCheckinModel },
      ],
    })
      .overrideProvider(getModelToken(Activities.name))
      .useValue(activityModel)
      .compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  describe('create', () => {
    it('should create activity', async () => {
      const dto: CreateActivitiesDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'ACT',
        fullDetails: { th: 'รายละเอียด', en: 'Detail' },
        shortDetails: { th: 'ย่อ', en: 'Short' },
        type: new Types.ObjectId().toString(),
        location: { th: 'ที่', en: 'Where' },
        photo: {
          coverPhoto: '',
          bannerPhoto: '',
          thumbnail: '',
          logoPhoto: '',
        },
        metadata: { scope: {} },
      };

      const instance = { save: saveMock.mockResolvedValue('saved') };
      const Model = jest.fn(() => instance);
      const module = await Test.createTestingModule({
        providers: [
          ActivitiesService,
          { provide: getModelToken(Activities.name), useValue: Model },
          { provide: UsersService, useValue: mockUsersService },
          { provide: getModelToken(Checkin.name), useValue: mockCheckinModel },
        ],
      }).compile();

      const svc = module.get<ActivitiesService>(ActivitiesService);
      const result = await svc.create(dto);
      expect(result).toBe('saved');
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw BadRequestException on invalid dates', async () => {
      const dto: CreateActivitiesDto = {
        name: { th: '', en: '' },
        acronym: '',
        fullDetails: { th: '', en: '' },
        shortDetails: { th: '', en: '' },
        type: new Types.ObjectId().toString(),
        location: { th: '', en: '' },
        photo: { coverPhoto: '', bannerPhoto: '', thumbnail: '', logoPhoto: '' },
        metadata: {
          startAt: new Date(),
          endAt: new Date(),
          checkinStartAt: new Date(),
        },
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should call queryAll with proper params', async () => {
      const result = await service.findAll({});
      expect(queryAll).toHaveBeenCalled();
      expect(result).toEqual({ data: [], meta: { total: 0, totalPages: 1 } });
    });
  });

  describe('findCanCheckinActivities', () => {
    it('should return checkin activities', async () => {
      const result = await service.findCanCheckinActivities();
      expect(result).toEqual({ data: [], meta: { total: 0, totalPages: 1 } });
    });
  });

  describe('findOne', () => {
    it('should find by id and return lean', async () => {
      const activity = { _id: '123' };
      activityModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(activity) });

      const result = await service.findOne('123');
      expect(result).toEqual(activity);
    });
  });

  describe('findActivitiesByUserId', () => {
    it('should return mapped activities', async () => {
      const userId = new Types.ObjectId().toString();

      mockUsersService.findOneByQuery.mockResolvedValueOnce({
        data: [{ _id: userId, metadata: { major: {}, school: {} } }],
      });

      mockCheckinModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ activity: 'a1' }]),
        }),
      });

      (queryAll as jest.Mock).mockResolvedValueOnce({
        data: [{ _id: 'a1', metadata: { isOpen: true, isVisible: true, checkinStartAt: new Date(), endAt: new Date() } }],
        meta: { total: 1, totalPages: 1 },
      });

      const result = await service.findActivitiesByUserId(userId);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should throw if user not found', async () => {
      mockUsersService.findOneByQuery.mockResolvedValueOnce({ data: [] });
      await expect(service.findActivitiesByUserId(new Types.ObjectId().toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update activity and return it', async () => {
      const updated = { _id: 'x1', acronym: 'NEW' };
      activityModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

      const result = await service.update('x1', { acronym: 'NEW' });
      expect(result).toEqual(updated);
    });

    it('should throw if not found', async () => {
      activityModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(service.update('bad-id', { acronym: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove activity by id', async () => {
      activityModel.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      const result = await service.remove('xx');
      expect(result).toEqual({ message: 'Activity deleted successfully', id: 'xx' });
    });
  });
});
