import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
  queryDeleteOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report, ReportDocument } from './schemas/reports.schema';
import { Types } from 'mongoose';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryDeleteOne: jest.fn(),
  queryUpdateOne: jest.fn(),
}));

jest.mock('src/pkg/validator/model.validator', () => ({
  findOrThrow: jest.fn(),
  throwIfExists: jest.fn(),
}));

describe('ReportsService with DTOs (Full Coverage)', () => {
  let service: ReportsService;
  let saveMock: jest.Mock;
  let mockReportModel: jest.Mock<{ save: jest.Mock }, []>;

  const mockUserModel = {};
  const mockCategoryModel = {
    findById: jest.fn().mockResolvedValue({ _id: 'catId', name: 'Category A' }),
  };

  const fixedDate = new Date('2025-06-03T00:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    saveMock = jest.fn();
    mockReportModel = jest.fn().mockImplementation(() => ({ save: saveMock }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken('Report'), useValue: mockReportModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('ReportCategory'), useValue: mockCategoryModel },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('create', () => {
    const dto: CreateReportDto = {
      message: 'create test',
      reporter: new Types.ObjectId().toHexString(),
      category: new Types.ObjectId().toHexString(),
      status: 'pending',
      createdAt: fixedDate,
    };

    it('should create report successfully', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      saveMock.mockResolvedValue({ _id: '1', ...dto });
      const result = await service.create(dto);
      expect(result).toEqual({ _id: '1', ...dto });
    });

    it('should throw on duplicate', async () => {
      (throwIfExists as jest.Mock).mockRejectedValue(new Error('Duplicate error'));
      await expect(service.create(dto)).rejects.toThrow('Duplicate error');
    });

    it('should throw InternalServerErrorException on save fail', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      saveMock.mockRejectedValue(new Error('DB error'));
      await expect(service.create(dto)).rejects.toThrow('Failed to create report');
    });
  });

  describe('findAll', () => {
    it('should return reports', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: ['report1'] });
      const result = await service.findAll({});
      expect(result).toEqual({ data: ['report1'] });
    });

    it('should throw InternalServerErrorException on queryAll error', async () => {
      (queryAll as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.findAll({})).rejects.toThrow('Failed to fetch reports');
    });
  });

  describe('findAllByCategory', () => {
    it('should return reports by category', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [{ _id: '1', message: 'msg', category: { _id: 'catId', name: 'Category A' } }] });
      const result = await service.findAllByCategory('catId');
      expect(result).toEqual({ category: { _id: 'catId', name: 'Category A' }, reports: [{ _id: '1', message: 'msg' }] });
    });

    it('should throw NotFoundException if no category found', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [] });
      mockCategoryModel.findById = jest.fn().mockResolvedValue(null);
      await expect(service.findAllByCategory('notfound')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      (queryAll as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.findAllByCategory('catId')).rejects.toThrow('Failed to fetch reports by category');
    });
  });

  describe('findOne', () => {
    it('should return report if found', async () => {
      const report = { _id: '1', message: 'found' };
      (queryFindOne as jest.Mock).mockResolvedValue({ data: report, message: 'Report retrieved successfully' });
      const result = await service.findOne('1');
      expect(result).toEqual({ data: report, message: 'Report retrieved successfully' });
    });

    it('should throw NotFoundException if not found', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('notfound')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto: UpdateReportDto = {
      message: 'update',
      reporter: new Types.ObjectId().toHexString(),
      category: new Types.ObjectId().toHexString(),
      status: 'resolved',
      updatedAt: fixedDate,
    };

    it('should update report', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: '1', ...dto });
      const result = await service.update('1', dto);
      expect(result).toEqual({ _id: '1', ...dto });
    });

    it('should throw NotFoundException if not found', async () => {
      (findOrThrow as jest.Mock).mockRejectedValue(new NotFoundException());
      await expect(service.update('404', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryUpdateOne as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.update('1', dto)).rejects.toThrow('Failed to update report with id 1');
    });
  });

  describe('remove', () => {
    it('should delete report', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);
      const result = await service.remove('1');
      expect(result).toEqual({ message: 'Report deleted successfully', id: '1' });
    });

    it('should throw NotFoundException if not found', async () => {
      (findOrThrow as jest.Mock).mockRejectedValue(new NotFoundException());
      await expect(service.remove('404')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryDeleteOne as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.remove('1')).rejects.toThrow('Failed to delete report with id 1');
    });
  });
});
