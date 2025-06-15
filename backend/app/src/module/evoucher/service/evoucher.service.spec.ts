import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EvoucherService } from './evoucher.service';
import { Sponsors } from 'src/module/sponsors/schema/sponsors.schema';
import { EvoucherType } from '../schema/evoucher-type.schema';
import { Evoucher } from '../schema/evoucher.schema';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { Types } from 'mongoose';

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
}));
jest.mock('src/pkg/helper/helpers', () => ({
  handleMongoDuplicateError: jest.fn(),
}));
jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));

import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

describe('EvoucherService', () => {
  let service: EvoucherService;

  const mockEvoucherModel = {
    save: jest.fn(),
    constructor: jest.fn(),
  };

  const mockSponsorsModel = {};
  const mockTypeModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvoucherService,
        {
          provide: getModelToken(Evoucher.name),
          useValue: jest.fn().mockImplementation(() => mockEvoucherModel),
        },
        {
          provide: getModelToken(Sponsors.name),
          useValue: mockSponsorsModel,
        },
        {
          provide: getModelToken(EvoucherType.name),
          useValue: mockTypeModel,
        },
      ],
    }).compile();

    service = module.get<EvoucherService>(EvoucherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (validation errors)', () => {
    it('should throw if evoucherType not found', async () => {
      const dto = {
        discount: 100,
        acronym: 'EV100',
        type: new Types.ObjectId().toString(),
        sponsors: new Types.ObjectId().toString(),
        expiration: new Date(),
        detail: { th: 'ดีลดี', en: 'Great Deal' },
        photo: {
          coverPhoto: '',
          bannerPhoto: '',
          thumbnail: '',
          logoPhoto: 'evocher.png',
        },
      } as CreateEvoucherDto;

      (findOrThrow as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Evoucher type not found');
      });

      await expect(service.create(dto)).rejects.toThrow('Evoucher type not found');
      expect(findOrThrow).toHaveBeenCalledTimes(1);
    });

    it('should throw if sponsors not found', async () => {
      const dto = {
        discount: 100,
        acronym: 'EV100',
        type: new Types.ObjectId().toString(),
        sponsors: new Types.ObjectId().toString(),
        expiration: new Date(),
        detail: { th: 'ดีลดี', en: 'Great Deal' },
        photo: {
          coverPhoto: '',
          bannerPhoto: '',
          thumbnail: '',
          logoPhoto: 'evocher.png',
        },
      } as CreateEvoucherDto;

      (findOrThrow as jest.Mock)
        .mockResolvedValueOnce({}) 
        .mockImplementationOnce(() => {
          throw new Error('Sponsors not found');
        });

      await expect(service.create(dto)).rejects.toThrow('Sponsors not found');
      expect(findOrThrow).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll (populate fields)', () => {
    it('should pass correct populateFields to queryAll', async () => {
      const mockResult = { data: ['ev1'], meta: {} };

      (queryAll as jest.Mock).mockImplementation(async (args) => {
        const fields = await args.populateFields?.();
        expect(fields).toEqual([
          { path: 'type' },
          { path: 'sponsors' },
        ]);
        return mockResult;
      });

      const result = await service.findAll({});
      expect(result).toEqual(mockResult);
    });
  });
 

  describe('findAll', () => {
    it('should return all evouchers with populated fields', async () => {
      const fakeQuery = { keyword: 'test' };
      (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });

      const result = await service.findAll(fakeQuery);
      expect(queryAll).toHaveBeenCalled();
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should return one evoucher with populated fields', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ _id: '123' });

      const result = await service.findOne('123');
      expect(queryFindOne).toHaveBeenCalledWith(
        expect.anything(),
        { _id: '123' },
        expect.arrayContaining([
          expect.objectContaining({ path: 'type' }),
          expect.objectContaining({ path: 'sponsors' }),
        ])
      );
      expect(result).toEqual({ _id: '123' });
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne', async () => {
      const updateDto = { discount: 50, updatedAt: new Date() };
      (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: '321', ...updateDto });

      const result = await service.update('321', updateDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(expect.anything(), '321', updateDto);
      expect(result).toEqual(expect.objectContaining({ discount: 50 }));
    });
  });

  describe('remove', () => {
    it('should delete evoucher and return message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);

      const result = await service.remove('999');
      expect(queryDeleteOne).toHaveBeenCalledWith(expect.anything(), '999');
      expect(result).toEqual({
        message: 'Evoucher deleted successfully',
        id: '999',
      });
    });
  });
});
