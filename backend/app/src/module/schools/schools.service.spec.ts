import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SchoolsService } from './schools.service';
import { School, SchoolDocument } from './schemas/school.schema';
import { Appearance, AppearanceDocument } from '../appearances/schemas/apprearance.schema';
import { Interfaces, InterfacesDocument } from '../interfaces/schema/interfaces.schema';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { Model } from 'mongoose';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { throwIfExists } from 'src/pkg/validator/model.validator';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));
jest.mock('src/pkg/validator/model.validator', () => ({
  throwIfExists: jest.fn(),
}));

describe('SchoolsService', () => {
  let service: SchoolsService;
  let schoolModel: Model<SchoolDocument>;
  let appearanceModel: Model<AppearanceDocument>;
  let interfacesModel: Model<InterfacesDocument>;

  const mockSave = jest.fn();
  const mockConstructor = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: mockSave,
  }));

  const mockAppearanceModel: Partial<Model<AppearanceDocument>> = {
    findOne: jest.fn(),
  };

  const mockInterfacesModel: Partial<Model<InterfacesDocument>> = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: getModelToken(School.name),
          useValue: Object.assign(mockConstructor, {
            findOne: jest.fn(),
          }),
        },
        {
          provide: getModelToken(Appearance.name),
          useValue: mockAppearanceModel,
        },
        {
          provide: getModelToken(Interfaces.name),
          useValue: mockInterfacesModel,
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
    schoolModel = module.get(getModelToken(School.name));
    appearanceModel = module.get(getModelToken(Appearance.name));
    interfacesModel = module.get(getModelToken(Interfaces.name));
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

      mockSave.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);

      expect(throwIfExists).toHaveBeenCalledWith(
        expect.any(Function),
        { name: dto.name },
        'School already exists',
      );
      expect(mockConstructor).toHaveBeenCalledWith(dto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', '1');
    });
  });

  describe('findAll', () => {
  it('should call queryAll with proper params', async () => {
    const query = { keyword: 'test' };

    await service.findAll(query);

    const callArg = (queryAll as jest.Mock).mock.calls[0][0];
    expect(callArg.model).toBe(schoolModel);
    expect(callArg.query).toEqual(query);
    expect(callArg.filterSchema).toEqual({});
    const populated = await callArg.populateFields();
    expect(populated).toEqual([{ path: 'majors' }]);
  });
});


  describe('findOne', () => {
    it('should call queryFindOne with specific id', async () => {
      await service.findOne('123');
      expect(queryFindOne).toHaveBeenCalledWith(schoolModel, { _id: '123' });
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne with updated fields', async () => {
      const id = 'school123';
      const dto: UpdateSchoolDto = {
        name: { th: 'ใหม่', en: 'New' },
        acronym: 'XYZ',
        detail: { th: 'รายละเอียดใหม่', en: 'Detail New' },
        photo: 'photo.png',
        createdAt: new Date(),
      };

      await service.update(id, dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(
        schoolModel,
        id,
        dto,
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
    it('should call queryFindOne for appearance with school', async () => {
      const schoolId = 'abc123';
      await service.findColor(schoolId, {});
      expect(queryFindOne).toHaveBeenCalledWith(
        appearanceModel,
        { school: schoolId },
        [{ path: 'school' }],
      );
    });
  });

  describe('findInterfaces', () => {
    it('should call queryFindOne for interfaces with school', async () => {
      const schoolId = 'xyz789';
      await service.findInterfaces(schoolId);
      expect(queryFindOne).toHaveBeenCalledWith(
        interfacesModel,
        { school: schoolId },
        [{ path: 'school' }],
      );
    });
  });
});
