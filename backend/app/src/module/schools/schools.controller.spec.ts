import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { APP_GUARD } from '@nestjs/core';

jest.mock('src/pkg/interceptors/multipart.interceptor', () => ({
  MultipartInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn((_, next) => next.handle()),
  })),
}));

describe('SchoolsController', () => {
  let controller: SchoolsController;
  let service: SchoolsService;

  const mockSchool = {
    _id: '1',
    name: { th: 'โรงเรียน', en: 'School' },
    acronym: 'SCH',
    detail: { th: 'รายละเอียด', en: 'Detail' },
    photo: 'photo.jpg',
    createdAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findColor: jest.fn(),
    findInterfaces: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [
        { provide: SchoolsService, useValue: mockService },
        { provide: APP_GUARD, useValue: { canActivate: () => true } }, 
      ],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get<SchoolsService>(SchoolsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create()', () => {
    it('should call service.create with dto', async () => {
      mockService.create.mockResolvedValue(mockSchool);
      const dto: CreateSchoolDto = { ...mockSchool };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockSchool);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with query', async () => {
      const query = { keyword: 'abc' };
      const expected = [mockSchool];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with id', async () => {
      mockService.findOne.mockResolvedValue(mockSchool);
      const result = await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSchool);
    });
  });

  describe('update()', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateSchoolDto = { ...mockSchool };
      mockService.update.mockResolvedValue({ ...dto, _id: '1' });
      const result = await controller.update('1', dto);
      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(expect.objectContaining({ _id: '1' }));
    });
  });

  describe('remove()', () => {
    it('should call service.remove with id', async () => {
      mockService.remove.mockResolvedValue({ deleted: true });
      const result = await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('findAppearance()', () => {
    it('should call service.findColor with id and query', async () => {
      const query = { sort: 'asc' };
      const expected = [{ color: 'blue' }];
      mockService.findColor.mockResolvedValue(expected);
      const result = await controller.findAppearance('1', query);
      expect(service.findColor).toHaveBeenCalledWith('1', query);
      expect(result).toEqual(expected);
    });
  });

  describe('findInterfaces()', () => {
    it('should call service.findInterfaces with id', async () => {
      const expected = [{ interface: 'mobile' }];
      mockService.findInterfaces.mockResolvedValue(expected);
      const result = await controller.findInterfaces('1');
      expect(service.findInterfaces).toHaveBeenCalledWith('1');
      expect(result).toEqual(expected);
    });
  });
});
