import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EvoucherCodeService } from './evoucher-code.service';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Types, Model } from 'mongoose';
import {
  validateEvoucher,
  validateClaimEligibility,
  createEvoucherCode,
  useEvoucherCode as useEvoucherCodeUtil,
} from '../utils/evoucher.util';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

jest.mock('../utils/evoucher.util');
jest.mock('src/pkg/helper/query.util');

describe('EvoucherCodeService', () => {
  let service: EvoucherCodeService;

  const mockEvoucherCodeModel = {
    findOne: jest.fn(),
  };
  const mockEvoucherModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvoucherCodeService,
        {
          provide: getModelToken(EvoucherCode.name),
          useValue: mockEvoucherCodeModel,
        },
        {
          provide: getModelToken(Evoucher.name),
          useValue: mockEvoucherModel,
        },
      ],
    }).compile();

    service = module.get<EvoucherCodeService>(EvoucherCodeService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should validate and create evoucher code', async () => {
      const dto: CreateEvoucherCodeDto = {
        evoucher: 'e1',
        user: 'u1',
        isUsed: false,
        metadata: {},
      };

      (validateEvoucher as jest.Mock).mockResolvedValue('validated-evoucher');
      (validateClaimEligibility as jest.Mock).mockResolvedValue(true);
      (createEvoucherCode as jest.Mock).mockResolvedValue('created-code');

      const result = await service.create(dto);

      expect(result).toEqual('created-code');
      expect(validateEvoucher).toHaveBeenCalledWith('e1', mockEvoucherModel);
      expect(validateClaimEligibility).toHaveBeenCalledWith('u1', 'validated-evoucher', mockEvoucherCodeModel);
      expect(createEvoucherCode).toHaveBeenCalledWith('u1', 'validated-evoucher', mockEvoucherCodeModel);
    });
  });

  describe('claimEvoucher', () => {
    it('should validate and claim evoucher', async () => {
      (validateEvoucher as jest.Mock).mockResolvedValue('evoucher');
      (validateClaimEligibility as jest.Mock).mockResolvedValue(true);
      (createEvoucherCode as jest.Mock).mockResolvedValue('claimed-code');

      const result = await service.claimEvoucher('u1', 'e1');

      expect(result).toEqual('claimed-code');
      expect(validateEvoucher).toHaveBeenCalledWith('e1', mockEvoucherModel);
      expect(validateClaimEligibility).toHaveBeenCalledWith('u1', 'evoucher', mockEvoucherCodeModel);
      expect(createEvoucherCode).toHaveBeenCalledWith('u1', 'evoucher', mockEvoucherCodeModel);
    });
  });

  describe('getUserEvoucherCodes', () => {
    it('should return processed user codes with canUse + isExpire flags', async () => {
      const now = new Date();
      const evoucherWithFutureDate = {
        expiration: new Date(now.getTime() + 1000000),
      };
      const mockCode = {
        isUsed: false,
        evoucher: evoucherWithFutureDate,
      };

      (queryAll as jest.Mock).mockResolvedValue({ data: [mockCode], meta: {} });

      const result = await service.getUserEvoucherCodes('u1');

      expect(result.data[0].canUse).toBe(true);
      expect(result.data[0].isExpire).toBe(false);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne', async () => {
      (queryUpdateOne as jest.Mock).mockResolvedValue({ updated: true });

      const dto: UpdateEvoucherCodeDto = {
        isUsed: true,
        metadata: {},
      };

      const result = await service.update('id1', dto);
      expect(result).toEqual({ updated: true });
      expect(queryUpdateOne).toHaveBeenCalledWith(mockEvoucherCodeModel, 'id1', dto);
    });
  });

  describe('findAll', () => {
    it('should return all evoucher codes', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: ['C1'], meta: {} });
      const result = await service.findAll({});
      expect(result).toEqual({ data: ['C1'], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should find one evoucher code', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ code: 'C1' });
      const result = await service.findOne('id1');
      expect(result).toEqual({ code: 'C1' });
    });
  });

  describe('remove', () => {
    it('should delete evoucher code and return message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);
      const result = await service.remove('id1');
      expect(result).toEqual({ message: 'Evoucher code deleted successfully', id: 'id1' });
    });
  });

  describe('checkVoucherUsage', () => {
    it('should return true if voucher is used', async () => {
      mockEvoucherCodeModel.findOne!.mockResolvedValue({ isUsed: true });
      const result = await service.checkVoucherUsage('u1', 'e1');
      expect(result).toBe(true);
    });

    it('should return false if voucher is not used', async () => {
      mockEvoucherCodeModel.findOne!.mockResolvedValue(null);
      const result = await service.checkVoucherUsage('u1', 'e1');
      expect(result).toBe(false);
    });
  });

  describe('useEvoucherCode', () => {
    it('should use evoucher code successfully', async () => {
      const mockResult = { _id: 'c1' };
      (useEvoucherCodeUtil as jest.Mock).mockResolvedValue(mockResult);

      const userId = new Types.ObjectId();
      const result = await service.useEvoucherCode(userId, 'c1');

      expect(result).toEqual({
        message: 'Evoucher code used successfully',
        code: mockResult,
      });
    });
  });
});
