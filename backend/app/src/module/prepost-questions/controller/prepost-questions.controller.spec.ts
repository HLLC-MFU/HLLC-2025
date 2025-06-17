import { Test, TestingModule } from '@nestjs/testing';
import { PrepostQuestionsController } from './prepost-questions.controller';
import { PrepostQuestionsService } from '../service/prepost-questions.service';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from '../dto/prepost-question/update-prepost-qustion.dto';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';
import { PrepostTypes } from '../enum/posttest-types.enum';

const mockPrepostQuestionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PrepostQuestionsController', () => {
  let controller: PrepostQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrepostQuestionsController],
      providers: [
        {
          provide: PrepostQuestionsService,
          useValue: mockPrepostQuestionsService,
        },
      ],
    }).compile();

    controller = module.get<PrepostQuestionsController>(PrepostQuestionsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreatePrepostQuestiontDto = {
        displayType: PrepostQuestionTypes.PRE,
        type: PrepostTypes.TEXT,
        question: 'What is 2+2?',
        order: 1,
      };
      const result = { _id: 'q1', ...dto };
      mockPrepostQuestionsService.create.mockResolvedValue(result);

      const response = await controller.create(dto);
      expect(response).toBe(result);
      expect(mockPrepostQuestionsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { page: '1' };
      const result = { data: [], meta: { total: 0 } };
      mockPrepostQuestionsService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query);
      expect(response).toBe(result);
      expect(mockPrepostQuestionsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = { _id: 'q1', question: 'Sample?' };
      mockPrepostQuestionsService.findOne.mockResolvedValue(result);

      const response = await controller.findOne('q1');
      expect(response).toBe(result);
      expect(mockPrepostQuestionsService.findOne).toHaveBeenCalledWith('q1');
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdatePrepostQuestiontDto = {
        question: 'Updated?',
      } as UpdatePrepostQuestiontDto;
      const result = { _id: 'q1', ...dto };
      mockPrepostQuestionsService.update.mockResolvedValue(result);

      const response = await controller.update('q1', dto);
      expect(response).toBe(result);
      expect(mockPrepostQuestionsService.update).toHaveBeenCalledWith('q1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = { deleted: true };
      mockPrepostQuestionsService.remove.mockResolvedValue(result);

      const response = await controller.remove('q1');
      expect(response).toBe(result);
      expect(mockPrepostQuestionsService.remove).toHaveBeenCalledWith('q1');
    });
  });
});
