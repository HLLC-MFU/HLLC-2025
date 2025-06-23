import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LandmarksService } from './landmarks.service';
import { Landmark } from '../schema/landmark.schema';
import { CreateLandmarkDto } from '../dto/ladmarks/create-landmark.dto';
import { UpdateLandmarkDto } from '../dto/ladmarks/update-landmark.dto';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/helper/helpers');

describe('LandmarksService', () => {
  let service: LandmarksService;
  let model: any;

  const mockLandmark = {
    _id: 'mock-id',
    name: { en: 'Name EN', th: 'Name TH' },
    hint: { en: 'Hint EN', th: 'Hint TH' },
    hintImage: 'hint.png',
    location: { latitude: 1.23, longitude: 4.56 },
    coinAmount: 10,
    cooldown: 5,
  };

  const mockModelInstance = {
    save: jest.fn(),
  };

  const mockModel = jest.fn().mockImplementation(() => mockModelInstance);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandmarksService,
        {
          provide: getModelToken(Landmark.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<LandmarksService>(LandmarksService);
    model = module.get(getModelToken(Landmark.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return landmark', async () => {
      mockModelInstance.save.mockResolvedValue(mockLandmark);
      const result = await service.create(mockLandmark as unknown as CreateLandmarkDto);
      expect(result).toEqual(mockLandmark);
    });

    it('should handle duplicate error', async () => {
      const error = new Error('duplicate');
      mockModelInstance.save.mockRejectedValue(error);
      await service.create(mockLandmark as unknown as CreateLandmarkDto);
      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct args', async () => {
      const mockQuery = { page: '1' };
      (queryAll as jest.Mock).mockResolvedValue([mockLandmark]);
      const result = await service.findAll(mockQuery);
      expect(queryAll).toHaveBeenCalledWith({ model: model, query: mockQuery, filterSchema: {} });
      expect(result).toEqual([mockLandmark]);
    });
  });

  describe('findOne', () => {
    it('should return one result', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue(mockLandmark);
      const result = await service.findOne('mock-id');
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: 'mock-id' });
      expect(result).toEqual(mockLandmark);
    });
  });

  describe('update', () => {
    it('should update landmark', async () => {
      (queryUpdateOne as jest.Mock).mockResolvedValue(mockLandmark);
      const result = await service.update('mock-id', {} as UpdateLandmarkDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, 'mock-id', {});
      expect(result).toEqual(mockLandmark);
    });
  });

  describe('remove', () => {
    it('should remove and return result', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue({ deleted: true });
      const result = await service.remove('mock-id');
      expect(queryDeleteOne).toHaveBeenCalledWith(model, 'mock-id');
      expect(result).toEqual({ deleted: true });
    });
  });
});
