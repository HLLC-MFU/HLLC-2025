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
  let mockConstructor: jest.Mock;

  beforeEach(async () => {
    mockConstructor = jest.fn(); 

    const modelStatics: Partial<Model<SystemStatusDocument>> = {
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
          useValue: Object.assign(mockConstructor, modelStatics),
        },
      ],
    }).compile();

    service = module.get<SystemStatusService>(SystemStatusService);
    model = module.get(getModelToken(SystemStatus.name));
  });

  describe('create()', () => {
    it('should create a system status', async () => {
      const dto: CreateSystemStatusDto = { status: true };
      const saveMock = jest.fn().mockResolvedValue({ _id: '123', status: true });

      mockConstructor.mockImplementation(() => ({
        ...dto,
        save: saveMock,
      }));

      const result = await service.create(dto);

      expect(mockConstructor).toHaveBeenCalledWith(dto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual({ _id: '123', status: true });
    });

    it('should throw error when save() fails', async () => {
      const dto: CreateSystemStatusDto = { status: true };
      const saveMock = jest.fn().mockRejectedValue(new Error('Save failed'));

      mockConstructor.mockImplementation(() => ({
        ...dto,
        save: saveMock,
      }));

      await expect(service.create(dto)).rejects.toThrow('Save failed');
      expect(saveMock).toHaveBeenCalled();
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
      const mockStatus = { _id: 'mockId', status: true };
      (queryFindOne as jest.Mock).mockResolvedValue(mockStatus);

      const result = await service.findOne('mockId');

      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: 'mockId' }, []);
      expect(result).toBe(mockStatus);
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
