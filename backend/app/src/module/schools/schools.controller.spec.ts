import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

interface Major {
  _id: string;
  name: { th: string; en: string };
  acronym: string;
  detail: { th: string; en: string };
  school: string;
  __v: number;
}

interface School {
  _id: string;
  name: { th: string; en: string };
  acronym: string;
  detail: { th: string; en: string };
  photos: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  majors: Major[];
  __v: number;
}

interface FindAllResponse {
  data: School[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lastUpdatedAt: string;
  };
  message: string;
}

describe('SchoolsController', () => {
  let controller: SchoolsController;
  let service: SchoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [
        {
          provide: SchoolsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get<SchoolsService>(SchoolsService);
  });

  describe('findAll', () => {
    it('should return an object with data array containing schools', async () => {
      const mockResponse: FindAllResponse = {
        data: [
          {
            _id: '668797867b6dca626ce7c106',
            name: { th: 'Test', en: 'Test' },
            acronym: 'TEST',
            detail: { th: 'Thai', en: 'English' },
            photos: {
              first: 'photo1.png',
              second: 'photo2.png',
              third: 'photo3.png',
              fourth: 'photo4.png',
            },
            majors: [
              {
                _id: 'major-id',
                name: { th: 'Major TH', en: 'Major EN' },
                acronym: 'MJR',
                detail: { th: 'Major Thai', en: 'Major English' },
                school: 'school-id',
                __v: 0,
              },
            ],
            __v: 0,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          lastUpdatedAt: '2025-05-30T07:42:21.004Z',
        },
        message: 'Data fetched successfully',
      };

      (service.findAll as jest.Mock).mockResolvedValue(mockResponse);
      const expectedResponse: Partial<FindAllResponse> = {
        data: [
          {
            _id: '668797867b6dca626ce7c106',
            acronym: 'TEST',
            detail: { en: 'English', th: 'Thai' },
            name: { en: 'Test', th: 'Test' },
            majors: [
              {
                _id: 'major-id',
                acronym: 'MJR',
                detail: { en: 'Major English', th: 'Major Thai' },
                name: { en: 'Major EN', th: 'Major TH' },
                school: 'school-id',
                __v: 0,
              },
            ],
            photos: {
              first: 'photo1.png',
              second: 'photo2.png',
              third: 'photo3.png',
              fourth: 'photo4.png',
            },
            __v: 0,
          },
        ],
        message: 'Data fetched successfully',
        meta: {
          lastUpdatedAt: '2025-05-30T07:42:21.004Z',
          limit: 10,
          page: 1,
          total: 1,
          totalPages: 1,
        },
      };

      const actual = await controller.findAll({});
      expect(actual).toEqual(expect.objectContaining(expectedResponse));
    });
  });

  describe('findOne', () => {
    it('should return a school object with the given id', async () => {
      const mockSchool: School = {
        _id: '668797867b6dca626ce7c106',
        name: { th: 'Test', en: 'Test' },
        acronym: 'TEST',
        detail: { th: 'Thai', en: 'English' },
        photos: {
          first: 'photo1.png',
          second: 'photo2.png',
          third: 'photo3.png',
          fourth: 'photo4.png',
        },
        majors: [],
        __v: 0,
      };

      (service.findOne as jest.Mock).mockResolvedValue(mockSchool);
      const actual = await controller.findOne('668797867b6dca626ce7c106');
      expect(actual).toEqual(mockSchool);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

describe('SchoolsController', () => {
  let controller: SchoolsController;
  let service: SchoolsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findColor: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [{ provide: SchoolsService, useValue: mockService }],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get<SchoolsService>(SchoolsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateSchoolDto = { name: 'Test School' } as any;
      mockService.create.mockResolvedValue(dto);
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with query', async () => {
      const query = { keyword: 'abc' };
      const expected = [{ name: 'A' }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with id', async () => {
      const id = 'abc';
      const expected = { name: 'School A' };
      mockService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('update()', () => {
    it('should call service.update with id and dto (with updatedAt)', async () => {
      const id = 'abc';
      const dto: UpdateSchoolDto = { name: 'Updated' } as any;
      const resultMock = { ...dto, updatedAt: expect.any(Date) };
      mockService.update.mockResolvedValue(resultMock);

      const result = await controller.update(id, dto);
      expect(dto.updatedAt).toBeInstanceOf(Date);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(resultMock);
    });
  });

  describe('remove()', () => {
    it('should call service.remove with id', async () => {
      const id = 'abc';
      const expected = { deleted: true };
      mockService.remove.mockResolvedValue(expected);
      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('findAppearance()', () => {
    it('should call service.findColor with id and query', async () => {
      const id = 'abc';
      const query = { sort: 'asc' };
      const expected = [{ color: 'blue' }];
      mockService.findColor.mockResolvedValue(expected);
      const result = await controller.findAppearance(id, query);
      expect(service.findColor).toHaveBeenCalledWith(id, query);
      expect(result).toEqual(expected);
    });
  });
});
