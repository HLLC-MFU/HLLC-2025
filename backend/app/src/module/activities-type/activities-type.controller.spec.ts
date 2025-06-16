import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesTypeController } from './activities-type.controller';
import { ActivitiesTypeService } from './activities-type.service';
import { CreateActivitiesTypeDto } from './dto/create-activities-type.dto';
import { UpdateActivitiesTypeDto } from './dto/update-activities-type.dto';
import { Types } from 'mongoose';

describe('ActivitiesTypeController', () => {
  let controller: ActivitiesTypeController;
  let service: ActivitiesTypeService;

  const mockId = new Types.ObjectId().toHexString();
  const mockResult = {
    _id: mockId,
    name: 'ประเภท A',
    createdAt: new Date(),
  };

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockResult),
    findAll: jest.fn().mockResolvedValue([mockResult]),
    findOne: jest.fn().mockResolvedValue(mockResult),
    update: jest.fn().mockResolvedValue({ ...mockResult, name: 'อัปเดต' }),
    remove: jest.fn().mockResolvedValue({
      message: 'Activities type deleted successfully',
      id: mockId,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesTypeController],
      providers: [{ provide: ActivitiesTypeService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ActivitiesTypeController>(ActivitiesTypeController);
    service = module.get<ActivitiesTypeService>(ActivitiesTypeService);
  });

  describe('create', () => {
    it('should create activities type', async () => {
      const dto: CreateActivitiesTypeDto = { name: 'ประเภท A' };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all activities types', async () => {
      const result = await controller.findAll({});
      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([mockResult]);
    });
  });

  describe('findOne', () => {
    it('should return single activities type', async () => {
      const result = await controller.findOne(mockId);
      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update activities type', async () => {
      const dto: UpdateActivitiesTypeDto = { name: 'อัปเดต' };
      const result = await controller.update(mockId, dto);
      expect(service.update).toHaveBeenCalledWith(mockId, dto);
      expect(result).toEqual({ ...mockResult, name: 'อัปเดต' });
    });
  });

  describe('remove', () => {
    it('should delete activities type', async () => {
      const result = await controller.remove(mockId);
      expect(service.remove).toHaveBeenCalledWith(mockId);
      expect(result).toEqual({
        message: 'Activities type deleted successfully',
        id: mockId,
      });
    });
  });
});
