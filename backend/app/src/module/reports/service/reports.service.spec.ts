import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';
import { Report, ReportDocument } from '../schemas/reports.schema';
import { User } from '../../users/schemas/user.schema';
import { ReportType } from '../schemas/report-type.schema';
import { CreateReportDto } from '../dto/reports/create-report.dto';
import { UpdateReportDto } from '../dto/reports/update-report.dto';
import { throwIfExists, findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'mongoose';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/query.util');

describe('ReportsService', () => {
  let service: ReportsService;

  let reportModel: Partial<Record<keyof Model<ReportDocument>, jest.Mock>> & {
    new (dto: CreateReportDto): {
      save: jest.Mock<Promise<Report>>;
    };
    findById: jest.Mock;
  };

  let reportTypeModel: {
    findById: jest.Mock<any>;
  };

  const userModel: Partial<Model<any>> = {};

  beforeEach(async () => {
    reportModel = Object.assign(
      jest.fn().mockImplementation((dto: CreateReportDto) => ({
        save: jest.fn().mockResolvedValue({ _id: '1', ...dto }),
      })),
      {
        findById: jest.fn(),
      }
    );

    reportTypeModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken(Report.name), useValue: reportModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(ReportType.name), useValue: reportTypeModel },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call throwIfExists and save report', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);

      const dto: CreateReportDto = {
        reporter: 'u1',
        category: 'c1',
        message: 'test',
        status: 'pending',
        createdAt: new Date(),
      };

      const result = await service.create(dto);
      expect(throwIfExists).toHaveBeenCalledWith(reportModel, { message: dto.message }, 'Message already exists');
      expect(result).toMatchObject({ _id: '1', message: dto.message });
    });

    it('should throw InternalServerError if save fails', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);

      const failingModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));
      Object.assign(failingModel, { findById: jest.fn() });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReportsService,
          { provide: getModelToken(Report.name), useValue: failingModel },
          { provide: getModelToken(User.name), useValue: userModel },
          { provide: getModelToken(ReportType.name), useValue: reportTypeModel },
        ],
      }).compile();

      const failingService = module.get<ReportsService>(ReportsService);

      const dto: CreateReportDto = {
        reporter: 'u1',
        category: 'c1',
        message: 'duplicate',
        status: 'pending',
        createdAt: new Date(),
      };

      await expect(failingService.create(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should call queryAll and return result', async () => {
      const mockResult = { data: [], total: 0 };
      (queryAll as jest.Mock).mockResolvedValue(mockResult);

      const res = await service.findAll({ status: 'pending' });
      expect(queryAll).toHaveBeenCalled();
      expect(res).toBe(mockResult);
    });

    it('should throw InternalServerError if queryAll fails', async () => {
      (queryAll as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.findAll({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllByCategory', () => {
    it('should return reports grouped by category', async () => {
      const mockData = [{
        _id: '1',
        message: 'test',
        reporter: { name: 'John' },
      }];

      (queryAll as jest.Mock).mockResolvedValue({ data: mockData });

      reportTypeModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'cat', name: 'test category' })
      });

      const result = await service.findAllByCategory('cat');

      expect(result).toEqual({
        category: { _id: 'cat', name: 'test category' },
        reports: [
          { _id: '1', message: 'test', reporter: { name: 'John' } },
        ],
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [] });

      reportTypeModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findAllByCategory('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return one report', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ data: [{ _id: '1' }], message: 'ok' });
      const result = await service.findOne('1');
      expect(queryFindOne).toHaveBeenCalledWith(reportModel, { _id: '1' });
      expect(result).toEqual({ data: [{ _id: '1' }], message: 'ok' });
    });

    it('should throw if not found', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update report', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryUpdateOne as jest.Mock).mockResolvedValue({ updated: true });

      const dto: UpdateReportDto = {
        status: 'resolved',
        updatedAt: new Date()
      };

      const res = await service.update('id123', dto);
      expect(findOrThrow).toHaveBeenCalledWith(reportModel, { _id: 'id123' }, 'Report not found');
      expect(queryUpdateOne).toHaveBeenCalledWith(reportModel, 'id123', expect.objectContaining({ status: 'resolved' }));
      expect(res).toEqual({ updated: true });
    });

    it('should throw InternalServerErrorException on other error', async () => {
      (findOrThrow as jest.Mock).mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        service.update('id', { status: 'x', updatedAt: new Date() })
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete report', async () => {
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      (queryDeleteOne as jest.Mock).mockResolvedValue(undefined);

      const res = await service.remove('id');
      expect(findOrThrow).toHaveBeenCalledWith(reportModel, { _id: 'id' }, 'Report not found');
      expect(queryDeleteOne).toHaveBeenCalledWith(reportModel, 'id');
      expect(res).toEqual({ message: 'Report deleted successfully', deletedId: 'id' });
    });

    it('should throw error if not found', async () => {
      (findOrThrow as jest.Mock).mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
