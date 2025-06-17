import { Test, TestingModule } from '@nestjs/testing';
import { EvoucherTypeController } from './evoucher-type.controller';
import { EvoucherTypeService } from '../service/evoucher-type.service';
import { CreateEvoucherTypeDto } from '../dto/evoucher-types/create-evoucher-type.dto';
import { UpdateEvoucherTypeDto } from '../dto/evoucher-types/update-evoucher-type.dto';
import { Types } from 'mongoose';

describe('EvoucherTypeController', () => {
  let controller: EvoucherTypeController;
  let service: EvoucherTypeService;

  const mockEvoucherType = {
    _id: new Types.ObjectId().toHexString(),
    name: 'Discount',
  };

  const mockEvoucherTypeService: Record<keyof EvoucherTypeService, jest.Mock> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvoucherTypeController],
      providers: [
        { provide: EvoucherTypeService, useValue: mockEvoucherTypeService },
      ],
    }).compile();

    controller = module.get<EvoucherTypeController>(EvoucherTypeController);
    service = module.get<EvoucherTypeService>(EvoucherTypeService);
  });

  describe('create', () => {
    it('should call evoucherTypeService.create with dto', async () => {
      const dto: CreateEvoucherTypeDto = { name: 'Discount' };
      mockEvoucherTypeService.create.mockResolvedValue({ ...dto, _id: mockEvoucherType._id });

      const result = await controller.create(dto);
      expect(result).toEqual({ ...dto, _id: mockEvoucherType._id });
      expect(mockEvoucherTypeService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all evoucher types from service', async () => {
      const query: Record<string, string> = { name: 'Discount' };
      mockEvoucherTypeService.findAll.mockResolvedValue([mockEvoucherType]);

      const result = await controller.findAll(query);
      expect(result).toEqual([mockEvoucherType]);
      expect(mockEvoucherTypeService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one evoucher type by id', async () => {
      mockEvoucherTypeService.findOne.mockResolvedValue(mockEvoucherType);

      const result = await controller.findOne(mockEvoucherType._id);
      expect(result).toEqual(mockEvoucherType);
      expect(mockEvoucherTypeService.findOne).toHaveBeenCalledWith(mockEvoucherType._id);
    });
  });

  describe('update', () => {
    it('should call update with id and dto', async () => {
      const updateDto: UpdateEvoucherTypeDto = { name: 'Updated Discount' };
      const updated = { ...mockEvoucherType, ...updateDto };
      mockEvoucherTypeService.update.mockResolvedValue(updated);

      const result = await controller.update(mockEvoucherType._id, updateDto);
      expect(result).toEqual(updated);
      expect(mockEvoucherTypeService.update).toHaveBeenCalledWith(mockEvoucherType._id, updateDto);
    });
  });

  describe('remove', () => {
    it('should call remove with id', async () => {
      const expected = { deleted: true };
      mockEvoucherTypeService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockEvoucherType._id);
      expect(result).toEqual(expected);
      expect(mockEvoucherTypeService.remove).toHaveBeenCalledWith(mockEvoucherType._id);
    });
  });
});
