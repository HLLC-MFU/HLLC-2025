jest.mock('src/pkg/interceptors/multipart.interceptor', () => ({
  MultipartInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn((_, next) => next.handle()),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

describe('SchoolsController', () => {
  let controller: SchoolsController;
  let service: SchoolsService;

  const mockSchoolData: CreateSchoolDto = {
    name: { th: 'โรงเรียนทดสอบ',en: 'Test School' },
    acronym: 'TS',
    detail: { th: 'รายละเอียด', en: 'Detail' },
    photo: 'photo.jpg',
    createdAt: new Date(),
  };

  const updatedSchoolData: UpdateSchoolDto = {
    name: { th: 'โรงเรียนใหม่', en: 'New School' },
    acronym: 'NS',
    detail: { th: 'ใหม่', en: 'New' },
    photo: 'newphoto.jpg',
    createdAt: new Date(),
  };

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
      mockService.create.mockResolvedValue(mockSchoolData);
      const result = await controller.create(mockSchoolData);
      expect(service.create).toHaveBeenCalledWith(mockSchoolData);
      expect(result).toEqual(mockSchoolData);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with query', async () => {
      const query = { keyword: 'abc' };
      const expected = [mockSchoolData];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with id', async () => {
      const id = 'abc';
      mockService.findOne.mockResolvedValue(mockSchoolData);
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockSchoolData);
    });
  });

  describe('update()', () => {
    it('should call service.update with id and dto (with updatedAt)', async () => {
      const id = 'abc';
      const dto: UpdateSchoolDto = { ...updatedSchoolData };
      const expected = { ...dto, updatedAt: expect.any(Date) };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update(id, dto);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
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
