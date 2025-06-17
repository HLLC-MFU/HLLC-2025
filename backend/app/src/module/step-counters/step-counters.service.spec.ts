import { Test, TestingModule } from '@nestjs/testing';
import { StepCountersService } from './step-counters.service';
import { getModelToken } from '@nestjs/mongoose';
import { StepCounter } from './schema/step-counter.schema';
import { User } from '../users/schemas/user.schema';
import { School } from '../schools/schemas/school.schema';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';

jest.mock('src/pkg/helper/query.util');
jest.mock('src/pkg/validator/model.validator');

describe('StepCountersService', () => {
  let service: StepCountersService;
  let mockSave: jest.Mock;
  let mockStepCounterModelInstance: any;

  const mockStepCounterModel = jest.fn().mockImplementation((data) => {
    mockStepCounterModelInstance = {
      ...data,
      save: mockSave,
    };
    return mockStepCounterModelInstance;
  });

  const mockUserModel = { findById: jest.fn(), exists: jest.fn() };
  const mockSchoolModel = {};

  beforeEach(async () => {
    mockSave = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepCountersService,
        { provide: getModelToken(StepCounter.name), useValue: mockStepCounterModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(School.name), useValue: mockSchoolModel },
      ],
    }).compile();

    service = module.get<StepCountersService>(StepCountersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call save with valid user', async () => {
      const dto: CreateStepCounterDto = { user: 'user1', stepCount: 1000 };
      (findOrThrow as jest.Mock).mockResolvedValue(true);
      mockSave.mockResolvedValue({ _id: 'id1', ...dto });

      const result = await service.create(dto);

      expect(result).toEqual({ _id: 'id1', ...dto });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call queryAll with user populated', async () => {
      const result = { data: [], meta: { total: 0 } };
      (queryAll as jest.Mock).mockResolvedValue(result);
      const response = await service.findAll({});
      expect(response).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return single step counter', async () => {
      const result = { _id: '123', stepCount: 500 };
      (queryFindOne as jest.Mock).mockResolvedValue(result);
      const response = await service.findOne('123');
      expect(response).toBe(result);
    });
  });

  describe('update', () => {
    it('should update step counter', async () => {
      const result = { _id: 'id1', stepCount: 2000 };
      (queryUpdateOne as jest.Mock).mockResolvedValue(result);
      const response = await service.update('id1', { stepCount: 2000 });
      expect(response).toBe(result);
    });
  });

  describe('remove', () => {
    it('should delete step counter', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue(true);
      const result = await service.remove('id1');
      expect(result).toEqual({ message: 'Step counter deleted successfully', id: 'id1' });
    });
  });

  describe('listUsersBySchoolId', () => {
    it('should filter users by schoolId', async () => {
      const mockUsers = [
        {
          metadata: {
            major: {
              school: { _id: { toString: () => 's1' } },
            },
          },
        },
        {
          metadata: {
            major: {
              school: { _id: { toString: () => 'other' } },
            },
          },
        },
      ];

      (queryAll as jest.Mock).mockResolvedValue({ data: mockUsers, meta: { total: 2 } });

      const result = await service.listUsersBySchoolId('s1');
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });
});