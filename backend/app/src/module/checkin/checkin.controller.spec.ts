import { Test, TestingModule } from '@nestjs/testing';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { Types } from 'mongoose';
import { UserRequest } from 'src/pkg/types/users';

describe('CheckinController', () => {
  let controller: CheckinController;
  let service: CheckinService;

  const mockCheckin = {
    _id: new Types.ObjectId().toHexString(),
    user: new Types.ObjectId().toHexString(),
    staff: new Types.ObjectId().toHexString(),
    activities: ['activity1', 'activity2'],
  };

  const mockCheckinService: Record<keyof CheckinService, jest.Mock> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckinController],
      providers: [{ provide: CheckinService, useValue: mockCheckinService }],
    }).compile();

    controller = module.get<CheckinController>(CheckinController);
    service = module.get<CheckinService>(CheckinService);
  });

  describe('create', () => {
    it('should call checkinService.create with staff from req.user', async () => {
      const userId = new Types.ObjectId().toHexString();
      const staffId = new Types.ObjectId().toHexString();

      const req: UserRequest = {
        user: {
          _id: staffId,
        },
      } as UserRequest;

      const inputDto: CreateCheckinDto = {
        user: userId,
        activities: ['activity1', 'activity2'],
        staff: '',
      };

      const expectedDto: CreateCheckinDto = {
        user: userId,
        activities: ['activity1', 'activity2'],
        staff: staffId,
      };

      const result = { ...expectedDto, _id: mockCheckin._id };
      mockCheckinService.create.mockResolvedValue(result);

      const res = await controller.create(req, inputDto);
      expect(res).toEqual(result);
      expect(mockCheckinService.create).toHaveBeenCalledWith(expectedDto);
    });
  });

  describe('findAll', () => {
    it('should return all checkins from service', async () => {
      const query: Record<string, string> = { user: mockCheckin.user };
      const mockResult = [mockCheckin];
      mockCheckinService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);
      expect(result).toEqual(mockResult);
      expect(mockCheckinService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one checkin by id', async () => {
      mockCheckinService.findOne.mockResolvedValue(mockCheckin);

      const result = await controller.findOne(mockCheckin._id);
      expect(result).toEqual(mockCheckin);
      expect(mockCheckinService.findOne).toHaveBeenCalledWith(mockCheckin._id);
    });
  });

  describe('update', () => {
    it('should call update with id and dto', async () => {
      const updateDto: UpdateCheckinDto = {
        activities: ['activity3'],
      };

      const updated = { ...mockCheckin, ...updateDto };
      mockCheckinService.update.mockResolvedValue(updated);

      const result = await controller.update(mockCheckin._id, updateDto);
      expect(result).toEqual(updated);
      expect(mockCheckinService.update).toHaveBeenCalledWith(mockCheckin._id, updateDto);
    });
  });

  describe('remove', () => {
    it('should call remove with id', async () => {
      const expected = { deleted: true };
      mockCheckinService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockCheckin._id);
      expect(result).toEqual(expected);
      expect(mockCheckinService.remove).toHaveBeenCalledWith(mockCheckin._id);
    });
  });
});
