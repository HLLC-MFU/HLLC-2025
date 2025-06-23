import { Test, TestingModule } from '@nestjs/testing';
import { EvoucherCodeController } from './evoucher-code.controller';
import { EvoucherCodeService } from '../service/evoucher-code.service';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('EvoucherCodeController', () => {
  let controller: EvoucherCodeController;
  let service: EvoucherCodeService;

  const mockObjectId = new Types.ObjectId();
  const mockObjectIdStr = mockObjectId.toHexString();

  const mockEvoucherCode = {
    _id: mockObjectId,
    user: mockObjectId,
    evoucher: mockObjectId,
    isUsed: false,
    metadata: { claimedBy: 'user' },
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockEvoucherCode),
    findAll: jest.fn().mockResolvedValue([mockEvoucherCode]),
    findOne: jest.fn().mockResolvedValue(mockEvoucherCode),
    update: jest.fn().mockResolvedValue(mockEvoucherCode),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
    claimEvoucher: jest.fn().mockResolvedValue({ claimed: true }),
    getUserEvoucherCodes: jest.fn().mockResolvedValue([mockEvoucherCode]),
    useEvoucherCode: jest.fn().mockResolvedValue({ used: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvoucherCodeController],
      providers: [
        { provide: EvoucherCodeService, useValue: mockService },
        { provide: CACHE_MANAGER, useValue: {} },
      ],
    }).compile();

    controller = module.get<EvoucherCodeController>(EvoucherCodeController);
    service = module.get<EvoucherCodeService>(EvoucherCodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateEvoucherCodeDto = {
        user: mockObjectIdStr,
        evoucher: mockObjectIdStr,
        metadata: { claimedBy: 'user' },
      };
      const result = await controller.create(dto);
      expect(result).toEqual(mockEvoucherCode);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all evoucher codes', async () => {
      const query = { page: '1' };
      const result = await controller.findAll(query);
      expect(result).toEqual([mockEvoucherCode]);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single evoucher code', async () => {
      const result = await controller.findOne('some-id');
      expect(result).toEqual(mockEvoucherCode);
      expect(service.findOne).toHaveBeenCalledWith('some-id');
    });
  });

  describe('update', () => {
    it('should update an evoucher code', async () => {
      const dto: UpdateEvoucherCodeDto = {
        metadata: { updatedBy: 'admin' },
      };
      const result = await controller.update('code-id', dto);
      expect(result).toEqual(mockEvoucherCode);
      expect(service.update).toHaveBeenCalledWith('code-id', dto);
    });
  });

  describe('remove', () => {
    it('should delete an evoucher code', async () => {
      const result = await controller.remove('code-id');
      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith('code-id');
    });
  });

  describe('claimEvoucher', () => {
    it('should claim evoucher for a user (string _id)', async () => {
      const req = { user: { _id: mockObjectIdStr } } as any;
      const result = await controller.claimEvoucher(mockObjectIdStr, req);
      expect(result).toEqual({ claimed: true });
      expect(service.claimEvoucher).toHaveBeenCalledWith(mockObjectIdStr, mockObjectIdStr);
    });

    it('should claim evoucher for a user (ObjectId _id)', async () => {
      const req = { user: { _id: mockObjectId } } as any;
      const result = await controller.claimEvoucher(mockObjectIdStr, req);
      expect(result).toEqual({ claimed: true });
      expect(service.claimEvoucher).toHaveBeenCalledWith(mockObjectIdStr, mockObjectIdStr);
    });
  });

  describe('getMyEvoucherCodes', () => {
    it('should get evoucher codes (string _id)', async () => {
      const req = { user: { _id: mockObjectIdStr } } as any;
      const result = await controller.getMyEvoucherCodes(req);
      expect(result).toEqual([mockEvoucherCode]);
      expect(service.getUserEvoucherCodes).toHaveBeenCalledWith(mockObjectIdStr);
    });

    it('should get evoucher codes (ObjectId _id)', async () => {
      const req = { user: { _id: mockObjectId } } as any;
      const result = await controller.getMyEvoucherCodes(req);
      expect(result).toEqual([mockEvoucherCode]);
      expect(service.getUserEvoucherCodes).toHaveBeenCalledWith(mockObjectIdStr);
    });
  });

  describe('useEvoucherCode', () => {
    it('should mark evoucher code as used (string _id)', async () => {
      const req = { user: { _id: mockObjectIdStr } } as any;
      const result = await controller.useEvoucherCode('code-id', req);
      expect(result).toEqual({ used: true });
      expect(service.useEvoucherCode).toHaveBeenCalledWith(new Types.ObjectId(mockObjectIdStr), 'code-id');
    });

    it('should mark evoucher code as used (ObjectId _id)', async () => {
      const req = { user: { _id: mockObjectId } } as any;
      const result = await controller.useEvoucherCode('code-id', req);
      expect(result).toEqual({ used: true });
      expect(service.useEvoucherCode).toHaveBeenCalledWith(mockObjectId, 'code-id');
    });
  });
});
