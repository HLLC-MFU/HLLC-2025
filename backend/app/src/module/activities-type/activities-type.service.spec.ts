import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesTypeService } from './activities-type.service';
import { getModelToken } from '@nestjs/mongoose';
import { ActivitiesType, ActivitiesTypeDocument } from './schema/activitiesType.schema';
import { Model, Types } from 'mongoose';
import { CreateActivitiesTypeDto } from './dto/create-activities-type.dto';
import { UpdateActivitiesTypeDto } from './dto/update-activities-type.dto';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/helpers');
jest.mock('src/pkg/helper/query.util');

describe('ActivitiesTypeService', () => {
  let service: ActivitiesTypeService;
  let model: Model<ActivitiesTypeDocument>;

  const mockId = new Types.ObjectId().toHexString()

  const mockActivitiesType: ActivitiesType = {
    name: 'ประเภท A'
  };

  const saveMock = jest.fn().mockResolvedValue(mockActivitiesType);

  const mockModel = {
    constructor: jest.fn(),
    save: saveMock,
    create: jest.fn(),
  };

  const modelProvider = {
    provide: getModelToken(ActivitiesType.name),
    useValue: jest.fn().mockImplementation(() => ({
      save: saveMock,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivitiesTypeService, modelProvider],
    }).compile();

    service = module.get<ActivitiesTypeService>(ActivitiesTypeService);
    model = module.get<Model<ActivitiesTypeDocument>>(getModelToken(ActivitiesType.name));
  });

  describe('create', () => {
    it('should create activities type successfully', async () => {
      const dto: CreateActivitiesTypeDto = { name: 'Test' };
      (throwIfExists as jest.Mock).mockResolvedValueOnce(undefined);
      const result = await service.create(dto);
      expect(throwIfExists).toHaveBeenCalledWith(model, { name: dto.name }, expect.any(String));
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(mockActivitiesType);
    });

    it('should handle duplicate error', async () => {
      const dto: CreateActivitiesTypeDto = { name: 'Duplicate' };
      const error = { code: 11000 };
      saveMock.mockRejectedValueOnce(error);
      await service.create(dto);
      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
    });
  });

  describe('findAll', () => {
    it('should return all activities type', async () => {
      (queryAll as jest.Mock).mockResolvedValueOnce([mockActivitiesType]);
      const result = await service.findAll({});
      expect(queryAll).toHaveBeenCalledWith({
        model,
        query: {},
        filterSchema: {},
      });
      expect(result).toEqual([mockActivitiesType]);
    });
  });

  describe('findOne', () => {
    it('should return single activities type', async () => {
      (queryFindOne as jest.Mock).mockResolvedValueOnce(mockActivitiesType);
      const result = await service.findOne(mockId);
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: mockId });
      expect(result).toEqual(mockActivitiesType);
    });
  });

  describe('update', () => {
    it('should update activities type', async () => {
      const dto: UpdateActivitiesTypeDto = { name: 'Updated' };
      (queryUpdateOne as jest.Mock).mockResolvedValueOnce({ ...mockActivitiesType, ...dto });
      const result = await service.update(mockId, dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, mockId, dto);
      expect(result).toEqual({ ...mockActivitiesType, ...dto });
    });
  });

  describe('remove', () => {
    it('should delete activities type', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValueOnce(undefined);
      const result = await service.remove(mockId);
      expect(queryDeleteOne).toHaveBeenCalledWith(model, mockId);
      expect(result).toEqual({
        message: 'Activities type deleted successfully',
        id: mockId,
      });
    });
  });
});
