import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppearancesService } from './appearances.service';
import { Appearance } from './schemas/apprearance.schema';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { NotFoundException } from '@nestjs/common';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/query.util');

describe('AppearancesService', () => {
  let service: AppearancesService;
  let model: Partial<Record<keyof Model<Appearance>, jest.Mock>>;

  const mockAppearanceId = new Types.ObjectId();
  const createDto: CreateAppearanceDto = {
    school: mockAppearanceId.toString(),
    assets: { logo: 'logo.png' },
    colors: { primary: '#000' },
  };

  const updateDto: UpdateAppearanceDto = {
    assets: { banner: 'banner.png' },
    colors: { secondary: '#fff' },
  };

  beforeEach(async () => {
    model = {
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppearancesService,
        {
          provide: getModelToken(Appearance.name),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get<AppearancesService>(AppearancesService);
  });

  describe('create', () => {
    it('should create and save a new appearance', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      const saveMock = jest.fn().mockResolvedValue({ _id: mockAppearanceId, ...createDto });
      const mockInstance = { ...createDto, save: saveMock };

      service['apprearanceModel'] = jest.fn().mockImplementation(() => mockInstance) as any;

      const result = await service.create(createDto);
      expect(throwIfExists).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual({ _id: mockAppearanceId, ...createDto });
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct args', async () => {
      (queryAll as jest.Mock).mockResolvedValue(['mock result']);
      const result = await service.findAll({ keyword: 'appearance' });
      expect(queryAll).toHaveBeenCalled();
      expect(result).toEqual(['mock result']);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne and return result', async () => {
      const mockResult = { data: [{ name: 'Appearance 1' }], message: 'Found' };
      (queryFindOne as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.findOne(mockAppearanceId.toString());
      expect(queryFindOne).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should merge and update appearance', async () => {
      const populatedMock = { populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue('final-result') };
      const existingDoc = {
        _id: mockAppearanceId,
        assets: { logo: 'logo.png' },
        colors: { primary: '#000' },
      };

      model.findById = jest.fn()
        .mockResolvedValueOnce(existingDoc) // for existence check
        .mockReturnValue(populatedMock); // for populate().exec()

      (queryUpdateOne as jest.Mock).mockResolvedValue(undefined);

      const result = await service.update(mockAppearanceId.toString(), updateDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, mockAppearanceId.toString(), expect.anything());
      expect(result).toEqual('final-result');
    });

    it('should throw NotFoundException if doc not found', async () => {
      model.findById = jest.fn().mockResolvedValueOnce(null);
      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete appearance and return message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(undefined);
      const result = await service.remove(mockAppearanceId.toString());
      expect(queryDeleteOne).toHaveBeenCalledWith(model, mockAppearanceId.toString());
      expect(result).toEqual({ message: 'Appearance delete successfully' });
    });
  });
});