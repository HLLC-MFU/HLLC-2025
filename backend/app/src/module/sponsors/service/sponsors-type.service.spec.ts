import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SponsorsTypeService } from './sponsors-type.service';
import { SponsorsType } from '../schema/sponsors-type.schema';
import { CreateSponsorsTypeDto } from '../dto/sponsers-type/create-sponsors-type.dto';
import { UpdateSponsorsTypeDto } from '../dto/sponsers-type/update-sponsors-type.dto';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { Model } from 'mongoose';
import { SponsorsTypeDocument } from '../schema/sponsors-type.schema';

jest.mock('src/pkg/validator/model.validator', () => ({
  throwIfExists: jest.fn(),
}));

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));

jest.mock('src/pkg/helper/helpers', () => ({
  handleMongoDuplicateError: jest.fn(),
}));

describe('SponsorsTypeService', () => {
  let service: SponsorsTypeService;
  let model: typeof mockSponsorsTypeModel;

  const mockSave = jest.fn();

  
  const mockSponsorsTypeModel = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));

  Object.assign(mockSponsorsTypeModel, {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsTypeService,
        {
          provide: getModelToken(SponsorsType.name),
          useValue: mockSponsorsTypeModel,
        },
      ],
    }).compile();

    service = module.get<SponsorsTypeService>(SponsorsTypeService);
    model = module.get(getModelToken(SponsorsType.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new sponsors type', async () => {
      const dto: CreateSponsorsTypeDto = { name: 'Gold' };
      mockSave.mockResolvedValue({ _id: 'id123', ...dto });
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);

      const result = await service.create(dto);

      expect(throwIfExists).toHaveBeenCalledWith(
        model,
        { name: dto.name },
        'Sponsors type already exists',
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'id123', name: 'Gold' });
    });

    it('should handle duplicate error', async () => {
      const dto: CreateSponsorsTypeDto = { name: 'Gold' };
      const error = new Error('duplicate');
      mockSave.mockRejectedValue(error);
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);

      await service.create(dto);

      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
    });
  });

  describe('findAll', () => {
    it('should return all sponsors types', async () => {
      const resultMock = [{ _id: 'id1', name: 'Gold' }];
      (queryAll as jest.Mock).mockResolvedValue(resultMock);

      const result = await service.findAll({});
      expect(queryAll).toHaveBeenCalledWith({
        model,
        query: {},
        filterSchema: {},
      });
      expect(result).toEqual(resultMock);
    });
  });

  describe('findOne', () => {
    it('should return one sponsors type', async () => {
      const mockData = { _id: 'id123', name: 'Silver' };
      (queryFindOne as jest.Mock).mockResolvedValue(mockData);

      const result = await service.findOne('id123');
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: 'id123' });
      expect(result).toEqual(mockData);
    });
  });

  describe('update', () => {
    it('should update sponsors type', async () => {
      const dto: UpdateSponsorsTypeDto = { name: 'Platinum' };
      const updated = { _id: 'id123', ...dto };

      (queryUpdateOne as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('id123', dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, 'id123', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete and return message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove('id123');
      expect(queryDeleteOne).toHaveBeenCalledWith(model, 'id123');
      expect(result).toEqual({
        message: 'Sponsors type deleted successfully',
        id: 'id123',
      });
    });
  });
});
