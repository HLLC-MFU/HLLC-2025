import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SchoolsService } from './schools.service';
import { School } from './schemas/school.schema';
import { Appearance } from '../appearances/schemas/apprearance.schema';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/query.util');

describe('SchoolsService', () => {
  let service: SchoolsService;
  let schoolModel: Partial<Record<keyof Model<School>, jest.Mock>> = {};
  let appearanceModel: Partial<Record<keyof Model<Appearance>, jest.Mock>> = {};

  const mockSchoolId = new Types.ObjectId();
  const createDto: CreateSchoolDto = {
    name: { th: 'โรงเรียนไทย', en: 'Thai School' },
    acronym: 'TS',
    detail: { th: 'รายละเอียด', en: 'Details' },
    photo: 'image.jpg',
    createdAt: new Date(),
  };

  const updateDto: UpdateSchoolDto = {
    acronym: 'UPDATED',
    photo: 'updated.jpg',
  };

  beforeEach(async () => {
    schoolModel = {
      save: jest.fn(),
    } as any;

    appearanceModel = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: getModelToken(School.name),
          useValue: schoolModel,
        },
        {
          provide: getModelToken(Appearance.name),
          useValue: appearanceModel,
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
  });

  describe('create', () => {
    it('should create and save a new school', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      const saveMock = jest.fn().mockResolvedValue({ _id: mockSchoolId, ...createDto });
      schoolModel.constructor = jest.fn().mockImplementation(() => ({
        ...createDto,
        save: saveMock,
      }));

      service['schoolModel'] = function () {
        return { ...createDto, save: saveMock };
      } as any;

      const result = await service.create(createDto);

      expect(throwIfExists).toHaveBeenCalledWith(
        expect.anything(),
        { name: createDto.name },
        'School already exists',
      );
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual({ _id: mockSchoolId, ...createDto });
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct args', async () => {
      (queryAll as jest.Mock).mockResolvedValue(['mock result']);
      const result = await service.findAll({ keyword: 'test' });
      expect(queryAll).toHaveBeenCalled();
      expect(result).toEqual(['mock result']);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne and return result', async () => {
      const mockResult = { data: [{ name: 'Test' }], message: 'Found' };
      (queryFindOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findOne(mockSchoolId.toString());
      expect(queryFindOne).toHaveBeenCalledWith(expect.anything(), { _id: mockSchoolId.toString() });
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne and return result', async () => {
      (queryUpdateOne as jest.Mock).mockResolvedValue(updateDto);
      const result = await service.update(mockSchoolId.toString(), updateDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(expect.anything(), mockSchoolId.toString(), updateDto);
      expect(result).toEqual(updateDto);
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne and return message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(undefined);
      const result = await service.remove(mockSchoolId.toString());
      expect(queryDeleteOne).toHaveBeenCalledWith(expect.anything(), mockSchoolId.toString());
      expect(result).toEqual({
        message: 'School deleted successfully',
        id: mockSchoolId.toString(),
      });
    });
  });

  describe('findAppearance', () => {
    it('should call queryFindOne for appearance', async () => {
      const mockAppearance = { data: 'appearance' };
      (queryFindOne as jest.Mock).mockResolvedValue(mockAppearance);
      const result = await service.findAppearance(mockSchoolId.toString(), {});
      expect(queryFindOne).toHaveBeenCalledWith(
        expect.anything(),
        { school: mockSchoolId.toString() },
        [{ path: 'school' }],
      );
      expect(result).toEqual(mockAppearance);
    });
  });
});