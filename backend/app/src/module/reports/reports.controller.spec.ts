import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';


describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAllByCategory: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a report', async () => {
      const dto: CreateReportDto = {
        message: 'create test',
        reporter: 'user123',
        category: 'cat456',
        status: 'pending',
        createdAt: new Date(),
      };

      const expected = { id: '1', ...dto };

      mockService.create.mockResolvedValue(expected);
      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all reports with query', async () => {
      const query = { status: 'pending' };
      const expected = [{ id: '1', message: 'report' }];

      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll(query);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return report by id', async () => {
      const expected = { id: '1', message: 'one report' };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('1');
      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('getByCategory', () => {
    it('should return reports by category ID via /:id/categories', async () => {
      const expected = { category: 'cat01', reports: [] };
      mockService.findAllByCategory.mockResolvedValue(expected);

      const result = await controller.getByCategory('cat01');
      expect(result).toEqual(expected);
      expect(service.findAllByCategory).toHaveBeenCalledWith('cat01');
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const dto: UpdateReportDto = {
        message: 'updated message',
        reporter: 'user123',
        category: 'cat456',
        status: 'resolved',
        updatedAt: new Date(),
      };

      const expected = { id: '1', ...dto };

      mockService.update.mockResolvedValue(expected);
      const result = await controller.update('1', dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      const expected = { message: 'deleted', deletedId: '1' };
      mockService.remove.mockResolvedValue(expected);

      const result = await controller.remove('1');
      expect(result).toEqual(expected);
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});


