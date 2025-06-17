import { Test, TestingModule } from '@nestjs/testing';
import { StepCountersController } from './step-counters.controller';
import { StepCountersService } from './step-counters.service';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { UpdateStepCounterDto } from './dto/update-step-counter.dto';

const mockStepCountersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  listUsersBySchoolId: jest.fn(),
};

describe('StepCountersController', () => {
  let controller: StepCountersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StepCountersController],
      providers: [
        {
          provide: StepCountersService,
          useValue: mockStepCountersService,
        },
      ],
    }).compile();

    controller = module.get<StepCountersController>(StepCountersController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: CreateStepCounterDto = { user: 'user123', stepCount: 500 };
      const expected = { _id: 'id1', ...dto };
      mockStepCountersService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);
      expect(result).toBe(expected);
      expect(mockStepCountersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { page: '1' };
      const expected = { data: [], meta: { total: 0 } };
      mockStepCountersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);
      expect(result).toBe(expected);
      expect(mockStepCountersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const expected = { _id: 'abc', stepCount: 123 };
      mockStepCountersService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('abc');
      expect(result).toBe(expected);
      expect(mockStepCountersService.findOne).toHaveBeenCalledWith('abc');
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateStepCounterDto = { stepCount: 2000 };
      const expected = { _id: 'abc', stepCount: 2000 };
      mockStepCountersService.update.mockResolvedValue(expected);

      const result = await controller.update('abc', dto);
      expect(result).toBe(expected);
      expect(mockStepCountersService.update).toHaveBeenCalledWith('abc', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const expected = { message: 'Step counter deleted successfully', id: 'abc' };
      mockStepCountersService.remove.mockResolvedValue(expected);

      const result = await controller.remove('abc');
      expect(result).toBe(expected);
      expect(mockStepCountersService.remove).toHaveBeenCalledWith('abc');
    });
  });

  describe('findBySchool', () => {
    it('should call service.listUsersBySchoolId with schoolId', async () => {
      const expected = { data: [], meta: { total: 0 } };
      mockStepCountersService.listUsersBySchoolId.mockResolvedValue(expected);

      const result = await controller.findBySchool('school123');
      expect(result).toBe(expected);
      expect(mockStepCountersService.listUsersBySchoolId).toHaveBeenCalledWith('school123');
    });
  });
});
