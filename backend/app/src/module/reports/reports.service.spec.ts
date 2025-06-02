import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';

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

import {
  queryAll,
  queryFindOne,
  queryDeleteOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

describe('ReportsService', () => {
  let service: ReportsService;
  let saveMock: jest.Mock;
  let mockReportModel: any;

  const mockUserModel = {};
  const mockCategoryModel = {
    findById: jest.fn().mockResolvedValue({ _id: 'catId', name: 'Category A' }),
  };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      const createDto = { massage: 'new message' };
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      saveMock.mockResolvedValue({ _id: '1', ...createDto });

      const result = await service.create(createDto as any);

      expect(result).toEqual({ _id: '1', ...createDto });
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when save fails', async () => {
      const createDto = { massage: 'fail' };
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      saveMock.mockRejectedValue(new Error('save failed'));

      await expect(service.create(createDto as any)).rejects.toThrow('Failed to create report');
    });
  });

  describe('findAll', () => {
    it('should return all reports', async () => {
      const mockResult = { data: ['report1', 'report2'] };
      (queryAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findAll({});
      expect(result).toEqual(mockResult);
      expect(queryAll).toHaveBeenCalled();
    });
  });

  describe('findAllByCategory', () => {
    it('should return reports by category', async () => {
      const mockResult = {
        data: [
          {
            _id: 'r1',
            message: 'Hello',
            category: { _id: 'catId', name: 'Category A' },
          },
        ],
      };
      (queryAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findAllByCategory('catId');
      expect(result).toEqual({
        category: { _id: 'catId', name: 'Category A' },
        reports: [{ _id: 'r1', message: 'Hello' }],
      });
    });
  });

  describe('findOne', () => {
    it('should return a report if found', async () => {
      const mockReport = { _id: '1', message: 'Found' };
      (queryFindOne as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.findOne('1');
      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if not found', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a report successfully', async () => {
      const updateDto = { message: 'updated' };
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      const mockUpdate = { _id: '1', ...updateDto };
      (queryUpdateOne as jest.Mock).mockResolvedValue(mockUpdate);

      const result = await service.update('1', updateDto as any);
      expect(result).toEqual(mockUpdate);
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const updateDto = { message: 'fail' };
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryUpdateOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.update('1', updateDto as any)).rejects.toThrow('Failed to update report with id 1');
    });
  });

  describe('remove', () => {
    it('should delete and return success message', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);

      const result = await service.remove('1');
      expect(result).toEqual({
        message: 'Report deleted successfully',
        id: '1',
      });
    });

    it('should throw NotFoundException if not found', async () => {
      (findOrThrow as jest.Mock).mockRejectedValue(new NotFoundException('Report not found'));

      await expect(service.remove('404')).rejects.toThrow(NotFoundException);
    });
  });
});

