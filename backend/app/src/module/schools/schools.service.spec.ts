import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SchoolsService } from './schools.service';
import { School, SchoolDocument } from './schemas/school.schema';
import { Appearance, AppearanceDocument } from '../appearances/schemas/apprearance.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { Model } from 'mongoose';
import { Type } from 'class-transformer';
import { create } from 'domain';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));
jest.mock('src/pkg/validator/model.validator', () => ({
  throwIfExists: jest.fn(),
}));
jest.mock('src/pkg/helper/helpers', () => ({
  handleMongoDuplicateError: jest.fn(),
}));

describe('SchoolsService', () => {
  let service: SchoolsService;
  let schoolModel: Model<SchoolDocument>;
  let appearanceModel: Model<AppearanceDocument>;

  const mockSchoolInstance = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: getModelToken(School.name),
          useValue: jest.fn(() => mockSchoolInstance),
        },
        {
          provide: getModelToken(Appearance.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
    schoolModel = module.get(getModelToken(School.name));
    appearanceModel = module.get(getModelToken(Appearance.name));
  });

  describe('create', () => {
    it('should create a school successfully', async () => {
      const dto: CreateSchoolDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'ABC',
        detail: { th: 'รายละเอียด', en: 'Detail' },
        photo: 'img.jpg',
        createdAt: new Date(),
      };

      mockSchoolInstance.save.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);
      expect(throwIfExists).toHaveBeenCalledWith(
        expect.any(Function),
        { name: dto.name },
        'School already exists'
      );
      expect(result).toHaveProperty('_id');
      expect(mockSchoolInstance.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call queryAll with proper params', async () => {
      const query = { keyword: 'test' };
      await service.findAll(query);
      expect(queryAll).toHaveBeenCalledWith({
        model: schoolModel,
        query,
        filterSchema: {},
        populateFields: expect.any(Function),
      });
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne with specific id', async () => {
      await service.findOne('123');
      expect(queryFindOne).toHaveBeenCalledWith(schoolModel, { _id: '123' });
    });
  });

 describe('update', () => {
  const id = 'school123';
  it('should update with updatedAt field', async () => {
    const createdAt = new Date();
    const dto: UpdateSchoolDto = {
      name: { th: 'ใหม่', en: 'New' },
      acronym: 'XYZ',
      detail: { th: 'รายละเอียดใหม่', en: 'Detail New' },
      photo: 'photo.png',
      createdAt, 
    };

    await service.update(id, dto);

    expect(queryUpdateOne).toHaveBeenCalledWith(
      schoolModel,
      id,
      expect.objectContaining({
        name: dto.name,
        acronym: dto.acronym,
        detail: dto.detail,
        photo: dto.photo,
        createdAt, 
      }),
    );
  });
});


  describe('remove', () => {
    it('should call queryDeleteOne and return confirmation', async () => {
      const id = 'schoolId';
      const result = await service.remove(id);
      expect(queryDeleteOne).toHaveBeenCalledWith(schoolModel, id);
      expect(result).toEqual({
        message: 'School deleted successfully',
        id,
      });
    });
  });

  describe('findColor', () => {
    it('should call queryFindOne with populated school path', async () => {
      const schoolId = 'abc123';
      await service.findColor(schoolId, {});
      expect(queryFindOne).toHaveBeenCalledWith(
        appearanceModel,
        { school: schoolId },
        [{ path: 'school' }],
      );
    });
  });
});
