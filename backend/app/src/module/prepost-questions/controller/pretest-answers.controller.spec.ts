import { Test, TestingModule } from '@nestjs/testing';
import { PretestAnswersController } from './pretest-answers.controller';
import { PretestAnswersService } from '../service/pretest-answers.service';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';

const mockPretestAnswersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  averageAllPretests: jest.fn(),
};

describe('PretestAnswersController', () => {
  let controller: PretestAnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PretestAnswersController],
      providers: [
        {
          provide: PretestAnswersService,
          useValue: mockPretestAnswersService,
        },
      ],
    }).compile();

    controller = module.get<PretestAnswersController>(PretestAnswersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreatePretestAnswerDto = {
        user: 'user123',
        answers: [{ pretest: 'pre123', answer: '2' }],
      };
      const result = { inserted: true };
      mockPretestAnswersService.create.mockResolvedValue(result);

      const response = await controller.create(dto);
      expect(response).toBe(result);
      expect(mockPretestAnswersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { page: '1' };
      const result = { data: [], meta: { total: 0 } };
      mockPretestAnswersService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query);
      expect(response).toBe(result);
      expect(mockPretestAnswersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = { data: { _id: 'abc' } };
      mockPretestAnswersService.findOne.mockResolvedValue(result);

      const response = await controller.findOne('abc');
      expect(response).toBe(result);
      expect(mockPretestAnswersService.findOne).toHaveBeenCalledWith('abc');
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = { deleted: true };
      mockPretestAnswersService.remove.mockResolvedValue(result);

      const response = await controller.remove('abc');
      expect(response).toBe(result);
      expect(mockPretestAnswersService.remove).toHaveBeenCalledWith('abc');
    });
  });

  describe('getAverageAll', () => {
    it('should call service.averageAllPretests', async () => {
      const result = [{ pretest: 'q1', average: 3.5, count: 2 }];
      mockPretestAnswersService.averageAllPretests.mockResolvedValue(result);

      const response = await controller.getAverageAll();
      expect(response).toBe(result);
      expect(mockPretestAnswersService.averageAllPretests).toHaveBeenCalled();
    });
  });
});