import { Test, TestingModule } from '@nestjs/testing';
import { MapsService } from './maps.service';
import { getModelToken } from '@nestjs/mongoose';
import { Map } from '../schema/map.schema';
import { Model } from 'mongoose';
import { CreateMapDto } from '../dto/maps/create-map.dto';
import { UpdateMapDto } from '../dto/maps/update-map.dto';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/helper/helpers');

describe('MapsService', () => {
  let service: MapsService;
  let model: Model<any>;

  const mockId = 'mock-id';
  const mockMap = { _id: mockId, map: 'mock-map' };

  const mockMapModel = {
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapsService,
        {
          provide: getModelToken(Map.name),
          useValue: jest.fn().mockImplementation(() => mockMapModel),
        },
      ],
    }).compile();

    service = module.get<MapsService>(MapsService);
    model = module.get<Model<any>>(getModelToken(Map.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new map', async () => {
      const dto: CreateMapDto = { map: 'mock-map' };
      mockMapModel.save.mockResolvedValueOnce(mockMap);

      const result = await service.create(dto);
      expect(result).toEqual(mockMap);
    });

    it('should call handleMongoDuplicateError on error', async () => {
      const dto: CreateMapDto = { map: 'mock-map' };
      const error = new Error('duplicate error');
      mockMapModel.save.mockRejectedValueOnce(error);

      await service.create(dto);
      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'map');
    });
  });

  describe('findAll', () => {
    it('should call queryAll with model and return result', async () => {
      const mockQuery = { keyword: 'test' };
      const mockResult = [mockMap];
      (queryAll as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await service.findAll(mockQuery);
      expect(queryAll).toHaveBeenCalledWith({ model: model, query: mockQuery, filterSchema: {} });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne and return result', async () => {
      (queryFindOne as jest.Mock).mockResolvedValueOnce(mockMap);

      const result = await service.findOne(mockId);
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: mockId });
      expect(result).toEqual(mockMap);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne and return updated map', async () => {
      const dto: UpdateMapDto = { map: 'updated-map' };
      const updated = { ...mockMap, ...dto };

      (queryUpdateOne as jest.Mock).mockResolvedValueOnce(updated);

      const result = await service.update(mockId, dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, mockId, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne and return delete message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await service.remove(mockId);
      expect(queryDeleteOne).toHaveBeenCalledWith(model, mockId);
      expect(result).toEqual({ message: 'Map deleted successfully', id: mockId });
    });
  });
});
