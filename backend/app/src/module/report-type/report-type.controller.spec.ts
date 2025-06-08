import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypeController } from './report-type.controller';
import { ReportTypeService } from './report-type.service';
import { CreateReportTypeDto } from './dto/create-type.dto';
import { UpdateReportTypeDto } from './dto/update-report_category.dto';

describe('ReportTypeController', () => {
  let controller: ReportTypeController;
  let service: ReportTypeService;

  const mockService = {
    create: jest.fn(dto => ({ id: '1', ...dto })),
    findAll: jest.fn(() => [{ id: '1', name: { th: 'ชื่อ', en: 'Name' } }]),
    findOne: jest.fn(id => {
      if (id === '404') throw new Error('Not Found');
      return { id, name: { th: 'ชื่อเดียว', en: 'Single Name' } };
    }),
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
      controllers: [ReportTypeController],
      providers: [
        {
          provide: ReportTypeService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportTypeController>(ReportTypeController);
    service = module.get<ReportTypeService>(ReportTypeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create report type', async () => {
    const dto: CreateReportTypeDto = { name: { th: 'ชื่อ', en: 'Name' } };
    const result = await controller.create(dto);
    expect(result).toEqual({ id: '1', ...dto });
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('should return all report types', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([{ id: '1', name: { th: 'ชื่อ', en: 'Name' } }]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('should return one report type by id', async () => {
    const result = await controller.findOne('123');
    expect(result).toEqual({ id: '123', name: { th: 'ชื่อเดียว', en: 'Single Name' } });
    expect(mockService.findOne).toHaveBeenCalledWith('123');
  });

  it('should update a report type', async () => {
    const dto: UpdateReportTypeDto = { name: { th: 'อัปเดต', en: 'Updated' } };
    const result = await controller.update('1', dto);
    expect(result).toEqual({ id: '1', ...dto });
    expect(mockService.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a report type', async () => {
    const result = await controller.remove('1');
    expect(result).toEqual({ deletedId: '1' });
    expect(mockService.remove).toHaveBeenCalledWith('1');
  });
});
