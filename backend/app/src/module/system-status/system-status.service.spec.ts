import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SystemStatusService } from './system-status.service';
import { SystemStatus, SystemStatusDocument } from './schemas/system-status.schema';
import { Model } from 'mongoose';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';

import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/helper/query.util');

describe('SystemStatusService', () => {
  let service: SystemStatusService;
  let model: jest.Mocked<Model<SystemStatusDocument>>;

  const mockSystemStatus = {
    _id: 'mockId',
    status: true,
    save: jest.fn(),
  } as object as SystemStatusDocument;

  beforeEach(async () => {
    const modelMock = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemStatusService,
        {
          provide: getModelToken(SystemStatus.name),
          useValue: Object.assign(jest.fn(), modelMock),
        },
      ],
    }).compile();

    service = module.get<SystemStatusService>(SystemStatusService);
    model = module.get(getModelToken(SystemStatus.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a system status', async () => {
      const dto: CreateSystemStatusDto = { status: true };
      const saveMock = jest.fn().mockResolvedValue({ _id: '123', status: true });
      (model as any).mockImplementation(() => ({ ...dto, save: saveMock }));
      const result = await service.create(dto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual({ _id: '123', status: true });
    });

    it('should throw error when save() fails', async () => {
      const dto: CreateSystemStatusDto = { status: true };
      const error = new Error('Save failed');
      const saveMock = jest.fn().mockRejectedValue(error);
      (model as any).mockImplementation(() => ({ ...dto, save: saveMock }));

      await expect(service.create(dto)).rejects.toThrow('Save failed');
    });
  });

  describe('findAll()', () => {
    it('should call queryAll', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      const result = await service.findAll({ status: 'true' });
      expect(queryAll).toHaveBeenCalledWith({
        model,
        query: { status: 'true' },
        filterSchema: {},
      });
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne()', () => {
    it('should call queryFindOne', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue(mockSystemStatus);
      const result = await service.findOne('mockId');
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: 'mockId' }, []);
      expect(result).toBe(mockSystemStatus);
    });
  });

  describe('update()', () => {
    it('should call queryUpdateOne', async () => {
      const dto: UpdateSystemStatusDto = { status: false };
      (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: 'mockId', status: false });
      const result = await service.update('mockId', dto);
      expect(queryUpdateOne).toHaveBeenCalledWith(model, 'mockId', dto);
      expect(result).toEqual({ _id: 'mockId', status: false });
    });
  });

  describe('remove()', () => {
    it('should call queryDeleteOne and return success message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(undefined);
      const result = await service.remove('mockId');
      expect(queryDeleteOne).toHaveBeenCalledWith(model, 'mockId');
      expect(result).toEqual({
        message: 'System status deleted successfully',
        id: 'mockId',
      });
    });
  });
});
