import { Test, TestingModule } from '@nestjs/testing';
import { EvoucherCodeController } from './evoucher-code.controller';
import { EvoucherCodeService } from '../service/evoucher-code.service';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Types } from 'mongoose';

describe('EvoucherCodeController', () => {
  let controller: EvoucherCodeController;
  let service: EvoucherCodeService;

  const mockCode = {
    _id: new Types.ObjectId().toHexString(),
    user: new Types.ObjectId().toHexString(),
    evoucher: new Types.ObjectId().toHexString(),
    isUsed: false,
    metadata: { source: 'web' },
  };

  const mockEvoucherCodeService: Record<keyof EvoucherCodeService, jest.Mock> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findOneByQuery: jest.fn(),
  findAllByQuery: jest.fn(),
  getExistsEvoucherCodes: jest.fn(),
  generateEvoucherCodes: jest.fn(),
  checkVoucherUsage: jest.fn(),
};


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvoucherCodeController],
      providers: [
        { provide: EvoucherCodeService, useValue: mockEvoucherCodeService },
      ],
    }).compile();

    controller = module.get<EvoucherCodeController>(EvoucherCodeController);
    service = module.get<EvoucherCodeService>(EvoucherCodeService);
  });

  describe('create', () => {
    it('should create a new evoucher code', async () => {
      const dto: CreateEvoucherCodeDto = {
        user: mockCode.user,
        evoucher: mockCode.evoucher,
        isUsed: false,
        metadata: { source: 'web' },
      };

      mockEvoucherCodeService.create.mockResolvedValue({ ...dto, _id: mockCode._id });

      const result = await controller.create(dto);
      expect(result).toEqual({ ...dto, _id: mockCode._id });
      expect(mockEvoucherCodeService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all evoucher codes', async () => {
      const query: Record<string, string> = { user: mockCode.user };
      mockEvoucherCodeService.findAll.mockResolvedValue([mockCode]);

      const result = await controller.findAll(query);
      expect(result).toEqual([mockCode]);
      expect(mockEvoucherCodeService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one evoucher code by id', async () => {
      mockEvoucherCodeService.findOne.mockResolvedValue(mockCode);

      const result = await controller.findOne(mockCode._id);
      expect(result).toEqual(mockCode);
      expect(mockEvoucherCodeService.findOne).toHaveBeenCalledWith(mockCode._id);
    });
  });

  describe('update', () => {
    it('should update evoucher code by id', async () => {
      const dto: UpdateEvoucherCodeDto = {
        isUsed: true,
        metadata: { updatedBy: 'admin' },
      };

      const updated = { ...mockCode, ...dto };
      mockEvoucherCodeService.update.mockResolvedValue(updated);

      const result = await controller.update(mockCode._id, dto);
      expect(result).toEqual(updated);
      expect(mockEvoucherCodeService.update).toHaveBeenCalledWith(mockCode._id, dto);
    });
  });

  describe('remove', () => {
    it('should remove evoucher code by id', async () => {
      const expected = { deleted: true };
      mockEvoucherCodeService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockCode._id);
      expect(result).toEqual(expected);
      expect(mockEvoucherCodeService.remove).toHaveBeenCalledWith(mockCode._id);
    });
  });
});
