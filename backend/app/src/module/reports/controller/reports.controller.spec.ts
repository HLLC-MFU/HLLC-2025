import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../service/reports.service';
import { CreateReportDto } from '../dto/reports/create-report.dto';
import { UpdateReportDto } from '../dto/reports/update-report.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService: Record<keyof ReportsService, jest.Mock> = {
    create: jest.fn((dto: CreateReportDto) => ({ id: '1', ...dto })),
    findAll: jest.fn(() => [{ id: '1', message: 'test' }]),
    findOne: jest.fn((id: string) => {
      if (id === '404') throw new Error('Not Found');
      return { id, message: 'found' };
    }),
    findAllByCategory: jest.fn((id: string) => [{ id: 'x', category: id }]),
    update: jest.fn((id: string, dto: UpdateReportDto) => {
      if (id === 'bad') throw new Error('Invalid update');
      return { id, ...dto };
    }),
    remove: jest.fn((id: string) => {
      if (id === 'bad') throw new Error('Delete failed');
      return { deletedId: id };
    }),
  };

  const fakeTime = new Date('2025-06-15T12:45:56.430Z');
  jest.useFakeTimers().setSystemTime(fakeTime);


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a report', async () => {
      const dto: CreateReportDto = {
        message: 'new report',
        reporter: 'userId123',
        category: 'categoryId123',
        status: 'pending',
        createdAt: fakeTime,
      };
      const result = await controller.create(dto);
      expect(result).toEqual({
        id: '1',
        message: 'new report',
        reporter: 'userId123',
        category: 'categoryId123',
        status: 'pending',
        createdAt: fakeTime,
      });
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all reports', async () => {
      const result = await controller.findAll({});
      expect(result).toEqual([{ id: '1', message: 'test' }]);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return one report by id', async () => {
      const result = await controller.findOne('123');
      expect(result).toEqual({ id: '123', message: 'found' });
      expect(mockService.findOne).toHaveBeenCalledWith('123');
    });
  });

  describe('getByCategory', () => {
    it('should return reports by category id', async () => {
      const result = await controller.getByCategory('cat123');
      expect(result).toEqual([{ id: 'x', category: 'cat123' }]);
      expect(mockService.findAllByCategory).toHaveBeenCalledWith('cat123');
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const dto: UpdateReportDto = { message: 'updated' };
      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: '1', message: 'updated' });
      expect(mockService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      const result = await controller.remove('1');
      expect(result).toEqual({ deletedId: '1' });
      expect(mockService.remove).toHaveBeenCalledWith('1');
    });
  });
});
