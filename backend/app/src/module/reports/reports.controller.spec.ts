import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService = {
    create: jest.fn(dto => ({ id: '1', ...dto })),
    findAll: jest.fn(() => [{ id: '1', message: 'test' }]),
    findOne: jest.fn(id => {
      if (id === '404') throw new Error('Not Found');
      return { id, message: 'found' };
    }),
    findAllByCategory: jest.fn(id => [{ id: 'x', category: id }]),
    update: jest.fn((id, dto) => {
      if (id === 'bad') throw new Error('Invalid update');
      return { id, ...dto };
    }),
    remove: jest.fn(id => {
      if (id === 'bad') throw new Error('Delete failed');
      return { deletedId: id };
    }),
  };

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

  it('should create a report', async () => {
    const dto: CreateReportDto = { message: 'new report' } as any;
    const result = await controller.create(dto);
    expect(result).toEqual({ id: '1', message: 'new report' });
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('should return all reports', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([{ id: '1', message: 'test' }]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('should return one report by id', async () => {
    const result = await controller.findOne('123');
    expect(result).toEqual({ id: '123', message: 'found' });
    expect(mockService.findOne).toHaveBeenCalledWith('123');
  });

  it('should return reports by category id', async () => {
    const result = await controller.getByCategory('cat123');
    expect(result).toEqual([{ id: 'x', category: 'cat123' }]);
    expect(mockService.findAllByCategory).toHaveBeenCalledWith('cat123');
  });

  it('should update a report', async () => {
    const dto: UpdateReportDto = { message: 'updated' } as any;
    const result = await controller.update('1', dto);
    expect(result).toEqual({ id: '1', message: 'updated' });
    expect(mockService.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a report', async () => {
    const result = await controller.remove('1');
    expect(result).toEqual({ deletedId: '1' });
    expect(mockService.remove).toHaveBeenCalledWith('1');
  });

});
