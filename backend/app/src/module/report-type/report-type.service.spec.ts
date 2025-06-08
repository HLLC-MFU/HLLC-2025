import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypeService } from './report-type.service';
import { getModelToken } from '@nestjs/mongoose';
import { ReportType } from './schemas/report-type.schema';
import { NotFoundException } from '@nestjs/common';
import {
  queryAll,
  queryFindOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { CreateReportTypeDto } from './dto/create-type.dto';
import { UpdateReportTypeDto } from './dto/update-report_category.dto';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));
jest.mock('src/pkg/validator/model.validator', () => ({
  throwIfExists: jest.fn(),
}));
jest.mock('src/pkg/helper/helpers', () => ({
  handleMongoDuplicateError: jest.fn(),
}));

describe('ReportTypeService', () => {
  let service: ReportTypeService;

  const mockModel = {
    findByIdAndUpdate: jest.fn(),
  };

  const save = jest.fn().mockResolvedValue({ _id: '1', name: { th: 'ชื่อ', en: 'name' } });
  const mockConstructor = jest.fn().mockImplementation(() => ({ save }));

  beforeEach(async () => {
    jest.clearAllMocks(); 

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportTypeService,
        {
          provide: getModelToken(ReportType.name),
          useValue: Object.assign(mockConstructor, mockModel),
        },
      ],
    }).compile();

    service = module.get<ReportTypeService>(ReportTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create',() => {

  it('should create report type successfully', async () => {
    const dto: CreateReportTypeDto = { name: { th: 'ชื่อ', en: 'name' } };

    const result = await service.create(dto);

    expect(throwIfExists).toHaveBeenCalled();
    expect(result).toHaveProperty('_id');
  });

  it('should handle duplicate error', async () => {
    const dto: CreateReportTypeDto = { name: { th: 'ชื่อไทย', en: 'English Name' } };
    const error = new Error('duplicate key error');
    mockConstructor.mockImplementationOnce(() => ({
      save: jest.fn().mockRejectedValue(error),
    }));

    await service.create(dto);

    expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
  });
  });

  describe('findAll',() => {
  it('should call queryAll', async () => {
    await service.findAll({});
    expect(queryAll).toHaveBeenCalled();
  });
  });

  describe('findOne',() => {
  it('should call queryFindOne', async () => {
    await service.findOne('id');
    expect(queryFindOne).toHaveBeenCalledWith(service['reportTypeModel'], {"_id": "id"});
  });
  });


  describe('update', () => {
  it('should update successfully', async () => {
    const dto: UpdateReportTypeDto = { name: { th: 'ใหม่', en: 'new' } };
    mockModel.findByIdAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve({ _id: 'id', name: dto.name }),
    });

    const result = await service.update('id', dto);
    expect(throwIfExists).toHaveBeenCalled();
    expect(result.data).toHaveProperty('_id');
  });

  it('should throw not found', async () => {
    mockModel.findByIdAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve(null),
    });

    await expect(service.update('id', {})).rejects.toThrow(NotFoundException);
  });

  it('should not call throwIfExists if name is not present', async () => {
    const dto: UpdateReportTypeDto = {};
    mockModel.findByIdAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve({ _id: 'id' }),
    });

    await service.update('id', dto);
    expect(throwIfExists).not.toHaveBeenCalled();
  });

  it('should return success message', async () => {
    const dto: UpdateReportTypeDto = {};
    mockModel.findByIdAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve({ _id: 'id' }),
    });

    const result = await service.update('id', dto);
    expect(result.message).toBe('Report type updated successfully');
  });

  });


  describe('remove', ()  => {
  it('should call queryDeleteOne', async () => {
    await service.remove('id');
    expect(queryDeleteOne).toHaveBeenCalledWith(service['reportTypeModel'], 'id');
  });
  });

});
