import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MajorsService } from './majors.service';
import { Major } from './schemas/major.schema';
import { School } from '../schools/schemas/school.schema';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { Model, Types } from 'mongoose';
import { throwIfExists, findOrThrow } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/helpers');

describe('MajorsService', () => {
  let service: MajorsService;
  let majorModel: Model<any>;
  let schoolModel: Model<any>;

  const mockMajorInstance = { save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MajorsService,
        {
          provide: getModelToken(Major.name),
          useValue: jest.fn(() => mockMajorInstance),
        },
        {
          provide: getModelToken(School.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MajorsService>(MajorsService);
    majorModel = module.get(getModelToken(Major.name));
    schoolModel = module.get(getModelToken(School.name));
  });

  describe('create', () => {
    it('should create a major successfully', async () => {
      const dto: CreateMajorDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'SCI',
        detail: { th: 'รายละเอียด', en: 'Detail' },
        school: new Types.ObjectId(),
        createdAt: new Date(),
      };

      mockMajorInstance.save.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);

      expect(throwIfExists).toHaveBeenCalled();
      expect(findOrThrow).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
      expect(mockMajorInstance.save).toHaveBeenCalled();
    });

    it('should handle duplicate error', async () => {
      const dto: CreateMajorDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'SCI',
        detail: { th: 'รายละเอียด', en: 'Detail' },
        school: new Types.ObjectId(),
        createdAt: new Date(),
      };

      const error = new Error('Duplicate');
      mockMajorInstance.save.mockRejectedValue(error);

      await service.create(dto);
      expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct parameters and resolve populateFields correctly', async () => {
      const query = { keyword: 'science' };
      await service.findAll(query);
      expect(queryAll).toHaveBeenCalledWith({
        model: majorModel,
        query,
        filterSchema: {},
        populateFields: expect.any(Function),
      });

      const populateFn = (queryAll as jest.Mock).mock.calls[0][0].populateFields;
      const fields = await populateFn();
      expect(fields).toEqual([{ path: 'school' }]);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne with specific id and populate school', async () => {
      const id = 'major123';
      await service.findOne(id);
      expect(queryFindOne).toHaveBeenCalledWith(majorModel, { _id: id }, [
        { path: 'school' },
      ]);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne with updatedAt field set to current date', async () => {
      const id = 'major123';
      const dto: UpdateMajorDto = {
        name: { th: 'ใหม่', en: 'New' },
        acronym: 'NEW',
        detail: { th: 'ใหม่', en: 'New' },
        createdAt: new Date(),
      };

      const before = Date.now();
      await service.update(id, dto);
      const after = Date.now();

      const updateArg = (queryUpdateOne as jest.Mock).mock.calls[0][2];
      expect(updateArg.name).toEqual(dto.name);
      expect(updateArg.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(updateArg.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne and return the result', async () => {
      const id = 'major123';
      const expected = { message: 'deleted', id };
      (queryDeleteOne as jest.Mock).mockResolvedValue(expected);

      const result = await service.remove(id);
      expect(queryDeleteOne).toHaveBeenCalledWith(majorModel, id);
      expect(result).toEqual(expected);
    });
  });
});
