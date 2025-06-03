import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsService } from './sponsors.service';
import { getModelToken } from '@nestjs/mongoose';
import { Sponsors } from './schema/sponsors.schema';
import { SponsorsType } from '../sponsors-type/schema/sponsors-type.schema';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { queryAll, queryFindOne } from 'src/pkg/helper/query.util';

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
}));

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
}));

describe('SponsorsService', () => {
  let service: SponsorsService;
  const saveMock = jest.fn();

  const sponsorsModelMock: any = jest.fn().mockImplementation(() => ({
    save: saveMock,
  }));
  sponsorsModelMock.findByIdAndUpdate = jest.fn();
  sponsorsModelMock.findByIdAndDelete = jest.fn();

  const sponsorsTypeModel = {
    findById: jest.fn(),
  };

  const objectId = new Types.ObjectId().toString();

  const mockCreateDto: CreateSponsorDto = {
    name: { th: 'ชื่อ', en: 'Name' },
    photo: {
      coverPhoto: '',
      bannerPhoto: '',
      thumbnail: '',
      logoPhoto: 'C:/Users/youmi/Downloads/twitter.png',
    },
    type: objectId,
    metadata: { note: 'mock test' },
  };

  const mockUpdateDto: UpdateSponsorDto = {
    ...mockCreateDto,
    name: { th: 'แก้ไข', en: 'updated' },
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsService,
        {
          provide: getModelToken(Sponsors.name),
          useValue: sponsorsModelMock,
        },
        {
          provide: getModelToken(SponsorsType.name),
          useValue: sponsorsTypeModel,
        },
      ],
    }).compile();

    service = module.get<SponsorsService>(SponsorsService);
  });

  describe('create()', () => {
    it('should create sponsor successfully', async () => {
      (findOrThrow as jest.Mock).mockResolvedValueOnce(true);
      saveMock.mockResolvedValueOnce({ _id: '1', ...mockCreateDto });

      const result = await service.create(mockCreateDto);
      expect(result).toEqual({ _id: '1', ...mockCreateDto });
    });
  });

  describe('findAll()', () => {
    it('should return all sponsors', async () => {
      (queryAll as jest.Mock).mockResolvedValueOnce({ data: ['s1'] });

      const result = await service.findAll({});
      expect(result).toEqual({ data: ['s1'] });
    });
  });

  describe('findOne()', () => {
    it('should return one sponsor', async () => {
      (queryFindOne as jest.Mock).mockResolvedValueOnce({ _id: '1', ...mockCreateDto });

      const result = await service.findOne('1');
      expect(result).toEqual({ _id: '1', ...mockCreateDto });
    });
  });

  describe('update()', () => {
    it('should update sponsor', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      sponsorsModelMock.findByIdAndUpdate.mockResolvedValue({ _id: '1', ...mockUpdateDto });

      const result = await service.update('1', mockUpdateDto);
      expect(result).toEqual({ _id: '1', ...mockUpdateDto });
    });
  });

  describe('remove()', () => {
    it('should delete sponsor', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      sponsorsModelMock.findByIdAndDelete.mockResolvedValue({ deleted: true });

      const result = await service.remove('1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
