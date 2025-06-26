import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EvoucherService } from './evoucher.service';
import { Sponsors } from 'src/module/sponsors/schema/sponsors.schema';
import { Evoucher, EvoucherStatus, EvoucherType } from '../schema/evoucher.schema';
import { EvoucherCode } from '../schema/evoucher-code.schema';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { Types, Model } from 'mongoose';

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
}));
jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));
jest.mock('../utils/evoucher.util', () => ({
  validatePublicAvailableVoucher: jest.fn(),
}));

import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { validatePublicAvailableVoucher } from '../utils/evoucher.util';

type EvoucherWithClaims = Omit<Evoucher, 'claims'> & {
  claims: {
    maxClaim: number | undefined;
    currentClaim: number;
  };
};

type EvoucherWithAvailability = Omit<Evoucher, 'isAvailable'> & {
  isAvailable: boolean;
};

describe('EvoucherService', () => {
  let service: EvoucherService;

  const mockEvoucherCodeModel = {
    countDocuments: jest.fn(),
  };

  const mockSponsorsModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvoucherService,
        {
          provide: getModelToken(Evoucher.name),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(Sponsors.name),
          useValue: mockSponsorsModel,
        },
        {
          provide: getModelToken(EvoucherCode.name),
          useValue: mockEvoucherCodeModel,
        },
      ],
    }).compile();

    service = module.get<EvoucherService>(EvoucherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create evoucher successfully', async () => {
      const dto: CreateEvoucherDto = {
        discount: '100',
        acronym: 'EV100',
        type: EvoucherType.GLOBAL,
        sponsors: new Types.ObjectId().toString(),
        expiration: new Date(),
        maxClaims: 100,
        detail: { th: 'ดีลดี', en: 'Great Deal' },
        photo: {
          coverPhoto: '',
          bannerPhoto: '',
          thumbnail: '',
          logoPhoto: 'evocher.png',
        },
      };

      (findOrThrow as jest.Mock).mockResolvedValueOnce({});

      const saveMock = jest.fn().mockResolvedValue({ _id: 'e1', ...dto });
      const evoucherConstructor = jest.fn().mockImplementation(() => ({ save: saveMock }));
      Object.defineProperty(service, 'evoucherModel', { value: evoucherConstructor });

      const result = await service.create(dto);
      expect(result).toEqual(expect.objectContaining({ _id: 'e1', acronym: 'EV100' }));
    });
  });

  describe('findAll', () => {
    it('should return evouchers with claims info', async () => {
      const mockEvoucher = {
        _id: new Types.ObjectId(),
        maxClaims: 10,
        expiration: new Date(Date.now() + 1000000),
        toJSON: function () {
          return {
            _id: this._id,
            maxClaims: this.maxClaims,
            expiration: this.expiration,
          };
        },
      };

      (queryAll as jest.Mock).mockResolvedValue({ data: [mockEvoucher], meta: {} });
      mockEvoucherCodeModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll({});

      const resultWithClaims = result.data as EvoucherWithClaims[];
      expect(resultWithClaims[0].claims).toEqual({ maxClaim: 10, currentClaim: 2 });
    });
  });

  describe('getPublicAvailableEvouchersForUser', () => {
    it('should validate each evoucher and return paginated result', async () => {
      const evoucher = {
        _id: new Types.ObjectId(),
        status: EvoucherStatus.ACTIVE,
        type: EvoucherType.GLOBAL,
      };

      (queryAll as jest.Mock).mockResolvedValue({ data: [evoucher], meta: {} });
      (validatePublicAvailableVoucher as jest.Mock).mockResolvedValue({ ...evoucher, isAvailable: true });

      const result = await service.getPublicAvailableEvouchersForUser('u1');

      const resultWithAvailability = result.data as EvoucherWithAvailability[];
      expect(resultWithAvailability[0].isAvailable).toBe(true);
    });
  });

  

describe('findOne', () => {
  it('should return one evoucher with populated fields', async () => {
    const expectedId = '123';
    const expectedResult = { _id: expectedId };

    (queryFindOne as jest.Mock).mockResolvedValue(expectedResult);

    const mockEvoucherModel: Partial<Model<Evoucher>> = {};
    Object.defineProperty(service, 'evoucherModel', { value: mockEvoucherModel });

    const result = await service.findOne(expectedId);

    expect(queryFindOne).toHaveBeenCalledWith(
      mockEvoucherModel,
      { _id: expectedId },
      [{ path:'sponsors' }] 
    );

    expect(result).toEqual(expectedResult);
  });
});


  describe('update', () => {
    it('should call queryUpdateOne', async () => {
      const updateDto = { discount: '50' };
      (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: '321', ...updateDto });

      const result = await service.update('321', updateDto);
      expect(result).toEqual(expect.objectContaining({ discount: '50' }));
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne and return confirmation', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);
      const result = await service.remove('999');
      expect(result).toEqual({ message: 'Evoucher deleted successfully', id: '999' });
    });
  });
});
