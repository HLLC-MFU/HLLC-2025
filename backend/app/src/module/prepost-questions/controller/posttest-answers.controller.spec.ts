import { Test, TestingModule } from '@nestjs/testing';
import { PosttestAnswersController } from './posttest-answers.controller';
import { PosttestAnswersService } from '../service/posttest-answers.service';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';

const mockPosttestAnswersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  averageAllPosttests: jest.fn(),
};

describe('PosttestAnswersController', () => {
  let controller: PosttestAnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosttestAnswersController],
      providers: [
        {
          provide: PosttestAnswersService,
          useValue: mockPosttestAnswersService,
        },
      ],
    }).compile();

    controller = module.get<PosttestAnswersController>(PosttestAnswersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreatePosttestAnswerDto = {
        user: 'user123',
        answers: [{ posttest: 'post123', answer: 'A' }],
      };
      const result = { inserted: true };
      mockPosttestAnswersService.create.mockResolvedValue(result);

      const response = await controller.create(dto);
      expect(response).toBe(result);
      expect(mockPosttestAnswersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { page: '1' };
      const result = { data: [], meta: { total: 0 } };
      mockPosttestAnswersService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query);
      expect(response).toBe(result);
      expect(mockPosttestAnswersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = { data: { _id: 'abc' } };
      mockPosttestAnswersService.findOne.mockResolvedValue(result);

      const response = await controller.findOne('abc');
      expect(response).toBe(result);
      expect(mockPosttestAnswersService.findOne).toHaveBeenCalledWith('abc');
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = { deleted: true };
      mockPosttestAnswersService.remove.mockResolvedValue(result);

      const response = await controller.remove('abc');
      expect(response).toBe(result);
      expect(mockPosttestAnswersService.remove).toHaveBeenCalledWith('abc');
    });
  });

  describe('getAverageAll', () => {
    it('should call service.averageAllPosttests', async () => {
      const result = [{ posttest: 'q1', average: 4.5, count: 2 }];
      mockPosttestAnswersService.averageAllPosttests.mockResolvedValue(result);

      const response = await controller.getAverageAll();
      expect(response).toBe(result);
      expect(mockPosttestAnswersService.averageAllPosttests).toHaveBeenCalled();
    });
  });
});
