import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';

describe('SchoolsController', () => {
  let controller: SchoolsController;
  let service: SchoolsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAppearance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [
        { provide: SchoolsService, useValue: mockService },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get<SchoolsService>(SchoolsService);
  });

  it('should call create() with correct dto', async () => {
    const dto: CreateSchoolDto = {
      name: { th: 'ไทย', en: 'EN' },
      acronym: 'TEST',
      detail: { th: 'รายละเอียด', en: 'Details' },
      photo: 'photo.jpg',
      createdAt: new Date(),
    };
    const mockResult = { id: '1', ...dto };
    mockService.create.mockResolvedValue(mockResult);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResult);
  });

  it('should call findAll() with query', async () => {
    const query = { keyword: 'test' };
    const mockResult = ['result'];
    mockService.findAll.mockResolvedValue(mockResult);

    const result = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockResult);
  });

  it('should call findOne() with id', async () => {
    const mockResult = { id: '123' };
    mockService.findOne.mockResolvedValue(mockResult);

    const result = await controller.findOne('123');
    expect(service.findOne).toHaveBeenCalledWith('123');
    expect(result).toEqual(mockResult);
  });

  it('should call update() with id and dto', async () => {
    const dto: UpdateSchoolDto = {
      acronym: 'UPD',
      photo: 'updated.jpg',
    };
    const mockResult = { id: '123', ...dto };
    mockService.update.mockResolvedValue(mockResult);

    const result = await controller.update('123', dto);
    expect(service.update).toHaveBeenCalledWith('123', dto);
    expect(result).toEqual(mockResult);
  });

  it('should call remove() with id', async () => {
    const mockResult = { message: 'deleted', id: '123' };
    mockService.remove.mockResolvedValue(mockResult);

    const result = await controller.remove('123');
    expect(service.remove).toHaveBeenCalledWith('123');
    expect(result).toEqual(mockResult);
  });

  it('should call findAppearance() with id and query', async () => {
    const query = { type: 'cover' };
    const mockResult = { appearance: 'data' };
    mockService.findAppearance.mockResolvedValue(mockResult);

    const result = await controller.findAppearance('123', query);
    expect(service.findAppearance).toHaveBeenCalledWith('123', query);
    expect(result).toEqual(mockResult);
  });
});