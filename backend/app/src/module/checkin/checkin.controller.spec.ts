import { Test, TestingModule } from '@nestjs/testing';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('CheckinController', () => {
  let controller: CheckinController;
  let service: CheckinService;

  const mockCheckin = {
    _id: new Types.ObjectId().toHexString(),
    user: new Types.ObjectId().toHexString(),
    staff: new Types.ObjectId().toHexString(),
    activities: [new Types.ObjectId().toHexString()],
  };

  const mockCheckinService: Partial<Record<keyof CheckinService, jest.Mock>> = {
    create: jest.fn(),
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
      const req = { user: { _id: staffId } } as any;

      const inputDto: CreateCheckinDto = {
        user: userId,
        activities: new Types.ObjectId().toHexString(),
        staff: '',
      };

      const expectedDto = {
        ...inputDto,
        staff: staffId,
      };

      const result = [mockCheckin];
      mockCheckinService.create!.mockResolvedValue(result);

      const res = await controller.create(inputDto, req);

      expect(res).toEqual(result);
      expect(mockCheckinService.create).toHaveBeenCalledWith(expectedDto);
    });

    it('should throw BadRequestException if req.user._id is missing', async () => {
      const inputDto: CreateCheckinDto = {
        user: new Types.ObjectId().toHexString(),
        activities: new Types.ObjectId().toHexString(),
        staff: '',
      };

      await expect(
        controller.create(inputDto, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should catch and rethrow errors as BadRequestException', async () => {
      const userId = new Types.ObjectId().toHexString();
      const staffId = new Types.ObjectId().toHexString();
      const req = { user: { _id: staffId } } as any;

      const inputDto: CreateCheckinDto = {
        user: userId,
        activities: new Types.ObjectId().toHexString(),
        staff: '',
      };

      const expectedDto = {
        ...inputDto,
        staff: staffId,
      };

      mockCheckinService.create!.mockRejectedValue(new Error('something went wrong'));

      await expect(controller.create(inputDto, req)).rejects.toThrow(
        new BadRequestException('something went wrong'),
      );
    });
  });
});
