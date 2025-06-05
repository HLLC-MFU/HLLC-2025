import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));

import {
  queryAll,
  queryFindOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockReportModel = {};
  const mockUserModel = {};
  const mockCategoryModel = {
    findById: jest.fn().mockResolvedValue({ _id: 'catId', name: 'Category A' }),
  };

  beforeEach(async () => {
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


  describe('remove', () => {
    it('should delete and return success message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);

      const result = await service.remove('1');
      expect(result).toEqual({
        message: 'Report deleted successfully',
        deletedId: '1',
      });
    });

    it('should throw NotFoundException if not found', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('404')).rejects.toThrow(NotFoundException);
    });
  });
});
