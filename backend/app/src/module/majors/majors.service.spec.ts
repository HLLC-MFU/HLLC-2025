import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MajorsService } from './majors.service';
import { Major, MajorDocument } from './schemas/major.schema';
import { School, SchoolDocument } from '../schools/schemas/school.schema';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { throwIfExists, findOrThrow } from 'src/pkg/validator/model.validator';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/validator/model.validator');

describe('MajorsService', () => {
  let service: MajorsService;
  let majorModel: Model<MajorDocument>;
  let schoolModel: Model<SchoolDocument>;

  const saveMock = jest.fn();
  const mockMajorConstructor = jest.fn(() => ({ save: saveMock }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MajorsService,
        {
          provide: getModelToken(Major.name),
          useValue: Object.assign(mockMajorConstructor, {
            prototype: {},
          }),
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
    const expectedSchoolId = new Types.ObjectId();

    const dto: CreateMajorDto = {
      name: { th: 'ชื่อ', en: 'Name' },
      acronym: 'SCI',
      detail: { th: 'รายละเอียด', en: 'Detail' },
      school: expectedSchoolId.toHexString(),
      createdAt: new Date(),
    };

    it('should validate uniqueness with throwIfExists', async () => {
      saveMock.mockResolvedValue({ _id: '1', ...dto });

      await service.create(dto);

      expect(throwIfExists).toHaveBeenCalledTimes(1);
      expect(throwIfExists).toHaveBeenCalledWith(
        majorModel,
        { name: dto.name },
        'Major already exists'
      );
    });

    it('should validate school existence with findOrThrow', async () => {
      saveMock.mockResolvedValue({ _id: '1', ...dto });

      await service.create(dto);

      expect(findOrThrow).toHaveBeenCalledTimes(1);
      expect(findOrThrow).toHaveBeenCalledWith(
        schoolModel,
        dto.school,
        'School not found'
      );
    });

    it('should create and save major', async () => {
      saveMock.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);

      expect(mockMajorConstructor).toHaveBeenCalledWith({
        ...dto,
        school: expectedSchoolId,
      });
      expect(saveMock).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
    });
  });


  describe('findAll', () => {
    it('should call queryAll with correct parameters and resolve populateFields correctly', async () => {
      const query = { keyword: 'science' };
      await service.findAll(query);
      expect(queryAll).toHaveBeenCalled();

      const callArgs = (queryAll as jest.Mock).mock.calls[0][0];

      expect(callArgs).toMatchObject({
        model: majorModel,
        query,
        filterSchema: {},
      });

      expect(typeof callArgs.populateFields).toBe('function');

      const fields = await callArgs.populateFields();
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

      await service.update(id, dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(majorModel, id, dto);
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